#include <WiFi.h>
#include <PubSubClient.h>
#include <Wire.h>
#include <Adafruit_GFX.h>
#include <Adafruit_SSD1306.h>

// ================= 1. KONFIGURASI WIFI & MQTT =================
// Kredensial WiFi
const char* ssid = "UNTIRTA";
const char* password = "untirtajawara";

// Broker MQTT (Tersinkronisasi 100% dengan Go Backend di VPS & Dashboard Web)
const char* mqtt_server = "test.mosquitto.org";
const int mqtt_port = 1883;

// Device ID sesuai dengan yang didaftarkan di form Web
const char* device_id = "hs-24e1796dc9a1"; 

// Topik MQTT Komunikasi Realtime
String topic_publish       = String(device_id) + "/data";              // Format data custom ESP32
String topic_telemetry_std = "hujansensor/" + String(device_id) + "/telemetry"; // Format standar sistem
String topic_state_std     = "hujansensor/" + String(device_id) + "/state";     // Status online / offline (LWT)
String topic_subscribe     = String(device_id) + "/control";           // Terima perintah dari tombol Web
String topic_cmd_std       = "hujansensor/" + String(device_id) + "/cmd";       // Perintah standar motor

// ================= 2. KONFIGURASI HARDWARE =================
#define SCREEN_WIDTH 128
#define SCREEN_HEIGHT 64
Adafruit_SSD1306 display(SCREEN_WIDTH, SCREEN_HEIGHT, &Wire, -1);

// Pin Sensor Analog (ESP32 ADC1: aman digunakan bersama WiFi)
#define PIN_HUJAN 33
#define PIN_LDR   34

// Pin Driver Motor Stepper (A4988 / DRV8825)
const int stepPin = 18;
const int dirPin  = 19;

WiFiClient espClient;
PubSubClient client(espClient);

// Status Posisi Jemuran (false = Di Luar/Jemur, true = Di Dalam/Teduh)
bool jemuranDiDalam = false;

// ================= 3. FUNGSI KONTROL MOTOR & OLED =================
void updateOLED(String hujan, String cahaya, String posisi, bool warningMendung) {
  display.clearDisplay();
  display.setTextSize(1);
  display.setTextColor(SSD1306_WHITE);

  display.setCursor(0, 0);
  if (warningMendung) {
    display.println("! AWAS MENDUNG !");
  } else {
    display.print("ID: "); display.println(device_id);
  }
  display.drawLine(0, 10, 127, 10, SSD1306_WHITE);

  display.setCursor(0, 16);
  display.print("Hujan : "); display.println(hujan);

  display.setCursor(0, 32);
  display.print("Langit: "); display.println(cahaya);

  display.setCursor(0, 48);
  display.print("Posisi: "); display.println(posisi);

  display.display();
}

// Fungsi menggerakkan stepper
void gerakkanJemuran(bool tarikMasuk, String sumber) {
  if (tarikMasuk && !jemuranDiDalam) {
    Serial.println("Menarik jemuran masuk (" + sumber + ")...");
    updateOLED("Proses...", sumber, "Menarik Masuk", false);

    // Putar ke arah jemuran masuk (LOW)
    digitalWrite(dirPin, LOW);
    for (int i = 0; i < 800; i++) {
      digitalWrite(stepPin, HIGH);
      delayMicroseconds(1000);
      digitalWrite(stepPin, LOW);
      delayMicroseconds(1000);
    }

    jemuranDiDalam = true;
    Serial.println("Selesai: Jemuran sekarang di dalam.");
  } 
  else if (!tarikMasuk && jemuranDiDalam) {
    Serial.println("Mendorong jemuran keluar (" + sumber + ")...");
    updateOLED("Proses...", sumber, "Dorong Keluar", false);

    // Putar ke arah jemuran keluar (HIGH)
    digitalWrite(dirPin, HIGH);
    for (int i = 0; i < 800; i++) {
      digitalWrite(stepPin, HIGH);
      delayMicroseconds(1000);
      digitalWrite(stepPin, LOW);
      delayMicroseconds(1000);
    }

    jemuranDiDalam = false;
    Serial.println("Selesai: Jemuran sekarang di luar.");
  }
}

// ================= 4. FUNGSI TERIMA PERINTAH DARI WEB =================
void mqttCallback(char* topic, byte* payload, unsigned int length) {
  String pesan = "";
  for (unsigned int i = 0; i < length; i++) {
    pesan += (char)payload[i];
  }
  
  Serial.print("Perintah masuk dari Web [");
  Serial.print(topic);
  Serial.print("]: ");
  Serial.println(pesan);

  pesan.toLowerCase();
  if (pesan.indexOf("tarik") >= 0 || pesan.indexOf("masuk") >= 0 || pesan.indexOf("retract") >= 0 || pesan.indexOf("in") >= 0 || pesan.indexOf("tutup") >= 0 || pesan == "1") {
    gerakkanJemuran(true, "Tombol Web");
  } 
  else if (pesan.indexOf("dorong") >= 0 || pesan.indexOf("keluar") >= 0 || pesan.indexOf("extend") >= 0 || pesan.indexOf("out") >= 0 || pesan.indexOf("buka") >= 0 || pesan == "0") {
    int adcHujan = analogRead(PIN_HUJAN);
    if (adcHujan >= 2500) {
      gerakkanJemuran(false, "Tombol Web");
    } else {
      Serial.println("Ditolak: Sensor masih mendeteksi air hujan!");
    }
  }
}

