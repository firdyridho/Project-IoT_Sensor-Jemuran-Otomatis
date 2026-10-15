#include <WiFi.h>
#include <PubSubClient.h>
#include <Wire.h>
#include <Adafruit_GFX.h>
#include <Adafruit_SSD1306.h>

// ================= 1. KONFIGURASI WIFI & MQTT =================
// Kredensial WiFi
const char* ssid     = "UNTIRTA";
const char* password = "untirtajawara";

// Broker MQTT Private VPS (Tencent Cloud Singapore)
const char* mqtt_server = "43.133.136.149";
const int mqtt_port     = 1883;

// Device ID
const char* device_id = "hs-24e1796dc9a1"; 

// Topik MQTT Komunikasi Realtime
String topic_publish       = String(device_id) + "/data";    
String topic_telemetry_std = "hujansensor/" + String(device_id) + "/telemetry"; 
String topic_state_std     = "hujansensor/" + String(device_id) + "/state";     
String topic_subscribe     = String(device_id) + "/control";   
String topic_cmd_std       = "hujansensor/" + String(device_id) + "/cmd";       

// ================= 2. KONFIGURASI HARDWARE =================
#define SCREEN_WIDTH 128
#define SCREEN_HEIGHT 64
Adafruit_SSD1306 display(SCREEN_WIDTH, SCREEN_HEIGHT, &Wire, -1);

// Pin Sensor Analog (ESP32 ADC1)
#define PIN_HUJAN 33
#define PIN_LDR   34

// Pin Driver Motor Stepper (A4988 / DRV8825)
const int stepPin = 18;
const int dirPin  = 19;

// Pin Limit Switch Luar (COM ke GND, NO ke GPIO 25)
#define PIN_LIMIT_LUAR 25

WiFiClient espClient;
PubSubClient client(espClient);

// Status Posisi Jemuran (false = Di Luar/Jemur, true = Di Dalam/Teduh)
bool jemuranDiDalam = false;

// Batas Ambang ADC dengan Hysteresis (Mencegah motor bolak-balik karena fluktuasi air)
#define AMBANG_HUJAN_MASUK    2300 // Jika ADC < 2300, terdeteksi air hujan -> tarik jemuran masuk
#define AMBANG_KERING_KELUAR  3000 // Jika ADC > 3000, sensor benar-benar kering

// Timer Debounce Kestabilan Kering (dalam milidetik)
// Sensor harus kering terus-menerus selama 20 detik sebelum motor boleh mendorong jemuran keluar
const unsigned long WAKTU_TUNGGU_KERING_MS = 20000;
unsigned long waktuMulaiKering = 0;

// ================= 3. FUNGSI KONTROL MOTOR & OLED =================
void updateOLED(String hujan, String cahaya, int valLdr, String posisi, bool warningMendung) {
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
  display.print("LDR: "); display.print(valLdr); display.print(" "); display.println(cahaya);

  display.setCursor(0, 48);
  display.print("Posisi: "); display.println(posisi);

  display.display();
}

