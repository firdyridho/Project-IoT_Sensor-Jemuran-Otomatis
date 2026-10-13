package handlers

import (
	"crypto/hmac"
	"crypto/rand"
	"crypto/sha256"
	"encoding/hex"
	"fmt"
	"net/http"
	"strings"
	"time"

	"github.com/gin-gonic/gin"
	"golang.org/x/crypto/bcrypt"

	"hujan-backend/database"
	"hujan-backend/models"
)

var jwtSecret = []byte("hujan-pantau-secret-key-2026")

type RegisterReq struct {
	Name     string `json:"name" binding:"required"`
	Username string `json:"username" binding:"required,min=3"`
	Password string `json:"password" binding:"required,min=6"`
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

func parseToken(tokenStr string) (string, error) {
	parts := strings.Split(tokenStr, ".")
	if len(parts) != 2 {
		return "", fmt.Errorf("invalid token format")
	}

	payloadBytes, err := hex.DecodeString(parts[0])
	if err != nil {
		return "", err
	}
	payload := string(payloadBytes)

	mac := hmac.New(sha256.New, jwtSecret)
	mac.Write([]byte(payload))
	expectedSig := hex.EncodeToString(mac.Sum(nil))

	if !hmac.Equal([]byte(parts[1]), []byte(expectedSig)) {
		return "", fmt.Errorf("invalid token signature")
	}

	subParts := strings.Split(payload, ":")
	if len(subParts) < 3 {
		return "", fmt.Errorf("invalid payload")
	}

	return subParts[0], nil
}

// Register registers a new user
func Register(c *gin.Context) {
	var req RegisterReq
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Format input tidak valid (username min 3, password min 6 karakter)"})
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

	newUser := models.User{
		ID:           userID,
		Username:     username,
		Name:         strings.TrimSpace(req.Name),
		PasswordHash: string(hash),
		CreatedAt:    time.Now(),
		UpdatedAt:    time.Now(),
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
	authHeader := c.GetHeader("Authorization")
	if authHeader == "" {
		return "", fmt.Errorf("Authorization header diperlukan")
	}
	token := strings.TrimPrefix(authHeader, "Bearer ")
	token = strings.TrimSpace(token)
	return parseToken(token)
}

// GetMe returns current logged in user from header token
func GetMe(c *gin.Context) {
	userID, err := ExtractUserID(c)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Sesi login tidak valid atau telah kedaluwarsa"})
		return
	}

	var user models.User
	if err := database.DB.First(&user, "id = ?", userID).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Akun pengguna tidak ditemukan"})
		return
	}

	c.JSON(http.StatusOK, user)
}

// UpdateProfile updates the display name of current user (REQ-BE-08)
func UpdateProfile(c *gin.Context) {
	userID, err := ExtractUserID(c)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Sesi login tidak valid atau telah kedaluwarsa"})
		return
	}

	var req models.UpdateProfileReq
	if err := c.ShouldBindJSON(&req); err != nil || strings.TrimSpace(req.Name) == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Nama lengkap tidak boleh kosong"})
		return
	}

	var user models.User
	if err := database.DB.First(&user, "id = ?", userID).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Akun pengguna tidak ditemukan"})
		return
	}

	user.Name = strings.TrimSpace(req.Name)
	user.UpdatedAt = time.Now()
	if err := database.DB.Save(&user).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal memperbarui profil: " + err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"status":  "success",
		"message": "Profil berhasil diperbarui",
		"user":    user,
	})
}

// UpdatePassword updates user password after verifying old password (REQ-BE-08)
func UpdatePassword(c *gin.Context) {
	userID, err := ExtractUserID(c)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Sesi login tidak valid atau telah kedaluwarsa"})
		return
	}

	var req models.UpdatePasswordReq
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Format input kata sandi tidak valid (minimal 6 karakter)"})
		return
	}

	var user models.User
	if err := database.DB.First(&user, "id = ?", userID).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Akun pengguna tidak ditemukan"})
		return
	}

	if err := bcrypt.CompareHashAndPassword([]byte(user.PasswordHash), []byte(req.OldPassword)); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Kata sandi lama salah"})
		return
	}

	newHash, err := bcrypt.GenerateFromPassword([]byte(req.NewPassword), bcrypt.DefaultCost)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal mengenkripsi kata sandi baru"})
		return
	}

	user.PasswordHash = string(newHash)
	user.UpdatedAt = time.Now()
	if err := database.DB.Save(&user).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal memperbarui kata sandi: " + err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"status":  "success",
		"message": "Kata sandi berhasil diperbarui",
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
