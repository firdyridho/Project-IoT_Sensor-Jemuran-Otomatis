package main

import (
	"bytes"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"os"
	"testing"

	"github.com/gin-gonic/gin"
	"github.com/stretchr/testify/assert"

	"hujan-backend/database"
	"hujan-backend/handlers"
	"hujan-backend/models"
)

func setupUserSettingsTestRouter() *gin.Engine {
	gin.SetMode(gin.TestMode)
	os.Setenv("DB_TYPE", "sqlite")
	os.Setenv("DB_PATH", ":memory:")
	_, _ = database.InitDB()

	r := gin.Default()
	api := r.Group("/api")
	{
		api.POST("/auth/register", handlers.Register)
		api.POST("/auth/login", handlers.LoginBruteForceMiddleware(), handlers.Login)
		api.GET("/auth/me", handlers.GetMe)
		api.GET("/user/profile", handlers.GetMe)
		api.PUT("/auth/profile", handlers.UpdateProfile)
		api.PUT("/user/profile", handlers.UpdateProfile)
		api.PUT("/auth/password", handlers.UpdatePassword)
		api.PUT("/user/password", handlers.UpdatePassword)
		api.POST("/user/test-telegram", handlers.TestUserTelegram)
	}
	return r
}

func TestUserProfileSettings(t *testing.T) {
	r := setupUserSettingsTestRouter()

	// 1. Register User 1
	regUser1 := map[string]string{
		"name":     "Budi Santoso",
		"username": "budisantoso",
		"password": "Password123!",
	}
	body1, _ := json.Marshal(regUser1)
	req1, _ := http.NewRequest("POST", "/api/auth/register", bytes.NewBuffer(body1))
	req1.Header.Set("Content-Type", "application/json")
	w1 := httptest.NewRecorder()
	r.ServeHTTP(w1, req1)
	assert.Equal(t, http.StatusCreated, w1.Code)

	var authResp1 handlers.AuthResponse
	_ = json.Unmarshal(w1.Body.Bytes(), &authResp1)
	token1 := authResp1.Token
	assert.NotEmpty(t, token1)

	// 2. Register User 2 (untuk uji coba username conflict)
	regUser2 := map[string]string{
		"name":     "Siti Aminah",
		"username": "sitiaminah",
		"password": "Password123!",
	}
	body2, _ := json.Marshal(regUser2)
	req2, _ := http.NewRequest("POST", "/api/auth/register", bytes.NewBuffer(body2))
	req2.Header.Set("Content-Type", "application/json")
	w2 := httptest.NewRecorder()
	r.ServeHTTP(w2, req2)
	assert.Equal(t, http.StatusCreated, w2.Code)

	// 3. GET /api/user/profile for User 1
	getProfileReq, _ := http.NewRequest("GET", "/api/user/profile", nil)
	getProfileReq.Header.Set("Authorization", "Bearer "+token1)
	wProfile := httptest.NewRecorder()
	r.ServeHTTP(wProfile, getProfileReq)
	assert.Equal(t, http.StatusOK, wProfile.Code)

	var curUser models.User
	_ = json.Unmarshal(wProfile.Body.Bytes(), &curUser)
	assert.Equal(t, "Budi Santoso", curUser.Name)
	assert.Equal(t, "budisantoso", curUser.Username)

	// 4. PUT /api/user/profile: Update Name, Telegram, AlarmTone, Theme
	teleID := "123456789"
	updatePayload := models.UpdateProfileReq{
		Name:           "Budi Prakoso",
		TelegramChatID: &teleID,
		AlarmTone:      "radar_alert",
		Theme:          "light",
	}
	upBody, _ := json.Marshal(updatePayload)
	upReq, _ := http.NewRequest("PUT", "/api/user/profile", bytes.NewBuffer(upBody))
	upReq.Header.Set("Authorization", "Bearer "+token1)
	upReq.Header.Set("Content-Type", "application/json")
	wUp := httptest.NewRecorder()
	r.ServeHTTP(wUp, upReq)
	assert.Equal(t, http.StatusOK, wUp.Code)

	var upResp struct {
		User models.User `json:"user"`
	}
	_ = json.Unmarshal(wUp.Body.Bytes(), &upResp)
	assert.Equal(t, "Budi Prakoso", upResp.User.Name)
	assert.Equal(t, "123456789", upResp.User.TelegramChatID)
	assert.Equal(t, "radar_alert", upResp.User.AlarmTone)
	assert.Equal(t, "light", upResp.User.Theme)

	// 5. PUT /api/user/profile: Ganti username ke yang sudah dipakai User 2 -> 409 Conflict
	conflictPayload := models.UpdateProfileReq{
		Username: "sitiaminah",
	}
	cBody, _ := json.Marshal(conflictPayload)
	cReq, _ := http.NewRequest("PUT", "/api/user/profile", bytes.NewBuffer(cBody))
	cReq.Header.Set("Authorization", "Bearer "+token1)
	cReq.Header.Set("Content-Type", "application/json")
	wC := httptest.NewRecorder()
	r.ServeHTTP(wC, cReq)
	assert.Equal(t, http.StatusConflict, wC.Code)

	// 6. PUT /api/user/profile: Ganti username yang valid -> 200 OK + new token
	validUsernamePayload := models.UpdateProfileReq{
		Username: "budi_baru",
	}
	vBody, _ := json.Marshal(validUsernamePayload)
	vReq, _ := http.NewRequest("PUT", "/api/user/profile", bytes.NewBuffer(vBody))
	vReq.Header.Set("Authorization", "Bearer "+token1)
	vReq.Header.Set("Content-Type", "application/json")
	wV := httptest.NewRecorder()
	r.ServeHTTP(wV, vReq)
	assert.Equal(t, http.StatusOK, wV.Code)

	var vResp struct {
		Token string      `json:"token"`
		User  models.User `json:"user"`
	}
	_ = json.Unmarshal(wV.Body.Bytes(), &vResp)
	assert.Equal(t, "budi_baru", vResp.User.Username)
	assert.NotEmpty(t, vResp.Token)

	// 7. Verify new token works
	getReqNew, _ := http.NewRequest("GET", "/api/user/profile", nil)
	getReqNew.Header.Set("Authorization", "Bearer "+vResp.Token)
	wNew := httptest.NewRecorder()
	r.ServeHTTP(wNew, getReqNew)
	assert.Equal(t, http.StatusOK, wNew.Code)
}

