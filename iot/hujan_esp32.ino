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

// Pin Driver Motor (Stepper A4988 / DRV8825 atau Motor DC L298N)
// - Mode Stepper: Pin 18 = STEP (pulsa), Pin 19 = DIR (arah putar)
// - Mode Motor DC (L298N): Pin 18 = IN1, Pin 19 = IN2
const int stepPin = 18;
const int dirPin  = 19;

// Pilih Tipe Driver Motor:
// false = Driver Stepper A4988 / DRV8825 (Default)
// true  = Driver Motor DC L298N / Relay 2-Channel (IN1 ke pin 18, IN2 ke pin 19)
#define MOTOR_TIPE_DC_L298N false

// Pin Limit Switch Luar & Dalam (COM ke GND, NO ke GPIO 25 & 26 dengan internal PULLUP)
#define PIN_LIMIT_LUAR  25 // Switch pembatas ujung luar (posisi jemur/terbuka)
#define PIN_LIMIT_DALAM 26 // Switch pembatas ujung dalam (posisi kanopi/teduh)

// Konfigurasi Level Logika Saklar saat Tertekan:
// LOW  = Saklar NO (Normally Open) terhubung ke GND dengan INPUT_PULLUP (Default)
// HIGH = Saklar NC (Normally Closed) jika pin membaca LOW saat tidak ditekan
#define LIMIT_SWITCH_PRESSED LOW

WiFiClient espClient;
PubSubClient client(espClient);

// Status Posisi Jemuran (false = Di Luar/Jemur, true = Di Dalam/Teduh)
bool jemuranDiDalam = false;

// Flag Berhenti Darurat / Manual dari Web
volatile bool stopManualDiminta = false;

// Status Hujan Aktif dengan Latch Hysteresis (Schmitt Trigger)
// Mencegah status 'reda' prematur saat lempeng sensor masih basah/lembab
bool statusHujanAktif = false;

// Batas Ambang ADC dengan Hysteresis (Mencegah motor bolak-balik karena fluktuasi air)
#define AMBANG_HUJAN_MASUK    2300 // Jika ADC < 2300, terdeteksi air hujan -> status terkunci HUJAN & tarik jemuran
#define AMBANG_KERING_KELUAR  3000 // Jika ADC > 3000, sensor benar-benar kering -> status menjadi KERING

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

// Fungsi pengiriman telemetri lengkap ke Broker MQTT (dapat dipanggil saat idle maupun saat motor bergerak)
void kirimDataTelemetri(String posisiMotor, String motorStatus) {
  int adcHujan = analogRead(PIN_HUJAN);
  int adcLdr   = analogRead(PIN_LDR);

  int rainPct = (4095 - adcHujan) * 100 / (4095 - 800);
  if (rainPct < 0) rainPct = 0;
  if (rainPct > 100) rainPct = 100;

  if (adcHujan < AMBANG_HUJAN_MASUK) {
    statusHujanAktif = true;
  } else if (adcHujan > AMBANG_KERING_KELUAR) {
    statusHujanAktif = false;
  }

  bool isBadai   = (statusHujanAktif && (rainPct > 80 || adcHujan < 1400));
  bool isMendung = (adcLdr > 2500);
  bool warningMendung = (isMendung && (posisiMotor == "diluar" || posisiMotor == "mendorong"));

  // 1. Topik Custom Data (+/data)
  String payload = "{";
  payload += "\"device_id\":\"" + String(device_id) + "\",";
  payload += "\"adc_hujan\":" + String(adcHujan) + ",";
  payload += "\"rain_pct\":" + String(rainPct) + ",";
  payload += "\"adc_ldr\":" + String(adcLdr) + ",";
  payload += "\"hujan\":" + String(statusHujanAktif ? "true" : "false") + ",";
  payload += "\"badai\":" + String(isBadai ? "true" : "false") + ",";
  payload += "\"mendung\":" + String(isMendung ? "true" : "false") + ",";
  payload += "\"peringatan\":" + String(warningMendung ? "true" : "false") + ",";
  payload += "\"status\":\"online\",";
  payload += "\"motor_status\":\"" + motorStatus + "\",";
  payload += "\"posisi\":\"" + posisiMotor + "\"";
  payload += "}";
  client.publish(topic_publish.c_str(), payload.c_str());

  // 2. Topik Standar Format Sistem (hujansensor/+/telemetry)
  String stdPayload = "{";
  stdPayload += "\"v\":1,";
  stdPayload += "\"deviceId\":\"" + String(device_id) + "\",";
  stdPayload += "\"ts\":" + String(millis()) + ",";
  stdPayload += "\"raw\":" + String(adcHujan) + ",";
  stdPayload += "\"pct\":" + String(rainPct) + ",";
  stdPayload += "\"wet\":" + String(statusHujanAktif ? "true" : "false") + ",";
  stdPayload += "\"mendung\":" + String(isMendung ? "true" : "false") + ",";
  stdPayload += "\"ldrRaw\":" + String(adcLdr) + ",";
  stdPayload += "\"rssi\":" + String(WiFi.RSSI());
  stdPayload += "}";
  client.publish(topic_telemetry_std.c_str(), stdPayload.c_str());
}

