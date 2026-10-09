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
		api.POST("/ai/predict-rain", handlers.PredictRain)
		api.GET("/ai/drying-advice", handlers.GetDryingAdvice)
		api.GET("/devices", handlers.GetDevices)
		api.POST("/devices", handlers.CreateDevice)
		api.GET("/devices/:id/latest", handlers.GetLatest)
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