// ================= 5. KONEKSI KE BROKER MQTT VPS DENGAN LWT =================
void reconnectMQTT() {
  while (!client.connected()) {
    Serial.print("Menghubungkan ke MQTT Broker VPS (" + String(mqtt_server) + ")...");
    String clientId = "ESP32Client-" + String(device_id) + "-" + String(random(1000, 9999));
    
    // Konfigurasi LWT (Last Will and Testament)
    // Jika ESP32 mati/terputus, broker otomatis mengabari Web bahwa status 'offline' secara instan
    const char* willTopic = topic_state_std.c_str();
    int willQos = 1;
    bool willRetain = true;
    const char* willMessage = "{\"status\":\"offline\"}";

    if (client.connect(clientId.c_str(), willTopic, willQos, willRetain, willMessage)) {
      Serial.println(" Terhubung!");

      // 1. Publikasikan status bahwa perangkat sekarang resmi ONLINE (Retained)
      client.publish(topic_state_std.c_str(), "{\"status\":\"online\"}", true);

      // 2. Berlangganan topik perintah kontrol dari Web
      client.subscribe(topic_subscribe.c_str());
      client.subscribe(topic_cmd_std.c_str());
      Serial.println("Subscribe ke: " + topic_subscribe + " & " + topic_cmd_std);
    } else {
      Serial.print(" Gagal, rc=");
      Serial.print(client.state());
      Serial.println(" Coba lagi dalam 3 detik...");
      delay(3000);
    }
  }
}

void setup() {
  Serial.begin(115200);

  // Setup Pin Driver Motor Stepper
  pinMode(stepPin, OUTPUT);
  pinMode(dirPin, OUTPUT);

  // Inisialisasi Layar OLED (I2C SDA=21, SCL=22)
  Wire.begin(21, 22);
  if (!display.begin(SSD1306_SWITCHCAPVCC, 0x3C)) {
    Serial.println("OLED SSD1306 gagal diinisialisasi");
  }
  display.clearDisplay();
  display.setTextSize(1);
  display.setTextColor(SSD1306_WHITE);
  display.setCursor(0, 10);
  display.println("Sistem Jemuran IoT");
  display.setCursor(0, 25);
  display.println("Connecting WiFi...");
  display.display();

  // Koneksi Wi-Fi
  WiFi.mode(WIFI_STA);
  WiFi.begin(ssid, password);
  Serial.print("Menghubungkan ke WiFi");
  while (WiFi.status() != WL_CONNECTED) {
    delay(400);
    Serial.print(".");
  }
  Serial.println("\nWiFi Terhubung! IP: " + WiFi.localIP().toString());

  // Inisialisasi Klien MQTT
  client.setServer(mqtt_server, mqtt_port);
  client.setCallback(mqttCallback);
  client.setBufferSize(512);
}

void loop() {
  if (WiFi.status() != WL_CONNECTED) {
    WiFi.reconnect();
    delay(500);
    return;
  }

  if (!client.connected()) {
    reconnectMQTT();
  }
  client.loop();

  // Cek sensor & kirim data telemetri ke Web setiap 2 detik
  static unsigned long lastMsg = 0;
  if (millis() - lastMsg > 2000) {
    lastMsg = millis();

    int adcHujan = analogRead(PIN_HUJAN);
    int adcLdr = analogRead(PIN_LDR);

    // Kalibrasi logika deteksi hujan dan mendung
    bool isHujan = (adcHujan < 2500);
    bool isMendung = (adcLdr > 2500);

    // 1. LOGIKA OTOMATIS: Tarik jemuran masuk saat hujan mulai turun
    if (isHujan && !jemuranDiDalam) {
      gerakkanJemuran(true, "Auto Hujan");
    }

    // 2. UPDATE TAMPILAN LAYAR OLED
    String txtHujan = isHujan ? "HUJAN!" : "Kering";
    String txtLangit = isMendung ? "Mendung" : "Cerah";
    String txtPosisi = jemuranDiDalam ? "Di Dalam" : "Di Luar";
    bool warningMendung = (isMendung && !jemuranDiDalam);

    updateOLED(txtHujan, txtLangit, txtPosisi, warningMendung);

    // 3. KIRIM DATA JSON KE WEB LEWAT BROKER MQTT VPS
    String payload = "{";
    payload += "\"device_id\":\"" + String(device_id) + "\",";
    payload += "\"adc_hujan\":" + String(adcHujan) + ",";
    payload += "\"adc_ldr\":" + String(adcLdr) + ",";
    payload += "\"hujan\":" + String(isHujan ? "true" : "false") + ",";
    payload += "\"mendung\":" + String(isMendung ? "true" : "false") + ",";
    payload += "\"peringatan\":" + String(warningMendung ? "true" : "false") + ",";
    payload += "\"posisi\":\"" + String(jemuranDiDalam ? "didalam" : "diluar") + "\"";
    payload += "}";

    // Publikasikan ke topik custom ESP32
    client.publish(topic_publish.c_str(), payload.c_str());

    // Konversi ADC hujan ke persentase basah (0-100%)
    int rainPct = (4095 - adcHujan) * 100 / (4095 - 800);
    if (rainPct < 0) rainPct = 0;
    if (rainPct > 100) rainPct = 100;

    // Publikasikan juga ke topik standar format sistem
    String stdPayload = "{";
    stdPayload += "\"v\":1,";
    stdPayload += "\"deviceId\":\"" + String(device_id) + "\",";
    stdPayload += "\"ts\":" + String(millis()) + ",";
    stdPayload += "\"raw\":" + String(adcHujan) + ",";
    stdPayload += "\"pct\":" + String(rainPct) + ",";
    stdPayload += "\"wet\":" + String(isHujan ? "true" : "false") + ",";
    stdPayload += "\"rssi\":" + String(WiFi.RSSI());
    stdPayload += "}";
    client.publish(topic_telemetry_std.c_str(), stdPayload.c_str());

    Serial.println("Kirim MQTT [" + topic_publish + "]: " + payload);
  }
}
