package handlers

import (
	"bytes"
	"encoding/json"
	"fmt"
	"net/http"
	"os"
	"strconv"
	"strings"
	"time"

	"github.com/gin-gonic/gin"

	"hujan-backend/database"
	"hujan-backend/models"
)

// GetDevices returns all registered devices for the requesting user
func GetDevices(c *gin.Context) {
	userID := c.Query("userId")
	if userID == "" {
		if authHeader := c.GetHeader("Authorization"); authHeader != "" {
			token := strings.TrimPrefix(authHeader, "Bearer ")
			if uid, err := parseToken(token); err == nil {
				userID = uid
			}
		}
	}

	var devices []models.Device
	if userID != "" {
		database.DB.Where("user_id = ? OR user_id = ''", userID).Order("created_at asc").Find(&devices)
	} else {
		database.DB.Order("created_at asc").Find(&devices)
	}
	for i := range devices {
		if devices[i].LastSeenAt.IsZero() || time.Since(devices[i].LastSeenAt) > 15*time.Second {
			devices[i].Status = "offline"
		}
	}
	c.JSON(http.StatusOK, devices)
}

// CreateDevice registers a new device
func CreateDevice(c *gin.Context) {
	var req models.Device
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	if req.ID == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "deviceId wajib diisi"})
		return
	}

	// Associate with user if not set
	if req.UserID == "" {
		if authHeader := c.GetHeader("Authorization"); authHeader != "" {
			token := strings.TrimPrefix(authHeader, "Bearer ")
			if uid, err := parseToken(token); err == nil {
				req.UserID = uid
			}
		}
	}

	req.LastSeenAt = time.Time{}
	req.Status = "offline"
	if req.AmbangPct == 0 {
		req.AmbangPct = 60
	}

	// Cek jika perangkat sudah ada di database, lakukan update (upsert) agar tidak gagal
	var existing models.Device
	if err := database.DB.First(&existing, "id = ?", req.ID).Error; err == nil {
		existing.Name = req.Name
		if req.UserID != "" {
			existing.UserID = req.UserID
		}
		if req.BrokerURL != "" {
			existing.BrokerURL = req.BrokerURL
		}
		if req.LokasiADM4 != "" {
			existing.LokasiADM4 = req.LokasiADM4
		}
		if req.AmbangPct > 0 {
			existing.AmbangPct = req.AmbangPct
		}
		database.DB.Save(&existing)
		c.JSON(http.StatusOK, existing)
		return
	}

	if err := database.DB.Create(&req).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal menyimpan perangkat: " + err.Error()})
		return
	}

	c.JSON(http.StatusCreated, req)
}

// UpdateDevice updates an existing device
func UpdateDevice(c *gin.Context) {
	id := c.Param("id")
	var req models.Device
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	var existing models.Device
	if err := database.DB.First(&existing, "id = ?", id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Perangkat tidak ditemukan"})
		return
	}

	existing.Name = req.Name
	existing.BrokerURL = req.BrokerURL
	existing.LokasiADM4 = req.LokasiADM4
	if req.AmbangPct > 0 {
		existing.AmbangPct = req.AmbangPct
	}

	database.DB.Save(&existing)
	c.JSON(http.StatusOK, existing)
}

// DeleteDevice deletes a device and its history
func DeleteDevice(c *gin.Context) {
	id := c.Param("id")
	database.DB.Where("device_id = ?", id).Delete(&models.Telemetry{})
	database.DB.Where("device_id = ?", id).Delete(&models.Event{})
	result := database.DB.Delete(&models.Device{}, "id = ?", id)

	if result.RowsAffected == 0 {
		c.JSON(http.StatusNotFound, gin.H{"error": "Perangkat tidak ditemukan"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Perangkat dan riwayat berhasil dihapus"})
}

// GetTelemetry returns time-series readings with range filter
func GetTelemetry(c *gin.Context) {
	deviceID := c.Param("id")
	rangeParam := c.DefaultQuery("range", "1h")
	limitParam := c.DefaultQuery("limit", "1000")

	limit, _ := strconv.Atoi(limitParam)
	if limit <= 0 || limit > 5000 {
		limit = 1000
	}

	query := database.DB.Where("device_id = ?", deviceID)

	now := time.Now()
	switch rangeParam {
	case "5m":
		cutoff := now.Add(-5 * time.Minute)
		query = query.Where("created_at >= ?", cutoff)
	case "1h":
		cutoff := now.Add(-1 * time.Hour)
		query = query.Where("created_at >= ?", cutoff)
	case "24h":
		cutoff := now.Add(-24 * time.Hour)
		query = query.Where("created_at >= ?", cutoff)
	}

	var list []models.Telemetry
	query.Order("timestamp asc").Limit(limit).Find(&list)

	c.JSON(http.StatusOK, list)
}

// GetEvents returns historical events for a device
func GetEvents(c *gin.Context) {
	deviceID := c.Param("id")
	limitParam := c.DefaultQuery("limit", "100")
	limit, _ := strconv.Atoi(limitParam)
	if limit <= 0 || limit > 500 {
		limit = 100
	}

	var list []models.Event
	database.DB.Where("device_id = ?", deviceID).Order("timestamp desc").Limit(limit).Find(&list)
	c.JSON(http.StatusOK, list)
}

// GetLatest returns latest status and reading for a device
func GetLatest(c *gin.Context) {
	deviceID := c.Param("id")

	var dev models.Device
	if err := database.DB.First(&dev, "id = ?", deviceID).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Perangkat tidak ditemukan"})
		return
	}

	var latestTel models.Telemetry
	database.DB.Where("device_id = ?", deviceID).Order("timestamp desc").First(&latestTel)

	// Check staleness (> 15 seconds or never seen)
	isStale := dev.LastSeenAt.IsZero() || time.Since(dev.LastSeenAt) > 15*time.Second
	status := dev.Status
	if isStale {
		status = "offline"
	}

	c.JSON(http.StatusOK, gin.H{
		"device":     dev,
		"status":     status,
		"isStale":    isStale,
		"telemetry":  latestTel,
		"lastSeenAt": dev.LastSeenAt,
	})
}

// IngestTelemetry handles direct HTTP POST ingestion from ESP32
func IngestTelemetry(c *gin.Context) {
	var p models.IngestPayload
	if err := c.ShouldBindJSON(&p); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	if p.DeviceID == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "deviceId wajib diisi"})
		return
	}

	if p.TS == 0 {
		p.TS = time.Now().UnixMilli()
	}

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

	database.DB.Create(&reading)
	database.DB.Model(&models.Device{}).Where("id = ?", p.DeviceID).Updates(map[string]interface{}{
		"status":       "online",
		"last_seen_at": time.Now(),
	})

	// Caching kilat Redis (BE-09)
	database.CacheLatestTelemetry(p.DeviceID, p)
	database.PushTelemetryList(p.DeviceID, p)

	Hub.Broadcast("telemetry", p)
	c.JSON(http.StatusOK, gin.H{"status": "ok"})
}