// Fungsi menggerakkan stepper
void gerakkanJemuran(bool tarikMasuk, String sumber) {
  if (tarikMasuk && !jemuranDiDalam) {
    Serial.println("Menarik jemuran masuk (" + sumber + ")...");
    updateOLED("Proses...", sumber, 0, "Menarik Masuk", false);

    // Putar ke arah jemuran masuk (LOW)
    digitalWrite(dirPin, LOW);
    
    // Bergerak dengan hitungan langkah sampai mentok ke pembatas dalam
    for (int i = 0; i < 3000; i++) {
      digitalWrite(stepPin, HIGH);
      delayMicroseconds(1000);
      digitalWrite(stepPin, LOW);
      delayMicroseconds(1000);

      // PENTING: Panggil client.loop() berkala agar broker MQTT tidak memutus koneksi (LWT Offline)
      if (i % 50 == 0) {
        client.loop();
      }
      yield();
    }

    jemuranDiDalam = true;
    Serial.println("Selesai: Jemuran sekarang di dalam.");
  } 
  else if (!tarikMasuk && jemuranDiDalam) {
    Serial.println("Mendorong jemuran keluar (" + sumber + ")...");
    updateOLED("Proses...", sumber, 0, "Dorong Keluar", false);

    // Putar ke arah jemuran keluar (HIGH)
    digitalWrite(dirPin, HIGH);
    
    // Beri batas langkah maksimal (akan berhenti otomatis saat menyentuh limit switch)
    for (int i = 0; i < 6000; i++) {
      // Cek limit switch di ujung luar: jika tersentuh tuasnya, langsung rem
      if (digitalRead(PIN_LIMIT_LUAR) == LOW) {
        Serial.println("Limit switch luar tersentuh! Posisi jemur tercapai.");
        break;
      }

      digitalWrite(stepPin, HIGH);
      delayMicroseconds(1000);
      digitalWrite(stepPin, LOW);
      delayMicroseconds(1000);

      // PENTING: Panggil client.loop() berkala agar broker MQTT tidak memutus koneksi (LWT Offline)
      if (i % 50 == 0) {
        client.loop();
      }
      yield();
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
    
    String willPayload = "{\"v\":1,\"deviceId\":\"" + String(device_id) + "\",\"status\":\"offline\"}";
    const char* willTopic = topic_state_std.c_str();
    int willQos = 1;
    bool willRetain = true;

    if (client.connect(clientId.c_str(), willTopic, willQos, willRetain, willPayload.c_str())) {
      Serial.println(" Terhubung!");

      // 1. Publikasikan status ONLINE (Retained)
      String onlinePayload = "{\"v\":1,\"deviceId\":\"" + String(device_id) + "\",\"status\":\"online\"}";
      client.publish(topic_state_std.c_str(), onlinePayload.c_str(), true);

      // 2. Berlangganan topik kontrol Web
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

  // Setup Pin Limit Switch
  pinMode(PIN_LIMIT_LUAR, INPUT_PULLUP);

  // Inisialisasi Layar OLED
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
  client.setKeepAlive(15);
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
    int adcLdr   = analogRead(PIN_LDR);

    // Evaluasi logika dengan Hysteresis (mencegah osilasi bolak-balik motor)
    bool isHujan   = (adcHujan < AMBANG_HUJAN_MASUK);
    bool isKering  = (adcHujan > AMBANG_KERING_KELUAR);
    bool isMendung = (adcLdr > 2500);

    // 1. LOGIKA OTOMATIS CERDAS DENGAN TIMER DEBOUNCE
    if (isHujan) {
      waktuMulaiKering = 0; // Reset timer kering jika masih terdeteksi air hujan
      if (!jemuranDiDalam) {
        gerakkanJemuran(true, "Auto Hujan");
      }
    } 
    else if (isKering && jemuranDiDalam) {
      // Sensor kering: hitung kestabilan cuaca 20 detik sebelum didorong keluar
      if (waktuMulaiKering == 0) {
        waktuMulaiKering = millis();
        Serial.println("Sensor kering terdeteksi. Menunggu 20 detik kestabilan cuaca sebelum keluar...");
      } else if (millis() - waktuMulaiKering >= WAKTU_TUNGGU_KERING_MS) {
        Serial.println("Cuaca terbukti stabil kering selama 20 detik! Mendorong jemuran keluar...");
        gerakkanJemuran(false, "Auto Kering");
        waktuMulaiKering = 0;
      }
    } 
    else {
      // Di zona buffer hysteresis (2300 - 3000): pertahankan posisi
      waktuMulaiKering = 0;
    }

    // 2. UPDATE TAMPILAN LAYAR OLED
    String txtHujan   = isHujan ? "HUJAN!" : "Kering";
    String txtLangit  = isMendung ? "Mendung" : "Cerah";
    String txtPosisi  = jemuranDiDalam ? "Di Dalam" : "Di Luar";
    bool warningMendung = (isMendung && !jemuranDiDalam);

    updateOLED(txtHujan, txtLangit, adcLdr, txtPosisi, warningMendung);
    Serial.println("Sensor LDR: " + String(adcLdr) + " -> " + txtLangit);

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

    client.publish(topic_publish.c_str(), payload.c_str());

    // Konversi ADC hujan ke persentase basah (0-100%)
    int rainPct = (4095 - adcHujan) * 100 / (4095 - 800);
    if (rainPct < 0) rainPct = 0;
    if (rainPct > 100) rainPct = 100;

    // Publikasikan ke topik standar format sistem
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