func TestChangePasswordValidation(t *testing.T) {
	r := setupUserSettingsTestRouter()

	// 1. Register User
	regUser := map[string]string{
		"name":     "Ahmad Dahlan",
		"username": "ahmaddahlan",
		"password": "PasswordAwal123",
	}
	body, _ := json.Marshal(regUser)
	req, _ := http.NewRequest("POST", "/api/auth/register", bytes.NewBuffer(body))
	req.Header.Set("Content-Type", "application/json")
	w := httptest.NewRecorder()
	r.ServeHTTP(w, req)
	assert.Equal(t, http.StatusCreated, w.Code)

	var authResp handlers.AuthResponse
	_ = json.Unmarshal(w.Body.Bytes(), &authResp)
	token := authResp.Token

	// 2. Ganti password dengan password lama salah -> 400 Bad Request
	wrongOld := models.UpdatePasswordReq{
		OldPassword: "PasswordSalah123",
		NewPassword: "PasswordBaru123",
	}
	bWrong, _ := json.Marshal(wrongOld)
	rWrong, _ := http.NewRequest("PUT", "/api/user/password", bytes.NewBuffer(bWrong))
	rWrong.Header.Set("Authorization", "Bearer "+token)
	rWrong.Header.Set("Content-Type", "application/json")
	wWrong := httptest.NewRecorder()
	r.ServeHTTP(wWrong, rWrong)
	assert.Equal(t, http.StatusBadRequest, wWrong.Code)

	// 3. Ganti password dengan password baru kurang dari 8 karakter -> 400 Bad Request
	shortNew := models.UpdatePasswordReq{
		OldPassword: "PasswordAwal123",
		NewPassword: "Pendek1",
	}
	bShort, _ := json.Marshal(shortNew)
	rShort, _ := http.NewRequest("PUT", "/api/user/password", bytes.NewBuffer(bShort))
	rShort.Header.Set("Authorization", "Bearer "+token)
	rShort.Header.Set("Content-Type", "application/json")
	wShort := httptest.NewRecorder()
	r.ServeHTTP(wShort, rShort)
	assert.Equal(t, http.StatusBadRequest, wShort.Code)

	// 4. Ganti password dengan password baru tanpa angka -> 400 Bad Request
	noDigit := models.UpdatePasswordReq{
		OldPassword: "PasswordAwal123",
		NewPassword: "HanyaHurufSaja",
	}
	bNoDigit, _ := json.Marshal(noDigit)
	rNoDigit, _ := http.NewRequest("PUT", "/api/user/password", bytes.NewBuffer(bNoDigit))
	rNoDigit.Header.Set("Authorization", "Bearer "+token)
	rNoDigit.Header.Set("Content-Type", "application/json")
	wNoDigit := httptest.NewRecorder()
	r.ServeHTTP(wNoDigit, rNoDigit)
	assert.Equal(t, http.StatusBadRequest, wNoDigit.Code)

	// 5. Ganti password dengan password baru sama dengan password lama -> 400 Bad Request
	samePass := models.UpdatePasswordReq{
		OldPassword: "PasswordAwal123",
		NewPassword: "PasswordAwal123",
	}
	bSame, _ := json.Marshal(samePass)
	rSame, _ := http.NewRequest("PUT", "/api/user/password", bytes.NewBuffer(bSame))
	rSame.Header.Set("Authorization", "Bearer "+token)
	rSame.Header.Set("Content-Type", "application/json")
	wSame := httptest.NewRecorder()
	r.ServeHTTP(wSame, rSame)
	assert.Equal(t, http.StatusBadRequest, wSame.Code)

	// 6. Ganti password yang valid -> 200 OK
	validPass := models.UpdatePasswordReq{
		CurrentPassword: "PasswordAwal123",
		NewPassword:     "PasswordBaruKuat456",
	}
	bValid, _ := json.Marshal(validPass)
	rValid, _ := http.NewRequest("PUT", "/api/user/password", bytes.NewBuffer(bValid))
	rValid.Header.Set("Authorization", "Bearer "+token)
	rValid.Header.Set("Content-Type", "application/json")
	wValid := httptest.NewRecorder()
	r.ServeHTTP(wValid, rValid)
	assert.Equal(t, http.StatusOK, wValid.Code)

	// 7. Login dengan password lama harus gagal (401)
	oldLogin := map[string]string{
		"username": "ahmaddahlan",
		"password": "PasswordAwal123",
	}
	bOldLog, _ := json.Marshal(oldLogin)
	rOldLog, _ := http.NewRequest("POST", "/api/auth/login", bytes.NewBuffer(bOldLog))
	rOldLog.Header.Set("Content-Type", "application/json")
	wOldLog := httptest.NewRecorder()
	r.ServeHTTP(wOldLog, rOldLog)
	assert.Equal(t, http.StatusUnauthorized, wOldLog.Code)

	// 8. Login dengan password baru harus berhasil (200)
	newLogin := map[string]string{
		"username": "ahmaddahlan",
		"password": "PasswordBaruKuat456",
	}
	bNewLog, _ := json.Marshal(newLogin)
	rNewLog, _ := http.NewRequest("POST", "/api/auth/login", bytes.NewBuffer(bNewLog))
	rNewLog.Header.Set("Content-Type", "application/json")
	wNewLog := httptest.NewRecorder()
	r.ServeHTTP(wNewLog, rNewLog)
	assert.Equal(t, http.StatusOK, wNewLog.Code)
}

