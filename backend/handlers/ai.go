package handlers

import (
	"fmt"
	"math"
	"net/http"
	"time"

	"github.com/gin-gonic/gin"

	"hujan-backend/database"
	"hujan-backend/models"
)

// PredictRain handles POST /api/ai/predict-rain (BE-05 & BE-07)
func PredictRain(c *gin.Context) {
	var req models.AIPredictRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Format request tidak valid: " + err.Error()})
		return
	}

	if req.DeviceID == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "deviceId wajib diisi"})
		return
	}

	if req.LookbackMinutes <= 0 || req.LookbackMinutes > 180 {
		req.LookbackMinutes = 30
	}

	// 1. Ambil data telemetri historis dalam jendela lookback
	cutoff := time.Now().Add(-time.Duration(req.LookbackMinutes) * time.Minute)
	var readings []models.Telemetry
	database.DB.Where("device_id = ? AND created_at >= ?", req.DeviceID, cutoff).
		Order("timestamp asc").
		Limit(200).
		Find(&readings)

	// Inisialisasi variabel analisis
	var humDelta float64 = 0.0
	var tempDelta float64 = 0.0
	var adcTrend string = "stable"
	var currentPct int = 0
	var isCurrentlyWet bool = false

	if len(readings) > 0 {
		first := readings[0]
		last := readings[len(readings)-1]
		currentPct = last.Pct
		isCurrentlyWet = last.Wet

		// Hitung delta kelembapan
		if first.Hum != nil && last.Hum != nil {
			humDelta = *last.Hum - *first.Hum
		}

		// Hitung delta suhu
		if first.TempC != nil && last.TempC != nil {
			tempDelta = *last.TempC - *first.TempC
		}

		// Hitung tren nilai ADC (ADC turun = plat mulai basah / konduktivitas naik)
		adcDiff := last.Raw - first.Raw
		if adcDiff < -120 {
			adcTrend = "falling"
		} else if adcDiff > 120 {
			adcTrend = "rising"
		} else {
			adcTrend = "stable"
		}
	} else {
		// Fallback jika belum ada telemetri: ambil 1 pembacaan terkini dari database
		var latestTel models.Telemetry
		if err := database.DB.Where("device_id = ?", req.DeviceID).Order("timestamp desc").First(&latestTel).Error; err == nil {
			currentPct = latestTel.Pct
			isCurrentlyWet = latestTel.Wet
		}
	}

	// 2. Algoritma Inferensi Kecerdasan Buatan (Heuristic Predictive Engine)
	var willRain bool = false
	var probabilityPct int = 15
	var estimatedMinutes int = 0
	var confidenceLevel string = "low"
	var summary string = "Kondisi cuaca stabil, tidak ada indikasi hujan dalam waktu dekat."

	if isCurrentlyWet || currentPct >= 60 {
		// Hujan sedang terjadi
		willRain = true
		probabilityPct = int(math.Max(95, float64(currentPct)))
		if probabilityPct > 99 {
			probabilityPct = 99
		}
		estimatedMinutes = 0
		confidenceLevel = "high"
		summary = "Hujan saat ini sedang berlangsung. Segera amankan jemuran ke tempat teduh!"
	} else {
		// Perhitungan skor indikator pra-hujan
		score := float64(currentPct) * 0.35

		// Indikator 1: Kenaikan kelembapan tajam (+10% atau lebih)
		if humDelta > 10.0 {
			score += 35.0
		} else if humDelta > 5.0 {
			score += 18.0
		}

		// Indikator 2: Penurunan suhu drastis akibat hembusan angin awan konvektif
		if tempDelta < -1.5 {
			score += 25.0
		} else if tempDelta < -0.8 {
			score += 14.0
		}

		// Indikator 3: Nilai ADC mulai merayap turun (kondensasi awal)
		if adcTrend == "falling" {
			score += 20.0
		}

		probabilityPct = int(math.Round(score))
		if probabilityPct < 10 {
			probabilityPct = 10
		}
		if probabilityPct > 92 {
			probabilityPct = 92
		}

		if probabilityPct >= 60 {
			willRain = true
			if probabilityPct >= 80 {
				confidenceLevel = "high"
				estimatedMinutes = 15
				summary = fmt.Sprintf("Kelembapan naik tajam (+%.1f%%) dan suhu turun (%.1f°C). Potensi hujan sangat tinggi dalam ~%d menit ke depan.",
					humDelta, tempDelta, estimatedMinutes)
			} else {
				confidenceLevel = "medium"
				estimatedMinutes = 25
				summary = fmt.Sprintf("Terdeteksi penurunan suhu dan kenaikan kelembapan. Waspada potensi hujan dalam ~%d menit ke depan.",
					estimatedMinutes)
			}
		} else if probabilityPct >= 40 {
			confidenceLevel = "medium"
			summary = "Cuaca sedikit mendung atau lembap, namun potensi hujan masih moderat."
		}
	}

	// 3. Simpan Riwayat Prediksi ke Database (BE-07)
	predRecord := models.AIPrediction{
		DeviceID:         req.DeviceID,
		ProbabilityPct:   probabilityPct,
		PredictedRain:    willRain,
		EstimatedMinutes: estimatedMinutes,
		ConfidenceLevel:  confidenceLevel,
		Summary:          summary,
		CreatedAt:        time.Now(),
	}
	database.DB.Create(&predRecord)

	// 4. Susun Format Response Sesuai Kontrak BE-05
	var resp models.AIPredictResponse
	resp.Status = "success"
	resp.DeviceID = req.DeviceID
	resp.AnalyzedAt = time.Now().UTC().Format(time.RFC3339)
	resp.Prediction.WillRain = willRain
	resp.Prediction.ProbabilityPct = probabilityPct
	resp.Prediction.EstimatedMinutesUntilRain = estimatedMinutes
	resp.Prediction.ConfidenceLevel = confidenceLevel
	resp.Prediction.TrendFactors.HumidityDelta = fmt.Sprintf("%+.1f%%", humDelta)
	resp.Prediction.TrendFactors.TempDelta = fmt.Sprintf("%+.1f°C", tempDelta)
	resp.Prediction.TrendFactors.ADCTrend = adcTrend
	resp.Prediction.Summary = summary

	c.JSON(http.StatusOK, resp)
}

