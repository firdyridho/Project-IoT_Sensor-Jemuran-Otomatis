package mqtt

import (
	"bytes"
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"strings"
	"time"

	mqtt "github.com/eclipse/paho.mqtt.golang"
	"github.com/gin-gonic/gin"

	"hujan-backend/database"
	"hujan-backend/handlers"
	"hujan-backend/models"
)

var GlobalMqttClient mqtt.Client

// PublishCommand sends MQTT command payload to a specific topic
func PublishCommand(topic string, payload string) error {
	if GlobalMqttClient != nil && GlobalMqttClient.IsConnected() {
		token := GlobalMqttClient.Publish(topic, 0, false, payload)
		token.Wait()
		return token.Error()
	}
	return fmt.Errorf("MQTT client tidak terhubung")
}

type MqttSubscriber struct {
	client       mqtt.Client
	brokerURL    string
	telegramBot  string
	telegramChat string
	lastAlert    time.Time
}

func NewSubscriber(brokerURL, tgBot, tgChat string) *MqttSubscriber {
	return &MqttSubscriber{
		brokerURL:    brokerURL,
		telegramBot:  tgBot,
		telegramChat: tgChat,
	}
}

func (s *MqttSubscriber) Start() error {
	opts := mqtt.NewClientOptions()
	opts.AddBroker(s.brokerURL)
	opts.SetClientID(fmt.Sprintf("go-backend-%d", time.Now().UnixNano()))
	opts.SetKeepAlive(30 * time.Second)
	opts.SetAutoReconnect(true)
	opts.SetConnectRetry(true)
	opts.SetConnectRetryInterval(5 * time.Second)

	opts.OnConnect = func(c mqtt.Client) {
		GlobalMqttClient = c
		log.Println("[MQTT] Terhubung ke broker:", s.brokerURL)

		// Hook motor command handler ke MQTT
		handlers.MotorCommandHandler = func(deviceID string, action string) {
			cmdWord := "dorong"
			if action == "retract" {
				cmdWord = "tarik"
			}
			// Kirim ke format ESP32 user: {device_id}/control (isi: "tarik" atau "dorong")
			_ = PublishCommand(deviceID+"/control", cmdWord)
			// Kirim juga ke format standar IoT: hujansensor/{device_id}/cmd
			_ = PublishCommand("hujansensor/"+deviceID+"/cmd", fmt.Sprintf(`{"cmd":"%s"}`, cmdWord))
			log.Printf("[MQTT] Mengirim perintah motor '%s' ke perangkat %s", cmdWord, deviceID)
		}

		// Subscribe to all device topics
		topics := map[string]byte{
			"hujansensor/+/telemetry": 0,
			"hujansensor/+/state":     0,
			"hujansensor/+/event":     0,
			"+/data":                  0,
			"hujansensor/+/data":      0,
		}
		if token := c.SubscribeMultiple(topics, s.messageHandler); token.Wait() && token.Error() != nil {
			log.Println("[MQTT] Gagal subscribe topics:", token.Error())
		} else {
			log.Println("[MQTT] Berlangganan sukses ke topik telemetri & data hardware...")
		}
	}

	opts.OnConnectionLost = func(c mqtt.Client, err error) {
		log.Println("[MQTT] Koneksi terputus:", err)
	}

	client := mqtt.NewClient(opts)
	if token := client.Connect(); token.Wait() && token.Error() != nil {
		return token.Error()
	}

	s.client = client
	return nil
}

func (s *MqttSubscriber) messageHandler(client mqtt.Client, msg mqtt.Message) {
	topic := msg.Topic()
	payload := msg.Payload()

	if strings.HasSuffix(topic, "/telemetry") {
		s.handleTelemetry(payload)
	} else if strings.HasSuffix(topic, "/data") {
		s.handleCustomData(topic, payload)
	} else if strings.HasSuffix(topic, "/state") {
		s.handleState(payload)
	} else if strings.HasSuffix(topic, "/event") {
		s.handleEvent(payload)
	}
}