// TestTelegram sends a test alert to verify Telegram bot and chat ID
func TestTelegram(c *gin.Context) {
	var req struct {
		BotToken string `json:"botToken"`
		ChatID   string `json:"chatId"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	botToken := strings.TrimSpace(req.BotToken)
	if botToken == "" {
		botToken = os.Getenv("TELEGRAM_BOT_TOKEN")
	}

	chatID := strings.TrimSpace(req.ChatID)
	if chatID == "" {
		chatID = os.Getenv("TELEGRAM_CHAT_ID")
	}

	if botToken == "" {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Bot Telegram belum dikonfigurasi di server. Pastikan environment TELEGRAM_BOT_TOKEN telah disetel.",
		})
		return
	}

	if chatID == "" {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Chat ID belum diisi. Masukkan Chat ID akun Telegram Anda.",
		})
		return
	}

	text := "🌧️ <b>Tes Notifikasi Rintik Bot!</b>\nKoneksi bot Telegram ke backend Rintik berhasil aktif.\n\nSistem siap mengirimkan peringatan darurat otomatis saat jemuran ditarik akibat hujan!"
	url := fmt.Sprintf("https://api.telegram.org/bot%s/sendMessage", botToken)
	body, _ := json.Marshal(map[string]interface{}{
		"chat_id":    chatID,
		"text":       text,
		"parse_mode": "HTML",
	})

	resp, err := http.Post(url, "application/json", bytes.NewBuffer(body))
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal terhubung ke Telegram API: " + err.Error()})
		return
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		var tgErr struct {
			Description string `json:"description"`
		}
		_ = json.NewDecoder(resp.Body).Decode(&tgErr)
		errMsg := tgErr.Description
		if errMsg == "" {
			errMsg = fmt.Sprintf("Telegram API merespons dengan status HTTP %d", resp.StatusCode)
		}
		c.JSON(resp.StatusCode, gin.H{"error": errMsg})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Notifikasi Telegram berhasil terkirim!"})
}

// GetTelegramConfig mengembalikan informasi status konfigurasi bot Telegram server
func GetTelegramConfig(c *gin.Context) {
	botToken := os.Getenv("TELEGRAM_BOT_TOKEN")
	botUsername := os.Getenv("TELEGRAM_BOT_USERNAME")
	if botUsername == "" {
		botUsername = "Rintik_Iot_Bot"
	}
	c.JSON(http.StatusOK, gin.H{
		"configured":  botToken != "",
		"botUsername": botUsername,
		"botName":     "Rintik",
	})
}

// SaveDeviceTelegram menyimpan ID Obrolan Telegram langsung ke database untuk perangkat tertentu
func SaveDeviceTelegram(c *gin.Context) {
	deviceID := c.Param("id")
	var req struct {
		ChatID string `json:"chatId"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Format request tidak valid: " + err.Error()})
		return
	}

	var dev models.Device
	if err := database.DB.First(&dev, "id = ?", deviceID).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Perangkat tidak ditemukan"})
		return
	}

	dev.TelegramChatID = strings.TrimSpace(req.ChatID)
	database.DB.Save(&dev)

	// Siarkan event ke dashboard web
	Hub.Broadcast("telegram_saved", gin.H{
		"deviceId": dev.ID,
		"chatId":   dev.TelegramChatID,
	})

	c.JSON(http.StatusOK, gin.H{
		"message":  "Chat ID Telegram berhasil disimpan ke perangkat",
		"deviceId": dev.ID,
		"chatId":   dev.TelegramChatID,
	})
}