// GetDryingAdvice handles GET /api/ai/drying-advice (BE-06)
func GetDryingAdvice(c *gin.Context) {
	deviceID := c.DefaultQuery("deviceId", "")
	if deviceID == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "parameter deviceId wajib diisi"})
		return
	}

	// 1. Ambil data telemetri terkini
	var latestTel models.Telemetry
	database.DB.Where("device_id = ?", deviceID).Order("timestamp desc").First(&latestTel)

	temp := 29.5
	if latestTel.TempC != nil && *latestTel.TempC > 0 {
		temp = *latestTel.TempC
	}

	hum := 65.0
	if latestTel.Hum != nil && *latestTel.Hum > 0 {
		hum = *latestTel.Hum
	}

	isWet := latestTel.Wet || latestTel.Pct >= 50

	// 2. Kalkulasi Skor Pengeringan Jemuran (Drying Score: 0 - 100)
	score := 50.0

	// Faktor Suhu: Suhu ideal jemur 30 - 36°C
	if temp >= 32.0 {
		score += 25.0
	} else if temp >= 28.0 {
		score += 15.0
	} else if temp < 24.0 {
		score -= 20.0
	}

	// Faktor Kelembapan: Kelembapan kering 40 - 55%
	if hum <= 50.0 {
		score += 25.0
	} else if hum <= 65.0 {
		score += 10.0
	} else if hum >= 80.0 {
		score -= 25.0
	}

	// Jika saat ini hujan atau sensor basah, turunkan drastis
	if isWet {
		score = 10.0
	}

	dryingScore := int(math.Round(score))
	if dryingScore < 5 {
		dryingScore = 5
	}
	if dryingScore > 98 {
		dryingScore = 98
	}

	// 3. Rekomendasi & Waktu Jemur Optimal
	var recommendation string
	var estimatedDryHours float64
	var bestDryingWindow string
	var bmkgWeatherDesc string
	var actionMessage string

	if isWet || dryingScore < 35 {
		recommendation = "angkat_segera"
		estimatedDryHours = 0.0
		bestDryingWindow = "Tidak disarankan menjemur saat ini"
		bmkgWeatherDesc = "Hujan / Basah"
		actionMessage = "Kondisi basah atau risiko hujan tinggi. Segera tarik jemuran ke tempat aman beratap!"
	} else if dryingScore >= 70 {
		recommendation = "aman_jemur"
		estimatedDryHours = 2.5
		bestDryingWindow = "Pukul 08:30 - 14:00 WIB"
		bmkgWeatherDesc = "Cerah Berawan"
		actionMessage = "Kondisi panas optimal dan angin cukup. Waktu sangat tepat untuk menjemur pakaian tebal."
	} else {
		recommendation = "waspada_jemur"
		estimatedDryHours = 4.0
		bestDryingWindow = "Pukul 10:00 - 13:30 WIB"
		bmkgWeatherDesc = "Berawan Tebal"
		actionMessage = "Kelembapan udara agak tinggi. Jemuran membutuhkan waktu lebih lama dan perlu dipantau berkala."
	}

	var resp models.AIDryingAdviceResponse
	resp.Status = "success"
	resp.DeviceID = deviceID
	resp.Advice.Recommendation = recommendation
	resp.Advice.DryingScore = dryingScore
	resp.Advice.EstimatedDryHours = estimatedDryHours
	resp.Advice.BestDryingWindow = bestDryingWindow
	resp.Advice.BMKGWeatherDesc = bmkgWeatherDesc
	resp.Advice.ActionMessage = actionMessage

	c.JSON(http.StatusOK, resp)
}

