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

func setupTestRouter() *gin.Engine {
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
		api.PUT("/auth/profile", handlers.UpdateProfile)
		api.PUT("/auth/password", handlers.UpdatePassword)
		api.GET("/user/settings", handlers.GetUserSettings)
		api.PUT("/user/settings", handlers.UpdateUserSettings)
		api.DELETE("/devices/:id/telemetry", handlers.ClearTelemetry)
		api.DELETE("/devices/:id/events", handlers.ClearEvents)
		api.GET("/notifications/vapid-key", handlers.GetVapidPublicKey)
		api.POST("/notifications/subscribe", handlers.SubscribeWebPush)
		api.POST("/ai/predict-rain", handlers.PredictRain)
		api.GET("/ai/drying-advice", handlers.GetDryingAdvice)
		api.GET("/ai/predictions/history", handlers.GetAIPredictionsHistory)
		api.GET("/devices", handlers.GetDevices)
		api.POST("/devices", handlers.CreateDevice)
		api.GET("/devices/:id/latest", handlers.GetLatest)
		api.GET("/telemetry/export", handlers.ExportTelemetryCSV)
		api.GET("/devices/:id/motor", handlers.GetMotorStatus)
		api.POST("/devices/:id/motor/command", handlers.CommandMotor)
		api.POST("/simulator/weather", handlers.SimulateWeather)
	}
	return r
}

func TestAuthRegisterAndLogin(t *testing.T) {
	r := setupTestRouter()

	// 1. Test Register Success
	regBody := map[string]string{
		"username": "useruji",
		"name":     "User Uji Coba",
		"password": "password123",
	}
	bodyBytes, _ := json.Marshal(regBody)
	w := httptest.NewRecorder()
	req, _ := http.NewRequest("POST", "/api/auth/register", bytes.NewBuffer(bodyBytes))
	req.Header.Set("Content-Type", "application/json")
	r.ServeHTTP(w, req)

	assert.Equal(t, http.StatusCreated, w.Code)
	var regResp handlers.AuthResponse
	err := json.Unmarshal(w.Body.Bytes(), &regResp)
	assert.NoError(t, err)
	assert.NotEmpty(t, regResp.Token)
	assert.Equal(t, "useruji", regResp.User.Username)

	// 2. Test Register Duplicate Username -> 409
	wDup := httptest.NewRecorder()
	reqDup, _ := http.NewRequest("POST", "/api/auth/register", bytes.NewBuffer(bodyBytes))
	reqDup.Header.Set("Content-Type", "application/json")
	r.ServeHTTP(wDup, reqDup)
	assert.Equal(t, http.StatusConflict, wDup.Code)

	// 3. Test Login Success
	loginBody := map[string]string{
		"username": "useruji",
		"password": "password123",
	}
	loginBytes, _ := json.Marshal(loginBody)
	wLogin := httptest.NewRecorder()
	reqLogin, _ := http.NewRequest("POST", "/api/auth/login", bytes.NewBuffer(loginBytes))
	reqLogin.Header.Set("Content-Type", "application/json")
	r.ServeHTTP(wLogin, reqLogin)

	assert.Equal(t, http.StatusOK, wLogin.Code)
	var loginResp handlers.AuthResponse
	_ = json.Unmarshal(wLogin.Body.Bytes(), &loginResp)
	assert.NotEmpty(t, loginResp.Token)

	// 4. Test Login Wrong Password -> 401
	wrongBody := map[string]string{
		"username": "useruji",
		"password": "salahpassword",
	}
	wrongBytes, _ := json.Marshal(wrongBody)
	wWrong := httptest.NewRecorder()
	reqWrong, _ := http.NewRequest("POST", "/api/auth/login", bytes.NewBuffer(wrongBytes))
	reqWrong.Header.Set("Content-Type", "application/json")
	r.ServeHTTP(wWrong, reqWrong)
	assert.Equal(t, http.StatusUnauthorized, wWrong.Code)

	// 5. Test GetMe with Bearer Token
	wMe := httptest.NewRecorder()
	reqMe, _ := http.NewRequest("GET", "/api/auth/me", nil)
	reqMe.Header.Set("Authorization", "Bearer "+loginResp.Token)
	r.ServeHTTP(wMe, reqMe)
	assert.Equal(t, http.StatusOK, wMe.Code)
	var meUser models.User
	_ = json.Unmarshal(wMe.Body.Bytes(), &meUser)
	assert.Equal(t, "useruji", meUser.Username)
}

