import React, { useState, useEffect, useRef, useTransition } from 'react';
import { NavTab, BottomNav } from './components/Layout/BottomNav';
import { Sidebar } from './components/Layout/Sidebar';
import { Header } from './components/Layout/Header';
import { ToastContainer } from './components/Layout/ToastContainer';
import { HeroStatusCard } from './components/Dashboard/HeroStatusCard';
import { TelemetryGrid } from './components/Dashboard/TelemetryGrid';
import { QuickWeatherCard } from './components/Dashboard/QuickWeatherCard';
import { RealtimeChart } from './components/Grafik/RealtimeChart';
import { WeatherView } from './components/Cuaca/WeatherView';
import { HistoryView } from './components/Riwayat/HistoryView';
import { DeviceView } from './components/Perangkat/DeviceView';

import {
  Perangkat,
  PembacaanHujan,
  Peristiwa,
  StatePayload,
  TelemetryPayload,
  EventPayload,
} from './types/iot';
import { BmkgResponse } from './types/bmkg';
import { StorageService } from './services/storage';
import { mqttClient, MqttConnectionStatus } from './services/mqtt';
import { fetchBmkgWeather } from './services/bmkg';
import { Notifications } from './services/notifications';
import { BackendService } from './services/api';

export const App: React.FC = () => {
  // 1. Core State
  const [activeTab, setActiveTab] = useState<NavTab>('dashboard');
  const [devices, setDevices] = useState<Perangkat[]>(() => StorageService.getDevices());
  const [settings, setSettings] = useState(() => StorageService.getSettings());

  const activeDevice =
    devices.find((d) => d.deviceId === settings.deviceIdActive) || devices[0];

  // 2. Realtime Telemetry & State
  const [latestState, setLatestState] = useState<StatePayload | null>(null);
  const [readings, setReadings] = useState<PembacaanHujan[]>(() =>
    StorageService.getReadings(activeDevice.deviceId)
  );
  const [events, setEvents] = useState<Peristiwa[]>(() =>
    StorageService.getEvents(activeDevice.deviceId)
  );

  const [brokerStatus, setBrokerStatus] = useState<MqttConnectionStatus>('connected');
  const [brokerError, setBrokerError] = useState<string>('');
  const [lastSeenTs, setLastSeenTs] = useState<number>(Date.now());
  const [secondsAgo, setSecondsAgo] = useState(0);

  // 3. BMKG Weather State
  const [weatherData, setWeatherData] = useState<BmkgResponse | null>(null);
  const [isWeatherLoading, setIsWeatherLoading] = useState(false);
  const [isWeatherStale, setIsWeatherStale] = useState(false);
  const [weatherError, setWeatherError] = useState<string | undefined>(undefined);

  // 4. Notifications State
  const [notifPermission, setNotifPermission] = useState<NotificationPermission>(() =>
    Notifications.getPermission()
  );

  // Debounced storage save reference
  const debouncedReadingsRef = useRef<number | null>(null);

  // Track previous wet state for transitions
  const prevWetRef = useRef<boolean>(false);

  // ---------------------------------------------------------------------------
  // Theme Manager
  // ---------------------------------------------------------------------------
  useEffect(() => {
    const applyTheme = () => {
      const mode = settings.tema;
      let effective = mode;
      if (mode === 'system') {
        effective = window.matchMedia('(prefers-color-scheme: dark)').matches
          ? 'dark'
          : 'light';
      }
      document.documentElement.dataset.tema = effective;
      if (effective === 'dark') {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    };

    applyTheme();

    const media = window.matchMedia('(prefers-color-scheme: dark)');
    const listener = () => {
      if (settings.tema === 'system') applyTheme();
    };
    media.addEventListener('change', listener);
    return () => media.removeEventListener('change', listener);
  }, [settings.tema]);

  const handleToggleTheme = () => {
    const order: Array<'system' | 'dark' | 'light'> = ['system', 'dark', 'light'];
    const nextIdx = (order.indexOf(settings.tema) + 1) % order.length;
    const nextTheme = order[nextIdx];
    const newSettings = { ...settings, tema: nextTheme };
    setSettings(newSettings);
    StorageService.saveSettings(newSettings);
  };

  const handleChangeTheme = (theme: 'light' | 'dark' | 'system') => {
    const newSettings = { ...settings, tema: theme };
    setSettings(newSettings);
    StorageService.saveSettings(newSettings);
  };

  // ---------------------------------------------------------------------------
  // BMKG Weather Fetcher
  // ---------------------------------------------------------------------------
  const loadWeather = async (adm4Code: string, force = false) => {
    setIsWeatherLoading(true);
    setWeatherError(undefined);
    try {
      const result = await fetchBmkgWeather(adm4Code, force);
      setWeatherData(result.data);
      setIsWeatherStale(result.isStale);
      if (result.error) {
        setWeatherError(result.error);
      }
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Gagal memuat cuaca';
      setWeatherError(msg);
    } finally {
      setIsWeatherLoading(false);
    }
  };

  useEffect(() => {
    loadWeather(activeDevice.lokasiAdm4);
  }, [activeDevice.lokasiAdm4]);

  // ---------------------------------------------------------------------------
  // Ticker for Staleness (>90s) & seconds counter
  // ---------------------------------------------------------------------------
  useEffect(() => {
    const interval = window.setInterval(() => {
      const now = Date.now();
      const diffSec = Math.floor((now - lastSeenTs) / 1000);
      setSecondsAgo(diffSec);
    }, 1000);
    return () => clearInterval(interval);
  }, [lastSeenTs]);

  // Offline calculation as per API.md A.8:
  // 1. retained LWT status === 'offline'
  // 2. Date.now() - lastSeen > 90_000
  // 3. Broker disconnected
  const isDeviceOffline =
    latestState?.status === 'offline' || Date.now() - lastSeenTs > 90000;
  const isBrokerDisconnected = brokerStatus !== 'connected';

  // ---------------------------------------------------------------------------
  // Ingest Incoming MQTT Telemetry & States
  // ---------------------------------------------------------------------------
  const handleIngestTelemetry = (telemetry: TelemetryPayload) => {
    const now = Date.now();
    setLastSeenTs(now);

    const newReading: PembacaanHujan = {
      deviceId: telemetry.deviceId,
      ts: telemetry.ts || now,
      raw: telemetry.raw,
      pct: telemetry.pct,
      wet: telemetry.wet,
      suhuC: telemetry.tempC ?? null,
      lembapPct: telemetry.hum ?? null,
      bateraiV: telemetry.vbat ?? null,
      bateraiPct: telemetry.vbat != null ? Math.min(100, Math.round(((telemetry.vbat - 3.2) / 1.0) * 100)) : null,
      rssi: telemetry.rssi ?? null,
    };

    setReadings((prev) => {
      const updated = [...prev, newReading].slice(-1000);
      // Debounced write to localStorage (5 seconds debounce as per ERD.md 5.1)
      if (debouncedReadingsRef.current) {
        window.clearTimeout(debouncedReadingsRef.current);
      }
      debouncedReadingsRef.current = window.setTimeout(() => {
        StorageService.saveReadings(telemetry.deviceId, updated);
      }, 5000);
      return updated;
    });

    // Rain transition trigger alert (Kering -> Hujan)
    if (!prevWetRef.current && telemetry.wet) {
      Notifications.showRainAlert(activeDevice.nama, telemetry.pct, telemetry.raw);
    }
    prevWetRef.current = telemetry.wet;
  };

  const handleIngestState = (state: StatePayload) => {
    setLatestState(state);
    setLastSeenTs(Date.now());
  };

  const handleIngestEvent = (ev: EventPayload) => {
    const newEvent: Peristiwa = {
      deviceId: ev.deviceId,
      ts: ev.ts || Date.now(),
      jenis: ev.type,
      data: ev.data,
    };

    setEvents((prev) => {
      const updated = [...prev, newEvent].slice(-200);
      StorageService.saveEvents(ev.deviceId, updated);
      return updated;
    });

    if (ev.type === 'rain_start') {
      Notifications.addToast({
        id: 'toast-' + Date.now(),
        type: 'rain',
        title: '🌧️ Hujan Terdeteksi',
        message: `Sensor di ${activeDevice.nama} mendeteksi hujan! Basah: ${ev.data?.pct ?? '—'}%`,
        timestamp: Date.now(),
      });
    } else if (ev.type === 'rain_stop') {
      Notifications.addToast({
        id: 'toast-' + Date.now(),
        type: 'info',
        title: '☀️ Hujan Telah Reda',
        message: `Kondisi sensor kembali kering di ${activeDevice.nama}.`,
        timestamp: Date.now(),
      });
    }
  };

  // ---------------------------------------------------------------------------
  // Load Historical Data from Golang Backend (Tencent Lighthouse VPS)
  // ---------------------------------------------------------------------------
  useEffect(() => {
    const backendUrl = settings.backendUrl;
    if (!backendUrl) return;

    let isMounted = true;
    BackendService.getTelemetry(backendUrl, activeDevice.deviceId, '24h')
      .then((dbReadings) => {
        if (!isMounted || !dbReadings.length) return;
        setReadings((prev) => {
          const map = new Map<number, PembacaanHujan>();
          dbReadings.forEach((r) => map.set(r.ts, r));
          prev.forEach((r) => map.set(r.ts, r));
          return Array.from(map.values()).sort((a, b) => a.ts - b.ts).slice(-1000);
        });
      })
      .catch(() => {});

    BackendService.getEvents(backendUrl, activeDevice.deviceId)
      .then((dbEvents) => {
        if (!isMounted || !dbEvents.length) return;
        setEvents((prev) => {
          const map = new Map<number, Peristiwa>();
          dbEvents.forEach((e) => map.set(e.ts, e));
          prev.forEach((e) => map.set(e.ts, e));
          return Array.from(map.values()).sort((a, b) => a.ts - b.ts).slice(-200);
        });
      })
      .catch(() => {});

    return () => {
      isMounted = false;
    };
  }, [settings.backendUrl, activeDevice.deviceId]);

  // ---------------------------------------------------------------------------
  // Realtime Backend WebSocket & Direct MQTT Hardware Lifecycle
  // ---------------------------------------------------------------------------
  useEffect(() => {
    // 1. If backend URL is provided, connect to WebSocket for live broadcast from VPS
    let closeWs: (() => void) | null = null;
    if (settings.backendUrl) {
      closeWs = BackendService.connectWebSocket(settings.backendUrl, {
        onTelemetry: (telemetry) => handleIngestTelemetry(telemetry),
        onState: (state) => handleIngestState(state),
        onEvent: (ev) => handleIngestEvent(ev),
        onStatusChange: (connected) => {
          if (connected) {
            setBrokerStatus('connected');
            setBrokerError('');
          }
        },
      });
    }

    // 2. Connect to MQTT Broker over WSS (ensures realtime directly from ESP32 hardware)
    mqttClient.connect(activeDevice.brokerUrl, activeDevice.deviceId, {
      onStatusChange: (status, errMsg) => {
        setBrokerStatus(status);
        if (errMsg) setBrokerError(errMsg);
      },
      onStateMessage: (state) => handleIngestState(state),
      onTelemetryMessage: (telemetry) => handleIngestTelemetry(telemetry),
      onEventMessage: (ev) => handleIngestEvent(ev),
    });

    return () => {
      if (closeWs) closeWs();
      mqttClient.disconnect();
    };
  }, [activeDevice.deviceId, activeDevice.brokerUrl, settings.backendUrl]);

  // Request browser notifications
  const handleRequestNotification = async () => {
    const perm = await Notifications.requestPermission();
    setNotifPermission(perm);
    if (perm === 'granted') {
      Notifications.addToast({
        id: 'notif-perm-' + Date.now(),
        type: 'success',
        title: 'Notifikasi Aktif',
        message: 'Anda akan diberi tahu ketika hujan terdeteksi di jemuran.',
        timestamp: Date.now(),
      });
    }
  };

  // Switch Device
  const handleSelectDevice = (deviceId: string) => {
    const newSettings = { ...settings, deviceIdActive: deviceId };
    setSettings(newSettings);
    StorageService.saveSettings(newSettings);

    const newReadings = StorageService.getReadings(deviceId);
    const newEvents = StorageService.getEvents(deviceId);
    setReadings(newReadings);
    setEvents(newEvents);
    setLatestState(null);
  };

  // Add Device
  const handleAddDevice = (newDevice: Perangkat) => {
    const updated = [...devices, newDevice];
    setDevices(updated);
    StorageService.saveDevices(updated);
    handleSelectDevice(newDevice.deviceId);
  };

  // Update/Edit Device
  const handleUpdateDevice = (updatedDevice: Perangkat) => {
    const updated = devices.map((d) =>
      d.deviceId === updatedDevice.deviceId ? updatedDevice : d
    );
    setDevices(updated);
    StorageService.saveDevices(updated);
    if (settings.deviceIdActive === updatedDevice.deviceId) {
      loadWeather(updatedDevice.lokasiAdm4);
    }
    Notifications.addToast({
      id: 'dev-update-' + Date.now(),
      type: 'success',
      title: 'Perangkat Diperbarui',
      message: `Pengaturan "${updatedDevice.nama}" berhasil disimpan.`,
      timestamp: Date.now(),
    });
  };

  // Delete Device
  const handleDeleteDevice = (deviceId: string) => {
    const dev = devices.find((d) => d.deviceId === deviceId);
    if (!window.confirm(`Yakin ingin menghapus perangkat "${dev?.nama || deviceId}"?`)) {
      return;
    }

    if (devices.length <= 1) {
      const cleanDefault: Perangkat = {
        deviceId: 'hs-' + Math.random().toString(16).slice(2, 14).padEnd(12, '0'),
        nama: 'Jemuran Baru',
        brokerUrl: 'wss://test.mosquitto.org:8081/mqtt',
        lokasiAdm4: '31.71.03.1001',
        fwVersi: '1.0.0',
        lastSeenTs: Date.now(),
        online: true,
        ambangPct: 60,
      };
      setDevices([cleanDefault]);
      StorageService.saveDevices([cleanDefault]);
      handleSelectDevice(cleanDefault.deviceId);
    } else {
      const updated = devices.filter((d) => d.deviceId !== deviceId);
      setDevices(updated);
      StorageService.saveDevices(updated);
      if (settings.deviceIdActive === deviceId) {
        handleSelectDevice(updated[0].deviceId);
      }
    }

    Notifications.addToast({
      id: 'dev-del-' + Date.now(),
      type: 'info',
      title: 'Perangkat Dihapus',
      message: `Perangkat "${dev?.nama || deviceId}" telah dihapus.`,
      timestamp: Date.now(),
    });
  };

  // Clear storage
  const handleClearStorage = () => {
    if (window.confirm('Bersihkan seluruh cache lokal dan riwayat pembacaan?')) {
      StorageService.clearAllData();
      setReadings([]);
      setEvents([]);
      window.location.reload();
    }
  };

  // Latest values for Dashboard
  const latestReading = readings[readings.length - 1];
  const currentWet = latestState?.rain?.wet ?? latestReading?.wet ?? false;
  const currentPct = latestState?.rain?.pct ?? latestReading?.pct ?? 0;
  const currentRaw = latestState?.rain?.raw ?? latestReading?.raw ?? 3800;
  const currentSinceTs = latestState?.rain?.sinceMs ?? activeDevice.lastSeenTs;

  const currentStatus: 'kering' | 'hujan' | 'offline' = isDeviceOffline
    ? 'offline'
    : currentWet
    ? 'hujan'
    : 'kering';

  return (
    <div className="min-h-screen flex flex-col bg-latar text-teks-utama selection:bg-cyan-500 selection:text-white">
      {/* Toast Alert System */}
      <ToastContainer />

      {/* Desktop Left Sidebar (>= 1024px) */}
      <Sidebar
        activeTab={activeTab}
        onChangeTab={setActiveTab}
        deviceName={activeDevice.nama}
        isOnline={!isDeviceOffline}
        isRaining={currentWet}
        brokerStatus={brokerStatus}
      />

      {/* Main Container */}
      <div className="flex-1 flex flex-col lg:pl-64">
        {/* Sticky App Header */}
        <Header
          devices={devices}
          activeDevice={activeDevice}
          onSelectDevice={handleSelectDevice}
          brokerStatus={brokerStatus}
          isOnline={!isDeviceOffline}
          isRaining={currentWet}
          theme={settings.tema}
          onToggleTheme={handleToggleTheme}
          notifPermission={notifPermission}
          onRequestNotif={handleRequestNotification}
        />

        {/* Content Area with pb-24 for mobile bottom navigation clearance */}
        <main className="flex-1 pb-24 lg:pb-12 pt-4 px-3.5 sm:px-6">
          <div className="mx-auto max-w-5xl space-y-5">
            {/* 1. Dashboard Tab */}
            {activeTab === 'dashboard' && (
              <div className="space-y-4 animate-in fade-in duration-150">
                {/* Live Status Bar */}
                <div className="flex items-center justify-between text-xs text-teks-sekunder px-1">
                  <span className="flex items-center gap-1.5 font-medium">
                    <span
                      className={`w-2 h-2 rounded-full ${
                        isBrokerDisconnected
                          ? 'bg-red-500'
                          : isDeviceOffline
                          ? 'bg-slate-400'
                          : 'bg-green-500 animate-pulse'
                      }`}
                    />
                    {isBrokerDisconnected
                      ? 'Broker terputus'
                      : isDeviceOffline
                      ? 'Perangkat offline'
                      : 'Terhubung live (MQTT)'}
                  </span>
                  <span>
                    Pembaruan: {secondsAgo < 5 ? 'Baru saja' : `${secondsAgo} dtk lalu`}
                  </span>
                </div>

                {/* Big Hero Card */}
                <HeroStatusCard
                  status={currentStatus}
                  pct={currentPct}
                  raw={currentRaw}
                  thresholdPct={activeDevice.ambangPct}
                  sinceTs={currentSinceTs}
                  lastSeenTs={lastSeenTs}
                  brokerDisconnected={isBrokerDisconnected}
                />

                {/* Quick Weather Forecast Snapshot */}
                <QuickWeatherCard
                  weatherData={weatherData}
                  isLoading={isWeatherLoading}
                  onOpenWeatherTab={() => setActiveTab('cuaca')}
                />

                {/* Live Telemetry Grid */}
                <TelemetryGrid
                  raw={currentRaw}
                  pct={currentPct}
                  tempC={latestState?.env?.tempC ?? latestReading?.suhuC ?? null}
                  hum={latestState?.env?.hum ?? latestReading?.lembapPct ?? null}
                  vbat={latestState?.power?.vbat ?? latestReading?.bateraiV ?? null}
                  batteryPct={latestState?.power?.pct ?? latestReading?.bateraiPct ?? null}
                  charging={latestState?.power?.charging ?? false}
                  rssi={latestState?.rssi ?? latestReading?.rssi ?? null}
                  uptimeS={latestState?.uptimeS ?? null}
                  fwVersion={latestState?.fw ?? activeDevice.fwVersi}
                  isStale={secondsAgo > 90}
                />
              </div>
            )}

            {/* 2. Grafik Tab */}
            {activeTab === 'grafik' && (
              <div className="space-y-4 animate-in fade-in duration-150">
                <RealtimeChart
                  readings={readings}
                  thresholdPct={activeDevice.ambangPct}
                />
              </div>
            )}

            {/* 3. Cuaca Tab (BMKG) */}
            {activeTab === 'cuaca' && (
              <div className="space-y-4 animate-in fade-in duration-150">
                <WeatherView
                  weatherData={weatherData}
                  isLoading={isWeatherLoading}
                  isStale={isWeatherStale}
                  error={weatherError}
                  currentAdm4={activeDevice.lokasiAdm4}
                  onRefresh={() => loadWeather(activeDevice.lokasiAdm4, true)}
                  onSelectAdm4={(code) => {
                    const updated = devices.map((d) =>
                      d.deviceId === activeDevice.deviceId ? { ...d, lokasiAdm4: code } : d
                    );
                    setDevices(updated);
                    StorageService.saveDevices(updated);
                    loadWeather(code, true);
                  }}
                />
              </div>
            )}

            {/* 4. Riwayat Tab */}
            {activeTab === 'riwayat' && (
              <div className="space-y-4 animate-in fade-in duration-150">
                <HistoryView
                  events={events}
                  device={activeDevice}
                  onClearEvents={() => {
                    setEvents([]);
                    StorageService.saveEvents(activeDevice.deviceId, []);
                  }}
                />
              </div>
            )}

            {/* 5. Perangkat Tab */}
            {activeTab === 'perangkat' && (
              <div className="space-y-4 animate-in fade-in duration-150">
                <DeviceView
                  devices={devices}
                  activeDevice={activeDevice}
                  onSelectDevice={handleSelectDevice}
                  onAddDevice={handleAddDevice}
                  onUpdateDevice={handleUpdateDevice}
                  onDeleteDevice={handleDeleteDevice}
                  theme={settings.tema}
                  onChangeTheme={handleChangeTheme}
                  onClearStorage={handleClearStorage}
                />
              </div>
            )}
          </div>
        </main>
      </div>

      {/* Mobile Fixed Bottom Navigation Bar (< 1024px) */}
      <BottomNav
        activeTab={activeTab}
        onChangeTab={setActiveTab}
        isRaining={currentWet}
      />
    </div>
  );
};