// StartWeatherAlertWorker starts an internal background worker to monitor extreme weather risks (BE-08)
func StartWeatherAlertWorker() {
	ticker := time.NewTicker(3 * time.Minute)
	go func() {
		for range ticker.C {
			checkExtremeWeatherRisk()
		}
	}()
}

func checkExtremeWeatherRisk() {
	var devices []models.Device
	if err := database.DB.Where("status = ?", "online").Find(&devices).Error; err != nil {
		return
	}

	for _, dev := range devices {
		// Evaluasi cepat 30 menit terakhir
		cutoff := time.Now().Add(-30 * time.Minute)
		var readings []models.Telemetry
		database.DB.Where("device_id = ? AND created_at >= ?", dev.ID, cutoff).
			Order("timestamp asc").
			Limit(30).
			Find(&readings)

		if len(readings) < 2 {
			continue
		}

		first := readings[0]
		last := readings[len(readings)-1]

		if last.Wet {
			continue // Sudah hujan, alert rain_start sudah ditangani
		}

		var humDelta float64 = 0
		var tempDelta float64 = 0
		if first.Hum != nil && last.Hum != nil {
			humDelta = *last.Hum - *first.Hum
		}
		if first.TempC != nil && last.TempC != nil {
			tempDelta = *last.TempC - *first.TempC
		}

		// Jika kelembapan melonjak > 12% dan suhu anjlok > 1.8°C dalam waktu singkat
		if humDelta >= 12.0 && tempDelta <= -1.8 {
			alertPayload := map[string]interface{}{
				"deviceId":        dev.ID,
				"alert":           "rain_forecast_alert",
				"probabilityPct":  88,
				"estimatedMin":    15,
				"humidityDelta":   fmt.Sprintf("+%.1f%%", humDelta),
				"tempDelta":       fmt.Sprintf("%.1f°C", tempDelta),
				"message":         "Peringatan Dini: Potensi hujan lebat terdeteksi dalam 15 menit ke depan!",
				"timestamp":       time.Now().UnixMilli(),
			}

			// Broadcast ke browser via WebSocket
			Hub.Broadcast("rain_forecast_alert", alertPayload)
		}
	}
}
