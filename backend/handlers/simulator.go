package handlers

import (
	"fmt"
	"net/http"
	"strings"
	"time"

	"github.com/gin-gonic/gin"

	"hujan-backend/database"
	"hujan-backend/models"
)

// SimulateWeather handles POST /api/simulator/weather (REQ-BE-02)
func SimulateWeather(c *gin.Context) {
	var req models.SimulatorWeatherRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Format request tidak valid: " + err.Error()})
		return
	}

	if req.DeviceID == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "deviceId wajib diisi"})
		return
	}

	condition := strings.ToLower(strings.TrimSpace(req.Condition))

	// Konfigurasi parameter cuaca virtual
	var raw int
	var pct int
	var wet bool
	var temp float64
	var hum float64
	var vbat float64
	var rssi int
	var motorPosition string
	var eventType string

	switch condition {
	case "cerah":
		raw = 4095
		pct = 0
		wet = false
		temp = 33.5
		hum = 48.0
		vbat = 4.15
		rssi = -55
		motorPosition = "extended"
		eventType = "rain_stop"
	case "gerimis":
		raw = 2800
		pct = 42
		wet = false
		temp = 27.2
		hum = 78.0
		vbat = 4.12
		rssi = -60
		motorPosition = "extended"
	case "hujan":
		raw = 1100
		pct = 85
		wet = true
		temp = 24.5
		hum = 92.0
		vbat = 4.08
		rssi = -68
		motorPosition = "sheltered"
		eventType = "rain_start"
	case "badai":
		raw = 350
		pct = 98
		wet = true
		temp = 21.8
		hum = 98.0
		vbat = 4.02
		rssi = -75
		motorPosition = "sheltered"
		eventType = "rain_start"
	default:
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "condition tidak valid. Pilihan yang didukung: 'cerah', 'gerimis', 'hujan', 'badai'",
		})
		return
	}

	now := time.Now()
	nowMs := now.UnixMilli()

	// 1. Simpan Telemetri ke Database
	reading := models.Telemetry{
		DeviceID:  req.DeviceID,
		Timestamp: nowMs,
		Raw:       raw,
		Pct:       pct,
		Wet:       wet,
		TempC:     &temp,
		Hum:       &hum,
		Vbat:      &vbat,
		RSSI:      &rssi,
		CreatedAt: now,
	}
	database.DB.Create(&reading)

	// 2. Perbarui Device (Online, LastSeen, Posisi Motor)
	database.DB.Model(&models.Device{}).Where("id = ?", req.DeviceID).Updates(map[string]interface{}{
		"status":              "online",
		"last_seen_at":        now,
		"motor_position":      motorPosition,
		"motor_status":        "idle",
		"motor_last_moved_at": now,
	})

	// 3. Catat Event jika kondisi memicu perubahan status hujan
	if eventType != "" {
		eventRecord := models.Event{
			DeviceID:  req.DeviceID,
			EventType: eventType,
			Timestamp: nowMs,
			DataJSON:  fmt.Sprintf(`{"source":"simulator","condition":"%s","pct":%d,"tempC":%.1f,"hum":%.1f}`, condition, pct, temp, hum),
			CreatedAt: now,
		}
		database.DB.Create(&eventRecord)
		Hub.Broadcast("event", gin.H{
			"deviceId": req.DeviceID,
			"type":     eventType,
			"ts":       nowMs,
			"data":     map[string]interface{}{"condition": condition, "pct": pct},
		})
	}

	// 4. Caching Kilat Redis
	ingestPayload := models.IngestPayload{
		V:        1,
		DeviceID: req.DeviceID,
		TS:       nowMs,
		Raw:      raw,
		Pct:      pct,
		Wet:      wet,
		TempC:    &temp,
		Hum:      &hum,
		Vbat:     &vbat,
		RSSI:     &rssi,
	}
	database.CacheLatestTelemetry(req.DeviceID, ingestPayload)
	database.PushTelemetryList(req.DeviceID, ingestPayload)

	// 5. Broadcast Telemetri & Motor ke WebSocket Hub
	Hub.Broadcast("telemetry", ingestPayload)
	Hub.Broadcast("motor", gin.H{
		"deviceId":    req.DeviceID,
		"position":    motorPosition,
		"status":      "idle",
		"lastMovedTs": nowMs,
	})

	c.JSON(http.StatusOK, gin.H{
		"status":    "success",
		"deviceId":  req.DeviceID,
		"condition": condition,
		"simulated": gin.H{
			"rawAdc":        raw,
			"rainPct":       pct,
			"isWet":         wet,
			"tempC":         temp,
			"hum":           hum,
			"vbat":          vbat,
			"motorPosition": motorPosition,
			"eventType":     eventType,
		},
		"message": fmt.Sprintf("Telemetri simulasi cuaca '%s' berhasil diinjeksi ke realtime hub", condition),
	})
}