// Fungsi menggerakkan motor (Stepper atau DC L298N) dengan telemetri realtime
void gerakkanJemuran(bool tarikMasuk, String sumber) {
  stopManualDiminta = false; // Reset flag stop manual sebelum mulai bergerak

  if (tarikMasuk) {
    // 1. Cek apakah limit switch dalam sudah tertekan (posisi sudah mentok di kanopi dalam)
    if (digitalRead(PIN_LIMIT_DALAM) == LIMIT_SWITCH_PRESSED) {
      Serial.println("Jemuran sudah berada di batas dalam (Limit Switch Dalam aktif). Tidak perlu menarik lagi.");
      jemuranDiDalam = true;
      kirimDataTelemetri("didalam", "idle");
      return;
    }

    Serial.println("Menarik jemuran masuk (" + sumber + ")...");
    updateOLED("Proses...", sumber, 0, "Menarik Masuk", false);

    // Konfigurasi arah pergerakan motor
    if (MOTOR_TIPE_DC_L298N) {
      // Driver Motor DC (L298N): IN1 = HIGH, IN2 = LOW
      digitalWrite(stepPin, HIGH);
      digitalWrite(dirPin, LOW);
    } else {
      // Driver Stepper: DIR = LOW
      digitalWrite(dirPin, LOW);
    }
    
    // Bergerak sampai menyentuh limit switch dalam (maksimal 6000 iterasi)
    for (int i = 0; i < 6000; i++) {
      // 1. Cek limit switch di ujung dalam: jika tersentuh tuasnya, rem seketika!
      if (digitalRead(PIN_LIMIT_DALAM) == LIMIT_SWITCH_PRESSED) {
        Serial.println("Limit switch dalam tersentuh! Posisi kanopi teduh tercapai.");
        break;
      }

      // 2. Cek apakah ada perintah berhenti (STOP) manual dari Web / App
      if (stopManualDiminta) {
        Serial.println("Motor dihentikan seketika oleh perintah STOP dari Web!");
        stopManualDiminta = false;
        break;
      }

      if (MOTOR_TIPE_DC_L298N) {
        // Motor DC: biarkan berputar kontinu dengan jeda singkat untuk sampling
        delay(2);
      } else {
        // Motor Stepper: pulsa langkah STEP
        digitalWrite(stepPin, HIGH);
        delayMicroseconds(1000);
        digitalWrite(stepPin, LOW);
        delayMicroseconds(1000);
      }

      // Setiap 500 iterasi (~1 detik): panggil loop MQTT & kirim telemetri lengkap realtime
      if (i % 500 == 0) {
        client.loop();
        kirimDataTelemetri("menarik", "moving");
      } else if (i % 50 == 0) {
        client.loop();
      }
      yield();
    }

    // Matikan driver jika menggunakan Motor DC
    if (MOTOR_TIPE_DC_L298N) {
      digitalWrite(stepPin, LOW);
      digitalWrite(dirPin, LOW);
    }

    // Jika limit switch dalam tersentuh, tandai posisi telah aman di dalam
    if (digitalRead(PIN_LIMIT_DALAM) == LIMIT_SWITCH_PRESSED) {
      jemuranDiDalam = true;
    }
    Serial.println("Selesai menarik. Posisi jemuran: " + String(jemuranDiDalam ? "Di Dalam" : "Dihentikan / Sebagian"));
    kirimDataTelemetri(jemuranDiDalam ? "didalam" : "menarik", "idle");
  } 
  else {
    // 2. Cek apakah limit switch luar sudah tertekan (posisi sudah mentok di luar)
    if (digitalRead(PIN_LIMIT_LUAR) == LIMIT_SWITCH_PRESSED) {
      Serial.println("Jemuran sudah berada di batas luar (Limit Switch Luar aktif). Tidak perlu mendorong lagi.");
      jemuranDiDalam = false;
      kirimDataTelemetri("diluar", "idle");
      return;
    }

    Serial.println("Mendorong jemuran keluar (" + sumber + ")...");
    updateOLED("Proses...", sumber, 0, "Dorong Keluar", false);

    // Konfigurasi arah pergerakan keluar
    if (MOTOR_TIPE_DC_L298N) {
      // Driver Motor DC (L298N): IN1 = LOW, IN2 = HIGH
      digitalWrite(stepPin, LOW);
      digitalWrite(dirPin, HIGH);
    } else {
      // Driver Stepper: DIR = HIGH
      digitalWrite(dirPin, HIGH);
    }
    
    // Beri batas pergerakan maksimal (akan berhenti otomatis saat menyentuh limit switch luar)
    for (int i = 0; i < 6000; i++) {
      // 1. Cek limit switch di ujung luar: jika tersentuh tuasnya, rem seketika!
      if (digitalRead(PIN_LIMIT_LUAR) == LIMIT_SWITCH_PRESSED) {
        Serial.println("Limit switch luar tersentuh! Posisi jemur tercapai.");
        break;
      }

      // 2. Cek apakah ada perintah berhenti (STOP) manual dari Web / App
      if (stopManualDiminta) {
        Serial.println("Motor dihentikan seketika oleh perintah STOP dari Web!");
        stopManualDiminta = false;
        break;
      }

      if (MOTOR_TIPE_DC_L298N) {
        // Motor DC: biarkan berputar kontinu dengan jeda singkat untuk sampling
        delay(2);
      } else {
        // Motor Stepper: pulsa langkah STEP
        digitalWrite(stepPin, HIGH);
        delayMicroseconds(1000);
        digitalWrite(stepPin, LOW);
        delayMicroseconds(1000);
      }

      // Setiap 500 iterasi (~1 detik): panggil loop MQTT & kirim telemetri lengkap
      if (i % 500 == 0) {
        client.loop();
        kirimDataTelemetri("mendorong", "moving");
        // Pengaman darurat otomatis: Jika gerakan otomatis dan mendadak hujan deras saat didorong keluar, langsung rem dan batalkan!
        if (sumber != "Tombol Web" && i > 0) {
          int adcHujan = analogRead(PIN_HUJAN);
          if (adcHujan < 1400) {
            Serial.println("DARURAT: Hujan deras terdeteksi saat jemuran didorong keluar! Berhenti mendorong.");
            break;
          }
        }
      } else if (i % 50 == 0) {
        client.loop();
      }
      yield();
    }

    // Matikan driver jika menggunakan Motor DC
    if (MOTOR_TIPE_DC_L298N) {
      digitalWrite(stepPin, LOW);
      digitalWrite(dirPin, LOW);
    }

    // Jika limit switch luar tersentuh, tandai posisi berada di luar
    if (digitalRead(PIN_LIMIT_LUAR) == LIMIT_SWITCH_PRESSED) {
      jemuranDiDalam = false;
    }
    Serial.println("Selesai mendorong. Posisi jemuran: " + String(jemuranDiDalam ? "Di Dalam" : "Di Luar"));
    kirimDataTelemetri(jemuranDiDalam ? "didalam" : "diluar", "idle");
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
  // 1. Perintah Berhenti Manual (STOP)
  if (pesan.indexOf("stop") >= 0 || pesan.indexOf("berhenti") >= 0 || pesan.indexOf("halt") >= 0 || pesan == "2") {
    stopManualDiminta = true;
    digitalWrite(stepPin, LOW);
    digitalWrite(dirPin, LOW);
    Serial.println("Perintah STOP diterima dari Web/App! Menghentikan pergerakan motor...");
    updateOLED("STOP!", "Manual Stop", 0, "Berhenti", false);
    kirimDataTelemetri(jemuranDiDalam ? "didalam" : "diluar", "idle");
  }
  // 2. Perintah Tarik Masuk
  else if (pesan.indexOf("tarik") >= 0 || pesan.indexOf("masuk") >= 0 || pesan.indexOf("retract") >= 0 || pesan.indexOf("in") >= 0 || pesan.indexOf("tutup") >= 0 || pesan == "1") {
    gerakkanJemuran(true, "Tombol Web");
  } 
  // 3. Perintah Dorong Keluar (Manual override dari tombol Web)
  else if (pesan.indexOf("dorong") >= 0 || pesan.indexOf("keluar") >= 0 || pesan.indexOf("extend") >= 0 || pesan.indexOf("out") >= 0 || pesan.indexOf("buka") >= 0 || pesan == "0") {
    Serial.println("Perintah manual BUKA / DORONG KELUAR diterima dari Web/App.");
    gerakkanJemuran(false, "Tombol Web");
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

  // Setup Pin Limit Switch Luar & Dalam
  pinMode(PIN_LIMIT_LUAR, INPUT_PULLUP);
  pinMode(PIN_LIMIT_DALAM, INPUT_PULLUP);

  // Inisialisasi status posisi awal berdasarkan kondisi limit switch fisik
  int swDalam = digitalRead(PIN_LIMIT_DALAM);
  int swLuar  = digitalRead(PIN_LIMIT_LUAR);

  Serial.println("=== STATUS LIMIT SWITCH FISIK SAAT BOOT ===");
  Serial.print("Limit Switch Dalam (GPIO "); Serial.print(PIN_LIMIT_DALAM); Serial.print("): ");
  Serial.println(swDalam == LIMIT_SWITCH_PRESSED ? "TERTEKAN (AKTIF)" : "TERLEPAS (TIDAK AKTIF)");
  Serial.print("Limit Switch Luar  (GPIO "); Serial.print(PIN_LIMIT_LUAR); Serial.print("): ");
  Serial.println(swLuar == LIMIT_SWITCH_PRESSED ? "TERTEKAN (AKTIF)" : "TERLEPAS (TIDAK AKTIF)");

  if (swDalam == LIMIT_SWITCH_PRESSED) {
    jemuranDiDalam = true;
    Serial.println("Posisi awal fisik terdeteksi: Di Dalam Kanopi");
  } else if (swLuar == LIMIT_SWITCH_PRESSED) {
    jemuranDiDalam = false;
    Serial.println("Posisi awal fisik terdeteksi: Di Luar Terbuka");
  }

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

    // 1. Konversi ADC hujan ke persentase basah (0-100%)
    int rainPct = (4095 - adcHujan) * 100 / (4095 - 800);
    if (rainPct < 0) rainPct = 0;
    if (rainPct > 100) rainPct = 100;

    // 2. Evaluasi Logika Hysteresis Sejati (Schmitt Trigger)
    // Mencegah status 'reda' palsu saat lempeng sensor masih basah/lembab
    if (adcHujan < AMBANG_HUJAN_MASUK) {
      statusHujanAktif = true; // Air hujan terdeteksi -> status terkunci HUJAN
    } else if (adcHujan > AMBANG_KERING_KELUAR) {
      statusHujanAktif = false; // Sensor benar-benar kering -> status menjadi KERING
    }
    // Jika ADC di antara AMBANG_HUJAN_MASUK (2300) dan AMBANG_KERING_KELUAR (3000):
    // statusHujanAktif TETAP mempertahankan status sebelumnya (tidak berubah prematur)!

    // 3. Klasifikasi Tingkat Cuaca: Kering, Hujan Biasa, atau Badai
    bool isBadai   = (statusHujanAktif && (rainPct > 80 || adcHujan < 1400));
    bool isMendung = (adcLdr > 2500);

    // 4. LOGIKA OTOMATIS CERDAS MOTOR DENGAN TIMER DEBOUNCE
    if (statusHujanAktif) {
      waktuMulaiKering = 0; // Reset timer kering jika masih terdeteksi air hujan
      if (!jemuranDiDalam) {
        gerakkanJemuran(true, isBadai ? "Auto Badai" : "Auto Hujan");
      }
    } 
    else if (jemuranDiDalam) {
      // Sensor kering sempurna (> 3000): hitung kestabilan cuaca 20 detik sebelum didorong keluar
      if (waktuMulaiKering == 0) {
        waktuMulaiKering = millis();
        Serial.println("Sensor kering terbukti. Menunggu 20 detik kestabilan cuaca sebelum keluar...");
      } else if (millis() - waktuMulaiKering >= WAKTU_TUNGGU_KERING_MS) {
        Serial.println("Cuaca terbukti stabil kering selama 20 detik! Mendorong jemuran keluar...");
        gerakkanJemuran(false, "Auto Kering");
        waktuMulaiKering = 0;
      }
    } 
    else {
      // Di luar dan kering: pastikan timer reset
      waktuMulaiKering = 0;
    }

    // 5. UPDATE TAMPILAN LAYAR OLED
    String txtHujan;
    if (isBadai) {
      txtHujan = "BADAI!";
    } else if (statusHujanAktif) {
      txtHujan = "HUJAN!";
    } else {
      txtHujan = "Kering";
    }
    String txtLangit  = isMendung ? "Mendung" : "Cerah";
    String txtPosisi  = jemuranDiDalam ? "Di Dalam" : "Di Luar";
    bool warningMendung = (isMendung && !jemuranDiDalam);

    updateOLED(txtHujan, txtLangit, adcLdr, txtPosisi, warningMendung);
    Serial.println("Sensor Hujan ADC: " + String(adcHujan) + " (" + String(rainPct) + "%) -> " + txtHujan);
    Serial.println("Sensor LDR: " + String(adcLdr) + " -> " + txtLangit);

    // 6. KIRIM TELEMETRI LENGKAP KE BROKER MQTT VPS
    kirimDataTelemetri(jemuranDiDalam ? "didalam" : "diluar", "idle");
  }
}