package main

import (
	"log"
	"os"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"

	"hujan-backend/database"
	"hujan-backend/handlers"
	"hujan-backend/mqtt"
	"hujan-backend/telegram"
)

func getEnv(key, defaultVal string) string {
	if val := os.Getenv(key); val != "" {
		return val
	}
	return defaultVal
}

func main() {
	port := getEnv("PORT", "8080")
	mqttBroker := getEnv("MQTT_BROKER", "tcp://test.mosquitto.org:1883")
	tgBot := getEnv("TELEGRAM_BOT_TOKEN", "")
	tgChat := getEnv("TELEGRAM_CHAT_ID", "")

	log.Println("==================================================")
	log.Println("  HujanPantau IoT Backend (Golang)")
	log.Println("  Ultra-Lightweight for Tencent Lighthouse / aaPanel")
	log.Println("==================================================")

	// 1. Inisialisasi Database (MySQL / SQLite)
	_, err := database.InitDB()
	if err != nil {
		log.Fatalf("[FATAL] Gagal inisialisasi database: %v", err)
	}

	// 2. Inisialisasi Redis (Opsional Cache Kilat)
	database.InitRedis()

	// 2. Jalankan MQTT Subscriber 24/7 di background
	sub := mqtt.NewSubscriber(mqttBroker, tgBot, tgChat)
	go func() {
		if err := sub.Start(); err != nil {
			log.Printf("[WARN] Gagal koneksi awal MQTT (%v). Akan mencoba reconnect otomatis...", err)
		}
	}()

	// 3. Jalankan Background Worker Pemantau Cuaca Ekstrem (BE-08)
	handlers.StartWeatherAlertWorker()

	// 4. Jalankan Bot Telegram Poller untuk Auto-Connect 1-Klik jika token disetel
	telegram.StartBotPoller(tgBot)

	// 5. Setup Gin Web Server
	gin.SetMode(gin.ReleaseMode)
	r := gin.Default()

	// Rate Limiting Umum 120 req/menit (BE-10)
	r.Use(handlers.RateLimiterMiddleware())

	// Izinkan CORS dari Vercel / domain luar
	corsConfig := cors.DefaultConfig()
	corsConfig.AllowAllOrigins = true
	corsConfig.AllowHeaders = []string{"Origin", "Content-Type", "Accept", "Authorization"}
	corsConfig.AllowMethods = []string{"GET", "POST", "PUT", "DELETE", "OPTIONS"}
	r.Use(cors.New(corsConfig))

	// Health Check untuk aaPanel / Uptime Monitor
	r.GET("/health", func(c *gin.Context) {
		c.JSON(200, gin.H{
			"status":  "healthy",
			"app":     "HujanPantau-Backend",
			"version": "1.0.0",
		})
	})

	// Realtime WebSocket endpoint untuk Frontend Vercel
	r.GET("/ws", handlers.Hub.HandleWebSocket)

	// REST API Routes
	api := r.Group("/api")
	{
		// Authentication endpoints (Multi-User) dengan proteksi brute-force (BE-10)
		api.POST("/auth/register", handlers.Register)
		api.POST("/auth/login", handlers.LoginBruteForceMiddleware(), handlers.Login)
		api.GET("/auth/me", handlers.GetMe)

		// Fitur Kecerdasan Buatan (AI Engine & Predictions) (BE-05 & BE-06)
		api.POST("/ai/predict-rain", handlers.PredictRain)
		api.GET("/ai/drying-advice", handlers.GetDryingAdvice)

		api.GET("/devices", handlers.GetDevices)
		api.POST("/devices", handlers.CreateDevice)
		api.PUT("/devices/:id", handlers.UpdateDevice)
		api.DELETE("/devices/:id", handlers.DeleteDevice)

		api.GET("/devices/:id/telemetry", handlers.GetTelemetry)
		api.GET("/devices/:id/events", handlers.GetEvents)
		api.GET("/devices/:id/latest", handlers.GetLatest)
		api.POST("/devices/:id/telegram", handlers.SaveDeviceTelegram)

		// Motor DC / Jemuran Kanopi Status & Kendali (REQ-BE-01)
		api.GET("/devices/:id/motor", handlers.GetMotorStatus)
		api.POST("/devices/:id/motor/command", handlers.CommandMotor)

		// Simulator Cuaca Virtual (REQ-BE-02)
		api.POST("/simulator/weather", handlers.SimulateWeather)

		// Direct HTTP ingestion backup
		api.POST("/telemetry", handlers.IngestTelemetry)

		// Telegram bot config & test
		api.GET("/telegram/config", handlers.GetTelegramConfig)
		api.POST("/telegram/test", handlers.TestTelegram)
	}

	log.Printf("[SERVER] Berjalan di port :%s ...\n", port)
	if err := r.Run(":" + port); err != nil {
		log.Fatalf("[FATAL] Server gagal berjalan: %v", err)
	}
}
