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

	"hujan-backend/database"
	"hujan-backend/handlers"
	"hujan-backend/models"
)

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
		log.Println("[MQTT] Terhubung ke broker:", s.brokerURL)
		// Subscribe to all device topics
		topics := map[string]byte{
			"hujansensor/+/telemetry": 0,
			"hujansensor/+/state":     0,
			"hujansensor/+/event":     0,
		}
		if token := c.SubscribeMultiple(topics, s.messageHandler); token.Wait() && token.Error() != nil {
			log.Println("[MQTT] Gagal subscribe topics:", token.Error())
		} else {
			log.Println("[MQTT] Berlangganan sukses ke topik hujansensor/+/...")
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

	database.DB.Model(&models.Device{}).Where("id = ?", st.DeviceID).Updates(map[string]interface{}{
		"status":       status,
		"last_seen_at": time.Now(),
	})

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
	if s.telegramBot == "" || s.telegramChat == "" {
		return
	}

	now := time.Now()
	if now.Sub(s.lastAlert) < 10*time.Minute {
		return // Cooldown 10 minutes
	}
	s.lastAlert = now

	text := fmt.Sprintf("🌧️ <b>Hujan Terdeteksi!</b>\nPerangkat: <code>%s</code>\nWaktu: %s WIB\n\nSegera amankan jemuran Anda!",
		ev.DeviceID, now.Format("15:04:05"))

	go func() {
		url := fmt.Sprintf("https://api.telegram.org/bot%s/sendMessage", s.telegramBot)
		body, _ := json.Marshal(map[string]interface{}{
			"chat_id":    s.telegramChat,
			"text":       text,
			"parse_mode": "HTML",
		})
		resp, err := http.Post(url, "application/json", bytes.NewBuffer(body))
		if err == nil {
			resp.Body.Close()
		}
	}()
}