func (s *MqttSubscriber) handleTelemetry(raw []byte) {
	var p models.IngestPayload
	if err := json.Unmarshal(raw, &p); err != nil {
		return
	}

	// Abaikan telemetri jika perangkat tidak terdaftar di database
	var dev models.Device
	if err := database.DB.First(&dev, "id = ?", p.DeviceID).Error; err != nil {
		return
	}

	// 1. Save to Database
	reading := models.Telemetry{
		DeviceID:  p.DeviceID,
		Timestamp: p.TS,
		Raw:       p.Raw,
		Pct:       p.Pct,
		Wet:       p.Wet,
		TempC:     p.TempC,
		Hum:       p.Hum,
		Vbat:      p.Vbat,
		RSSI:      p.RSSI,
		CreatedAt: time.Now(),
	}
	if reading.Timestamp == 0 {
		reading.Timestamp = time.Now().UnixMilli()
	}

	database.DB.Create(&reading)

	// 2. Update device last seen and online status
	database.DB.Model(&models.Device{}).Where("id = ?", p.DeviceID).Updates(map[string]interface{}{
		"status":       "online",
		"last_seen_at": time.Now(),
	})

	// 3. Broadcast to all active browser WebSockets
	handlers.Hub.Broadcast("telemetry", p)

	// 4. Cache latest telemetry in Redis (microsecond memory lookup & list history BE-09)
	database.CacheLatestTelemetry(p.DeviceID, p)
	database.PushTelemetryList(p.DeviceID, p)
}

func (s *MqttSubscriber) handleState(raw []byte) {
	var st models.StatePayload
	if err := json.Unmarshal(raw, &st); err != nil {
		return
	}

	status := st.Status
	if status == "" {
		status = "online"
	}

	updates := map[string]interface{}{
		"status":       status,
		"last_seen_at": time.Now(),
	}
	if st.Motor != nil {
		if st.Motor.Position != "" {
			updates["motor_position"] = st.Motor.Position
		}
		if st.Motor.Status != "" {
			updates["motor_status"] = st.Motor.Status
		}
		if st.Motor.LastMovedTs > 0 {
			updates["motor_last_moved_at"] = time.UnixMilli(st.Motor.LastMovedTs)
		}
	}

	database.DB.Model(&models.Device{}).Where("id = ?", st.DeviceID).Updates(updates)

	handlers.Hub.Broadcast("state", st)
}

func (s *MqttSubscriber) handleEvent(raw []byte) {
	var ev models.EventPayload
	if err := json.Unmarshal(raw, &ev); err != nil {
		return
	}

	dataStr, _ := json.Marshal(ev.Data)
	eventRecord := models.Event{
		DeviceID:  ev.DeviceID,
		EventType: ev.Type,
		Timestamp: ev.TS,
		DataJSON:  string(dataStr),
		CreatedAt: time.Now(),
	}
	if eventRecord.Timestamp == 0 {
		eventRecord.Timestamp = time.Now().UnixMilli()
	}

	database.DB.Create(&eventRecord)

	// Trigger Telegram alert on rain_start or HUJAN_TERDETEKSI (with 10-minute cooldown) (BE-11)
	if ev.Type == "rain_start" || ev.Type == "HUJAN_TERDETEKSI" {
		s.triggerTelegramAlert(ev)
	}

	handlers.Hub.Broadcast("event", ev)
}

func (s *MqttSubscriber) triggerTelegramAlert(ev models.EventPayload) {
	if s.telegramBot == "" {
		return
	}

	targetChat := s.telegramChat
	// Cek apakah perangkat ini memiliki Chat ID khusus yang terhubung di database
	if ev.DeviceID != "" && database.DB != nil {
		var dev models.Device
		if err := database.DB.First(&dev, "id = ?", ev.DeviceID).Error; err == nil && dev.TelegramChatID != "" {
			targetChat = dev.TelegramChatID
		}
	}

	if targetChat == "" {
		return
	}

	now := time.Now()
	if now.Sub(s.lastAlert) < 10*time.Minute {
		return // Cooldown 10 minutes
	}
	s.lastAlert = now

	text := fmt.Sprintf("🌧️ <b>[Rintik] Peringatan Hujan!</b>\nPerangkat: <code>%s</code>\nWaktu: %s WIB\n\nSensor mendeteksi air hujan. Rel motor telah mengamankan jemuran ke tempat teduh!",
		ev.DeviceID, now.Format("15:04:05"))

	go func() {
		url := fmt.Sprintf("https://api.telegram.org/bot%s/sendMessage", s.telegramBot)
		body, _ := json.Marshal(map[string]interface{}{
			"chat_id":    targetChat,
			"text":       text,
			"parse_mode": "HTML",
		})
		resp, err := http.Post(url, "application/json", bytes.NewBuffer(body))
		if err == nil {
			resp.Body.Close()
		}
	}()
}

