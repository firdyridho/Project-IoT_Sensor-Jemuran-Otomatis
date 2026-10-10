import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  Sun,
  Umbrella,
  Cog,
  ArrowLeft,
  ArrowRight,
  Home,
  CloudSun,
  Cloud,
  Cpu,
  Hand,
  CheckCircle2,
  AlertTriangle,
  Loader2,
} from 'lucide-react';
import { Card } from '../Common/Card';
import { BackendService } from '../../services/api';
import { Notifications } from '../../services/notifications';

export type MotorWeatherCondition = 'cerah' | 'mendung' | 'hujan' | 'badai' | 'gerimis';

interface ClotheslineMotorCardProps {
  isRaining: boolean;
  condition: MotorWeatherCondition;
  backendUrl?: string;
  deviceId?: string;
  currentMotorPos?: 'extended' | 'sheltered';
  onCommandMotor?: (action: 'retract' | 'extend') => Promise<boolean>;
}

export const ClotheslineMotorCard: React.FC<ClotheslineMotorCardProps> = ({
  isRaining,
  condition,
  backendUrl,
  deviceId,
  currentMotorPos,
  onCommandMotor,
}) => {
  const isCerah = condition === 'cerah';
  const isMendung = condition === 'mendung';
  const isWeatherProtected = isRaining || condition === 'gerimis' || condition === 'hujan' || condition === 'badai';

  // State Mode: Otomatis (mengikuti sensor) vs Manual (kontrol tombol pengguna)
  const [controlMode, setControlMode] = useState<'auto' | 'manual'>('auto');
  const [manualPos, setManualPos] = useState<'extended' | 'sheltered'>(
    currentMotorPos || (isWeatherProtected ? 'sheltered' : 'extended')
  );
  const [isProcessing, setIsProcessing] = useState(false);
  const [lastActionNote, setLastActionNote] = useState<string>('');

  // Sinkronkan posisi manual saat pertama kali menerima prop dari server jika ada
  useEffect(() => {
    if (currentMotorPos && controlMode === 'auto') {
      setManualPos(currentMotorPos);
    }
  }, [currentMotorPos, controlMode]);

  // Posisi efektif jemuran berdasarkan mode aktif
  const isSheltered =
    controlMode === 'auto'
      ? isWeatherProtected
      : manualPos === 'sheltered';

  const handleManualAction = async (action: 'retract' | 'extend') => {
    if (isProcessing) return;

    // Safety check: jika mencoba bentangkan keluar saat sedang hujan lebat
    if (action === 'extend' && isRaining) {
      const confirmMove = window.confirm(
        'PERINGATAN KESELAMATAN: Sensor mendeteksi tetesan air hujan aktif di luar. Yakin ingin tetap membentangkan jemuran?'
      );
      if (!confirmMove) return;
    }

    setIsProcessing(true);
    const targetPos = action === 'retract' ? 'sheltered' : 'extended';
    const actionLabel = action === 'retract' ? 'Tarik Masuk (Teduh)' : 'Bentangkan Keluar (Jemur)';

    try {
      let success = false;
      if (onCommandMotor) {
        success = await onCommandMotor(action);
      } else if (backendUrl && deviceId) {
        success = await BackendService.commandMotor(backendUrl, deviceId, action);
      } else {
        // Simulasi fallback jika belum terhubung
        success = true;
      }

      setManualPos(targetPos);
      setLastActionNote(
        `Berhasil: ${actionLabel} dikirim ke ESP32 (${new Date().toLocaleTimeString('id-ID')})`
      );

      Notifications.addToast({
        id: 'motor-cmd-' + Date.now(),
        type: 'success',
        title: 'Perintah Motor Terkirim',
        message: `Instruksi ${actionLabel} berhasil disiarkan ke ESP32`,
        timestamp: Date.now(),
      });
    } catch (err: any) {
      Notifications.addToast({
        id: 'motor-err-' + Date.now(),
        type: 'danger',
        title: 'Gagal Menggerakkan Motor',
        message: err.message || 'Perintah gagal diproses',
        timestamp: Date.now(),
      });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <Card
      className={`relative overflow-hidden border p-4 sm:p-6 backdrop-blur-xl shadow-md transition-all duration-700 ${
        isCerah
          ? 'bg-white/95 border-slate-200/90 text-slate-900'
          : 'border-white/15 bg-gradient-to-br from-slate-900/95 via-slate-900/85 to-blue-950/70 text-white'
      }`}
    >
      {/* Ambient decorative glow */}
      {!isCerah && (
        <div
          className={`absolute -top-12 -right-12 w-48 h-48 rounded-full blur-3xl pointer-events-none transition-colors duration-700 ${
            isSheltered
              ? 'bg-emerald-500/15'
              : 'bg-slate-400/15'
          }`}
        />
      )}

      {/* Header Info & Mode Switcher */}
      <div
        className={`flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b ${
          isCerah ? 'border-slate-200' : 'border-slate-800'
        }`}
      >
        <div>
          <div className="flex items-center gap-2">
            <span
              className={`text-xs font-bold uppercase tracking-wider ${
                isCerah ? 'text-amber-700' : 'text-blue-400'
              }`}
            >
              Mekanisme Kendali IoT & Motor DC
            </span>
            <span
              className={`w-2 h-2 rounded-full ${
                controlMode === 'auto'
                  ? 'bg-emerald-500 animate-pulse'
                  : 'bg-amber-500 animate-ping'
              }`}
            />
          </div>
          <h3
            className={`text-lg sm:text-xl font-bold tracking-tight mt-0.5 font-heading ${
              isCerah ? 'text-slate-900' : 'text-white'
            }`}
          >
            Sistem Rel Jemuran & Motor DC
          </h3>
        </div>

        {/* Mode Selector (Otomatis vs Manual) & Status Badge */}
        <div className="flex flex-wrap items-center gap-2.5 self-start md:self-auto">
          {/* Segmented Mode Selector */}
          <div
            className={`inline-flex p-1 rounded-xl border backdrop-blur-md shadow-sm transition-all ${
              isCerah
                ? 'bg-slate-100 border-slate-200'
                : 'bg-slate-950/70 border-slate-800'
            }`}
          >
            <button
              type="button"
              onClick={() => setControlMode('auto')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                controlMode === 'auto'
                  ? 'bg-emerald-500 text-white shadow-xs'
                  : isCerah
                  ? 'text-slate-600 hover:text-slate-900'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Cpu className="w-3.5 h-3.5" />
              <span>Otomatis</span>
            </button>
            <button
              type="button"
              onClick={() => setControlMode('manual')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                controlMode === 'manual'
                  ? 'bg-amber-500 text-white shadow-xs'
                  : isCerah
                  ? 'text-slate-600 hover:text-slate-900'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Hand className="w-3.5 h-3.5" />
              <span>Manual</span>
            </button>
          </div>

          {/* Safety Status Badge */}
          <div
            className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border text-xs font-bold transition-all duration-500 shadow-xs ${
              isSheltered
                ? isCerah ? 'bg-emerald-50 text-emerald-800 border-emerald-300' : 'bg-emerald-400 text-slate-950 border-emerald-300'
                : isMendung
                ? isCerah ? 'bg-amber-50 text-amber-800 border-amber-300' : 'bg-amber-400 text-slate-950 border-amber-300'
                : isCerah ? 'bg-amber-50 text-amber-800 border-amber-300' : 'bg-slate-950 text-amber-300 border-slate-800'
            }`}
          >
            {isSheltered ? (
              <>
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <span>JEMURAN AMAN (TEDUH)</span>
              </>
            ) : isMendung ? (
              <>
                <Cloud className="w-4 h-4 text-amber-600" />
                <span>JEMURAN SIAGA (MENDUNG)</span>
              </>
            ) : (
              <>
                <Sun className={`w-4 h-4 ${isCerah ? 'text-amber-600' : 'text-amber-300'}`} />
                <span>SEDANG MENJEMUR (TERIK)</span>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Interactive Visual Rail & Motor Graphic */}
      <div
        className={`my-4 p-4 rounded-2xl border relative transition-colors duration-500 ${
          isCerah
            ? 'bg-white/80 border-slate-200 shadow-inner'
            : 'bg-slate-950/70 border-slate-800'
        }`}
      >
        <div
          className={`flex items-center justify-between text-xs mb-3 px-1 ${
            isCerah ? 'text-slate-900 font-bold' : 'text-slate-300'
          }`}
        >
          <span className="flex items-center gap-1.5 font-black text-emerald-600 dark:text-emerald-400">
            <Home className="w-3.5 h-3.5" /> Area Teduh / Atap
          </span>
          <span className="text-[11px] font-mono font-bold opacity-80">
            Panjang Rel: 2.5 Meter • Motor Stepper
          </span>
          <span className="flex items-center gap-1.5 font-black text-amber-600 dark:text-amber-400">
            <CloudSun className="w-3.5 h-3.5" /> Area Terbuka
          </span>
        </div>

        {/* The Track Rail */}
        <div
          className={`relative h-7 rounded-full border overflow-hidden flex items-center px-1 transition-colors duration-500 ${
            isCerah
              ? 'bg-slate-200 border-slate-300'
              : 'bg-slate-800/80 border-slate-700/60'
          }`}
        >
          {/* Track Guides */}
          <div
            className={`absolute inset-x-2 h-1 rounded-full ${
              isCerah ? 'bg-slate-400' : 'bg-slate-700'
            }`}
          />

          {/* Motorized Cart / Hanger Slider */}
          <div
            className={`relative flex items-center gap-1.5 px-3.5 py-1 rounded-full text-xs font-black shadow-lg transition-all duration-1000 transform ${
              isSheltered
                ? 'translate-x-0 bg-gradient-to-r from-emerald-500 to-teal-500 text-white ring-2 ring-emerald-300 shadow-emerald-500/20'
                : 'translate-x-[calc(100%-8px)] sm:translate-x-[calc(260px)] md:translate-x-[calc(380px)] bg-gradient-to-r from-amber-500 to-orange-500 text-slate-950 ring-2 ring-amber-300 shadow-amber-500/20'
            }`}
          >
            <Umbrella className="w-3.5 h-3.5 shrink-0" />
            <span className="whitespace-nowrap">
              {isSheltered ? 'Posisi: Bawah Atap' : 'Posisi: Luar Terbuka'}
            </span>
          </div>
        </div>

        {/* Movement Direction Indicator & Status */}
        <div
          className={`flex items-center justify-between mt-3 pt-2 text-xs border-t ${
            isCerah ? 'border-slate-200' : 'border-slate-900'
          }`}
        >
          <div className="flex items-center gap-2">
            <div
              className={`p-1.5 rounded-lg transition-all ${
                isCerah
                  ? 'bg-slate-950 text-white'
                  : 'bg-blue-500/20 text-blue-400'
              } ${isProcessing ? 'animate-spin' : ''}`}
            >
              <Cog className="w-4 h-4" />
            </div>
            <div>
              <div
                className={`text-xs font-black ${
                  isCerah ? 'text-slate-950' : 'text-slate-100'
                }`}
              >
                {isProcessing
                  ? 'Motor DC: Sedang Berputar...'
                  : isSheltered
                  ? 'Motor DC: Terkunci di Atap'
                  : 'Motor DC: Siaga di Luar (Idle)'}
              </div>
              <div
                className={`text-[10px] ${
                  isCerah ? 'text-slate-700 font-bold' : 'text-slate-300'
                }`}
              >
                Driver Stepper • {controlMode === 'auto' ? 'Mode Otomatis (Sensor)' : 'Mode Manual (Tombol)'}
              </div>
            </div>
          </div>

          <div className="text-right">
            <span
              className={`inline-flex items-center gap-1 text-[11px] font-black px-2.5 py-1 rounded-md shadow-xs ${
                isSheltered
                  ? 'bg-emerald-400 text-slate-950 border border-emerald-300'
                  : isCerah
                  ? 'bg-slate-950 text-amber-300 border border-slate-800'
                  : 'bg-amber-400 text-slate-950 border border-amber-300'
              }`}
            >
              {isSheltered ? (
                <>
                  <ArrowLeft className="w-3 h-3 animate-pulse" />
                  Di Bawah Atap
                </>
              ) : (
                <>
                  Terbentang di Luar
                  <ArrowRight className="w-3 h-3" />
                </>
              )}
            </span>
          </div>
        </div>
      </div>

      {/* Control Action Buttons (TAMPIL KHUSUS / PROMINENT PADA MODE MANUAL & INFORMASI SENSOR) */}
      <div
        className={`p-3.5 rounded-xl border transition-all duration-300 ${
          controlMode === 'manual'
            ? isCerah
              ? 'bg-amber-500/10 border-amber-500/30'
              : 'bg-amber-500/10 border-amber-500/30'
            : isCerah
            ? 'bg-white/80 border-slate-300 text-slate-900 shadow-sm'
            : 'bg-slate-900/40 border-slate-800/40'
        }`}
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <span className={`text-xs font-black uppercase tracking-wider ${isCerah ? 'text-slate-950' : 'text-white'}`}>
                {controlMode === 'manual' ? '🎮 Panel Kendali Tombol Manual' : '⚡ Otomasi Sensor Pintar Aktif'}
              </span>
              {controlMode === 'manual' ? (
                <span className="text-[10px] px-2 py-0.5 rounded bg-amber-500 text-slate-950 font-black shadow-xs">
                  KONTROL MANUAL
                </span>
              ) : (
                <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-500 text-white font-black shadow-xs">
                  AUTO SENSOR
                </span>
              )}
            </div>

            <p className={`text-xs mt-1 leading-relaxed ${isCerah ? 'text-slate-700 font-medium' : 'text-slate-300'}`}>
              {controlMode === 'manual' ? (
                'Gunakan tombol di samping untuk menarik atau membentangkan jemuran secara manual lewat instruksi MQTT.'
              ) : isWeatherProtected ? (
                <span>
                  <strong className={isCerah ? 'text-emerald-800 font-black' : 'text-emerald-300 font-bold'}>
                    Jemuran Aman!
                  </strong>{' '}
                  Sensor IoT mendeteksi kondisi cuaca basah/hujan ({condition}). Rel otomatis diamankan ke bawah atap.
                </span>
              ) : isMendung ? (
                <span>
                  <strong className={isCerah ? 'text-amber-900 font-black' : 'text-amber-300 font-bold'}>
                    Kondisi Mendung Tebal.
                  </strong>{' '}
                  Sensor IoT dalam posisi siaga aktif untuk segera menarik rel jika hujan mulai turun.
                </span>
              ) : (
                <span>
                  <strong className={isCerah ? 'text-amber-900 font-black' : 'text-amber-300 font-bold'}>
                    Kondisi Cerah Hangat.
                  </strong>{' '}
                  Rel otomatis dibentangkan di luar agar jemuran lekas kering tersengat matahari.
                </span>
              )}
            </p>
          </div>

          {/* Tombol-Tombol Kendali Manual */}
          <div className="flex items-center gap-2 self-stretch sm:self-auto shrink-0">
            <button
              type="button"
              disabled={isProcessing || (controlMode === 'manual' && isSheltered)}
              onClick={() => {
                if (controlMode === 'auto') setControlMode('manual');
                handleManualAction('retract');
              }}
              className={`flex-1 sm:flex-initial flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-black shadow-md transition-all ${
                isSheltered
                  ? 'bg-emerald-600/30 text-emerald-300 border border-emerald-500/40 cursor-not-allowed opacity-75'
                  : 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white shadow-emerald-500/20 active:scale-95'
              }`}
            >
              {isProcessing && manualPos === 'sheltered' ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Umbrella className="w-4 h-4" />
              )}
              <span>Tarik Masuk (Teduh)</span>
            </button>

            <button
              type="button"
              disabled={isProcessing || (controlMode === 'manual' && !isSheltered)}
              onClick={() => {
                if (controlMode === 'auto') setControlMode('manual');
                handleManualAction('extend');
              }}
              className={`flex-1 sm:flex-initial flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-black shadow-md transition-all ${
                !isSheltered
                  ? 'bg-amber-600/30 text-amber-300 border border-amber-500/40 cursor-not-allowed opacity-75'
                  : 'bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 shadow-amber-500/20 active:scale-95'
              }`}
            >
              {isProcessing && manualPos === 'extended' ? (
                <Loader2 className="w-4 h-4 animate-spin text-slate-950" />
              ) : (
                <Sun className="w-4 h-4" />
              )}
              <span>Bentangkan Keluar (Jemur)</span>
            </button>
          </div>
        </div>

        {/* Notifikasi feedback terakhir */}
        {lastActionNote && (
          <div className="mt-2.5 pt-2 border-t border-black/5 dark:border-white/5 flex items-center gap-1.5 text-[11px] text-emerald-600 dark:text-emerald-400 font-bold">
            <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
            <span>{lastActionNote}</span>
          </div>
        )}
      </div>

      {/* Safety Alert if Raining while Extended in Manual Mode */}
      {controlMode === 'manual' && !isSheltered && isRaining && (
        <div className="mt-3 p-3 rounded-xl bg-rose-500/20 border border-rose-500/40 text-rose-200 text-xs flex items-center gap-2.5 animate-pulse">
          <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
          <span>
            <strong>Peringatan!</strong> Sensor mendeteksi tetesan air hujan aktif, namun jemuran berada di luar karena mode manual. Segera tekan <strong>Tarik Masuk</strong> untuk mengamankan pakaian!
          </span>
        </div>
      )}
    </Card>
  );
};
