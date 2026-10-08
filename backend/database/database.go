package database

import (
	"log"
	"time"

	"github.com/glebarez/sqlite"
	"gorm.io/gorm"
	"gorm.io/gorm/logger"

	"hujan-backend/models"
)

var DB *gorm.DB

// InitDB initializes SQLite database using pure-Go driver
func InitDB(dbPath string) (*gorm.DB, error) {
	if dbPath == "" {
		dbPath = "./hujan.db"
	}

	db, err := gorm.Open(sqlite.Open(dbPath), &gorm.Config{
		Logger: logger.Default.LogMode(logger.Warn),
	})
	if err != nil {
		return nil, err
	}

	// Auto-migrate tables
	err = db.AutoMigrate(
		&models.Device{},
		&models.Telemetry{},
		&models.Event{},
	)
	if err != nil {
		return nil, err
	}

	// Configure connection pool
	sqlDB, err := db.DB()
	if err == nil {
		sqlDB.SetMaxIdleConns(5)
		sqlDB.SetMaxOpenConns(20)
		sqlDB.SetConnMaxLifetime(time.Hour)
	}

	// Seed default device if empty
	var count int64
	db.Model(&models.Device{}).Count(&count)
	if count == 0 {
		defaultDev := models.Device{
			ID:         "hs-8f3a1c9d2b70",
			Name:       "Jemuran Utama",
			BrokerURL:  "wss://test.mosquitto.org:8081/mqtt",
			LokasiADM4: "31.71.03.1001",
			AmbangPct:  60,
			Status:     "online",
			LastSeenAt: time.Now(),
		}
		db.Create(&defaultDev)
		log.Println("[Database] Seeded default device: hs-8f3a1c9d2b70")
	}

	DB = db
	log.Println("[Database] SQLite initialized successfully at:", dbPath)
	return db, nil
}
