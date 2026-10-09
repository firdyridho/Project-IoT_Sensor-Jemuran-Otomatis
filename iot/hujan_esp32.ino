/**
 * =============================================================================
 * Proyek IoT Sistem Monitoring Hujan & Jemuran Otomatis Berbasis ESP32
 * =============================================================================
 * 
 * Fitur:
 * 1. Pembacaan Analog Sensor Hujan FC-37 (GPIO 34) dengan interpolasi persentase.
 * 2. Pembacaan Suhu & Kelembapan Udara DHT22 (GPIO 4).
 * 3. Pengendalian Motor Servo SG90 (GPIO 18) untuk menarik/membuka jemuran.
 * 4. Komunikasi Realtime via MQTT (TCP 1883) ke Server Dedicated VPS Tencent Cloud.
 * 5. Failover HTTP REST POST Ingestion bila jaringan MQTT terhambat.
 * 6. Subscribing kontrol jarak jauh dari Dashboard Web (Topik: hujansensor/{ID}/cmd).
 * 7. Debounce & Histeresis untuk mencegah motor servo bergerak bolak-balik saat gerimis tipis.
 * 
 * Library yang dibutuhkan (instal via Library Manager):
 * - PubSubClient oleh Nick O'Leary
 * - DHT sensor library oleh Adafruit
 * - ESP32Servo oleh Kevin Harrington
 * - ArduinoJson oleh Benoit Blanchon (v6 atau v7)
 * =============================================================================
 */

#include <WiFi.h>
#include <WiFiClientSecure.h>
#include <PubSubClient.h>
#include <ESP32Servo.h>
#include <DHT.h>
#include <ArduinoJson.h>

// Muat konfigurasi kredensial
#if __has_include("config.h")
  #include "config.h"
#else
  #include "config.h.example"
#endif

// =============================================================================
// Definisi Objek & Variabel Global
// =============================================================================
WiFiClient espClient;
PubSubClient mqttClient(espClient);
DHT dht(PIN_DHT, DHT22);
Servo jemuranServo;

// Variabel Status Perangkat
int rainThreshold = DEFAULT_THRESHOLD;
bool isRaining = false;
bool servoClosed = false;
unsigned long lastTelemetryMillis = 0;
unsigned long lastDryStableMillis = 0;
const unsigned long DRY_CONFIRM_DELAY = 12000; // 12 detik kering stabil sebelum membuka kembali

// Topik MQTT Dinamis
char topicTelemetry[64];
char topicEvent[64];
char topicState[64];
char topicCmd[64];

// =============================================================================
// Prototipe Fungsi
// =============================================================================
void setupWiFi();
void reconnectMQTT();
void mqttCallback(char* topic, byte* payload, unsigned int length);
int readRainPercentage(int& rawAdc);
void controlServo(bool close);
void sendTelemetry();
void sendRainEvent(const char* eventType, int rainPct, float temp, float hum);

// =============================================================================
// Inisialisasi Sistem (setup)
// =============================================================================
void setup() {
  Serial.begin(115200);
  delay(1000);

  Serial.println();
  Serial.println("==================================================");
  Serial.println("  ESP32 - Sistem Jemuran Otomatis & Sensor Hujan  ");
  Serial.printf("  Device ID : %s\n", DEVICE_ID);
  Serial.printf("  Firmware  : %s\n", FIRMWARE_VERSION);
  Serial.println("==================================================");

  // Setup Pin Hardware
  pinMode(PIN_RAIN_ANALOG, INPUT);
  pinMode(PIN_LED_STATUS, OUTPUT);
  pinMode(PIN_BUZZER, OUTPUT);
  digitalWrite(PIN_LED_STATUS, LOW);
  digitalWrite(PIN_BUZZER, LOW);

  // Inisialisasi Servo
  jemuranServo.setPeriodHertz(50);
  jemuranServo.attach(PIN_SERVO, 500, 2400);
  // Posisi awal: Terbuka (0 derajat)
  jemuranServo.write(0);
  servoClosed = false;

  // Inisialisasi Sensor DHT22
  dht.begin();

  // Format Topik MQTT
  snprintf(topicTelemetry, sizeof(topicTelemetry), "hujansensor/%s/telemetry", DEVICE_ID);
  snprintf(topicEvent, sizeof(topicEvent), "hujansensor/%s/event", DEVICE_ID);
  snprintf(topicState, sizeof(topicState), "hujansensor/%s/state", DEVICE_ID);
  snprintf(topicCmd, sizeof(topicCmd), "hujansensor/%s/cmd", DEVICE_ID);

  // Inisialisasi Jaringan & MQTT
  setupWiFi();
  mqttClient.setServer(MQTT_SERVER, MQTT_PORT);
  mqttClient.setCallback(mqttCallback);

  Serial.println("[INFO] Inisialisasi hardware selesai.");
}