func TestTelegramTestEndpoint(t *testing.T) {
	r := setupUserSettingsTestRouter()

	// 1. Tanpa header auth -> 401
	reqNoAuth, _ := http.NewRequest("POST", "/api/user/test-telegram", nil)
	wNoAuth := httptest.NewRecorder()
	r.ServeHTTP(wNoAuth, reqNoAuth)
	assert.Equal(t, http.StatusUnauthorized, wNoAuth.Code)

	// 2. Register user
	regUser := map[string]string{
		"name":     "Test Telegram User",
		"username": "tguser",
		"password": "Password123!",
	}
	body, _ := json.Marshal(regUser)
	reqReg, _ := http.NewRequest("POST", "/api/auth/register", bytes.NewBuffer(body))
	reqReg.Header.Set("Content-Type", "application/json")
	wReg := httptest.NewRecorder()
	r.ServeHTTP(wReg, reqReg)

	var authResp handlers.AuthResponse
	_ = json.Unmarshal(wReg.Body.Bytes(), &authResp)
	token := authResp.Token

	// 3. User belum punya chat ID dan request body kosong -> 400 Bad Request
	reqEmpty, _ := http.NewRequest("POST", "/api/user/test-telegram", bytes.NewBuffer([]byte("{}")))
	reqEmpty.Header.Set("Authorization", "Bearer "+token)
	reqEmpty.Header.Set("Content-Type", "application/json")
	wEmpty := httptest.NewRecorder()
	r.ServeHTTP(wEmpty, reqEmpty)
	assert.Equal(t, http.StatusBadRequest, wEmpty.Code)
	assert.Contains(t, wEmpty.Body.String(), "Chat ID Telegram belum diatur")

	// 4. User ada chat ID tapi bot token tidak diatur -> 400 Bad Request
	os.Unsetenv("TELEGRAM_BOT_TOKEN")
	reqWithChat, _ := http.NewRequest("POST", "/api/user/test-telegram", bytes.NewBuffer([]byte(`{"chatId":"987654321"}`)))
	reqWithChat.Header.Set("Authorization", "Bearer "+token)
	reqWithChat.Header.Set("Content-Type", "application/json")
	wWithChat := httptest.NewRecorder()
	r.ServeHTTP(wWithChat, reqWithChat)
	assert.Equal(t, http.StatusBadRequest, wWithChat.Code)
	assert.Contains(t, wWithChat.Body.String(), "Bot Telegram belum dikonfigurasi di server")
}
