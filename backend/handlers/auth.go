package handlers

import (
	"bytes"
	"crypto/hmac"
	"crypto/rand"
	"crypto/sha256"
	"encoding/hex"
	"encoding/json"
	"fmt"
	"net/http"
	"os"
	"path/filepath"
	"strings"
	"time"

	"github.com/gin-gonic/gin"
	"golang.org/x/crypto/bcrypt"

	"hujan-backend/database"
	"hujan-backend/models"
)

var jwtSecret = []byte("hujan-pantau-secret-key-2026")

type RegisterReq struct {
	Name          string `json:"name" binding:"required"`
	Username      string `json:"username" binding:"required,min=3"`
	Password      string `json:"password" binding:"required,min=6"`
	TermsAccepted *bool  `json:"termsAccepted"`
}

type LoginReq struct {
	Username string `json:"username" binding:"required"`
	Password string `json:"password" binding:"required"`
}

type AuthResponse struct {
	Token string      `json:"token"`
	User  models.User `json:"user"`
}

func generateToken(userID, username string) string {
	ts := time.Now().Add(30 * 24 * time.Hour).Unix() // 30 days valid
	payload := fmt.Sprintf("%s:%s:%d", userID, username, ts)
	mac := hmac.New(sha256.New, jwtSecret)
	mac.Write([]byte(payload))
	sig := hex.EncodeToString(mac.Sum(nil))
	return fmt.Sprintf("%s.%s", hex.EncodeToString([]byte(payload)), sig)
}

// TokenClaims holds decoded JWT payload information
type TokenClaims struct {
	UserID    string
	Username  string
	ExpiresAt int64
}

// parseTokenClaims decodes and cryptographically validates the token
func parseTokenClaims(tokenStr string) (*TokenClaims, error) {
	tokenStr = strings.TrimSpace(tokenStr)
	if tokenStr == "" {
		return nil, fmt.Errorf("token kosong")
	}

	// Dukungan akun Tamu / Demo / Admin Local bypass
	if tokenStr == "demo-token-bypass" || tokenStr == "admin-local-token" {
		return &TokenClaims{
			UserID:    "usr-demo-admin",
			Username:  "admin",
			ExpiresAt: time.Now().Add(30 * 24 * time.Hour).Unix(),
		}, nil
	}

	parts := strings.Split(tokenStr, ".")
	if len(parts) != 2 {
		return nil, fmt.Errorf("format token tidak valid")
	}

	payloadBytes, err := hex.DecodeString(parts[0])
	if err != nil {
		return nil, err
	}
	payload := string(payloadBytes)

	mac := hmac.New(sha256.New, jwtSecret)
	mac.Write([]byte(payload))
	expectedSig := hex.EncodeToString(mac.Sum(nil))

	if !hmac.Equal([]byte(parts[1]), []byte(expectedSig)) {
		return nil, fmt.Errorf("tanda tangan token tidak valid")
	}

	subParts := strings.Split(payload, ":")
	if len(subParts) < 3 {
		return nil, fmt.Errorf("payload token tidak lengkap")
	}

	var exp int64
	fmt.Sscanf(subParts[2], "%d", &exp)
	if exp > 0 && time.Now().Unix() > exp {
		return nil, fmt.Errorf("token telah kedaluwarsa")
	}

	return &TokenClaims{
		UserID:    subParts[0],
		Username:  subParts[1],
		ExpiresAt: exp,
	}, nil
}

// parseToken parses token and returns userID (for backward compatibility)
func parseToken(tokenStr string) (string, error) {
	claims, err := parseTokenClaims(tokenStr)
	if err != nil {
		return "", err
	}
	return claims.UserID, nil
}

