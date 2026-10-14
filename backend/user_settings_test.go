package main

import (
	"bytes"
	"crypto/hmac"
	"crypto/sha256"
	"encoding/hex"
	"encoding/json"
	"fmt"
	"mime/multipart"
	"net/http"
	"net/http/httptest"
	"os"
	"testing"
	"time"

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
		api.POST("/user/accept-terms", handlers.AcceptTerms)
		api.POST("/user/custom-alarm", handlers.UploadCustomAlarm)
		api.POST("/notifications/subscribe", handlers.SubscribeWebPush)
		api.POST("/notifications/unsubscribe", handlers.UnsubscribeWebPush)
		api.DELETE("/notifications/subscribe", handlers.UnsubscribeWebPush)
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

func TestTermsAuditAcceptance(t *testing.T) {
	r := setupUserSettingsTestRouter()

	// 1. Registrasi dengan termsAccepted = false -> 400 Bad Request
	falseVal := false
	regReject := map[string]interface{}{
		"name":          "Legal Reject User",
		"username":      "rejectlegal",
		"password":      "Password123!",
		"termsAccepted": &falseVal,
	}
	bodyReject, _ := json.Marshal(regReject)
	reqReject, _ := http.NewRequest("POST", "/api/auth/register", bytes.NewBuffer(bodyReject))
	reqReject.Header.Set("Content-Type", "application/json")
	wReject := httptest.NewRecorder()
	r.ServeHTTP(wReject, reqReject)
	assert.Equal(t, http.StatusBadRequest, wReject.Code)
	assert.Contains(t, wReject.Body.String(), "wajib menyetujui Ketentuan Layanan")

	// 2. Registrasi berhasil otomatis mengisi TermsAcceptedAt
	regSuccess := map[string]interface{}{
		"name":     "Legal Accepted User",
		"username": "legaluser",
		"password": "Password123!",
	}
	bodySuccess, _ := json.Marshal(regSuccess)
	reqSuccess, _ := http.NewRequest("POST", "/api/auth/register", bytes.NewBuffer(bodySuccess))
	reqSuccess.Header.Set("Content-Type", "application/json")
	wSuccess := httptest.NewRecorder()
	r.ServeHTTP(wSuccess, reqSuccess)
	assert.Equal(t, http.StatusCreated, wSuccess.Code)

	var authResp handlers.AuthResponse
	_ = json.Unmarshal(wSuccess.Body.Bytes(), &authResp)
	assert.NotNil(t, authResp.User.TermsAcceptedAt)
	token := authResp.Token

	// 3. Panggil POST /api/user/accept-terms untuk mencatat audit persetujuan ulang
	reqAccept, _ := http.NewRequest("POST", "/api/user/accept-terms", nil)
	reqAccept.Header.Set("Authorization", "Bearer "+token)
	wAccept := httptest.NewRecorder()
	r.ServeHTTP(wAccept, reqAccept)
	assert.Equal(t, http.StatusOK, wAccept.Code)

	var acceptResp struct {
		Status          string `json:"status"`
		TermsAcceptedAt string `json:"termsAcceptedAt"`
	}
	_ = json.Unmarshal(wAccept.Body.Bytes(), &acceptResp)
	assert.Equal(t, "success", acceptResp.Status)
	assert.NotEmpty(t, acceptResp.TermsAcceptedAt)
}

func TestWebPushUnsubscribe(t *testing.T) {
	r := setupUserSettingsTestRouter()

	testEndpoint := "https://fcm.googleapis.com/fcm/send/test-token-12345"

	// 1. Mendaftarkan langganan push baru
	subPayload := map[string]interface{}{
		"endpoint": testEndpoint,
		"keys": map[string]string{
			"p256dh": "test-p256dh-key",
			"auth":   "test-auth-secret",
		},
	}
	subBody, _ := json.Marshal(subPayload)
	reqSub, _ := http.NewRequest("POST", "/api/notifications/subscribe", bytes.NewBuffer(subBody))
	reqSub.Header.Set("Content-Type", "application/json")
	wSub := httptest.NewRecorder()
	r.ServeHTTP(wSub, reqSub)
	assert.Equal(t, http.StatusCreated, wSub.Code)

	// Pastikan tersimpan di database
	var count int64
	database.DB.Model(&models.WebPushSubscription{}).Where("endpoint = ?", testEndpoint).Count(&count)
	assert.Equal(t, int64(1), count)

	// 2. Unsubscribe via POST /api/notifications/unsubscribe
	unsubPayload := map[string]string{
		"endpoint": testEndpoint,
	}
	unsubBody, _ := json.Marshal(unsubPayload)
	reqUnsub, _ := http.NewRequest("POST", "/api/notifications/unsubscribe", bytes.NewBuffer(unsubBody))
	reqUnsub.Header.Set("Content-Type", "application/json")
	wUnsub := httptest.NewRecorder()
	r.ServeHTTP(wUnsub, reqUnsub)
	assert.Equal(t, http.StatusOK, wUnsub.Code)

	// Pastikan telah terhapus dari database
	database.DB.Model(&models.WebPushSubscription{}).Where("endpoint = ?", testEndpoint).Count(&count)
	assert.Equal(t, int64(0), count)

	// 3. Subscribe lagi lalu Unsubscribe via DELETE /api/notifications/subscribe
	wSub2 := httptest.NewRecorder()
	reqSub2, _ := http.NewRequest("POST", "/api/notifications/subscribe", bytes.NewBuffer(subBody))
	reqSub2.Header.Set("Content-Type", "application/json")
	r.ServeHTTP(wSub2, reqSub2)
	assert.Equal(t, http.StatusCreated, wSub2.Code)

	reqDel, _ := http.NewRequest("DELETE", "/api/notifications/subscribe?endpoint="+testEndpoint, nil)
	wDel := httptest.NewRecorder()
	r.ServeHTTP(wDel, reqDel)
	assert.Equal(t, http.StatusOK, wDel.Code)

	database.DB.Model(&models.WebPushSubscription{}).Where("endpoint = ?", testEndpoint).Count(&count)
	assert.Equal(t, int64(0), count)
}

func createMultipartRequest(url, fieldName, filename string, fileContent []byte, token string) (*http.Request, error) {
	var b bytes.Buffer
	w := multipart.NewWriter(&b)
	part, err := w.CreateFormFile(fieldName, filename)
	if err != nil {
		return nil, err
	}
	_, err = part.Write(fileContent)
	if err != nil {
		return nil, err
	}
	err = w.Close()
	if err != nil {
		return nil, err
	}

	req, err := http.NewRequest("POST", url, &b)
	if err != nil {
		return nil, err
	}
	req.Header.Set("Content-Type", w.FormDataContentType())
	if token != "" {
		req.Header.Set("Authorization", "Bearer "+token)
	}
	return req, nil
}

func TestUploadCustomAlarm(t *testing.T) {
	r := setupUserSettingsTestRouter()

	// 1. Register User
	regUser := map[string]string{
		"name":     "Audio Tester",
		"username": "audiotester",
		"password": "Password123!",
	}
	body, _ := json.Marshal(regUser)
	reqReg, _ := http.NewRequest("POST", "/api/auth/register", bytes.NewBuffer(body))
	reqReg.Header.Set("Content-Type", "application/json")
	wReg := httptest.NewRecorder()
	r.ServeHTTP(wReg, reqReg)
	assert.Equal(t, http.StatusCreated, wReg.Code)

	var authResp handlers.AuthResponse
	_ = json.Unmarshal(wReg.Body.Bytes(), &authResp)
	token := authResp.Token

	// 2. Upload file dengan format tidak diizinkan (.exe)
	reqBad, err := createMultipartRequest("/api/user/custom-alarm", "audio", "virus.exe", []byte("fake binary"), token)
	assert.NoError(t, err)
	wBad := httptest.NewRecorder()
	r.ServeHTTP(wBad, reqBad)
	assert.Equal(t, http.StatusBadRequest, wBad.Code)

	// 3. Upload file audio valid (.mp3)
	fakeAudioBytes := []byte("ID3\x04\x00\x00\x00\x00\x00#TSSE\x00\x00\x00\x0f\x00\x00\x03Lavf58.29.100")
	reqGood, err := createMultipartRequest("/api/user/custom-alarm", "audio", "my_custom_siren.mp3", fakeAudioBytes, token)
	assert.NoError(t, err)
	wGood := httptest.NewRecorder()
	r.ServeHTTP(wGood, reqGood)
	assert.Equal(t, http.StatusOK, wGood.Code)

	var resp struct {
		Status         string      `json:"status"`
		Message        string      `json:"message"`
		AlarmTone      string      `json:"alarmTone"`
		CustomAlarmUrl string      `json:"customAlarmUrl"`
		User           models.User `json:"user"`
	}
	_ = json.Unmarshal(wGood.Body.Bytes(), &resp)
	assert.Equal(t, "success", resp.Status)
	assert.Equal(t, "custom", resp.AlarmTone)
	assert.NotEmpty(t, resp.CustomAlarmUrl)
	assert.Contains(t, resp.CustomAlarmUrl, "/uploads/tones/tone_")

	// Pastikan data tersimpan di DB
	var userDB models.User
	err = database.DB.First(&userDB, "id = ?", authResp.User.ID).Error
	assert.NoError(t, err)
	assert.Equal(t, "custom", userDB.AlarmTone)
	assert.Equal(t, resp.CustomAlarmUrl, userDB.CustomAlarmUrl)

	// Bersihkan file yang di-upload
	filePath := "." + resp.CustomAlarmUrl
	_ = os.Remove(filePath)
}

func TestCrossEnvironmentTokenSyncAndDemo(t *testing.T) {
	r := setupUserSettingsTestRouter()

	// 1. Uji Demo token bypass ("demo-token-bypass")
	reqDemo, _ := http.NewRequest("GET", "/api/user/profile", nil)
	reqDemo.Header.Set("Authorization", "Bearer demo-token-bypass")
	wDemo := httptest.NewRecorder()
	r.ServeHTTP(wDemo, reqDemo)
	assert.Equal(t, http.StatusOK, wDemo.Code)

	var demoUser models.User
	_ = json.Unmarshal(wDemo.Body.Bytes(), &demoUser)
	assert.Equal(t, "usr-demo-admin", demoUser.ID)
	assert.Equal(t, "admin", demoUser.Username)

	// 2. Uji Token dari environment lain (misal token dibuat di Prod, lalu diuji di Staging)
	ts := time.Now().Add(30 * 24 * time.Hour).Unix()
	payload := fmt.Sprintf("usr-remote-prod-123:remoteproduser:%d", ts)
	mac := hmac.New(sha256.New, []byte("hujan-pantau-secret-key-2026"))
	mac.Write([]byte(payload))
	sig := hex.EncodeToString(mac.Sum(nil))
	remoteToken := fmt.Sprintf("%s.%s", hex.EncodeToString([]byte(payload)), sig)

	// Pastikan user belum ada di DB lokal sebelumnya
	var notFoundUser models.User
	err := database.DB.First(&notFoundUser, "id = ?", "usr-remote-prod-123").Error
	assert.Error(t, err)

	// Panggil GET /api/user/profile dengan remote token -> Harus otomatis sync dan mengembalikan 200 OK (BUKAN 404!)
	reqRemote, _ := http.NewRequest("GET", "/api/user/profile", nil)
	reqRemote.Header.Set("Authorization", "Bearer "+remoteToken)
	wRemote := httptest.NewRecorder()
	r.ServeHTTP(wRemote, reqRemote)
	assert.Equal(t, http.StatusOK, wRemote.Code)

	var syncedUser models.User
	_ = json.Unmarshal(wRemote.Body.Bytes(), &syncedUser)
	assert.Equal(t, "usr-remote-prod-123", syncedUser.ID)
	assert.Equal(t, "remoteproduser", syncedUser.Username)

	// Panggil PUT /api/user/profile untuk update Telegram Chat ID
	teleID := "987654321"
	updatePayload := models.UpdateProfileReq{
		TelegramChatID: &teleID,
		AlarmTone:      "custom",
	}
	upBody, _ := json.Marshal(updatePayload)
	reqUp, _ := http.NewRequest("PUT", "/api/user/profile", bytes.NewBuffer(upBody))
	reqUp.Header.Set("Authorization", "Bearer "+remoteToken)
	reqUp.Header.Set("Content-Type", "application/json")
	wUp := httptest.NewRecorder()
	r.ServeHTTP(wUp, reqUp)
	assert.Equal(t, http.StatusOK, wUp.Code)

	// Panggil POST /api/user/test-telegram (tanpa token bot di env)
	testTgPayload := map[string]string{
		"chatId": "987654321",
	}
	tgBody, _ := json.Marshal(testTgPayload)
	reqTg, _ := http.NewRequest("POST", "/api/user/test-telegram", bytes.NewBuffer(tgBody))
	reqTg.Header.Set("Authorization", "Bearer "+remoteToken)
	reqTg.Header.Set("Content-Type", "application/json")
	wTg := httptest.NewRecorder()
	r.ServeHTTP(wTg, reqTg)
	// Response harus 400 Bad Request karena bot token belum dikonfigurasi di server testing, BUKAN 404 "Akun pengguna tidak ditemukan"!
	assert.NotEqual(t, http.StatusNotFound, wTg.Code)
}


