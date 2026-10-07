import React, { useState } from 'react';
import { Bike, KeyRound, UserCheck, ShieldAlert, ArrowRight, Eye, EyeOff, CheckCircle2 } from 'lucide-react';
import { DUMMY_ACCOUNTS, UserAccount } from '../data/campusData';
import rectorateImg from '../assets/images/campus_station_rectorate_1791384986707.jpg';

interface LoginScreenProps {
  onLoginSuccess: (account: UserAccount) => void;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({ onLoginSuccess }) => {
  const [identifier, setIdentifier] = useState('G1A026040');
  const [password, setPassword] = useState('12345678');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    const normalizedKey = identifier.trim().toUpperCase();
    const record = DUMMY_ACCOUNTS[normalizedKey];

    if (!record || record.password !== password) {
      setErrorMsg(
        'NPM/Username atau kata sandi tidak sesuai. Gunakan G1A026040 / 12345678 atau admin / 12345678.'
      );
      return;
    }

    onLoginSuccess(record.user);
  };

  const fillCredential = (id: string, pass: string) => {
    setIdentifier(id);
    setPassword(pass);
    setErrorMsg(null);
  };

  return (
    <div className="min-h-screen bg-[#FAF8F4] text-[#1C1B19] flex flex-col justify-between">
      {/* Minimal Top Brand Header */}
      <header className="border-b border-[#E8E5DF] bg-[#FAF8F4]">
        <div className="max-w-[1120px] mx-auto px-4 sm:px-8 h-16 flex items-center justify-between">
          <span className="text-[22px] font-bold tracking-[-0.01em] text-[#1a2469]">
            Goesin
          </span>
          <span className="text-[13px] font-label text-[#63625D]">
            Portal Sivitas & Pengelola Kampus
          </span>
        </div>
      </header>

      {/* Main Split Login Content */}
      <main className="flex-1 flex items-center justify-center px-4 sm:px-8 py-8">
        <div className="max-w-[1000px] w-full grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          {/* Left Column: Editorial Campus Visual & Value Prop */}
          <div className="lg:col-span-6 space-y-5">
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-[13px] font-label text-[#63625D]">
                <span>Mobilitas Kampus Terpadu</span>
                <span>·</span>
                <span>Bebas Emisi</span>
              </div>
              <h1 className="text-[28px] leading-[36px] sm:text-[36px] sm:leading-[44px] font-bold text-[#1C1B19] tracking-[-0.01em] [text-wrap:balance]">
                Masuk dengan akun SSO kampus untuk meminjam sepeda.
              </h1>
              <p className="text-[16px] leading-[24px] text-[#63625D]">
                Nikmati kuota gratis 60 menit setiap hari kuliah untuk berpindah antar gedung perkuliahan, perpustakaan, dan laboratorium.
              </p>
            </div>

            <div className="relative h-56 sm:h-64 rounded-[16px] overflow-hidden border border-[#E8E5DF] shadow-warm-raised">
              <img
                src={rectorateImg}
                alt="Stasiun Sepeda Kampus Goesin"
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
              <div className="absolute bottom-4 left-4 right-4 text-white space-y-0.5">
                <p className="text-[12px] font-label text-white/80">
                  Terintegrasi Barcode & QR Scanner
                </p>
                <p className="text-[15px] font-semibold">
                  Pindai kode batang pada kunci sepeda atau produk untuk membuka dock secara instan.
                </p>
              </div>
            </div>
          </div>

          {/* Right Column: Login Card */}
          <div className="lg:col-span-6 bg-white border border-[#E8E5DF] rounded-[16px] p-6 sm:p-8 shadow-warm-raised space-y-6">
            <div className="space-y-1 border-b border-[#E8E5DF] pb-4">
              <h2 className="text-[22px] leading-[28px] font-bold text-[#1C1B19]">
                Masuk Akun Goesin
              </h2>
              <p className="text-[14px] text-[#63625D]">
                Pilih akun demo di bawah atau ketik NPM / Username Anda.
              </p>
            </div>

            {/* Quick One-Tap Credential Fillers */}
            <div className="space-y-2">
              <span className="block text-[12px] font-label font-medium text-[#63625D]">
                Isi Cepat Akun Demo (Klik untuk memilih):
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <button
                  type="button"
                  onClick={() => fillCredential('G1A026040', '12345678')}
                  className={`min-h-[52px] p-3 rounded-[12px] border text-left transition-colors flex items-center justify-between ${
                    identifier.toUpperCase() === 'G1A026040'
                      ? 'border-[#1a2469] bg-[#FAF8F4]'
                      : 'border-[#E8E5DF] bg-white hover:bg-[#FAF8F4]'
                  }`}
                >
                  <div>
                    <p className="text-[13px] font-semibold text-[#1C1B19]">
                      Mahasiswa (Sivitas)
                    </p>
                    <p className="text-[12px] font-label text-[#1a2469] tabular-nums">
                      NPM: G1A026040
                    </p>
                  </div>
                  {identifier.toUpperCase() === 'G1A026040' && (
                    <CheckCircle2 className="w-4 h-4 text-[#1a2469] shrink-0" />
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => fillCredential('admin', '12345678')}
                  className={`min-h-[52px] p-3 rounded-[12px] border text-left transition-colors flex items-center justify-between ${
                    identifier.toLowerCase() === 'admin'
                      ? 'border-[#1a2469] bg-[#FAF8F4]'
                      : 'border-[#E8E5DF] bg-white hover:bg-[#FAF8F4]'
                  }`}
                >
                  <div>
                    <p className="text-[13px] font-semibold text-[#1C1B19]">
                      Admin / Teknisi
                    </p>
                    <p className="text-[12px] font-label text-[#1a2469] tabular-nums">
                      User: admin
                    </p>
                  </div>
                  {identifier.toLowerCase() === 'admin' && (
                    <CheckCircle2 className="w-4 h-4 text-[#1a2469] shrink-0" />
                  )}
                </button>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <label
                  htmlFor="login-identifier"
                  className="block font-label text-[14px] font-medium text-[#1C1B19]"
                >
                  NPM Mahasiswa atau Username Admin
                </label>
                <div className="relative">
                  <UserCheck className="w-4 h-4 text-[#8F8E89] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    id="login-identifier"
                    type="text"
                    value={identifier}
                    onChange={(e) => setIdentifier(e.target.value)}
                    placeholder="G1A026040 atau admin"
                    required
                    className="w-full h-12 pl-10 pr-4 rounded-[12px] bg-white border border-[#E8E5DF] text-[16px] font-medium text-[#1C1B19] tabular-nums focus:outline-none focus:border-[#1a2469] focus:ring-2 focus:ring-[#1a2469]/15"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label
                  htmlFor="login-password"
                  className="block font-label text-[14px] font-medium text-[#1C1B19]"
                >
                  Kata Sandi (Password)
                </label>
                <div className="relative">
                  <KeyRound className="w-4 h-4 text-[#8F8E89] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    id="login-password"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="12345678"
                    required
                    className="w-full h-12 pl-10 pr-12 rounded-[12px] bg-white border border-[#E8E5DF] text-[16px] font-medium text-[#1C1B19] tabular-nums focus:outline-none focus:border-[#1a2469] focus:ring-2 focus:ring-[#1a2469]/15"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((prev) => !prev)}
                    aria-label={showPassword ? 'Sembunyikan sandi' : 'Lihat sandi'}
                    className="w-10 h-10 absolute right-1.5 top-1/2 -translate-y-1/2 flex items-center justify-center text-[#63625D] hover:text-[#1C1B19] rounded-[8px]"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {errorMsg && (
                <div className="p-3.5 rounded-[12px] bg-[#FEE2E2] text-[#4f1c00] text-[13px] font-medium flex items-start gap-2.5">
                  <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{errorMsg}</span>
                </div>
              )}

              <button
                type="submit"
                className="w-full min-h-[52px] px-5 py-3 rounded-[14px] bg-[#1a2469] hover:bg-[#000a55] text-white font-label font-semibold text-[16px] flex items-center justify-center gap-2 transition-colors whitespace-nowrap"
              >
                <span>Masuk ke Goesin</span>
                <ArrowRight className="w-5 h-5 shrink-0" />
              </button>
            </form>

            <div className="pt-3 border-t border-[#E8E5DF] flex items-center justify-between text-[12px] font-label text-[#63625D]">
              <span>Sandi Demo: 12345678</span>
              <span>·</span>
              <span>Mendukung Scan Barcode Produk</span>
            </div>
          </div>
        </div>
      </main>

      <footer className="border-t border-[#E8E5DF] py-4 px-4 sm:px-8 text-center text-[13px] text-[#63625D]">
        Goesin Campus Mobility · Layanan Sepeda Kampus Indonesia
      </footer>
    </div>
  );
};
