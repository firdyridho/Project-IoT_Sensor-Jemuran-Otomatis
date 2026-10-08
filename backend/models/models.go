package models

import (
	"time"
)

// User represents an authenticated account
type User struct {
	ID           string    `gorm:"primaryKey;size:64" json:"id"`
	Email        string    `gorm:"size:128;uniqueIndex;not null" json:"email"`
	Name         string    `gorm:"size:128;not null" json:"name"`
	PasswordHash string    `gorm:"size:256;not null" json:"-"`
	CreatedAt    time.Time `json:"createdAt"`
	UpdatedAt    time.Time `json:"updatedAt"`
}

// Device represents a registered ESP32 clothesline monitor unit
type Device struct {
	ID         string    `gorm:"primaryKey;size:64" json:"deviceId"`
	UserID     string    `gorm:"size:64;index" json:"userId"`
	Name       string    `gorm:"size:128;not null" json:"name"`
	BrokerURL  string    `gorm:"size:256" json:"brokerUrl"`
	LokasiADM4 string    `gorm:"size:32" json:"lokasiAdm4"`
	AmbangPct  int       `gorm:"default:60" json:"ambangPct"`
	Status     string    `gorm:"size:32;default:'offline'" json:"status"` // "online" or "offline"
	LastSeenAt time.Time `json:"lastSeenAt"`
	CreatedAt  time.Time `json:"createdAt"`
	UpdatedAt  time.Time `json:"updatedAt"`
}

// Telemetry represents time-series telemetry readings from ESP32
type Telemetry struct {
	ID        uint      `gorm:"primaryKey;autoIncrement" json:"id"`
	DeviceID  string    `gorm:"size:64;index" json:"deviceId"`
	Timestamp int64     `gorm:"index" json:"ts"` // epoch ms
	Raw       int       `json:"raw"`
	Pct       int       `json:"pct"`
	Wet       bool      `json:"wet"`
	TempC     *float64  `json:"tempC"`
	Hum       *float64  `json:"hum"`
	Vbat      *float64  `json:"vbat"`
	RSSI      *int      `json:"rssi"`
	CreatedAt time.Time `gorm:"index" json:"createdAt"`
}

// Event represents discrete IoT occurrences (rain_start, rain_stop, device_boot, etc.)
type Event struct {
	ID        uint      `gorm:"primaryKey;autoIncrement" json:"id"`
	DeviceID  string    `gorm:"size:64;index" json:"deviceId"`
	EventType string    `gorm:"size:64;index" json:"type"`
	Timestamp int64     `json:"ts"` // epoch ms
	DataJSON  string    `gorm:"type:text" json:"data"`
	CreatedAt time.Time `gorm:"index" json:"createdAt"`
}

// IngestPayload format for incoming MQTT / REST telemetry
type IngestPayload struct {
	V        int      `json:"v"`
	DeviceID string   `json:"deviceId"`
	TS       int64    `json:"ts"`
	Raw      int      `json:"raw"`
	Pct      int      `json:"pct"`
	Wet      bool     `json:"wet"`
	TempC    *float64 `json:"tempC"`
	Hum      *float64 `json:"hum"`
	Vbat     *float64 `json:"vbat"`
	RSSI     *int     `json:"rssi"`
}

// StatePayload format for MQTT state retained messages
type StatePayload struct {
	V        int    `json:"v"`
	DeviceID string `json:"deviceId"`
	Status   string `json:"status"`
	FW       string `json:"fw"`
	TS       int64  `json:"ts"`
	UptimeS  int    `json:"uptimeS"`
	RSSI     int    `json:"rssi"`
	Rain     struct {
		Raw          int   `json:"raw"`
		Pct          int   `json:"pct"`
		Wet          bool  `json:"wet"`
		ThresholdPct int   `json:"thresholdPct"`
		SinceMs      int64 `json:"sinceMs"`
	} `json:"rain"`
	Env *struct {
		TempC float64 `json:"tempC"`
		Hum   float64 `json:"hum"`
	} `json:"env"`
	Power *struct {
		Vbat     float64 `json:"vbat"`
		Pct      int     `json:"pct"`
		Charging bool    `json:"charging"`
	} `json:"power"`
	Loc *struct {
		ADM4 string `json:"adm4"`
	} `json:"loc"`
}

// EventPayload format for incoming events
type EventPayload struct {
	V        int         `json:"v"`
	DeviceID string      `json:"deviceId"`
	Type     string      `json:"type"`
	TS       int64       `json:"ts"`
	Data     interface{} `json:"data"`
}
