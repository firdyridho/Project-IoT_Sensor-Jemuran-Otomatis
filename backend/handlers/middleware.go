package handlers

import (
	"net/http"
	"sync"
	"time"

	"github.com/gin-gonic/gin"
)

type rateRecord struct {
	count     int
	resetTime time.Time
}

type bruteForceRecord struct {
	failedAttempts int
	lockedUntil    time.Time
}

var (
	generalLimits = make(map[string]*rateRecord)
	loginAttempts = make(map[string]*bruteForceRecord)
	limiterMu     sync.Mutex
)

// RateLimiterMiddleware membatasi umum 120 request / menit per IP (BE-10)
func RateLimiterMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		clientIP := c.ClientIP()
		now := time.Now()

		limiterMu.Lock()
		rec, exists := generalLimits[clientIP]
		if !exists || now.After(rec.resetTime) {
			generalLimits[clientIP] = &rateRecord{
				count:     1,
				resetTime: now.Add(1 * time.Minute),
			}
			limiterMu.Unlock()
			c.Next()
			return
		}

		rec.count++
		if rec.count > 120 {
			limiterMu.Unlock()
			c.Header("Retry-After", "60")
			c.AbortWithStatusJSON(http.StatusTooManyRequests, gin.H{
				"error": "Terlalu banyak permintaan (Rate limit 120 req/menit tercapai). Silakan coba lagi nanti.",
			})
			return
		}

		limiterMu.Unlock()
		c.Next()
	}
}

// LoginBruteForceMiddleware memeriksa apakah IP sedang dikunci karena 5x gagal login (BE-10)
func LoginBruteForceMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		clientIP := c.ClientIP()
		now := time.Now()

		limiterMu.Lock()
		record, exists := loginAttempts[clientIP]
		if exists && now.Before(record.lockedUntil) {
			limiterMu.Unlock()
			retrySec := int(time.Until(record.lockedUntil).Seconds())
			c.AbortWithStatusJSON(http.StatusTooManyRequests, gin.H{
				"error": "Terlalu banyak percobaan login yang gagal. Akses dari IP Anda dikunci sementara.",
				"retryAfterSeconds": retrySec,
			})
			return
		}
		limiterMu.Unlock()

		c.Next()
	}
}

// RecordFailedLogin mencatat kegagalan login untuk IP tertentu
func RecordFailedLogin(clientIP string) {
	limiterMu.Lock()
	defer limiterMu.Unlock()

	now := time.Now()
	rec, exists := loginAttempts[clientIP]
	if !exists || now.After(rec.lockedUntil) {
		loginAttempts[clientIP] = &bruteForceRecord{
			failedAttempts: 1,
			lockedUntil:    time.Time{},
		}
		return
	}

	rec.failedAttempts++
	if rec.failedAttempts >= 5 {
		rec.lockedUntil = now.Add(5 * time.Minute)
	}
}

// ResetFailedLogin menghapus catatan gagal saat login berhasil
func ResetFailedLogin(clientIP string) {
	limiterMu.Lock()
	defer limiterMu.Unlock()
	delete(loginAttempts, clientIP)
}
