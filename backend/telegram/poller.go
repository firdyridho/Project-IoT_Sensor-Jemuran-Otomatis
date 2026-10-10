package telegram

import (
	"bytes"
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"strings"
	"time"

	"hujan-backend/database"
	"hujan-backend/handlers"
	"hujan-backend/models"
)

type Update struct {
	UpdateID int `json:"update_id"`
	Message  *struct {
		MessageID int `json:"message_id"`
		From      struct {
			ID        int64  `json:"id"`
			FirstName string `json:"first_name"`
			Username  string `json:"username"`
		} `json:"from"`
		Chat struct {
			ID   int64  `json:"id"`
			Type string `json:"type"`
		} `json:"chat"`
		Text string `json:"text"`
	} `json:"message"`
}

type UpdatesResponse struct {
	OK     bool     `json:"ok"`
	Result []Update `json:"result"`
}

// StartBotPoller menjalankan background polling getUpdates untuk fitur auto-connect 1-klik Telegram
func StartBotPoller(botToken string) {
	if botToken == "" {
		log.Println("[Telegram] Bot token tidak diatur. Poller 1-klik dinonaktifkan.")
		return
	}

	go func() {
		log.Println("[Telegram] Memulai Bot Poller untuk auto-connect Telegram...")
		client := &http.Client{Timeout: 35 * time.Second}
		offset := 0

		for {
			url := fmt.Sprintf("https://api.telegram.org/bot%s/getUpdates?offset=%d&timeout=15", botToken, offset)
			resp, err := client.Get(url)
			if err != nil {
				time.Sleep(5 * time.Second)
				continue
			}

			var updateResp UpdatesResponse
			err = json.NewDecoder(resp.Body).Decode(&updateResp)
			resp.Body.Close()

			if err != nil || !updateResp.OK {
				time.Sleep(5 * time.Second)
				continue
			}

			for _, upd := range updateResp.Result {
				if upd.UpdateID >= offset {
					offset = upd.UpdateID + 1
				}

				if upd.Message == nil || upd.Message.Text == "" {
					continue
				}

				msgText := strings.TrimSpace(upd.Message.Text)
				chatID := fmt.Sprintf("%d", upd.Message.Chat.ID)
				userName := upd.Message.From.FirstName
				if userName == "" {
					userName = "Pengguna"
				}

				// Cek jika perintah adalah /start
				if strings.HasPrefix(msgText, "/start") {
					parts := strings.Fields(msgText)
					targetDeviceID := "hs-24e1796dc9a1" // default fallback
					if len(parts) > 1 {
						payload := strings.TrimPrefix(parts[1], "pair_")
						if payload != "" {
							targetDeviceID = payload
						}
					}

					// Simpan ke database jika tabel device ada
					if database.DB != nil {
						var dev models.Device
						if err := database.DB.First(&dev, "id = ?", targetDeviceID).Error; err == nil {
							dev.TelegramChatID = chatID
							database.DB.Save(&dev)
						}
					}

					// Kirim pesan konfirmasi ke pengguna di Telegram
					replyText := fmt.Sprintf("🎉 <b>Halo %s!</b>\n\nAkun Telegram Anda <b>BERHASIL TERHUBUNG</b> ke aplikasi <b>Rintik IoT</b> untuk perangkat <code>%s</code>!\n\nID Obrolan Anda: <code>%s</code>\n\nSekarang Anda akan menerima pesan darurat otomatis di sini jika hujan turun dan jemuran ditarik ke kanopi.",
						userName, targetDeviceID, chatID)

					sendReply(botToken, chatID, replyText)

					// Broadcast ke Dashboard Web agar langsung update statusnya secara realtime
					handlers.Hub.Broadcast("telegram_paired", map[string]interface{}{
						"deviceId": targetDeviceID,
						"chatId":   chatID,
						"username": userName,
					})

					log.Printf("[Telegram] Berhasil menghubungkan user '%s' (Chat ID: %s) ke device %s", userName, chatID, targetDeviceID)
				}
			}
		}
	}()
}

func sendReply(botToken, chatID, text string) {
	url := fmt.Sprintf("https://api.telegram.org/bot%s/sendMessage", botToken)
	body, _ := json.Marshal(map[string]interface{}{
		"chat_id":    chatID,
		"text":       text,
		"parse_mode": "HTML",
	})
	resp, err := http.Post(url, "application/json", bytes.NewBuffer(body))
	if err == nil {
		resp.Body.Close()
	}
}