func TestUpdateProfileAndPassword(t *testing.T) {
	r := setupTestRouter()

	// 1. Register test user
	regBody, _ := json.Marshal(map[string]string{
		"username": "userprofile",
		"name":     "Nama Awal",
		"password": "oldpassword123",
	})
	wReg := httptest.NewRecorder()
	reqReg, _ := http.NewRequest("POST", "/api/auth/register", bytes.NewBuffer(regBody))
	reqReg.Header.Set("Content-Type", "application/json")
	r.ServeHTTP(wReg, reqReg)
	assert.Equal(t, http.StatusCreated, wReg.Code)

	var regResp handlers.AuthResponse
	_ = json.Unmarshal(wReg.Body.Bytes(), &regResp)
	token := regResp.Token

	// 2. Test Update Profile Name
	profBody, _ := json.Marshal(map[string]string{
		"name": "Nama Yang Diperbarui",
	})
	wProf := httptest.NewRecorder()
	reqProf, _ := http.NewRequest("PUT", "/api/auth/profile", bytes.NewBuffer(profBody))
	reqProf.Header.Set("Content-Type", "application/json")
	reqProf.Header.Set("Authorization", "Bearer "+token)
	r.ServeHTTP(wProf, reqProf)
	assert.Equal(t, http.StatusOK, wProf.Code)

	// 3. Test Update Password Wrong Old Password -> 400
	wrongPassBody, _ := json.Marshal(map[string]string{
		"oldPassword": "salahPasswordLama",
		"newPassword": "newpassword456",
	})
	wWrongPass := httptest.NewRecorder()
	reqWrongPass, _ := http.NewRequest("PUT", "/api/auth/password", bytes.NewBuffer(wrongPassBody))
	reqWrongPass.Header.Set("Content-Type", "application/json")
	reqWrongPass.Header.Set("Authorization", "Bearer "+token)
	r.ServeHTTP(wWrongPass, reqWrongPass)
	assert.Equal(t, http.StatusBadRequest, wWrongPass.Code)

	// 4. Test Update Password Success
	correctPassBody, _ := json.Marshal(map[string]string{
		"oldPassword": "oldpassword123",
		"newPassword": "newpassword456",
	})
	wPass := httptest.NewRecorder()
	reqPass, _ := http.NewRequest("PUT", "/api/auth/password", bytes.NewBuffer(correctPassBody))
	reqPass.Header.Set("Content-Type", "application/json")
	reqPass.Header.Set("Authorization", "Bearer "+token)
	r.ServeHTTP(wPass, reqPass)
	assert.Equal(t, http.StatusOK, wPass.Code)

	// 5. Verify login with new password succeeds
	loginBody, _ := json.Marshal(map[string]string{
		"username": "userprofile",
		"password": "newpassword456",
	})
	wLogin := httptest.NewRecorder()
	reqLogin, _ := http.NewRequest("POST", "/api/auth/login", bytes.NewBuffer(loginBody))
	reqLogin.Header.Set("Content-Type", "application/json")
	r.ServeHTTP(wLogin, reqLogin)
	assert.Equal(t, http.StatusOK, wLogin.Code)
}

