import React, { useState } from 'react';
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
} from 'lucide-react';
import { Button } from '../Common/Button';
import { Card } from '../Common/Card';
import { Badge } from '../Common/Badge';

export type LegalTab = 'terms' | 'privacy';

interface LegalViewProps {
  initialTab?: LegalTab;
  onBack?: () => void;
  isModal?: boolean;
}

export const LegalView: React.FC<LegalViewProps> = ({
  initialTab = 'terms',
  onBack,
  isModal = false,
}) => {
  const [activeTab, setActiveTab] = useState<LegalTab>(initialTab);

  const handleBack = () => {
    if (onBack) {
      onBack();
    } else if (typeof window !== 'undefined' && window.history.length > 1) {
      window.history.back();
    } else {
      window.location.href = '/';
    }
  };

  return (
    <div className={`w-full max-w-4xl mx-auto ${isModal ? 'p-2' : 'py-6 px-4 sm:px-6'}`}>
      {/* Top Header & Navigation */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-garis">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleBack}
            className="p-2 min-h-10 min-w-10 rounded-xl"
            aria-label="Kembali"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-black font-heading tracking-tight text-teks-utama">
                Dokumen Legal Rintik
              </h1>
              <Badge variant="sukses" className="text-[10px]">
                v1.2 (Okt 2026)
              </Badge>
            </div>
            <p className="text-xs text-teks-sekunder mt-0.5">
              Transparansi hak pengguna, keamanan data telemetri, dan ketentuan operasional sistem.
            </p>
          </div>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center p-1 rounded-2xl bg-kartu-muted border border-garis self-start sm:self-auto">
          <button
            onClick={() => setActiveTab('terms')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'terms'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-teks-sekunder hover:text-teks-utama'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Ketentuan Layanan</span>
          </button>
          <button
            onClick={() => setActiveTab('privacy')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'privacy'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-teks-sekunder hover:text-teks-utama'
            }`}
          >
            <Shield className="w-3.5 h-3.5" />
            <span>Kebijakan Privasi</span>
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="pt-6 space-y-6">
        {activeTab === 'terms' ? (
          /* ======================================================== */
          /* 1. KETENTUAN LAYANAN (TERMS OF SERVICE)                  */
          /* ======================================================== */
          <div className="space-y-6 text-teks-utama">
            <Card className="p-4 sm:p-6 space-y-4">
              <div className="flex items-center gap-2 text-blue-500 font-bold text-sm uppercase tracking-wider">
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

            <Card className="p-4 sm:p-6 space-y-4 border-l-4 border-l-amber-500">
              <div className="flex items-center gap-2 text-amber-500 font-bold text-sm uppercase tracking-wider">
                <AlertTriangle className="w-4 h-4" />
                <span>2. Batas Tanggung Jawab (Disclaimer)</span>
              </div>
              <div className="text-xs sm:text-sm text-teks-sekunder space-y-3 leading-relaxed">
                <p>
                  Sistem sensor fisik dan integrasi prakiraan cuaca BMKG disajikan sebagai <strong>alat bantu presisi</strong>.
                  Pengguna memahami dan menyetujui bahwa:
                </p>
                <ul className="list-disc list-inside space-y-1.5 pl-2 text-xs">
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

            <Card className="p-4 sm:p-6 space-y-4">
              <div className="flex items-center gap-2 text-emerald-500 font-bold text-sm uppercase tracking-wider">
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

            <Card className="p-4 sm:p-6 space-y-4">
              <div className="flex items-center gap-2 text-indigo-500 font-bold text-sm uppercase tracking-wider">
                <CheckCircle2 className="w-4 h-4" />
                <span>4. Penggunaan Wajar (Fair Use Policy)</span>
              </div>
              <div className="text-xs sm:text-sm text-teks-sekunder space-y-2 leading-relaxed">
                <p>
                  Pengguna dilarang melakukan tindakan yang dapat membebani infrastruktur server cloud, termasuk:
                </p>
                <ul className="list-disc list-inside space-y-1 pl-2 text-xs">
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
            <Card className="p-4 sm:p-6 space-y-4">
              <div className="flex items-center gap-2 text-blue-500 font-bold text-sm uppercase tracking-wider">
                <Database className="w-4 h-4" />
                <span>1. Data yang Kami Kumpulkan</span>
              </div>
              <div className="text-xs sm:text-sm text-teks-sekunder space-y-3 leading-relaxed">
                <p>
                  Platform Rintik mengumpulkan data yang seminimal mungkin (data minimization) yang secara mutlak
                  hanya dibutuhkan untuk pengoperasian sistem jemuran otomatis:
                </p>
                <ul className="list-disc list-inside space-y-1.5 pl-2 text-xs">
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
                    serta token endpoint Web Push subscription browser jika Anda mengaktifkan push notification.
                  </li>
                </ul>
              </div>
            </Card>

            <Card className="p-4 sm:p-6 space-y-4">
              <div className="flex items-center gap-2 text-emerald-500 font-bold text-sm uppercase tracking-wider">
                <Shield className="w-4 h-4" />
                <span>2. Tujuan Pengolahan & Keamanan Data</span>
              </div>
              <div className="text-xs sm:text-sm text-teks-sekunder space-y-2 leading-relaxed">
                <p>
                  Data telemetri yang dikumpulkan hanya digunakan untuk:
                </p>
                <ul className="list-disc list-inside space-y-1.5 pl-2 text-xs">
                  <li>Menjalankan otomatisasi pengamanan motor jemuran ketika sensor mendeteksi tetesan air hujan.</li>
                  <li>Mengirimkan notifikasi darurat secara realtime ke browser atau perangkat seluler Anda.</li>
                  <li>Menyajikan grafik riwayat telemetri serta kalkulasi skor rekomendasi jemur pakaian berbasis kecerdasan buatan.</li>
                </ul>
                <p className="pt-2 font-medium text-teks-utama">
                  Kami tidak pernah dan tidak akan pernah menjual, menyewakan, atau membagikan data pribadi maupun
                  data sensor pengguna kepada pihak ketiga atau pengiklan.
                </p>
              </div>
            </Card>

            <Card className="p-4 sm:p-6 space-y-4">
              <div className="flex items-center gap-2 text-cyan-500 font-bold text-sm uppercase tracking-wider">
                <Download className="w-4 h-4" />
                <span>3. Hak & Kontrol Penuh Pengguna</span>
              </div>
              <div className="text-xs sm:text-sm text-teks-sekunder space-y-2 leading-relaxed">
                <p>
                  Anda memiliki kedaulatan penuh atas data Anda di sistem Rintik:
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                  <div className="p-3 rounded-xl bg-kartu-muted border border-garis space-y-1">
                    <span className="font-bold text-xs text-teks-utama flex items-center gap-1.5">
                      <Download className="w-3.5 h-3.5 text-blue-500" />
                      Hak Portabilitas Data
                    </span>
                    <p className="text-[11px] text-teks-sekunder">
                      Anda berhak mengunduh seluruh rekaman telemetri sensor kapan saja dalam format CSV melalui tab Grafik.
                    </p>
                  </div>

                  <div className="p-3 rounded-xl bg-kartu-muted border border-garis space-y-1">
                    <span className="font-bold text-xs text-teks-utama flex items-center gap-1.5">
                      <Trash2 className="w-3.5 h-3.5 text-rose-500" />
                      Hak Penghapusan Data
                    </span>
                    <p className="text-[11px] text-teks-sekunder">
                      Anda berhak membersihkan riwayat telemetri, log peristiwa, maupun menghapus unit perangkat Anda sewaktu-waktu.
                    </p>
                  </div>
                </div>
              </div>
            </Card>

            <Card className="p-4 sm:p-6 space-y-4">
              <div className="flex items-center gap-2 text-indigo-500 font-bold text-sm uppercase tracking-wider">
                <Lock className="w-4 h-4" />
                <span>4. Keamanan Multi-Tenant</span>
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

      {/* Footer Contact Note */}
      <div className="pt-8 text-center text-xs text-teks-sekunder space-y-1">
        <p>Ada pertanyaan mengenai privasi atau ketentuan layanan?</p>
        <p className="font-medium text-teks-utama">
          Tim Pengembang Rintik IoT • Kontak dukungan via GitHub Repository
        </p>
      </div>
    </div>
  );
};