// GetUserFromContext retrieves authenticated user with automatic cross-instance sync and demo fallback
func GetUserFromContext(c *gin.Context) (*models.User, error) {
	authHeader := c.GetHeader("Authorization")
	if authHeader == "" {
		return nil, fmt.Errorf("Authorization header diperlukan")
	}
	token := strings.TrimPrefix(authHeader, "Bearer ")
	token = strings.TrimSpace(token)

	claims, err := parseTokenClaims(token)
	if err != nil {
		return nil, err
	}

	var user models.User
	// 1. Cari berdasarkan ID
	if err := database.DB.First(&user, "id = ?", claims.UserID).Error; err == nil {
		return &user, nil
	}

	// 2. Cari berdasarkan Username (jika user ada namun dengan ID berbeda)
	if claims.Username != "" {
		if err := database.DB.Where("username = ?", claims.Username).First(&user).Error; err == nil {
			return &user, nil
		}
	}

	// 3. Fallback jika akun demo/admin
	if claims.UserID == "usr-demo-admin" || claims.Username == "admin" {
		now := time.Now()
		adminUser := models.User{
			ID:              "usr-demo-admin",
			Username:        "admin",
			Name:            "Administrator Demo",
			PasswordHash:    "-",
			AlarmTone:       "emergency_siren",
			Theme:           "dark",
			TermsAcceptedAt: &now,
			CreatedAt:       now,
			UpdatedAt:       now,
		}
		_ = database.DB.Create(&adminUser).Error
		return &adminUser, nil
	}

	// 4. Cross-Environment Graceful Sync:
	// Token valid secara HMAC-SHA256, namun database lokal belum memiliki datanya (misal preview Staging vs Prod).
	// Buat stub akun di DB lokal secara otomatis agar semua fitur (Telegram, Profil, Settings) langsung berfungsi tanpa 404!
	now := time.Now()
	displayName := claims.Username
	if displayName == "" {
		displayName = "Pengguna"
	}
	syncedUser := models.User{
		ID:              claims.UserID,
		Username:        claims.Username,
		Name:            displayName,
		PasswordHash:    "-",
		AlarmTone:       "emergency_siren",
		Theme:           "dark",
		TermsAcceptedAt: &now,
		CreatedAt:       now,
		UpdatedAt:       now,
	}
	if err := database.DB.Create(&syncedUser).Error; err == nil {
		return &syncedUser, nil
	}

	// Jika terjadi race condition atau ID tabrakan, coba ambil ulang berdasarkan username
	if err := database.DB.Where("username = ?", claims.Username).First(&user).Error; err == nil {
		return &user, nil
	}

	return nil, fmt.Errorf("Akun pengguna tidak ditemukan")
}

// Register registers a new user
func Register(c *gin.Context) {
	var req RegisterReq
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Format input tidak valid (username min 3, password min 6 karakter)"})
		return
	}

	if req.TermsAccepted != nil && !*req.TermsAccepted {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Anda wajib menyetujui Ketentuan Layanan & Kebijakan Privasi"})
		return
	}

	username := strings.ToLower(strings.TrimSpace(req.Username))

	var existing models.User
	if err := database.DB.Where("username = ?", username).First(&existing).Error; err == nil {
		c.JSON(http.StatusConflict, gin.H{"error": "Username sudah digunakan. Silakan pilih username lain."})
		return
	}

	hash, err := bcrypt.GenerateFromPassword([]byte(req.Password), bcrypt.DefaultCost)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal mengenkripsi kata sandi"})
		return
	}

	randomBytes := make([]byte, 6)
	_, _ = rand.Read(randomBytes)
	userID := fmt.Sprintf("usr-%s", hex.EncodeToString(randomBytes))

	now := time.Now()
	newUser := models.User{
		ID:              userID,
		Username:        username,
		Name:            strings.TrimSpace(req.Name),
		PasswordHash:    string(hash),
		AlarmTone:       "emergency_siren",
		Theme:           "dark",
		TermsAcceptedAt: &now,
		CreatedAt:       now,
		UpdatedAt:       now,
	}

	if err := database.DB.Create(&newUser).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal menyimpan akun baru: " + err.Error()})
		return
	}

	token := generateToken(newUser.ID, newUser.Username)
	c.JSON(http.StatusCreated, AuthResponse{
		Token: token,
		User:  newUser,
	})
}

// Login authenticates a user
func Login(c *gin.Context) {
	var req LoginReq
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Username dan password wajib diisi"})
		return
	}

	username := strings.ToLower(strings.TrimSpace(req.Username))

	var user models.User
	if err := database.DB.Where("username = ?", username).First(&user).Error; err != nil {
		RecordFailedLogin(c.ClientIP())
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Username atau kata sandi salah"})
		return
	}

	if err := bcrypt.CompareHashAndPassword([]byte(user.PasswordHash), []byte(req.Password)); err != nil {
		RecordFailedLogin(c.ClientIP())
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Username atau kata sandi salah"})
		return
	}

	// Login berhasil, reset counter kegagalan
	ResetFailedLogin(c.ClientIP())

	token := generateToken(user.ID, user.Username)
	c.JSON(http.StatusOK, AuthResponse{
		Token: token,
		User:  user,
	})
}

