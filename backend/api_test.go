package main

import (
	"bytes"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"
	"time"

	"github.com/stretchr/testify/assert"

	"hujan-backend/database"
	"hujan-backend/models"
)

func TestAIPredictRainEndpoint(t *testing.T) {
	r := setupTestRouter()

	// Seed dummy device & telemetri
	devID := "hs-test-ai-01"
	dev := models.Device{
		ID:         devID,
		Name:       "Test Device AI",
		Status:     "online",
		AmbangPct:  60,
		LastSeenAt: time.Now(),
	}
	database.DB.Create(&dev)

	// Seed 3 telemetry readings (simulasi kenaikan kelembapan)
	hum1 := 65.0
	hum2 := 72.0
	hum3 := 83.0
	temp1 := 31.0
	temp2 := 29.5
	temp3 := 28.0

	database.DB.Create(&models.Telemetry{DeviceID: devID, Raw: 3800, Pct: 10, Hum: &hum1, TempC: &temp1, Timestamp: time.Now().Add(-20 * time.Minute).UnixMilli(), CreatedAt: time.Now().Add(-20 * time.Minute)})
	database.DB.Create(&models.Telemetry{DeviceID: devID, Raw: 3500, Pct: 25, Hum: &hum2, TempC: &temp2, Timestamp: time.Now().Add(-10 * time.Minute).UnixMilli(), CreatedAt: time.Now().Add(-10 * time.Minute)})
	database.DB.Create(&models.Telemetry{DeviceID: devID, Raw: 2900, Pct: 40, Hum: &hum3, TempC: &temp3, Timestamp: time.Now().UnixMilli(), CreatedAt: time.Now()})

	// 1. Valid Request
	reqBody := models.AIPredictRequest{
		DeviceID:        devID,
		LookbackMinutes: 30,
	}
	b, _ := json.Marshal(reqBody)
	w := httptest.NewRecorder()
	req, _ := http.NewRequest("POST", "/api/ai/predict-rain", bytes.NewBuffer(b))
	req.Header.Set("Content-Type", "application/json")
	r.ServeHTTP(w, req)

	assert.Equal(t, http.StatusOK, w.Code)
	var resp models.AIPredictResponse
	err := json.Unmarshal(w.Body.Bytes(), &resp)
	assert.NoError(t, err)
	assert.Equal(t, "success", resp.Status)
	assert.Equal(t, devID, resp.DeviceID)
	assert.True(t, resp.Prediction.ProbabilityPct >= 50)
	assert.NotEmpty(t, resp.Prediction.Summary)

	// 2. Missing DeviceID -> 400 Bad Request
	reqInvalid := models.AIPredictRequest{
		DeviceID: "",
	}
	bInv, _ := json.Marshal(reqInvalid)
	wInv := httptest.NewRecorder()
	reqInv, _ := http.NewRequest("POST", "/api/ai/predict-rain", bytes.NewBuffer(bInv))
	reqInv.Header.Set("Content-Type", "application/json")
	r.ServeHTTP(wInv, reqInv)
	assert.Equal(t, http.StatusBadRequest, wInv.Code)
}

func TestAIDryingAdviceEndpoint(t *testing.T) {
	r := setupTestRouter()

	devID := "hs-test-advice-01"
	dev := models.Device{
		ID:         devID,
		Name:       "Test Advice Device",
		Status:     "online",
		AmbangPct:  60,
		LastSeenAt: time.Now(),
	}
	database.DB.Create(&dev)

	temp := 33.0
	hum := 48.0
	database.DB.Create(&models.Telemetry{
		DeviceID:  devID,
		Raw:       4000,
		Pct:       0,
		Wet:       false,
		TempC:     &temp,
		Hum:       &hum,
		Timestamp: time.Now().UnixMilli(),
		CreatedAt: time.Now(),
	})

	// 1. Valid Request
	w := httptest.NewRecorder()
	req, _ := http.NewRequest("GET", "/api/ai/drying-advice?deviceId="+devID, nil)
	r.ServeHTTP(w, req)

	assert.Equal(t, http.StatusOK, w.Code)
	var resp models.AIDryingAdviceResponse
	err := json.Unmarshal(w.Body.Bytes(), &resp)
	assert.NoError(t, err)
	assert.Equal(t, "success", resp.Status)
	assert.Equal(t, devID, resp.DeviceID)
	assert.Equal(t, "aman_jemur", resp.Advice.Recommendation)
	assert.True(t, resp.Advice.DryingScore >= 70)
	assert.NotEmpty(t, resp.Advice.ActionMessage)

	// 2. Missing deviceId -> 400 Bad Request
	wEmpty := httptest.NewRecorder()
	reqEmpty, _ := http.NewRequest("GET", "/api/ai/drying-advice", nil)
	r.ServeHTTP(wEmpty, reqEmpty)
	assert.Equal(t, http.StatusBadRequest, wEmpty.Code)
}