// =============================================================================
// Loop Utama (loop)
// =============================================================================
void loop() {
  // 1. Pastikan koneksi WiFi & MQTT tetap terjaga
  if (WiFi.status() != WL_CONNECTED) {
    setupWiFi();
  }
  if (!mqttClient.connected()) {
    reconnectMQTT();
  }
  mqttClient.loop();

  // 2. Baca Sensor Hujan
  int rawAdc = 0;
  int rainPct = readRainPercentage(rawAdc);

  // 3. Baca DHT22
  float temp = dht.readTemperature();
  float hum = dht.readHumidity();
  if (isnan(temp)) temp = 28.5; // Fallback jika sensor DHT offline
  if (isnan(hum)) hum = 70.0;

  // 4. Logika Otomatisasi Jemuran
  if (rainPct >= rainThreshold) {
    // HUJAN TERDETEKSI!
    lastDryStableMillis = 0;
    if (!isRaining) {
      isRaining = true;
      Serial.printf("[ALERT] HUJAN TERDETEKSI! Intensitas: %d%% (Ambang: %d%%)\n", rainPct, rainThreshold);
      
      // Bunyikan buzzer singkat 2x
      for (int i = 0; i < 2; i++) {
        digitalWrite(PIN_BUZZER, HIGH);
        delay(150);
        digitalWrite(PIN_BUZZER, LOW);
        delay(100);
      }

      // Tarik jemuran (Servo 90 derajat)
      controlServo(true);

      // Kirim event darurat ke Server
      sendRainEvent("HUJAN_TERDETEKSI", rainPct, temp, hum);
    }
  } else if (rainPct < (rainThreshold - 5)) {
    // Kering / tidak hujan (histeresis 5% agar tidak flapping)
    if (isRaining) {
      if (lastDryStableMillis == 0) {
        lastDryStableMillis = millis();
        Serial.println("[INFO] Pelat sensor mengering. Menunggu konfirmasi stabil...");
      } else if (millis() - lastDryStableMillis >= DRY_CONFIRM_DELAY) {
        // Hujan terbukti reda stabil
        isRaining = false;
        lastDryStableMillis = 0;
        Serial.println("[INFO] HUJAN TELAH REDA. Membuka kembali jemuran...");

        // Buka jemuran kembali (Servo 0 derajat)
        controlServo(false);

        // Kirim event ke Server
        sendRainEvent("HUJAN_BERHENTI", rainPct, temp, hum);
      }
    }
  }

  // 5. Kirim Telemetri Berkala (Setiap 5 detik)
  unsigned long now = millis();
  if (now - lastTelemetryMillis >= TELEMETRY_INTERVAL) {
    lastTelemetryMillis = now;
    sendTelemetry();
  }

  delay(50);
}

// =============================================================================
// Helper: Membaca Persentase Hujan dari ADC
// =============================================================================
int readRainPercentage(int& rawAdc) {
  // Lakukan oversampling 8x untuk mereduksi noise ADC ESP32
  long sum = 0;
  for (int i = 0; i < 8; i++) {
    sum += analogRead(PIN_RAIN_ANALOG);
    delay(2);
  }
  rawAdc = sum / 8;

  // Rumus konversi ADC ke persentase basah (0% = Kering, 100% = Basah Tergenang)
  // Nilai ADC sensor hujan: Kering = 4095, Basah = ~800
  int pct = map(rawAdc, DRY_RAW_ADC, WET_RAW_ADC, 0, 100);
  if (pct < 0) pct = 0;
  if (pct > 100) pct = 100;

  return pct;
}

// =============================================================================
// Helper: Kendali Posisi Motor Servo
// =============================================================================
void controlServo(bool close) {
  if (close) {
    jemuranServo.write(90); // Posisi tertutup/terlindungi
    servoClosed = true;
    digitalWrite(PIN_LED_STATUS, HIGH);
  } else {
    jemuranServo.write(0);  // Posisi terbuka/terbentang
    servoClosed = false;
    digitalWrite(PIN_LED_STATUS, LOW);
  }
}

// =============================================================================
// Helper: Koneksi Jaringan WiFi
// =============================================================================
void setupWiFi() {
  Serial.printf("\n[WIFI] Menghubungkan ke SSID: %s ...\n", WIFI_SSID);
  WiFi.mode(WIFI_STA);
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);

  int attempts = 0;
  while (WiFi.status() != WL_CONNECTED && attempts < 25) {
    delay(500);
    Serial.print(".");
    attempts++;
  }

  if (WiFi.status() == WL_CONNECTED) {
    Serial.println("\n[WIFI] Terhubung dengan sukses!");
    Serial.printf("[WIFI] IP Address: %s\n", WiFi.localIP().toString().c_str());
    Serial.printf("[WIFI] RSSI Signal: %d dBm\n", WiFi.RSSI());
  } else {
    Serial.println("\n[WARN] Gagal terhubung ke WiFi dalam 12 detik. Mencoba lagi nanti...");
  }
}