func TestUserSettingsSync(t *testing.T) {
	r := setupTestRouter()

	// 1. Register test user
	regBody, _ := json.Marshal(map[string]string{
		"username": "usersettings",
		"name":     "User Settings Test",
		"password": "password123",
	})
	wReg := httptest.NewRecorder()
	reqReg, _ := http.NewRequest("POST", "/api/auth/register", bytes.NewBuffer(regBody))
	reqReg.Header.Set("Content-Type", "application/json")
	r.ServeHTTP(wReg, reqReg)

	var regResp handlers.AuthResponse
	_ = json.Unmarshal(wReg.Body.Bytes(), &regResp)
	token := regResp.Token

	// 2. GET initial settings (default)
	wGet := httptest.NewRecorder()
	reqGet, _ := http.NewRequest("GET", "/api/user/settings", nil)
	reqGet.Header.Set("Authorization", "Bearer "+token)
	r.ServeHTTP(wGet, reqGet)
	assert.Equal(t, http.StatusOK, wGet.Code)

	var initSettings models.UserSettings
	_ = json.Unmarshal(wGet.Body.Bytes(), &initSettings)
	assert.Equal(t, "dark", initSettings.Tema)

	// 3. PUT updated settings
	putBody, _ := json.Marshal(models.UserSettings{
		Tema:              "light",
		AlarmSound:        "bell",
		AlarmVolume:       95,
		WeatherAudioMuted: true,
	})
	wPut := httptest.NewRecorder()
	reqPut, _ := http.NewRequest("PUT", "/api/user/settings", bytes.NewBuffer(putBody))
	reqPut.Header.Set("Content-Type", "application/json")
	reqPut.Header.Set("Authorization", "Bearer "+token)
	r.ServeHTTP(wPut, reqPut)
	assert.Equal(t, http.StatusOK, wPut.Code)

	var updatedSettings models.UserSettings
	_ = json.Unmarshal(wPut.Body.Bytes(), &updatedSettings)
	assert.Equal(t, "light", updatedSettings.Tema)
	assert.Equal(t, "bell", updatedSettings.AlarmSound)
	assert.Equal(t, 95, updatedSettings.AlarmVolume)
	assert.True(t, updatedSettings.WeatherAudioMuted)
}

func TestClearTelemetryAndEvents(t *testing.T) {
	r := setupTestRouter()
	devID := "hs-test-clear-01"

	// Insert dummy telemetry and event
	database.DB.Create(&models.Telemetry{
		DeviceID:  devID,
		Timestamp: 1000,
		Raw:       3800,
		Pct:       0,
	})
	database.DB.Create(&models.Event{
		DeviceID:  devID,
		EventType: "test_event",
		Timestamp: 1000,
	})

	// 1. DELETE /api/devices/:id/telemetry
	wDelTel := httptest.NewRecorder()
	reqDelTel, _ := http.NewRequest("DELETE", "/api/devices/"+devID+"/telemetry", nil)
	r.ServeHTTP(wDelTel, reqDelTel)
	assert.Equal(t, http.StatusOK, wDelTel.Code)

	// Verify telemetry count is 0
	var countTel int64
	database.DB.Model(&models.Telemetry{}).Where("device_id = ?", devID).Count(&countTel)
	assert.Equal(t, int64(0), countTel)

	// 2. DELETE /api/devices/:id/events
	wDelEv := httptest.NewRecorder()
	reqDelEv, _ := http.NewRequest("DELETE", "/api/devices/"+devID+"/events", nil)
	r.ServeHTTP(wDelEv, reqDelEv)
	assert.Equal(t, http.StatusOK, wDelEv.Code)

	// Verify events count is 0
	var countEv int64
	database.DB.Model(&models.Event{}).Where("device_id = ?", devID).Count(&countEv)
	assert.Equal(t, int64(0), countEv)
}

func TestWebPushEndpoints(t *testing.T) {
	r := setupTestRouter()

	// 1. GET /api/notifications/vapid-key
	wVapid := httptest.NewRecorder()
	reqVapid, _ := http.NewRequest("GET", "/api/notifications/vapid-key", nil)
	r.ServeHTTP(wVapid, reqVapid)
	assert.Equal(t, http.StatusOK, wVapid.Code)

	var vapidResp map[string]string
	_ = json.Unmarshal(wVapid.Body.Bytes(), &vapidResp)
	assert.NotEmpty(t, vapidResp["publicKey"])

	// 2. POST /api/notifications/subscribe
	subBody := map[string]interface{}{
		"deviceId": "hs-test-pwa-01",
		"subscription": map[string]interface{}{
			"endpoint": "https://fcm.googleapis.com/fcm/send/test-sub-token",
			"keys": map[string]string{
				"p256dh": "dummy-p256dh-key",
				"auth":   "dummy-auth-key",
			},
		},
	}
	bodyBytes, _ := json.Marshal(subBody)
	wSub := httptest.NewRecorder()
	reqSub, _ := http.NewRequest("POST", "/api/notifications/subscribe", bytes.NewBuffer(bodyBytes))
	reqSub.Header.Set("Content-Type", "application/json")
	r.ServeHTTP(wSub, reqSub)
	assert.Equal(t, http.StatusCreated, wSub.Code)
}
