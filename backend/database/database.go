package database

import (
	"fmt"
	"log"
	"os"
	"strings"
	"time"

	"github.com/glebarez/sqlite"
	"golang.org/x/crypto/bcrypt"
	"gorm.io/driver/mysql"
	"gorm.io/gorm"
	"gorm.io/gorm/logger"

	"hujan-backend/models"
)

var DB *gorm.DB

// InitDB initializes either MySQL or SQLite database depending on environment variables
func InitDB() (*gorm.DB, error) {
	dbType := strings.ToLower(os.Getenv("DB_TYPE"))
	var dialector gorm.Dialector

	if dbType == "mysql" {
		user := os.Getenv("MYSQL_USER")
		if user == "" {
			user = "root"
		}
		pass := os.Getenv("MYSQL_PASSWORD")
		host := os.Getenv("MYSQL_HOST")
		if host == "" {
			host = "127.0.0.1"
		}
		port := os.Getenv("MYSQL_PORT")
		if port == "" {
			port = "3306"
		}
		dbName := os.Getenv("MYSQL_DATABASE")
		if dbName == "" {
			dbName = "hujan_iot"
		}

		// 1. Otomatis cek & buat database jika belum ada di MySQL
		rootDSN := fmt.Sprintf("%s:%s@tcp(%s:%s)/?charset=utf8mb4&parseTime=True&loc=Local", user, pass, host, port)
		if rootDB, err := gorm.Open(mysql.Open(rootDSN), &gorm.Config{Logger: logger.Default.LogMode(logger.Silent)}); err == nil {
			createSql := fmt.Sprintf("CREATE DATABASE IF NOT EXISTS `%s` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;", dbName)
			if err := rootDB.Exec(createSql).Error; err == nil {
				log.Printf("[Database] Database '%s' siap / dibuat otomatis di MySQL!", dbName)
			}
			if sqlDB, err := rootDB.DB(); err == nil {
				_ = sqlDB.Close()
			}
		}

		// 2. Hubungkan ke database tujuan
		dsn := os.Getenv("MYSQL_DSN")
		if dsn == "" {
			dsn = fmt.Sprintf("%s:%s@tcp(%s:%s)/%s?charset=utf8mb4&parseTime=True&loc=Local",
				user, pass, host, port, dbName)
		}
		log.Printf("[Database] Connecting to MySQL database '%s'...", dbName)
		dialector = mysql.Open(dsn)
	} else {
		// Default: SQLite (Pure Go driver)
		dbPath := os.Getenv("DB_PATH")
		if dbPath == "" {
			dbPath = "./hujan.db"
		}
		log.Printf("[Database] Using SQLite at: %s", dbPath)
		dialector = sqlite.Open(dbPath)
	}

	db, err := gorm.Open(dialector, &gorm.Config{
		Logger: logger.Default.LogMode(logger.Warn),
	})
	if err != nil {
		if dbType == "mysql" {
			log.Printf("[Database WARNING] Gagal konek MySQL (%v). Beralih ke fallback SQLite ./hujan.db...", err)
			dbPath := os.Getenv("DB_PATH")
			if dbPath == "" {
				dbPath = "./hujan.db"
			}
			dialector = sqlite.Open(dbPath)
			db, err = gorm.Open(dialector, &gorm.Config{
				Logger: logger.Default.LogMode(logger.Warn),
			})
			if err != nil {
				return nil, fmt.Errorf("gagal membuka database SQLite fallback: %w", err)
			}
		} else {
			return nil, fmt.Errorf("gagal membuka database: %w", err)
		}
	} else if dbType == "mysql" {
		log.Printf("[Database SUCCESS] Berhasil terhubung ke MySQL!")
	}

	// Auto-migrate tables (User, Devices, Telemetry, Events, AIPrediction)
	err = db.AutoMigrate(
		&models.User{},
		&models.Device{},
		&models.Telemetry{},
		&models.Event{},
		&models.AIPrediction{},
	)
	if err != nil {
		return nil, fmt.Errorf("gagal migrasi tabel: %w", err)
	}
	log.Printf("[Database SUCCESS] AutoMigrate tabel selesai (users, devices, telemetries, events, ai_predictions siap)!")

	// Connection pool
	sqlDB, err := db.DB()
	if err == nil {
		sqlDB.SetMaxIdleConns(5)
		sqlDB.SetMaxOpenConns(25)
		sqlDB.SetConnMaxLifetime(time.Hour)
	}

	// Seed demo user if empty
	var userCount int64
	db.Model(&models.User{}).Count(&userCount)
	if userCount == 0 {
		hash, _ := bcrypt.GenerateFromPassword([]byte("admin123"), bcrypt.DefaultCost)
		demoUser := models.User{
			ID:           "usr-demo-admin",
			Username:     "admin",
			Name:         "Admin HujanPantau",
			PasswordHash: string(hash),
			CreatedAt:    time.Now(),
			UpdatedAt:    time.Now(),
		}
		db.Create(&demoUser)
		log.Println("[Database] Seeded demo user: admin / admin123")
	} else {
		// Ensure demo user has username set if migrated from earlier schema
		db.Model(&models.User{}).Where("id = ? AND (username = '' OR username IS NULL)", "usr-demo-admin").Update("username", "admin")
	}

	// Seed default device if empty or ensure user device hs-24e1796dc9a1 exists
	var count int64
	db.Model(&models.Device{}).Count(&count)
	if count == 0 {
		defaultDev := models.Device{
			ID:         "hs-24e1796dc9a1",
			UserID:     "usr-demo-admin",
			Name:       "Jemuran ESP32 Utama",
			BrokerURL:  "wss://43-133-136-149.sslip.io/ws",
			LokasiADM4: "31.71.03.1001",
			AmbangPct:  60,
			Status:     "offline",
			LastSeenAt: time.Time{},
		}
		db.Create(&defaultDev)
		log.Println("[Database] Seeded default device: hs-24e1796dc9a1")
	} else {
		var devUser models.Device
		if err := db.First(&devUser, "id = ?", "hs-24e1796dc9a1").Error; err != nil {
			newDev := models.Device{
				ID:         "hs-24e1796dc9a1",
				UserID:     "usr-demo-admin",
				Name:       "Jemuran ESP32 Utama",
				BrokerURL:  "wss://43-133-136-149.sslip.io/ws",
				LokasiADM4: "31.71.03.1001",
				AmbangPct:  60,
				Status:     "offline",
				LastSeenAt: time.Time{},
			}
			db.Create(&newDev)
			log.Println("[Database] Seeded user device: hs-24e1796dc9a1")
		}
	}

	DB = db
	if dbType == "mysql" {
		log.Println("[Database] MySQL successfully connected & tables migrated!")
	} else {
		log.Println("[Database] SQLite successfully initialized & tables migrated!")
	}
	return db, nil
}