func TestDeviceEndpoints(t *testing.T) {
	r := setupTestRouter()

	// 1. Create Device
	newDev := models.Device{
		ID:        "hs-test-crud-99",
		Name:      "Jemuran Balkon Uji",
		AmbangPct: 55,
	}
	b, _ := json.Marshal(newDev)
	w := httptest.NewRecorder()
	req, _ := http.NewRequest("POST", "/api/devices", bytes.NewBuffer(b))
	req.Header.Set("Content-Type", "application/json")
	r.ServeHTTP(w, req)
	assert.Equal(t, http.StatusCreated, w.Code)

	// 2. Get Devices
	wGet := httptest.NewRecorder()
	reqGet, _ := http.NewRequest("GET", "/api/devices", nil)
	r.ServeHTTP(wGet, reqGet)
	assert.Equal(t, http.StatusOK, wGet.Code)

	var devices []models.Device
	_ = json.Unmarshal(wGet.Body.Bytes(), &devices)
	assert.NotEmpty(t, devices)
}

func TestMotorEndpoints(t *testing.T) {
	r := setupTestRouter()
	devID := "hs-test-motor-01"

	// Create test device
	database.DB.Create(&models.Device{
		ID:            devID,
		Name:          "Motor Device Test",
		MotorPosition: "extended",
		MotorStatus:   "idle",
		LastSeenAt:    time.Now(),
	})

	// 1. Get Motor Status -> 200 OK
	wGet := httptest.NewRecorder()
	reqGet, _ := http.NewRequest("GET", "/api/devices/"+devID+"/motor", nil)
	r.ServeHTTP(wGet, reqGet)
	assert.Equal(t, http.StatusOK, wGet.Code)

	var statusResp models.MotorStatusResponse
	err := json.Unmarshal(wGet.Body.Bytes(), &statusResp)
	assert.NoError(t, err)
	assert.Equal(t, devID, statusResp.DeviceID)
	assert.Equal(t, "extended", statusResp.Position)
	assert.Equal(t, "idle", statusResp.Status)

	// 2. Command Motor: Retract -> 200 OK
	cmdBody := models.MotorCommandRequest{Action: "retract"}
	b, _ := json.Marshal(cmdBody)
	wCmd := httptest.NewRecorder()
	reqCmd, _ := http.NewRequest("POST", "/api/devices/"+devID+"/motor/command", bytes.NewBuffer(b))
	reqCmd.Header.Set("Content-Type", "application/json")
	r.ServeHTTP(wCmd, reqCmd)
	assert.Equal(t, http.StatusOK, wCmd.Code)

	// Verify position updated to sheltered
	wGet2 := httptest.NewRecorder()
	reqGet2, _ := http.NewRequest("GET", "/api/devices/"+devID+"/motor", nil)
	r.ServeHTTP(wGet2, reqGet2)
	assert.Equal(t, http.StatusOK, wGet2.Code)
	var statusResp2 models.MotorStatusResponse
	_ = json.Unmarshal(wGet2.Body.Bytes(), &statusResp2)
	assert.Equal(t, "sheltered", statusResp2.Position)

	// 3. Command Motor: Invalid action -> 400 Bad Request
	invBody := models.MotorCommandRequest{Action: "invalid_action"}
	bInv, _ := json.Marshal(invBody)
	wInv := httptest.NewRecorder()
	reqInv, _ := http.NewRequest("POST", "/api/devices/"+devID+"/motor/command", bytes.NewBuffer(bInv))
	reqInv.Header.Set("Content-Type", "application/json")
	r.ServeHTTP(wInv, reqInv)
	assert.Equal(t, http.StatusBadRequest, wInv.Code)
}

func TestSimulatorWeatherEndpoint(t *testing.T) {
	r := setupTestRouter()
	devID := "hs-test-sim-01"

	database.DB.Create(&models.Device{
		ID:         devID,
		Name:       "Sim Device Test",
		LastSeenAt: time.Now(),
	})

	// 1. Simulate Rain Condition -> 200 OK
	simBody := models.SimulatorWeatherRequest{
		DeviceID:  devID,
		Condition: "hujan",
	}
	b, _ := json.Marshal(simBody)
	w := httptest.NewRecorder()
	req, _ := http.NewRequest("POST", "/api/simulator/weather", bytes.NewBuffer(b))
	req.Header.Set("Content-Type", "application/json")
	r.ServeHTTP(w, req)
	assert.Equal(t, http.StatusOK, w.Code)

	var res map[string]interface{}
	err := json.Unmarshal(w.Body.Bytes(), &res)
	assert.NoError(t, err)
	assert.Equal(t, "success", res["status"])
	assert.Equal(t, "hujan", res["condition"])

	// 2. Simulate Invalid Condition -> 400 Bad Request
	simInvalid := models.SimulatorWeatherRequest{
		DeviceID:  devID,
		Condition: "salju_lebat",
	}
	bInv, _ := json.Marshal(simInvalid)
	wInv := httptest.NewRecorder()
	reqInv, _ := http.NewRequest("POST", "/api/simulator/weather", bytes.NewBuffer(bInv))
	reqInv.Header.Set("Content-Type", "application/json")
	r.ServeHTTP(wInv, reqInv)
	assert.Equal(t, http.StatusBadRequest, wInv.Code)
}