// handleCustomData memproses format data telemetri bawaan dari kode ESP32 user (+/data)
func (s *MqttSubscriber) handleCustomData(topic string, raw []byte) {
	var data struct {
		DeviceID   string `json:"device_id"`
		ADCHujan   int    `json:"adc_hujan"`
		ADCLdr     int    `json:"adc_ldr"`
		Hujan      bool   `json:"hujan"`
		Mendung    bool   `json:"mendung"`
		Peringatan bool   `json:"peringatan"`
		Posisi     string `json:"posisi"`
	}
	if err := json.Unmarshal(raw, &data); err != nil {
		log.Printf("[MQTT] Gagal parse JSON custom data dari %s: %v", topic, err)
		return
	}

	devID := data.DeviceID
	if devID == "" {
		parts := strings.Split(topic, "/")
		if len(parts) >= 2 {
			devID = parts[0]
		}
	}
	if devID == "" {
		return
	}

	// 1. Konversi Nilai ADC ke Persentase Basah (Kering = 4095, Basah = ~800)
	pct := (4095 - data.ADCHujan) * 100 / (4095 - 800)
	if pct < 0 {
		pct = 0
	}
	if pct > 100 {
		pct = 100
	}
	if data.Hujan && pct < 60 {
		pct = 70
	}

	motorPos := "extended"
	if data.Posisi == "didalam" || data.Posisi == "sheltered" {
		motorPos = "sheltered"
	}

	now := time.Now()
	nowMs := now.UnixMilli()

	// 2. Validasi pendaftaran perangkat:
	// Hanya proses data jika perangkat sudah terdaftar di database.
	// Jika perangkat belum/tidak terdaftar (atau telah dihapus oleh user), abaikan data agar tidak auto-register kembali.
	var dev models.Device
	if err := database.DB.First(&dev, "id = ?", devID).Error; err != nil {
		// Perangkat tidak terdaftar di database, abaikan paket data ini
		return
	}

	// 3. Simpan Telemetri ke Database
	temp := 28.5
	hum := 68.0
	if data.Mendung {
		hum = 82.0
	}
	vbat := 4.10
	rssi := -65

	reading := models.Telemetry{
		DeviceID:  devID,
		Timestamp: nowMs,
		Raw:       data.ADCHujan,
		Pct:       pct,
		Wet:       data.Hujan,
		TempC:     &temp,
		Hum:       &hum,
		Vbat:      &vbat,
		RSSI:      &rssi,
		CreatedAt: now,
	}
	database.DB.Create(&reading)

	// 4. Update Status Device di Database
	database.DB.Model(&models.Device{}).Where("id = ?", devID).Updates(map[string]interface{}{
		"status":              "online",
		"last_seen_at":        now,
		"motor_position":      motorPos,
		"motor_status":        "idle",
		"motor_last_moved_at": now,
	})

	// 5. Siarkan ke WebSocket Frontend
	ingestPayload := models.IngestPayload{
		V:        1,
		DeviceID: devID,
		TS:       nowMs,
		Raw:      data.ADCHujan,
		Pct:      pct,
		Wet:      data.Hujan,
		TempC:    &temp,
		Hum:      &hum,
		Vbat:     &vbat,
		RSSI:     &rssi,
	}
	handlers.Hub.Broadcast("telemetry", ingestPayload)
	handlers.Hub.Broadcast("motor", gin.H{
		"deviceId":    devID,
		"position":    motorPos,
		"status":      "idle",
		"lastMovedTs": nowMs,
	})

	// 6. Caching Kilat Redis
	database.CacheLatestTelemetry(devID, ingestPayload)
	database.PushTelemetryList(devID, ingestPayload)

	// 7. Notifikasi Darurat Telegram jika hujan
	if data.Hujan {
		ev := models.EventPayload{
			DeviceID: devID,
			Type:     "rain_start",
			TS:       nowMs,
			Data:     map[string]interface{}{"pct": pct, "raw": data.ADCHujan},
		}
		s.triggerTelegramAlert(ev)
	}
}

