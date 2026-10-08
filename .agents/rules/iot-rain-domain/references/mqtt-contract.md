# Kontrak MQTT - Referensi Lengkap

Ringkas dari `API.md` bagian A. Dipakai saat menulis kode yang mem-publish atau mem-consume payload.

## Topik

```
hujansensor/{deviceId}/state       retained, 5 detik + boot
hujansensor/{deviceId}/telemetry   tidak retained, 3 detik
hujansensor/{deviceId}/event       tidak retained, diskret
hujansensor/{deviceId}/cmd         DIBLOKIR di v1 (web read-only)
```

`deviceId` berformat `hs-` + 12 karakter hex. Contoh: `hs-8f3a1c9d2b70`.

## Batas nilai

Payload di luar batas ini **ditolak**, bukan dipangkas.

| Field | Min | Maks | Tipe |
|---|---|---|---|
| `rain.raw`, `raw` | 0 | 4095 | int |
| `rain.pct`, `pct` | 0 | 100 | int |
| `bateraiPct`, `hum`, `hu` | 0 | 100 | int/float |
| `tempC`, `suhuC` | -50 | 80 | float |
| `vbat`, `bateraiV` | 0 | 5 | float |
| `rssi` | -120 | 0 | int |
| `uptimeS` | 0 | 31536000 | int |
| `thresholdPct` | 1 | 100 | int |
| `rain.sinceMs`, `ts` | 0 | maks 2^53 | int (epoch ms) |

## Contoh payload `state`

```json
{
  "v": 1,
  "deviceId": "hs-8f3a1c9d2b70",
  "status": "online",
  "fw": "1.0.0",
  "ts": 1763308800000,
  "uptimeS": 84213,
  "rssi": -58,
  "ip": "192.168.1.14",
  "rain": { "raw": 812, "pct": 18, "wet": false, "thresholdPct": 60, "sinceMs": 1763304600000 },
  "env": { "tempC": 28.4, "hum": 82 },
  "power": { "vbat": 3.91, "pct": 74, "charging": false },
  "loc": { "adm4": "31.71.03.1001" }
}
```

`env` dan `power` **boleh null**. Perangkat tanpa DHT22 atau divider tegangan tidak melaporkan keduanya.

## Contoh payload `telemetry`

`env` dan `power` diratakan agar pesan ringkas.

```json
{
  "v": 1,
  "deviceId": "hs-8f3a1c9d2b70",
  "ts": 1763308803000,
  "raw": 815,
  "pct": 18,
  "wet": false,
  "tempC": 28.4,
  "hum": 82,
  "vbat": 3.91,
  "rssi": -58
}
```

## Contoh payload `event`

```json
{ "v": 1, "deviceId": "hs-8f3a1c9d2b70", "type": "rain_start", "ts": 1763308803000, "data": { "pct": 78, "raw": 612 } }
```

| `type` | `data` |
|---|---|
| `rain_start` | `pct`, `raw` |
| `rain_stop` | `pct`, `raw` |
| `device_boot` | `resetReason` |
| `wifi_fail` | `ssid`, `code` |
| `mqtt_retry` | `attempt`, `delayMs` |

## LWT

| Parameter | Nilai |
|---|---|
| topic | `hujansensor/{deviceId}/state` |
| retain | `true` |
| qos | `0` |
| message | `{"v":1,"deviceId":"{id}","status":"offline"}` |

## Deteksi offline di web

Offline bila salah satu terpenuhi:

1. Pesan retained `status == "offline"`
2. `Date.now() - lastSeen > 90000`
3. WebSocket ke broker putus

Aturan 3 dilaporkan sebagai `Koneksi broker terputus`, **bukan** `Perangkat offline`.

## Konfigurasi koneksi

| Sisi | URL | Port |
|---|---|---|
| Web | `wss://broker.emqx.io:8884/mqtt` | 8884 |
| ESP32 | `broker.emqx.io` | 1883 |

Cadangan:

| Broker | WSS | TCP |
|---|---|---|
| HiveMQ | `wss://broker.hivemq.com:8884/mqtt` | `broker.hivemq.com:1883` |
| Mosquitto | `wss://test.mosquitto.org:8081/mqtt` | `test.mosquitto.org:1883` |
