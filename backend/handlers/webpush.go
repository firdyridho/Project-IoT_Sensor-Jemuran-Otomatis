package handlers

import (
	"encoding/json"
	"log"
	"net/http"
	"os"
	"sync"
	"time"

	webpush "github.com/SherClockHolmes/webpush-go"
	"github.com/gin-gonic/gin"

	"hujan-backend/database"
	"hujan-backend/models"
)

var (
	vapidMu         sync.RWMutex
	vapidPublicKey  string
	vapidPrivateKey string
)

func initVAPIDKeys() {
	vapidMu.Lock()
	defer vapidMu.Unlock()

	pub := os.Getenv("VAPID_PUBLIC_KEY")
	priv := os.Getenv("VAPID_PRIVATE_KEY")

	if pub != "" && priv != "" {
		vapidPublicKey = pub
		vapidPrivateKey = priv
		log.Println("[WebPush] Menggunakan VAPID key dari environment variable.")
		return
	}

	// Generate key pair dinamis jika belum disetel
	privKey, pubKey, err := webpush.GenerateVAPIDKeys()
	if err != nil {
		log.Printf("[WebPush WARN] Gagal membuat VAPID key otomatis: %v", err)
		return
	}

	vapidPublicKey = pubKey
	vapidPrivateKey = privKey
	log.Println("[WebPush SUCCESS] VAPID Key pair berhasil diinisialisasi untuk PWA Push Notification.")
}

// GetVapidPublicKey returns the public key required by browser PushManager (REQ-BE-09)
func GetVapidPublicKey(c *gin.Context) {
	vapidMu.RLock()
	if vapidPublicKey == "" {
		vapidMu.RUnlock()
		initVAPIDKeys()
		vapidMu.RLock()
	}
	key := vapidPublicKey
	vapidMu.RUnlock()

	c.JSON(http.StatusOK, gin.H{
		"publicKey":  key,
		"public_key": key,
		"vapidKey":   key,
	})
}

// SubscribeWebPush registers or updates a client PWA push subscription (REQ-BE-09)
func SubscribeWebPush(c *gin.Context) {
	// Dukung format payload bersarang { subscription: ... } maupun format langsung { endpoint, keys: ... }
	var raw struct {
		DeviceID string `json:"deviceId"`
		Endpoint string `json:"endpoint"`
		Keys     struct {
			P256dh string `json:"p256dh"`
			Auth   string `json:"auth"`
		} `json:"keys"`
		Subscription struct {
			Endpoint string `json:"endpoint"`
			Keys     struct {
				P256dh string `json:"p256dh"`
				Auth   string `json:"auth"`
			} `json:"keys"`
		} `json:"subscription"`
	}

	if err := c.ShouldBindJSON(&raw); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Format subscription tidak valid: " + err.Error()})
		return
	}

	endpoint := raw.Subscription.Endpoint
	p256dh := raw.Subscription.Keys.P256dh
	auth := raw.Subscription.Keys.Auth

	if endpoint == "" {
		endpoint = raw.Endpoint
		p256dh = raw.Keys.P256dh
		auth = raw.Keys.Auth
	}

	if endpoint == "" || p256dh == "" || auth == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Endpoint, p256dh, dan auth wajib disertakan"})
		return
	}

	var userID string
	if uid, err := ExtractUserID(c); err == nil {
		userID = uid
	}

	var existing models.WebPushSubscription
	err := database.DB.Where("endpoint = ?", endpoint).First(&existing).Error
	if err == nil {
		// Update existing
		if raw.DeviceID != "" {
			existing.DeviceID = raw.DeviceID
		}
		if userID != "" {
			existing.UserID = userID
		}
		existing.P256dh = p256dh
		existing.Auth = auth
		if err := database.DB.Save(&existing).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal memperbarui langganan notifikasi: " + err.Error()})
			return
		}
		c.JSON(http.StatusOK, gin.H{
			"status":         "success",
			"message":        "Langganan notifikasi push berhasil diperbarui",
			"subscriptionId": existing.ID,
		})
		return
	}

	// Buat subscription baru
	newSub := models.WebPushSubscription{
		DeviceID:  raw.DeviceID,
		UserID:    userID,
		Endpoint:  endpoint,
		P256dh:    p256dh,
		Auth:      auth,
		CreatedAt: time.Now(),
	}

	if err := database.DB.Create(&newSub).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal mendaftarkan langganan notifikasi: " + err.Error()})
		return
	}

	c.JSON(http.StatusCreated, gin.H{
		"status":         "success",
		"message":        "Langganan notifikasi push berhasil didaftarkan",
		"subscriptionId": newSub.ID,
	})
}