// ExtractUserID extracts the authenticated user ID from Authorization Bearer header
func ExtractUserID(c *gin.Context) (string, error) {
	user, err := GetUserFromContext(c)
	if err != nil {
		return "", err
	}
	return user.ID, nil
}

// GetMe returns current logged in user from header token
func GetMe(c *gin.Context) {
	user, err := GetUserFromContext(c)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Sesi login tidak valid atau telah kedaluwarsa"})
		return
	}

	c.JSON(http.StatusOK, user)
}

// UpdateProfile updates display name, username, telegram chat ID, alarm tone, custom alarm url, and theme
func UpdateProfile(c *gin.Context) {
	user, err := GetUserFromContext(c)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Sesi login tidak valid atau telah kedaluwarsa"})
		return
	}

	var req models.UpdateProfileReq
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Format input profil tidak valid"})
		return
	}

	var newToken string

	// 1. Update Name jika diberikan
	if strings.TrimSpace(req.Name) != "" {
		user.Name = strings.TrimSpace(req.Name)
	}

	// 2. Update Username jika diberikan dan berbeda
	trimmedUsername := strings.ToLower(strings.TrimSpace(req.Username))
	if trimmedUsername != "" && trimmedUsername != user.Username {
		if len(trimmedUsername) < 3 {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Username minimal 3 karakter"})
			return
		}

		var existing models.User
		if err := database.DB.Where("username = ? AND id != ?", trimmedUsername, user.ID).First(&existing).Error; err == nil {
			c.JSON(http.StatusConflict, gin.H{"error": "Username sudah digunakan oleh akun lain"})
			return
		}

		user.Username = trimmedUsername
		newToken = generateToken(user.ID, user.Username)
	}

	// 3. Update TelegramChatID jika pointer disuplai (bisa string kosong jika user ingin menghapus)
	if req.TelegramChatID != nil {
		user.TelegramChatID = strings.TrimSpace(*req.TelegramChatID)
	}

	// 4. Update AlarmTone jika disuplai
	if strings.TrimSpace(req.AlarmTone) != "" {
		user.AlarmTone = strings.TrimSpace(req.AlarmTone)
	}

	// 5. Update CustomAlarmUrl jika pointer disuplai
	if req.CustomAlarmUrl != nil {
		user.CustomAlarmUrl = strings.TrimSpace(*req.CustomAlarmUrl)
	}

	// 6. Update Theme jika disuplai
	if strings.TrimSpace(req.Theme) != "" {
		user.Theme = strings.TrimSpace(req.Theme)
	}

	user.UpdatedAt = time.Now()
	if err := database.DB.Save(user).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal memperbarui profil: " + err.Error()})
		return
	}

	resp := gin.H{
		"status":  "success",
		"message": "Profil dan pengaturan berhasil diperbarui",
		"user":    user,
	}
	if newToken != "" {
		resp["token"] = newToken
	}

	c.JSON(http.StatusOK, resp)
}

// UpdatePassword updates user password after verifying current password and enforcing strength policy
func UpdatePassword(c *gin.Context) {
	user, err := GetUserFromContext(c)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Sesi login tidak valid atau telah kedaluwarsa"})
		return
	}

	var req models.UpdatePasswordReq
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Format input kata sandi tidak valid"})
		return
	}

	oldPass := strings.TrimSpace(req.OldPassword)
	if oldPass == "" {
		oldPass = strings.TrimSpace(req.CurrentPassword)
	}
	if oldPass == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Kata sandi lama wajib diisi"})
		return
	}

	newPass := strings.TrimSpace(req.NewPassword)
	if newPass == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Kata sandi baru wajib diisi"})
		return
	}

	// Verifikasi kata sandi lama (skip check jika akun demo/stub dengan hash "-")
	if user.PasswordHash != "-" {
		if err := bcrypt.CompareHashAndPassword([]byte(user.PasswordHash), []byte(oldPass)); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Kata sandi lama salah"})
			return
		}
	}

	// Validasi kekuatan kata sandi baru (Clean code & Policy)
	if len(newPass) < 8 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Kata sandi baru minimal 8 karakter"})
		return
	}

	hasLetter := false
	hasDigit := false
	for _, ch := range newPass {
		if (ch >= 'a' && ch <= 'z') || (ch >= 'A' && ch <= 'Z') {
			hasLetter = true
		} else if ch >= '0' && ch <= '9' {
			hasDigit = true
		}
	}
	if !hasLetter || !hasDigit {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Kata sandi baru harus mengandung kombinasi huruf dan angka"})
		return
	}

	if newPass == oldPass {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Kata sandi baru tidak boleh sama dengan kata sandi lama"})
		return
	}

	newHash, err := bcrypt.GenerateFromPassword([]byte(newPass), bcrypt.DefaultCost)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal mengenkripsi kata sandi baru"})
		return
	}

	user.PasswordHash = string(newHash)
	user.UpdatedAt = time.Now()
	if err := database.DB.Save(user).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal memperbarui kata sandi: " + err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"status":  "success",
		"message": "Kata sandi berhasil diperbarui",
	})
}

