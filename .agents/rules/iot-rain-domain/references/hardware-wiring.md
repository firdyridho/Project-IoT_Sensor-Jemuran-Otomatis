# Hardware dan Wiring ESP32

> Status: **rancangan**. Pertanyaan Q1 di `PRD.md` (jenis sensor) masih terbuka. Sesuaikan kalibrasi setelah sensor fisik ditentukan.

## Komponen

| Komponen | Peran | Opsional |
|---|---|---|
| ESP32 devkit | mikrokontroler + WiFi | wajib |
| Sensor hujan analog (optik atau kapasitif) | deteksi basah | wajib |
| DHT22 / DHT11 | suhu + kelembapan | sangat disarankan |
| Buzzer aktif | alarm lokal saat internet mati | disarankan |
| LED status | indikator WiFi/mqtt | disarankan |
| Divider tegangan (2x resistor) | ukur baterai | opsional |
| OLED 0.96" I2C | tampilkan deviceId + QR pairing | opsional |
| Kapasitor 100nF di VCC sensor | stabilisasi | disarankan |

## Pinout yang disarankan

| GPIO | Fungsi | Catatan |
|---|---|---|
| GPIO 34 | Sensor hujan analog | `ADC1_CH6`, input only, aman untuk WiFi |
| GPIO 32 | Divisor tegangan baterai | `ADC1_CH4` |
| GPIO 21 | SDA DHT22 + OLED | I2C |
| GPIO 22 | SCL DHT22 + OLED | I2C |
| GPIO 26 | Buzzer | |
| GPIO 2 | LED status | LED bawaan sebagian besar devkit |
| GPIO 4 | DHT22 data | butuh pull-up 10k |

**Pakai ADC1 (GPIO 32-39) untuk semua sensor analog.** ADC2 tidak bisa dipakai saat WiFi aktif karena saling berebut peripheral. Ini penyebab umum nilai ADC yang lompat-lompat pada ESP32.

## Catatan sensor hujan

Sensor optik umumnya output **terbalik**: kering = nilai tinggi (sekitar 4000), basah = nilai rendah (sekitar 800). Jangan asumsikan, ukur dulu:

```
kering : raw = ....
basah  : raw = ....
```

Nilai inilah `RAW_KERING` dan `RAW_BASAH` yang dipakai untuk konversi ke persentase.

Sensor optik **tidak tahan hujan lebat di luar ruangan** tanpa penahan air. Lapisi dengan bahan hidrofobik dan beri jarak dari air menggenang agar tidak memberi sinyal basah terus-menerus.

## Kalibrasi

1. Baca nilai saat benar-benar kering selama 60 detik, catat rata-rata.
2. Teteskan air hingga seluruh permukaan terkena, baca nilai terendah.
3. Masukkan kedua nilai ke konfigurasi.
4. Uji ulang setelah 1-2 kali hujan pertama karena permukaan sensor berubah.

Ambang default `AMBANG = 60` dan jarak histeresis 15 poin adalah titik awal, bukan nilai final.

## Algoritma pemrosesan

```
raw ADC --> konversi ke pct --> EMA (alpha 0.15) --> histeresis (60 / 45) --> wet
                                                                    |
                                                          transisi? --> event + Telegram
```

| Parameter | Nilai awal | Fungsi |
|---|---|---|
| `ALPHA` | 0.15 | smoothing. Makin kecil makin halus, makin lambat merespons |
| `AMBANG` | 60 | mulai dianggap hujan |
| `LEPAS` | 45 | baru dianggap berhenti (histeresis 15) |
| interval telemetry | 3 detik | |
| interval state | 5 detik | |
| durasi minimal hujan | 60 detik | sebelum kirim notifikasi |
| cooldown `rain_start` | 10 menit | |

## Penyimpanan konfigurasi (LittleFS)

Simpan di `/config.json`, **jangan hardcode**:

```json
{
  "deviceId": "hs-8f3a1c9d2b70",
  "wifiSsid": "...",
  "wifiPass": "...",
  "mqttHost": "broker.emqx.io",
  "mqttPort": 1883,
  "telegramToken": "...",
  "telegramChatId": "...",
  "ambangPct": 60,
  "histeresis": 15,
  "adm4": "31.71.03.1001",
  "namaPerangkat": "Jemuran Utama"
}
```

`WiFiManager` membuat captive portal saat konfigurasi kosong atau WiFi gagal terhubung, sehingga pengguna mengisi lewat HP tanpa mengubah kode.

Token bot Telegram dan password WiFi **tidak boleh berada di repositori**. Masukkan lewat portal konfigurasi.

## Keandalan jaringan

| Masalah | Penanganan |
|---|---|
| WiFi gagal | retry dengan backoff eksponensial, max 60 detik, publish `wifi_fail` saat kembali |
| Broker tidak terjangkau | backoff, event `mqtt_retry`, jangan blokir loop |
| Koneksi terputus tiba-tiba | LWT menandai offline di web |
| Perangkat reboot | event `device_boot`, publish `state` retained segera |

Backoff eksponensial: `delay = min(30000, 1000 * 2^attempt)`.

## Konsumsi daya (perkiraan)

| Kondisi | Arus |
|---|---|
| WiFi aktif + telemetry 3 detik | sekitar 80-120 mA |
| Idle ringan | sekitar 30-50 mA |
| Deep sleep | sekitar 10 uA |

Konfigurasi ini **tidak memakai deep sleep** karena butuh koneksi MQTT yang selalu siap. Bila ingin tahan baterai berbulan-bulan, butuh perancangan ulang: kirim lalu sleep, dan status offline di web jadi tidak akurat. Lihat `PRD.md` Q3 dan bagian 14.