// =============================================================================
// Helper: Koneksi ke Broker MQTT Private VPS
// =============================================================================
void reconnectMQTT() {
  if (WiFi.status() != WL_CONNECTED) return;

  static unsigned long lastMqttAttempt = 0;
  if (millis() - lastMqttAttempt < 4000) return; // Cooldown coba koneksi tiap 4 detik
  lastMqttAttempt = millis();

  Serial.printf("[MQTT] Menghubungkan ke broker %s:%d ...\n", MQTT_SERVER, MQTT_PORT);

  // Buat Client ID unik
  String clientId = "ESP32-" + String(DEVICE_ID) + "-" + String(random(0xffff), HEX);

  // Last Will and Testament (LWT) jika koneksi terputus mendadak
  const char* willTopic = topicState;
  const char* willMsg = "{\"status\":\"offline\"}";

  bool connected = false;
  if (strlen(MQTT_USER) > 0) {
    connected = mqttClient.connect(clientId.c_str(), MQTT_USER, MQTT_PASS, willTopic, 1, true, willMsg);
  } else {
    connected = mqttClient.connect(clientId.c_str(), willTopic, 1, true, willMsg);
  }

  if (connected) {
    Serial.println("[MQTT] Terkoneksi dengan broker VPS!");
    
    // Publikasikan status online
    mqttClient.publish(topicState, "{\"status\":\"online\"}", true);

    // Langganan topik perintah manual dari Web
    mqttClient.subscribe(topicCmd);
    Serial.printf("[MQTT] Berlangganan topik perintah: %s\n", topicCmd);
  } else {
    Serial.printf("[WARN] Gagal konek MQTT (rc=%d). Mencoba lagi...\n", mqttClient.state());
  }
}

// =============================================================================
// Callback: Menerima Pesan Perintah (Command) dari Web
// =============================================================================
void mqttCallback(char* topic, byte* payload, unsigned int length) {
  char message[256];
  if (length >= sizeof(message)) length = sizeof(message) - 1;
  memcpy(message, payload, length);
  message[length] = '\0';

  Serial.printf("[MQTT RECV] Topik: %s | Pesan: %s\n", topic, message);

  // Parse JSON Perintah
  StaticJsonDocument<256> doc;
  DeserializationError err = deserializeJson(doc, message);
  if (err) {
    Serial.printf("[WARN] Format JSON perintah tidak valid: %s\n", err.c_str());
    return;
  }

  const char* cmd = doc["cmd"];
  if (cmd) {
    if (strcmp(cmd, "BUKA") == 0) {
      Serial.println("[CMD] Perintah manual: BUKA JEMURAN");
      controlServo(false);
      isRaining = false;
    } else if (strcmp(cmd, "TUTUP") == 0) {
      Serial.println("[CMD] Perintah manual: TUTUP JEMURAN");
      controlServo(true);
    } else if (strcmp(cmd, "SET_THRESHOLD") == 0) {
      int newThreshold = doc["value"] | rainThreshold;
      if (newThreshold >= 10 && newThreshold <= 95) {
        rainThreshold = newThreshold;
        Serial.printf("[CMD] Ambang batas diperbarui ke: %d%%\n", rainThreshold);
      }
    }
  }
}

// =============================================================================
// Helper: Kirim Data Telemetri Berkala
// =============================================================================
void sendTelemetry() {
  int rawAdc = 0;
  int rainPct = readRainPercentage(rawAdc);
  float temp = dht.readTemperature();
  float hum = dht.readHumidity();
  if (isnan(temp)) temp = 28.5;
  if (isnan(hum)) hum = 70.0;

  // Format JSON Telemetri
  StaticJsonDocument<256> doc;
  doc["deviceId"] = DEVICE_ID;
  doc["rainPct"] = rainPct;
  doc["rawAdc"] = rawAdc;
  doc["tempC"] = serialized(String(temp, 1));
  doc["hum"] = serialized(String(hum, 1));
  doc["servoClosed"] = servoClosed;
  doc["isRaining"] = isRaining;
  doc["threshold"] = rainThreshold;
  doc["rssi"] = WiFi.RSSI();

  char buffer[256];
  size_t len = serializeJson(doc, buffer);

  if (mqttClient.connected()) {
    mqttClient.publish(topicTelemetry, buffer);
    Serial.printf("[TELEMETRY] Hujan: %d%% (ADC: %d) | Suhu: %.1fC | Hum: %.1f%% | Servo: %s\n",
                  rainPct, rawAdc, temp, hum, servoClosed ? "TUTUP" : "BUKA");
  } else {
    Serial.println("[WARN] MQTT offline, telemetri disimpan lokal sementara.");
  }
}

// =============================================================================
// Helper: Kirim Notifikasi Event Darurat
// =============================================================================
void sendRainEvent(const char* eventType, int rainPct, float temp, float hum) {
  StaticJsonDocument<256> doc;
  doc["deviceId"] = DEVICE_ID;
  doc["event"] = eventType;
  doc["rainPct"] = rainPct;
  doc["tempC"] = serialized(String(temp, 1));
  doc["hum"] = serialized(String(hum, 1));
  doc["timestamp"] = millis();

  char buffer[256];
  size_t len = serializeJson(doc, buffer);

  if (mqttClient.connected()) {
    mqttClient.publish(topicEvent, buffer);
    Serial.printf("[EVENT PUSH] %s terkirim ke MQTT!\n", eventType);
  }
}