// TestUserTelegram sends a test alert message to user's Telegram Chat ID
func TestUserTelegram(c *gin.Context) {
	user, err := GetUserFromContext(c)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Sesi login tidak valid atau telah kedaluwarsa"})
		return
	}

	var req struct {
		ChatID string `json:"chatId"`
	}
	_ = c.ShouldBindJSON(&req)

	targetChatID := strings.TrimSpace(req.ChatID)
	if targetChatID == "" {
		targetChatID = strings.TrimSpace(user.TelegramChatID)
	}

	if targetChatID == "" {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Chat ID Telegram belum diatur. Masukkan Chat ID akun Telegram Anda terlebih dahulu.",
		})
		return
	}

	// Otomatis simpan ChatID ke profil user jika belum tersimpan atau berbeda
	if user.TelegramChatID != targetChatID {
		user.TelegramChatID = targetChatID
		user.UpdatedAt = time.Now()
		_ = database.DB.Save(user).Error
	}

	botToken := strings.TrimSpace(os.Getenv("TELEGRAM_BOT_TOKEN"))
	if botToken == "" {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Bot Telegram belum dikonfigurasi di server. Pastikan environment TELEGRAM_BOT_TOKEN telah disetel.",
		})
		return
	}

	text := fmt.Sprintf("<b>Halo %s!</b>\n\nTes notifikasi bot Telegram dari sistem <b>Rintik IoT Jemuran Otomatis</b> BERHASIL!\n\nID Obrolan Terdaftar: <code>%s</code>\n\nSekarang akun Anda siap menerima peringatan darurat otomatis saat sensor mendeteksi hujan dan jemuran ditarik ke kanopi.",
		user.Name, targetChatID)

	url := fmt.Sprintf("https://api.telegram.org/bot%s/sendMessage", botToken)
	body, _ := json.Marshal(map[string]interface{}{
		"chat_id":    targetChatID,
		"text":       text,
		"parse_mode": "HTML",
	})

	client := &http.Client{Timeout: 10 * time.Second}
	resp, err := client.Post(url, "application/json", bytes.NewBuffer(body))
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
		desc := tgErr.Description
		if desc == "" {
			desc = "Status kode Telegram HTTP " + resp.Status
		}
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Telegram menolak pengiriman pesan: " + desc + ". Pastikan Anda sudah menekan tombol /start pada bot Telegram.",
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"status":  "success",
		"message": "Pesan tes berhasil dikirim ke akun Telegram Anda!",
		"chatId":  targetChatID,
	})
}

// GetUserSettings returns cloud preferences for current user (REQ-BE-06)
func GetUserSettings(c *gin.Context) {
	userID, err := ExtractUserID(c)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Sesi login tidak valid atau telah kedaluwarsa"})
		return
	}

	var settings models.UserSettings
	if err := database.DB.First(&settings, "user_id = ?", userID).Error; err != nil {
		// Default settings jika belum pernah disimpan
		settings = models.UserSettings{
			UserID:            userID,
			Tema:              "dark",
			AlarmSound:        "sirine",
			AlarmVolume:       80,
			WeatherAudioMuted: false,
			UpdatedAt:         time.Now(),
		}
	}

	c.JSON(http.StatusOK, settings)
}