// TestWebPush sends a test notification to all or specific device subscriptions
func TestWebPush(c *gin.Context) {
	var req struct {
		DeviceID string `json:"deviceId"`
		Title    string `json:"title"`
		Body     string `json:"body"`
	}
	_ = c.ShouldBindJSON(&req)

	title := req.Title
	if title == "" {
		title = "Uji Coba Notifikasi Rintik"
	}
	body := req.Body
	if body == "" {
		body = "Koneksi Web Push berhasil! HP Anda siap menerima peringatan hujan otomatis."
	}

	SendWebPushAlert(req.DeviceID, title, body)

	var count int64
	if req.DeviceID != "" {
		database.DB.Model(&models.WebPushSubscription{}).Where("device_id = ? OR device_id = ''", req.DeviceID).Count(&count)
	} else {
		database.DB.Model(&models.WebPushSubscription{}).Count(&count)
	}

	c.JSON(http.StatusOK, gin.H{
		"status":        "success",
		"message":       "Perintah push notifikasi uji coba berhasil dikirim",
		"targetedSubs": count,
	})
}

// SendWebPushAlert broadcasts push notification to registered browsers for a device
func SendWebPushAlert(deviceID string, title string, body string) {
	vapidMu.RLock()
	pubKey := vapidPublicKey
	privKey := vapidPrivateKey
	vapidMu.RUnlock()

	if pubKey == "" || privKey == "" {
		return
	}

	var subs []models.WebPushSubscription
	if deviceID != "" {
		database.DB.Where("device_id = ? OR device_id = ''", deviceID).Find(&subs)
	} else {
		database.DB.Find(&subs)
	}

	if len(subs) == 0 {
		return
	}

	payloadData, err := json.Marshal(gin.H{
		"title":     title,
		"body":      body,
		"icon":      "/favicon.svg?v=2",
		"badge":     "/favicon.svg?v=2",
		"url":       "/",
		"timestamp": time.Now().UnixMilli(),
	})
	if err != nil {
		return
	}

	subscriberEmail := os.Getenv("VAPID_SUBSCRIBER_EMAIL")
	if subscriberEmail == "" {
		subscriberEmail = "admin@hujanpantau.sslip.io"
	}

	go func(subscriptions []models.WebPushSubscription, payload []byte) {
		for _, s := range subscriptions {
			sub := &webpush.Subscription{
				Endpoint: s.Endpoint,
				Keys: webpush.Keys{
					P256dh: s.P256dh,
					Auth:   s.Auth,
				},
			}

			resp, err := webpush.SendNotification(payload, sub, &webpush.Options{
				Subscriber:      subscriberEmail,
				VAPIDPublicKey:  pubKey,
				VAPIDPrivateKey: privKey,
				TTL:             60,
				Urgency:         webpush.UrgencyHigh,
			})

			if err != nil {
				log.Printf("[WebPush] Gagal kirim ke subscription #%d (%s): %v", s.ID, s.Endpoint, err)
			} else if resp != nil {
				_ = resp.Body.Close()
				// Jika 410 Gone atau 404, subscription sudah kedaluwarsa di browser, hapus dari DB
				if resp.StatusCode == http.StatusGone || resp.StatusCode == http.StatusNotFound {
					database.DB.Delete(&s)
					log.Printf("[WebPush] Menghapus subscription kedaluwarsa #%d (HTTP %d)", s.ID, resp.StatusCode)
				}
			}
		}
	}(subs, payloadData)
}
