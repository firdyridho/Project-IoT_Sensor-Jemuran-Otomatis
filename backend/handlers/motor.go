package handlers

import (
	"net/http"
	"strings"
	"time"

	"github.com/gin-gonic/gin"

	"hujan-backend/database"
	"hujan-backend/models"
)

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

// CommandMotor handles POST /api/devices/:id/motor/command (REQ-BE-01)
func CommandMotor(c *gin.Context) {
	deviceID := c.Param("id")
	var req models.MotorCommandRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Format request tidak valid: " + err.Error()})
		return
	}

	action := strings.ToLower(strings.TrimSpace(req.Action))
	if action != "retract" && action != "extend" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "action harus 'retract' (tarik ke kanopi) atau 'extend' (bentangkan)"})
		return
	}

	var dev models.Device
	if err := database.DB.First(&dev, "id = ?", deviceID).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Perangkat tidak ditemukan"})
		return
	}

	targetPosition := "extended"
	if action == "retract" {
		targetPosition = "sheltered"
	}

	now := time.Now()
	dev.MotorPosition = targetPosition
	dev.MotorStatus = "idle"
	dev.MotorLastMovedAt = now
	database.DB.Save(&dev)

	// Broadcast status perubahan motor ke seluruh client WebSocket
	motorPayload := gin.H{
		"deviceId":    dev.ID,
		"position":    targetPosition,
		"status":      "idle",
		"lastMovedTs": now.UnixMilli(),
		"action":      action,
	}
	Hub.Broadcast("motor", motorPayload)

	c.JSON(http.StatusOK, gin.H{
		"status":      "success",
		"deviceId":    dev.ID,
		"action":      action,
		"position":    targetPosition,
		"motorStatus": "idle",
		"lastMovedTs": now.UnixMilli(),
		"message":     "Perintah motor rel jemuran berhasil dieksekusi",
	})
}