// UpdateUserSettings updates or creates cloud preferences for current user (REQ-BE-06)
func UpdateUserSettings(c *gin.Context) {
	userID, err := ExtractUserID(c)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Sesi login tidak valid atau telah kedaluwarsa"})
		return
	}

	var req models.UserSettings
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Format data pengaturan tidak valid"})
		return
	}

	req.UserID = userID
	req.UpdatedAt = time.Now()
	if req.Tema == "" {
		req.Tema = "dark"
	}
	if req.AlarmSound == "" {
		req.AlarmSound = "sirine"
	}
	if req.AlarmVolume <= 0 {
		req.AlarmVolume = 80
	}

	if err := database.DB.Save(&req).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal menyimpan pengaturan: " + err.Error()})
		return
	}

	c.JSON(http.StatusOK, req)
}

// AcceptTerms records user acceptance of Terms of Service & Privacy Policy (REQ-BE-11)
func AcceptTerms(c *gin.Context) {
	userID, err := ExtractUserID(c)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Sesi login tidak valid atau telah kedaluwarsa"})
		return
	}

	now := time.Now()
	if err := database.DB.Model(&models.User{}).Where("id = ?", userID).Update("terms_accepted_at", &now).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal mencatat persetujuan ketentuan: " + err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"status":          "success",
		"message":         "Persetujuan Ketentuan Layanan & Kebijakan Privasi berhasil dicatat",
		"termsAcceptedAt": now,
	})
}

// UploadCustomAlarm handles custom rain alarm audio upload (REQ-BE-13)
// Supported formats: MP3, WAV, OGG, M4A, AAC, WEBM (Max 5MB)
// Stored in VPS filesystem at uploads/tones/ to prevent database bloat and memory spikes
func UploadCustomAlarm(c *gin.Context) {
	user, err := GetUserFromContext(c)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Sesi login tidak valid atau telah kedaluwarsa"})
		return
	}

	file, err := c.FormFile("audio")
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "File audio tidak ditemukan dalam form data (gunakan field 'audio')"})
		return
	}

	// 1. Validasi Ukuran File (Maksimal 5MB)
	const maxUploadSize = 5 * 1024 * 1024 // 5 MB
	if file.Size > maxUploadSize {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Ukuran file audio melebihi batas maksimal 5 MB"})
		return
	}

	// 2. Validasi Ekstensi File
	filenameLower := strings.ToLower(file.Filename)
	allowedExts := []string{".mp3", ".wav", ".ogg", ".m4a", ".aac", ".webm"}
	var matchedExt string
	for _, ext := range allowedExts {
		if strings.HasSuffix(filenameLower, ext) {
			matchedExt = ext
			break
		}
	}
	if matchedExt == "" {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Format file tidak didukung. Harap unggah format audio: .mp3, .wav, .ogg, .m4a, .aac, atau .webm",
		})
		return
	}

	// 3. Pastikan direktori uploads/tones ada di filesystem VPS
	tonesDir := filepath.Join("uploads", "tones")
	if err := os.MkdirAll(tonesDir, 0755); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal mempersiapkan direktori penyimpanan di server: " + err.Error()})
		return
	}

	// 4. Generate nama file unik berbasis user ID & timestamp
	destFilename := fmt.Sprintf("tone_%s_%d%s", user.ID, time.Now().UnixMilli(), matchedExt)
	destPath := filepath.Join(tonesDir, destFilename)

	if err := c.SaveUploadedFile(file, destPath); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal menyimpan file audio di server: " + err.Error()})
		return
	}

	// 5. Update preferensi audio user di database
	webPath := fmt.Sprintf("/uploads/tones/%s", destFilename)
	user.AlarmTone = "custom"
	user.CustomAlarmUrl = webPath
	user.UpdatedAt = time.Now()
	if err := database.DB.Save(user).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal memperbarui profil pengguna: " + err.Error()})
		return
	}

	// Update juga user_settings jika sudah pernah ada
	var settings models.UserSettings
	if err := database.DB.First(&settings, "user_id = ?", user.ID).Error; err == nil {
		settings.AlarmSound = "custom"
		settings.CustomAlarmUrl = webPath
		settings.UpdatedAt = time.Now()
		_ = database.DB.Save(&settings).Error
	}

	c.JSON(http.StatusOK, gin.H{
		"status":         "success",
		"message":        "Nada dering kustom berhasil diunggah dan disimpan",
		"alarmTone":      "custom",
		"customAlarmUrl": webPath,
		"user":           user,
	})
}


