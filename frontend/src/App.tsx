import React, { useState, useEffect, useRef, useTransition } from 'react';
import { NavTab, BottomNav } from './components/Layout/BottomNav';
import { Sidebar } from './components/Layout/Sidebar';
import { Header } from './components/Layout/Header';
import { ToastContainer } from './components/Layout/ToastContainer';
import { HeroStatusCard } from './components/Dashboard/HeroStatusCard';
import { TelemetryGrid } from './components/Dashboard/TelemetryGrid';
import { QuickWeatherCard } from './components/Dashboard/QuickWeatherCard';
import { ConditionChipBar, SimulationMode, WeatherCondition } from './components/Dashboard/ConditionChipBar';
import { RaindropGlassCanvas } from './components/Dashboard/RaindropGlassCanvas';
import { SoftDriftingClouds } from './components/Dashboard/SoftDriftingClouds';
import { LightningFlash } from './components/Dashboard/LightningFlash';
import { ClotheslineMotorCard } from './components/Dashboard/ClotheslineMotorCard';
import { AIPredictionCard } from './components/Dashboard/AIPredictionCard';
import { DryingAdviceCard } from './components/Dashboard/DryingAdviceCard';
import { weatherAudio } from './services/weatherAudio';
import { RealtimeChart } from './components/Grafik/RealtimeChart';
import { WeatherView } from './components/Cuaca/WeatherView';
import { HistoryView } from './components/Riwayat/HistoryView';
import { DeviceView } from './components/Perangkat/DeviceView';
import { ConfirmModal } from './components/Common/ConfirmModal';
import { AuthPage } from './components/Auth/AuthPage';
import { LandingPage } from './components/Landing/LandingPage';
import { AuthService } from './services/auth';
import { AuthSession } from './types/auth';

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
  // 0. Auth Session State ("Ingat Saya" & User Data Isolation)
  const [session, setSession] = useState<AuthSession | null>(() => AuthService.getSession());
  const [authView, setAuthView] = useState<'landing' | 'login' | 'register'>('landing');

  // 1. Core State
  const [activeTab, setActiveTab] = useState<NavTab>('dashboard');
  const [devices, setDevices] = useState<Perangkat[]>(() =>
    StorageService.getDevices(session?.user?.id)
  );
  const [settings, setSettings] = useState(() => StorageService.getSettings());

  // Reload devices when user switches or logs in
  useEffect(() => {
    if (session?.user?.id) {
      const userDevices = StorageService.getDevices(session.user.id);
      setDevices(userDevices);
    }
  }, [session?.user?.id]);

  const activeDevice =
    devices.find((d) => d.deviceId === settings.deviceIdActive) ||
    devices[0] || {
      deviceId: 'hs-8f3a1c9d2b70',
      nama: 'Jemuran Utama',
      brokerUrl: 'wss://43-133-136-149.sslip.io/ws',
      lokasiAdm4: '31.71.03.1001',
      fwVersi: '1.0.0',
      lastSeenTs: Date.now(),
      online: true,
      ambangPct: 60,
    };

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

  // 4. Notifications & Modals State
  const [notifPermission, setNotifPermission] = useState<NotificationPermission>(() =>
    Notifications.getPermission()
  );
  const [deviceToDelete, setDeviceToDelete] = useState<Perangkat | null>(null);
  const [showClearStorageModal, setShowClearStorageModal] = useState<boolean>(false);

  // Debounced storage save reference
  const debouncedReadingsRef = useRef<number | null>(null);

  // Track previous wet state for transitions
  const prevWetRef = useRef<boolean>(false);

  // ---------------------------------------------------------------------------
  // Theme Manager (Dashboard selalu menggunakan tema atmosferik gelap mandiri)
  // ---------------------------------------------------------------------------
  useEffect(() => {
    const applyTheme = () => {
      // Khusus Dashboard, mode terang tidak berlaku agar atmosfer cuaca dan tetesan air kaca tetap optimal
      if (activeTab === 'dashboard') {
        document.documentElement.dataset.tema = 'dark';
        document.documentElement.classList.add('dark');
        return;
      }

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
      if (settings.tema === 'system' && activeTab !== 'dashboard') applyTheme();
    };
    media.addEventListener('change', listener);
    return () => media.removeEventListener('change', listener);
  }, [settings.tema, activeTab]);

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
  // Auth Handlers (Login, Logout, Session Persistence)
  // ---------------------------------------------------------------------------
  const handleAuthSuccess = (newSession: AuthSession) => {
    setSession(newSession);
    const userDevices = StorageService.getDevices(newSession.user.id);
    setDevices(userDevices);
    Notifications.addToast({
      id: 'auth-success-' + Date.now(),
      type: 'success',
      title: 'Selamat Datang!',
      message: `Berhasil masuk sebagai ${newSession.user.name}. Data perangkat Anda siap digunakan.`,
      timestamp: Date.now(),
    });
  };

  const handleLogout = () => {
    AuthService.clearSession();
    setSession(null);
    setAuthView('login');
    Notifications.addToast({
      id: 'auth-logout-' + Date.now(),
      type: 'info',
      title: 'Telah Keluar',
      message: 'Sesi Anda telah diakhiri. Silakan masuk kembali kapan saja.',
      timestamp: Date.now(),
    });
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
  // Sync Devices from Golang Backend (MySQL Database on Tencent VPS)
  // ---------------------------------------------------------------------------
  useEffect(() => {
    const backendUrl = settings.backendUrl;
    if (!backendUrl || !session) return;

    let isMounted = true;
    const syncDevices = async () => {
      try {
        const remoteDevices = await BackendService.getDevices(
          backendUrl,
          session.user.id,
          session.token
        );
        if (!isMounted) return;

        if (remoteDevices && remoteDevices.length > 0) {
          // Check if user has local devices not yet saved to backend
          const currentLocal = StorageService.getDevices(session.user.id);
          const missingOnRemote = currentLocal.filter(
            (localDev) => !remoteDevices.some((r) => r.deviceId === localDev.deviceId)
          );

          if (missingOnRemote.length > 0) {
            for (const missingDev of missingOnRemote) {
              await BackendService.createDevice(
                backendUrl,
                missingDev,
                session.user.id,
                session.token
              );
            }
            const updatedRemote = await BackendService.getDevices(
              backendUrl,
              session.user.id,
              session.token
            );
            if (isMounted && updatedRemote && updatedRemote.length > 0) {
              setDevices(updatedRemote);
              StorageService.saveDevices(updatedRemote, session.user.id);
              return;
            }
          }

          setDevices(remoteDevices);
          StorageService.saveDevices(remoteDevices, session.user.id);

          // Ensure active device exists
          setSettings((prevSettings) => {
            if (!remoteDevices.some((d) => d.deviceId === prevSettings.deviceIdActive)) {
              const updatedSettings = { ...prevSettings, deviceIdActive: remoteDevices[0].deviceId };
              StorageService.saveSettings(updatedSettings);
              return updatedSettings;
            }
            return prevSettings;
          });
        } else {
          // If remote database is empty for this user, push existing local devices to backend
          const localDevices = StorageService.getDevices(session.user.id);
          for (const dev of localDevices) {
            await BackendService.createDevice(
              backendUrl,
              dev,
              session.user.id,
              session.token
            );
          }
        }
      } catch (err) {
        console.warn('Gagal sinkronisasi daftar perangkat dari backend:', err);
      }
    };

    syncDevices();

    // Re-sync on window focus (e.g. when user switches between laptop and phone)
    const handleFocus = () => {
      syncDevices();
    };
    window.addEventListener('focus', handleFocus);
    return () => {
      isMounted = false;
      window.removeEventListener('focus', handleFocus);
    };
  }, [settings.backendUrl, session?.user?.id, session?.token]);

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
        onForecastAlert: (alert) => {
          Notifications.addToast({
            id: 'forecast-alert-' + Date.now(),
            type: 'warning',
            title: '⚠️ Peringatan Hujan Mendadak (AI)',
            message: `${alert.message} (${alert.probabilityPct}% potensi hujan dalam ~${alert.estimatedMin} menit)`,
            timestamp: Date.now(),
          });
        },
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
    StorageService.saveDevices(updated, session?.user?.id);
    handleSelectDevice(newDevice.deviceId);

    Notifications.addToast({
      id: 'dev-add-' + Date.now(),
      type: 'success',
      title: 'Perangkat Berhasil Ditambahkan',
      message: `Perangkat "${newDevice.nama}" (${newDevice.deviceId}) berhasil didaftarkan dan disinkronkan ke database MySQL VPS.`,
      timestamp: Date.now(),
    });

    // Sync to MySQL Database on VPS
    if (settings.backendUrl) {
      BackendService.createDevice(
        settings.backendUrl,
        newDevice,
        session?.user?.id,
        session?.token
      ).catch((err) => {
        console.warn('Gagal menyimpan perangkat ke database backend:', err);
      });
    }
  };

  // Update/Edit Device
  const handleUpdateDevice = (updatedDevice: Perangkat) => {
    const updated = devices.map((d) =>
      d.deviceId === updatedDevice.deviceId ? updatedDevice : d
    );
    setDevices(updated);
    StorageService.saveDevices(updated, session?.user?.id);
    if (settings.deviceIdActive === updatedDevice.deviceId) {
      loadWeather(updatedDevice.lokasiAdm4);
    }
    Notifications.addToast({
      id: 'dev-update-' + Date.now(),
      type: 'success',
      title: 'Perubahan Berhasil Disimpan',
      message: `Pengaturan "${updatedDevice.nama}" berhasil diperbarui dan disinkronkan ke database MySQL VPS.`,
      timestamp: Date.now(),
    });

    // Sync to MySQL Database on VPS
    if (settings.backendUrl) {
      BackendService.updateDevice(settings.backendUrl, updatedDevice).catch((err) => {
        console.warn('Gagal memperbarui perangkat di database backend:', err);
      });
    }
  };

  // Request Delete Device (Opens custom modal instead of window.confirm)
  const handleDeleteDevice = (deviceId: string) => {
    const dev = devices.find((d) => d.deviceId === deviceId);
    if (dev) {
      setDeviceToDelete(dev);
    }
  };

  // Confirm Delete Device from Modal
  const handleConfirmDelete = () => {
    if (!deviceToDelete) return;
    const deviceId = deviceToDelete.deviceId;
    const devName = deviceToDelete.nama;

    if (devices.length <= 1) {
      const cleanDefault: Perangkat = {
        deviceId: 'hs-' + Math.random().toString(16).slice(2, 14).padEnd(12, '0'),
        nama: 'Jemuran Utama',
        brokerUrl: 'wss://43-133-136-149.sslip.io/ws',
        lokasiAdm4: '31.71.03.1001',
        fwVersi: '1.0.0',
        lastSeenTs: Date.now(),
        online: true,
        ambangPct: 60,
      };
      setDevices([cleanDefault]);
      StorageService.saveDevices([cleanDefault], session?.user?.id);
      handleSelectDevice(cleanDefault.deviceId);
      if (settings.backendUrl) {
        BackendService.createDevice(
          settings.backendUrl,
          cleanDefault,
          session?.user?.id,
          session?.token
        ).catch(() => {});
      }
    } else {
      const updated = devices.filter((d) => d.deviceId !== deviceId);
      setDevices(updated);
      StorageService.saveDevices(updated, session?.user?.id);
      if (settings.deviceIdActive === deviceId) {
        handleSelectDevice(updated[0].deviceId);
      }
    }

    // Sync deletion to MySQL Database on VPS
    if (settings.backendUrl) {
      BackendService.deleteDevice(settings.backendUrl, deviceId).catch((err) => {
        console.warn('Gagal menghapus perangkat di database backend:', err);
      });
    }

    Notifications.addToast({
      id: 'dev-del-' + Date.now(),
      type: 'info',
      title: 'Perangkat Dihapus',
      message: `Perangkat "${devName}" berhasil dihapus dari sistem dan database MySQL VPS.`,
      timestamp: Date.now(),
    });

    setDeviceToDelete(null);
  };

  // Request Clear Storage (Opens custom modal instead of window.confirm)
  const handleClearStorage = () => {
    setShowClearStorageModal(true);
  };

  // Confirm Clear Storage from Modal
  const handleConfirmClearStorage = () => {
    StorageService.clearAllData();
    setReadings([]);
    setEvents([]);
    setShowClearStorageModal(false);
    Notifications.addToast({
      id: 'clear-storage-' + Date.now(),
      type: 'success',
      title: 'Cache Lokal Dibersihkan',
      message: 'Seluruh riwayat lokal telah direset. Memuat ulang halaman...',
      timestamp: Date.now(),
    });
    setTimeout(() => {
      window.location.reload();
    }, 600);
  };

  // Simulation & Audio Mode for Dashboard Demo
  const [simMode, setSimMode] = useState<SimulationMode>('live');
  const [isAudioMuted, setIsAudioMuted] = useState<boolean>(true);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState<boolean>(false);

  // Latest values for Dashboard
  const latestReading = readings[readings.length - 1];
  const currentWet = latestState?.rain?.wet ?? latestReading?.wet ?? false;
  const currentPct = latestState?.rain?.pct ?? latestReading?.pct ?? 0;
  const currentRaw = latestState?.rain?.raw ?? latestReading?.raw ?? 3800;
  const currentSinceTs = latestState?.rain?.sinceMs ?? activeDevice.lastSeenTs;

  // Real weather condition inferred from IoT hardware sensor
  const realCondition: WeatherCondition = !currentWet
    ? 'cerah'
    : currentPct > 80
    ? 'badai'
    : currentPct > 45
    ? 'hujan'
    : 'gerimis';

  // Effective condition (either simulated demo or real IoT)
  const activeCondition: WeatherCondition = simMode === 'live' ? realCondition : simMode;

  const effectiveWet = simMode === 'live' ? currentWet : activeCondition !== 'cerah';
  const effectivePct = simMode === 'live'
    ? currentPct
    : activeCondition === 'cerah'
    ? 5
    : activeCondition === 'gerimis'
    ? 35
    : activeCondition === 'hujan'
    ? 78
    : 95;
  const effectiveRaw = simMode === 'live'
    ? currentRaw
    : activeCondition === 'cerah'
    ? 3940
    : activeCondition === 'gerimis'
    ? 2680
    : activeCondition === 'hujan'
    ? 1380
    : 610;

  const currentStatus: 'kering' | 'hujan' | 'offline' = isDeviceOffline && simMode === 'live'
    ? 'offline'
    : effectiveWet
    ? 'hujan'
    : 'kering';

  const handleToggleAudio = () => {
    const next = !isAudioMuted;
    setIsAudioMuted(next);
    weatherAudio.setMuted(next);
    if (!next) {
      weatherAudio.play(activeCondition);
    }
  };

  const handleChangeSimMode = (mode: SimulationMode) => {
    setSimMode(mode);
    const nextCondition = mode === 'live' ? realCondition : mode;
    if (!isAudioMuted) {
      weatherAudio.play(nextCondition);
    }
  };

  if (!session) {
    if (authView === 'login' || authView === 'register') {
      return (
        <div className="min-h-screen bg-latar text-teks-utama selection:bg-cyan-500 selection:text-white">
          <ToastContainer />
          <AuthPage
            initialMode={authView}
            backendUrl={settings.backendUrl || ''}
            onSuccess={handleAuthSuccess}
            onBackToLanding={() => setAuthView('landing')}
            theme={settings.tema}
            onToggleTheme={handleToggleTheme}
          />
        </div>
      );
    }

    return (
      <div className="min-h-screen bg-latar text-teks-utama selection:bg-cyan-500 selection:text-white">
        <ToastContainer />
        <LandingPage
          onGoToAuth={(mode) => setAuthView(mode)}
          onQuickDemo={() => {
            const demoSession = AuthService.demoLogin(true);
            handleAuthSuccess(demoSession);
          }}
          theme={settings.tema}
          onToggleTheme={handleToggleTheme}
        />
      </div>
    );
  }

  return (
    <div
      className={`min-h-screen flex flex-col relative transition-colors duration-1000 ${
        activeTab === 'dashboard' ? `weather-bg-${activeCondition}` : 'bg-latar'
      } text-teks-utama selection:bg-cyan-500 selection:text-white overflow-x-hidden`}
    >
      {/* Bottom atmospheric soft blue gradient */}
      <div className="pointer-events-none fixed inset-x-0 bottom-0 h-96 bottom-blue-gradient z-0" aria-hidden="true" />

      {/* Realistic Soft Drifting Clouds for every weather condition */}
      {activeTab === 'dashboard' && <SoftDriftingClouds condition={activeCondition} />}

      {/* Realistic Water Drops Dripping on Glass Window Pane */}
      {activeTab === 'dashboard' && <RaindropGlassCanvas condition={activeCondition} />}

      {/* Badai Lightning / Halilintar Screen Flash & Electric Bolts */}
      {activeTab === 'dashboard' && <LightningFlash active={activeCondition === 'badai'} />}

      {/* Toast Alert System */}
      <ToastContainer />

      {/* Sidebar: Desktop left column + Mobile Hamburger Drawer */}
      <Sidebar
        activeTab={activeTab}
        onChangeTab={setActiveTab}
        deviceName={activeDevice.nama}
        isOnline={!isDeviceOffline}
        isRaining={effectiveWet}
        brokerStatus={brokerStatus}
        isOpenMobile={isMobileMenuOpen}
        onCloseMobile={() => setIsMobileMenuOpen(false)}
      />

      {/* Main Container */}
      <div className="flex-1 flex flex-col lg:pl-64 relative z-10">
        {/* Sticky App Header */}
        <Header
          devices={devices}
          activeDevice={activeDevice}
          onSelectDevice={handleSelectDevice}
          brokerStatus={brokerStatus}
          isOnline={!isDeviceOffline}
          isRaining={effectiveWet}
          theme={settings.tema}
          onToggleTheme={handleToggleTheme}
          notifPermission={notifPermission}
          onRequestNotif={handleRequestNotification}
          user={session.user}
          onLogout={handleLogout}
          onOpenMobileMenu={() => setIsMobileMenuOpen(true)}
          isDashboard={activeTab === 'dashboard'}
        />

        {/* Content Area with pb-24 for mobile bottom navigation clearance */}
        <main className="flex-1 pb-24 lg:pb-12 pt-4 px-3.5 sm:px-6">
          <div className="mx-auto max-w-5xl space-y-5">
            {/* 1. Dashboard Tab */}
            {activeTab === 'dashboard' && (
              <div className="space-y-4 animate-in fade-in duration-150">
                {/* Condition Chip Bar for Demonstration / Testing */}
                <ConditionChipBar
                  currentMode={simMode}
                  onChangeMode={handleChangeSimMode}
                  isAudioMuted={isAudioMuted}
                  onToggleAudio={handleToggleAudio}
                />

                {/* Live Status Bar */}
                <div className="flex items-center justify-between text-xs text-teks-sekunder px-1">
                  <span className="flex items-center gap-1.5 font-medium">
                    <span
                      className={`w-2 h-2 rounded-full ${
                        isBrokerDisconnected && simMode === 'live'
                          ? 'bg-red-500'
                          : isDeviceOffline && simMode === 'live'
                          ? 'bg-slate-400'
                          : 'bg-green-500 animate-pulse'
                      }`}
                    />
                    {simMode !== 'live'
                      ? `Simulasi Demo: Cuaca ${activeCondition.toUpperCase()}`
                      : isBrokerDisconnected
                      ? 'Server terputus'
                      : isDeviceOffline
                      ? 'Perangkat offline'
                      : 'Server Cloud Realtime (WebSocket)'}
                  </span>
                  <span>
                    Pembaruan: {secondsAgo < 5 ? 'Baru saja' : `${secondsAgo} dtk lalu`}
                  </span>
                </div>

                {/* Big Hero Card with 3D Orb and Weather Scene */}
                <HeroStatusCard
                  status={currentStatus}
                  pct={effectivePct}
                  raw={effectiveRaw}
                  thresholdPct={activeDevice.ambangPct}
                  sinceTs={currentSinceTs}
                  lastSeenTs={lastSeenTs}
                  brokerDisconnected={isBrokerDisconnected && simMode === 'live'}
                  weatherCondition={activeCondition}
                />

                {/* Clothesline & DC Motor Safety Automation Card */}
                <ClotheslineMotorCard
                  isRaining={effectiveWet}
                  condition={activeCondition}
                />

                {/* AI Rain Prediction Card (REQ-FE-01 / FE-05) */}
                <AIPredictionCard
                  backendUrl={settings.backendUrl}
                  deviceId={activeDevice.deviceId}
                  currentWet={effectiveWet}
                />

                {/* AI Smart Drying Advice Card (REQ-FE-02 / FE-06) */}
                <DryingAdviceCard
                  backendUrl={settings.backendUrl}
                  deviceId={activeDevice.deviceId}
                  currentWet={effectiveWet}
                />

                {/* Quick Weather Forecast Snapshot */}
                <QuickWeatherCard
                  weatherData={weatherData}
                  isLoading={isWeatherLoading}
                  onOpenWeatherTab={() => setActiveTab('cuaca')}
                />

                {/* Live Telemetry Grid */}
                <TelemetryGrid
                  raw={effectiveRaw}
                  pct={effectivePct}
                  tempC={latestState?.env?.tempC ?? latestReading?.suhuC ?? null}
                  hum={latestState?.env?.hum ?? latestReading?.lembapPct ?? null}
                  vbat={latestState?.power?.vbat ?? latestReading?.bateraiV ?? null}
                  batteryPct={latestState?.power?.pct ?? latestReading?.bateraiPct ?? null}
                  charging={latestState?.power?.charging ?? false}
                  rssi={latestState?.rssi ?? latestReading?.rssi ?? null}
                  uptimeS={latestState?.uptimeS ?? null}
                  fwVersion={latestState?.fw ?? activeDevice.fwVersi}
                  isStale={secondsAgo > 90 && simMode === 'live'}
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

      {/* Custom Confirmation Modals */}
      <ConfirmModal
        isOpen={!!deviceToDelete}
        title="Hapus Perangkat?"
        message={`Apakah Anda yakin ingin menghapus perangkat "${deviceToDelete?.nama}" (${deviceToDelete?.deviceId})? Seluruh data riwayat dan telemetri terkait akan dihapus secara permanen dari database MySQL VPS.`}
        confirmLabel="Ya, Hapus Perangkat"
        cancelLabel="Batal"
        variant="danger"
        onConfirm={handleConfirmDelete}
        onCancel={() => setDeviceToDelete(null)}
      />

      <ConfirmModal
        isOpen={showClearStorageModal}
        title="Bersihkan Cache & Reset Data?"
        message="Semua cache telemetri offline dan preferensi browser lokal akan dibersihkan. Halaman akan dimuat ulang secara otomatis."
        confirmLabel="Ya, Bersihkan Cache"
        cancelLabel="Batal"
        variant="warning"
        onConfirm={handleConfirmClearStorage}
        onCancel={() => setShowClearStorageModal(false)}
      />
    </div>
  );
};
