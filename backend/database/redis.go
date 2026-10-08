package database

import (
	"context"
	"encoding/json"
	"fmt"
	"log"
	"os"
	"time"

	"github.com/redis/go-redis/v9"
)

var (
	RedisClient *redis.Client
	ctx         = context.Background()
)

// InitRedis initializes connection to Redis (optional cache layer)
func InitRedis() *redis.Client {
	redisAddr := os.Getenv("REDIS_ADDR")
	if redisAddr == "" {
		redisAddr = "127.0.0.1:6379"
	}
	redisPassword := os.Getenv("REDIS_PASSWORD")

	client := redis.NewClient(&redis.Options{
		Addr:         redisAddr,
		Password:     redisPassword,
		DB:           0,
		DialTimeout:  2 * time.Second,
		ReadTimeout:  2 * time.Second,
		WriteTimeout: 2 * time.Second,
	})

	// Test connection ping
	pingCtx, cancel := context.WithTimeout(ctx, 2*time.Second)
	defer cancel()

	_, err := client.Ping(pingCtx).Result()
	if err != nil {
		log.Printf("[Redis] ⚠️ Redis tidak aktif di %s (%v). Sistem berjalan normal tanpa cache Redis.", redisAddr, err)
		return nil
	}

	RedisClient = client
	log.Printf("[Redis] ✅ Tersambung ke Redis di: %s (In-Memory Cache Aktif)", redisAddr)
	return client
}

// CacheLatestTelemetry caches the latest sensor telemetry for ultra-fast lookup
func CacheLatestTelemetry(deviceID string, payload interface{}) {
	if RedisClient == nil {
		return
	}
	bytes, err := json.Marshal(payload)
	if err != nil {
		return
	}
	key := fmt.Sprintf("hujan:latest:%s", deviceID)
	// Cache for 24 hours
	_ = RedisClient.Set(ctx, key, string(bytes), 24*time.Hour).Err()
}

// GetCachedLatestTelemetry retrieves cached telemetry from Redis
func GetCachedLatestTelemetry(deviceID string) (string, error) {
	if RedisClient == nil {
		return "", fmt.Errorf("redis tidak aktif")
	}
	key := fmt.Sprintf("hujan:latest:%s", deviceID)
	return RedisClient.Get(ctx, key).Result()
}
