import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import {
  FileText,
  Shield,
  ArrowLeft,
  CheckCircle2,
  AlertTriangle,
  Lock,
  Database,
  Trash2,
  Download,
  Info,
  Printer,
  Sun,
  Moon,
  Laptop,
  Home,
  Clock,
  Sparkles,
} from 'lucide-react';
import { Button } from '../Common/Button';
import { Card } from '../Common/Card';
import { Badge } from '../Common/Badge';

export type LegalTab = 'terms' | 'privacy';

interface LegalViewProps {
  initialTab?: LegalTab;
  onBack?: () => void;
  theme?: 'light' | 'dark' | 'system';
  onToggleTheme?: () => void;
}

export const LegalView: React.FC<LegalViewProps> = ({
  initialTab = 'terms',
  onBack,
  theme,
  onToggleTheme,
}) => {
  const navigate = useNavigate();
  const location = useLocation();

  // Sync tab with URL path if available
  const currentTabFromPath: LegalTab = location.pathname.includes('privacy')
    ? 'privacy'
    : location.pathname.includes('terms')
    ? 'terms'
    : initialTab;

  const [activeTab, setActiveTab] = useState<LegalTab>(currentTabFromPath);

  useEffect(() => {
    setActiveTab(currentTabFromPath);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [currentTabFromPath, location.pathname]);

  const handleTabChange = (tab: LegalTab) => {
    setActiveTab(tab);
    navigate(tab === 'privacy' ? '/privacy' : '/terms');
  };

  const handleBack = () => {
    if (onBack) {
      onBack();
    } else if (typeof window !== 'undefined' && window.history.length > 1) {
      window.history.back();
    } else {
      navigate('/');
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="min-h-screen bg-latar text-teks-utama selection:bg-cyan-500 selection:text-white flex flex-col">
      {/* 1. Dedicated Top Navigation Bar */}
      <header className="sticky top-0 z-40 w-full border-b bg-white/85 dark:bg-slate-900/85 backdrop-blur-md border-garis">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-14 sm:h-16 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleBack}
              className="p-2 min-h-10 min-w-10 rounded-xl shrink-0"
              aria-label="Kembali ke halaman sebelumnya"
              title="Kembali"
            >
              <ArrowLeft className="w-5 h-5 text-teks-sekunder hover:text-teks-utama" />
            </Button>

            <Link
              to="/"
              className="flex items-center gap-2.5 min-w-0 group hover:opacity-90 transition-opacity"
            >
              <img
                src="/favicon.svg?v=2"
                alt="Rintik Logo"
                className="w-8 h-8 rounded-xl shadow-xs shrink-0"
              />
              <div className="flex flex-col min-w-0">
                <span className="font-heading font-black text-base sm:text-lg tracking-tight text-teks-utama leading-tight truncate">
                  Rintik
                </span>
                <span className="text-[10px] text-teks-sekunder font-medium hidden xs:block truncate">
                  Dokumen Legal & Privasi
                </span>
              </div>
            </Link>
          </div>

          {/* Right Action Controls */}
          <div className="flex items-center gap-2 shrink-0">
            {onToggleTheme && (
              <button
                onClick={onToggleTheme}
                className="min-h-9 min-w-9 p-2 rounded-xl text-teks-sekunder hover:text-teks-utama hover:bg-kartu-muted border border-transparent hover:border-garis transition-all flex items-center justify-center"
                aria-label="Ganti tema"
                title="Ganti Tema"
              >
                {theme === 'dark' ? (
                  <Moon className="w-4 h-4 text-cyan-400" />
                ) : theme === 'light' ? (
                  <Sun className="w-4 h-4 text-amber-500" />
                ) : (
                  <Laptop className="w-4 h-4" />
                )}
              </button>
            )}

            <Button
              variant="secondary"
              size="sm"
              onClick={handlePrint}
              className="hidden sm:inline-flex items-center gap-1.5 text-xs px-3 py-1.5 font-medium"
              title="Cetak atau Simpan Dokumen sebagai PDF"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Cetak / PDF</span>
            </Button>

            <Button
              variant="primary"
              size="sm"
              onClick={() => navigate('/')}
              className="text-xs px-3 sm:px-4 py-1.5 font-bold gap-1.5"
            >
              <Home className="w-3.5 h-3.5" />
              <span className="hidden xs:inline">Beranda</span>
            </Button>
          </div>
        </div>
      </header>

      {/* 2. Main Scrollable Document Content */}
      <main className="flex-1 w-full max-w-4xl mx-auto py-8 px-4 sm:px-6 space-y-8">
        {/* Document Header Banner */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-6 border-b border-garis">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="sukses" className="text-[10px] uppercase font-bold tracking-wider">
                Resmi v1.2
              </Badge>
              <span className="text-[11px] text-teks-sekunder flex items-center gap-1">
                <Clock className="w-3 h-3" />
                Berlaku per Oktober 2026
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black font-heading tracking-tight text-teks-utama">
              {activeTab === 'terms' ? 'Ketentuan Layanan' : 'Kebijakan Privasi'}
            </h1>
            <p className="text-xs sm:text-sm text-teks-sekunder max-w-2xl leading-relaxed">
              {activeTab === 'terms'
                ? 'Harap baca ketentuan penggunaan platform IoT Rintik dengan saksama sebelum mengoperasikan perangkat kanopi jemuran pintar.'
                : 'Transparansi penuh mengenai data telemetri, kredensial akun, serta perlindungan privasi pengguna sistem jemuran otomatis.'}
            </p>
          </div>

          {/* Interactive Document Switcher Tabs */}
          <div className="flex items-center p-1 rounded-2xl bg-kartu-muted border border-garis self-start sm:self-auto shrink-0 shadow-xs">
            <button
              type="button"
              onClick={() => handleTabChange('terms')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'terms'
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'text-teks-sekunder hover:text-teks-utama'
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Ketentuan Layanan</span>
            </button>
            <button
              type="button"
              onClick={() => handleTabChange('privacy')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'privacy'
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'text-teks-sekunder hover:text-teks-utama'
              }`}
            >
              <Shield className="w-3.5 h-3.5" />
              <span>Kebijakan Privasi</span>
            </button>
          </div>
        </div>

        {/* Highlight Note */}
        <div className="p-4 rounded-2xl bg-gradient-to-r from-blue-500/10 via-indigo-500/5 to-cyan-500/10 border border-blue-500/20 flex items-start gap-3">
          <Sparkles className="w-5 h-5 text-blue-500 shrink-0 mt-0.5" />
          <div className="text-xs space-y-1">
            <span className="font-bold text-teks-utama block">
              Prinsip Privasi & Kedaulatan Pengguna
            </span>
            <p className="text-teks-sekunder leading-relaxed">
              Rintik dibangun dengan asas desentralisasi data telemetri: sistem hanya merekam data analog sensor untuk keperluan otomasi motor kanopi, tidak melacak lokasi presisi pengguna, dan tidak pernah membagikan data kepada pihak ketiga periklanan.
            </p>
          </div>
        </div>

        {/* Document Body Sections */}
        <div className="space-y-6">
          {activeTab === 'terms' ? (
            /* ======================================================== */
            /* 1. KETENTUAN LAYANAN (TERMS OF SERVICE)                  */
            /* ======================================================== */
            <div className="space-y-6 text-teks-utama">
              <Card className="p-5 sm:p-6 space-y-4">
                <div className="flex items-center gap-2.5 text-blue-500 font-bold text-sm uppercase tracking-wider">
                  <Info className="w-4 h-4" />
                  <span>1. Ruang Lingkup Layanan</span>
                </div>
                <p className="text-xs sm:text-sm text-teks-sekunder leading-relaxed">
                  Rintik adalah platform Internet of Things (IoT) yang mengintegrasikan mikrokontroler fisik
                  ESP32, sensor kebasahan air analog (FC-37), motor servo/stepper kanopi jemuran otomatis, serta
                  data cuaca terbuka dari Badan Meteorologi, Klimatologi, dan Geofisika (BMKG) Republik Indonesia.
                  Layanan ini mencakup pemantauan telemetri cuaca realtime, otomatisasi penarikan jemuran saat hujan,
                  dan analitik prakiraan cuaca cerdas.
                </p>
              </Card>

              <Card className="p-5 sm:p-6 space-y-4 border-l-4 border-l-amber-500">
                <div className="flex items-center gap-2.5 text-amber-500 font-bold text-sm uppercase tracking-wider">
                  <AlertTriangle className="w-4 h-4" />
                  <span>2. Batas Tanggung Jawab (Disclaimer Hardware & Cuaca Ekstrem)</span>
                </div>
                <div className="text-xs sm:text-sm text-teks-sekunder space-y-3 leading-relaxed">
                  <p>
                    Sistem sensor fisik dan integrasi prakiraan cuaca BMKG disajikan sebagai <strong>alat bantu presisi</strong>.
                    Pengguna memahami dan menyetujui bahwa:
                  </p>
                  <ul className="list-disc list-inside space-y-2 pl-2 text-xs sm:text-sm">
                    <li>
                      Otomatisasi bergantung pada suplai daya listrik mikrokontroler ESP32, kestabilan jaringan WiFi/internet,
                      serta integritas mekanik motor rel jemuran di lokasi masing-masing.
                    </li>
                    <li>
                      Pengembang dan pengelola platform Rintik tidak bertanggung jawab atas kerusakan pakaian, kanopi, atau aset
                      lainnya yang diakibatkan oleh pemadaman listrik mendadak, kendala mekanis motor di luar jangkauan software,
                      atau bencana cuaca ekstrem (seperti badai topan atau angin ribut) yang melebihi kapasitas beban fisik hardware.
                    </li>
                    <li>
                      Data prakiraan BMKG merupakan estimasi permodelan numerik atmosfer yang dapat mengalami variasi mikroklimat lokal.
                    </li>
                  </ul>
                </div>
              </Card>

              <Card className="p-5 sm:p-6 space-y-4">
                <div className="flex items-center gap-2.5 text-emerald-500 font-bold text-sm uppercase tracking-wider">
                  <Lock className="w-4 h-4" />
                  <span>3. Akun Pengguna & Keamanan Perangkat</span>
                </div>
                <div className="text-xs sm:text-sm text-teks-sekunder space-y-2 leading-relaxed">
                  <p>
                    Setiap pengguna bertanggung jawab penuh untuk menjaga kerahasiaan kata sandi akun serta Device ID
                    perangkat ESP32 yang didaftarkan. Pengguna wajib segera memperbarui kata sandi apabila mencurigai
                    adanya akses tidak sah ke akun mereka.
                  </p>
                  <p>
                    Sistem menerapkan isolasi data multi-user (multi-tenant), di mana perangkat dan rekaman sensor Anda
                    hanya dapat diakses oleh akun Anda sendiri.
                  </p>
                </div>
              </Card>

              <Card className="p-5 sm:p-6 space-y-4">
                <div className="flex items-center gap-2.5 text-indigo-500 font-bold text-sm uppercase tracking-wider">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>4. Penggunaan Wajar (Fair Use Policy)</span>
                </div>
                <div className="text-xs sm:text-sm text-teks-sekunder space-y-2 leading-relaxed">
                  <p>
                    Pengguna dilarang melakukan tindakan yang dapat membebani infrastruktur server cloud, termasuk:
                  </p>
                  <ul className="list-disc list-inside space-y-1.5 pl-2 text-xs sm:text-sm">
                    <li>Spamming request HTTP atau flooding paket WebSocket / MQTT.</li>
                    <li>Manipulasi injeksi telemetri ilegal untuk merusak integritas data pengguna lain.</li>
                    <li>Upaya rekayasa balik (reverse engineering) yang melanggar hak cipta perangkat lunak.</li>
                  </ul>
                </div>
              </Card>
            </div>
          ) : (
            /* ======================================================== */
            /* 2. KEBIJAKAN PRIVASI (PRIVACY POLICY)                    */
            /* ======================================================== */
            <div className="space-y-6 text-teks-utama">
              <Card className="p-5 sm:p-6 space-y-4">
                <div className="flex items-center gap-2.5 text-blue-500 font-bold text-sm uppercase tracking-wider">
                  <Database className="w-4 h-4" />
                  <span>1. Data yang Kami Kumpulkan</span>
                </div>
                <div className="text-xs sm:text-sm text-teks-sekunder space-y-3 leading-relaxed">
                  <p>
                    Platform Rintik mengumpulkan data yang seminimal mungkin (data minimization) yang secara mutlak
                    hanya dibutuhkan untuk pengoperasian sistem jemuran otomatis:
                  </p>
                  <ul className="list-disc list-inside space-y-2 pl-2 text-xs sm:text-sm">
                    <li>
                      <strong>Kredensial Akun:</strong> Nama lengkap dan nama pengguna (username) saat pendaftaran. Kata sandi di-hash
                      menggunakan algoritma <em>Bcrypt</em> standar industri sehingga tidak dapat dibaca oleh pihak mana pun.
                    </li>
                    <li>
                      <strong>Telemetri Sensor:</strong> Nilai analog kebasahan air (ADC 0-4095), persentase basah (0-100%),
                      status basah/kering, suhu udara (°C) & kelembapan (%RH) jika sensor DHT terpasang, serta kekuatan sinyal WiFi (RSSI).
                    </li>
                    <li>
                      <strong>Preferensi Wilayah & Notifikasi:</strong> Kode administrasi wilayah BMKG (Adm4) yang Anda pilih
                      serta Chat ID Telegram jika Anda mengaktifkan pengiriman notifikasi instan.
                    </li>
                  </ul>
                </div>
              </Card>

              <Card className="p-5 sm:p-6 space-y-4">
                <div className="flex items-center gap-2.5 text-emerald-500 font-bold text-sm uppercase tracking-wider">
                  <Shield className="w-4 h-4" />
                  <span>2. Tujuan Pengolahan & Keamanan Data</span>
                </div>
                <div className="text-xs sm:text-sm text-teks-sekunder space-y-2 leading-relaxed">
                  <p>
                    Data telemetri yang dikumpulkan hanya digunakan untuk:
                  </p>
                  <ul className="list-disc list-inside space-y-1.5 pl-2 text-xs sm:text-sm">
                    <li>Menjalankan otomatisasi pengamanan motor jemuran ketika sensor mendeteksi tetesan air hujan.</li>
                    <li>Mengirimkan notifikasi darurat secara realtime ke browser atau bot Telegram Anda.</li>
                    <li>Menyajikan grafik riwayat telemetri serta kalkulasi skor rekomendasi jemur pakaian berbasis kecerdasan buatan.</li>
                  </ul>
                  <p className="pt-2 font-medium text-teks-utama">
                    Kami tidak pernah dan tidak akan pernah menjual, menyewakan, atau membagikan data pribadi maupun
                    data sensor pengguna kepada pihak ketiga atau pengiklan.
                  </p>
                </div>
              </Card>

              <Card className="p-5 sm:p-6 space-y-4">
                <div className="flex items-center gap-2.5 text-cyan-500 font-bold text-sm uppercase tracking-wider">
                  <Download className="w-4 h-4" />
                  <span>3. Hak & Kontrol Penuh Pengguna</span>
                </div>
                <div className="text-xs sm:text-sm text-teks-sekunder space-y-3 leading-relaxed">
                  <p>
                    Anda memiliki kedaulatan penuh atas data Anda di sistem Rintik:
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                    <div className="p-4 rounded-xl bg-kartu-muted border border-garis space-y-1.5">
                      <span className="font-bold text-xs text-teks-utama flex items-center gap-1.5">
                        <Download className="w-3.5 h-3.5 text-blue-500" />
                        Hak Portabilitas Data
                      </span>
                      <p className="text-[11px] text-teks-sekunder leading-relaxed">
                        Anda berhak mengunduh seluruh rekaman telemetri sensor kapan saja dalam format CSV melalui tab Grafik.
                      </p>
                    </div>

                    <div className="p-4 rounded-xl bg-kartu-muted border border-garis space-y-1.5">
                      <span className="font-bold text-xs text-teks-utama flex items-center gap-1.5">
                        <Trash2 className="w-3.5 h-3.5 text-rose-500" />
                        Hak Penghapusan Data
                      </span>
                      <p className="text-[11px] text-teks-sekunder leading-relaxed">
                        Anda berhak membersihkan riwayat telemetri, log peristiwa, maupun menghapus unit perangkat Anda sewaktu-waktu.
                      </p>
                    </div>
                  </div>
                </div>
              </Card>

              <Card className="p-5 sm:p-6 space-y-4">
                <div className="flex items-center gap-2.5 text-indigo-500 font-bold text-sm uppercase tracking-wider">
                  <Lock className="w-4 h-4" />
                  <span>4. Keamanan Multi-Tenant & Enkripsi Data</span>
                </div>
                <p className="text-xs sm:text-sm text-teks-sekunder leading-relaxed">
                  Database dan server WebSocket kami diisolasi secara ketat menggunakan query berbasis <code>user_id</code>.
                  Setiap data telemetri, token bot, dan log prediksi AI yang dikirimkan terenkripsi menggunakan protokol HTTPS
                  dan WSS (WebSocket Secure).
                </p>
              </Card>
            </div>
          )}
        </div>

        {/* Navigation Footer */}
        <div className="pt-8 border-t border-garis flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-teks-sekunder">
          <p>© 2026 Rintik • Platform IoT Sensor Jemuran Otomatis Realtime</p>
          <div className="flex items-center gap-4">
            <Link to="/terms" className="hover:text-blue-500 font-medium transition-colors">
              Ketentuan Layanan
            </Link>
            <span>•</span>
            <Link to="/privacy" className="hover:text-blue-500 font-medium transition-colors">
              Kebijakan Privasi
            </Link>
            <span>•</span>
            <Link to="/" className="hover:text-blue-500 font-medium transition-colors">
              Halaman Utama
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
};
