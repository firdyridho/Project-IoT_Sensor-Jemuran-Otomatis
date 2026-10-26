package handlers

import (
	"encoding/json"
	"net/http"
	"strings"
	"time"

	"github.com/gin-gonic/gin"

	"hujan-backend/database"
	"hujan-backend/models"
)

// MotorCommandHandler is a hook for publishing motor commands to MQTT/hardware
var MotorCommandHandler func(deviceID string, action string)

// GetMotorStatus handles GET /api/devices/:id/motor (REQ-BE-01)
func GetMotorStatus(c *gin.Context) {
	deviceID := c.Param("id")

	var dev models.Device
	if err := database.DB.First(&dev, "id = ?", deviceID).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Perangkat tidak ditemukan"})
		return
	}

	position := dev.MotorPosition
	if position == "" {
		position = "extended"
	}
	status := dev.MotorStatus
	if status == "" {
		status = "idle"
	}

	lastMovedTs := dev.MotorLastMovedAt.UnixMilli()
	if lastMovedTs <= 0 {
		lastMovedTs = dev.CreatedAt.UnixMilli()
	}

	c.JSON(http.StatusOK, models.MotorStatusResponse{
		DeviceID:    dev.ID,
		Position:    position,
		Status:      status,
		LastMovedTs: lastMovedTs,
	})
}

// CommandMotor handles POST /api/devices/:id/motor/command (REQ-BE-01 & BE-25)
func CommandMotor(c *gin.Context) {
	deviceID := c.Param("id")
	var req models.MotorCommandRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Format request tidak valid: " + err.Error()})
		return
	}

	action := strings.ToLower(strings.TrimSpace(req.Action))
	if action == "berhenti" {
		action = "stop"
	}
	if action != "retract" && action != "extend" && action != "stop" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "action harus 'retract' (tarik ke kanopi), 'extend' (bentangkan), atau 'stop' (berhenti manual)"})
		return
	}

	var dev models.Device
	if err := database.DB.First(&dev, "id = ?", deviceID).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Perangkat tidak ditemukan"})
		return
	}

	targetPosition := dev.MotorPosition
	if targetPosition == "" {
		targetPosition = "extended"
	}
	if action == "retract" {
		targetPosition = "sheltered"
	} else if action == "extend" {
		targetPosition = "extended"
	}

	now := time.Now()
	dev.MotorPosition = targetPosition
	dev.MotorStatus = "idle"
	dev.MotorLastMovedAt = now
	database.DB.Save(&dev)

	// Panggil hook MQTT untuk mengirim perintah ke hardware ESP32
	if MotorCommandHandler != nil {
		MotorCommandHandler(dev.ID, action)
	}

	// Broadcast status perubahan motor ke seluruh client WebSocket
	motorPayload := gin.H{
		"deviceId":    dev.ID,
		"position":    targetPosition,
		"status":      "idle",
		"lastMovedTs": now.UnixMilli(),
		"action":      action,
	}
	Hub.Broadcast("motor", motorPayload)

	// Simpan peristiwa motor_move / motor_stop ke tabel events dan broadcast ke UI
	eventType := "motor_move"
	if action == "stop" {
		eventType = "motor_stop"
	}
	evData, _ := json.Marshal(map[string]interface{}{
		"action":   action,
		"position": targetPosition,
		"source":   "web_manual",
	})
	eventRecord := models.Event{
		DeviceID:  dev.ID,
		EventType: eventType,
		Timestamp: now.UnixMilli(),
		DataJSON:  string(evData),
		CreatedAt: now,
	}
	database.DB.Create(&eventRecord)
	Hub.Broadcast("event", models.EventPayload{
		DeviceID: dev.ID,
		Type:     eventType,
		TS:       now.UnixMilli(),
		Data:     map[string]interface{}{"action": action, "position": targetPosition, "source": "web_manual"},
	})

	msg := "Perintah motor rel jemuran berhasil dieksekusi"
	if action == "stop" {
		msg = "Perintah berhenti (stop) motor jemuran berhasil dikirim"
	}

	c.JSON(http.StatusOK, gin.H{
		"status":      "success",
		"deviceId":    dev.ID,
		"action":      action,
		"position":    targetPosition,
		"motorStatus": "idle",
		"lastMovedTs": now.UnixMilli(),
		"message":     msg,
	})
}
