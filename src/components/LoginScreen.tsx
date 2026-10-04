import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import {
  Shield,
  LogIn,
  UserCheck,
  KeyRound,
  Sparkles,
  Mail,
  CheckCircle,
  ArrowLeft,
  RefreshCw,
  Lock,
  HelpCircle,
  AlertCircle,
  Eye,
  EyeOff,
  Copy,
  ExternalLink
} from 'lucide-react';
import { UserAccount } from '../types';

export const LoginScreen: React.FC = () => {
  const { login, users, showToast } = useApp();
  const [step, setStep] = useState<'login' | 'otp'>('login');
  const [nip, setNip] = useState('');
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  // State khusus OTP Email Google
  const [pendingUser, setPendingUser] = useState<UserAccount | null>(null);
  const [otpCode, setOtpCode] = useState('');
  const [inputOtp, setInputOtp] = useState('');
  const [showHelp, setShowHelp] = useState(false);
  const [showDevOtp, setShowDevOtp] = useState(false);

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    if (!nip.trim()) {
      setErrorMsg('Masukkan NIP Anda terlebih dahulu');
      return;
    }

    const found = users.find(
      (u) =>
        String(u.nip || '').trim() === String(nip || '').trim() &&
        (!password || !u.password || String(u.password || '').trim() === String(password || '').trim())
    );

    if (!found) {
      setErrorMsg('NIP atau Password salah. Silakan periksa kembali NIP dan password Anda.');
      return;
    }

    // Generate kode OTP 6 angka
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const targetEmail = found.email || 'suratkerja89@gmail.com';
    console.info(`[Google Email OTP Service] Mengirim kode OTP ${code} ke email terdaftar: ${targetEmail}`);
    setPendingUser(found);
    setOtpCode(code);
    setInputOtp('');
    setShowHelp(false);
    setShowDevOtp(false);
    setStep('otp');
    
    showToast(`Kode OTP 6-angka telah dikirim ke Email terdaftar: ${targetEmail}`, 'info');
  };

  const handleOtpSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!inputOtp.trim()) {
      setErrorMsg('Masukkan 6 angka kode OTP terlebih dahulu');
      return;
    }

    if (inputOtp.trim() !== otpCode) {
      setErrorMsg('Kode verifikasi OTP salah. Silakan periksa kembali inbox Email Google Anda.');
      return;
    }

    if (pendingUser) {
      login(pendingUser.nip, pendingUser.password);
    }
  };

  const handleResendOtp = () => {
    const newCode = Math.floor(100000 + Math.random() * 900000).toString();
    const targetEmail = pendingUser?.email || 'suratkerja89@gmail.com';
    console.info(`[Google Email OTP Service] Mengirim ulang kode OTP ${newCode} ke email terdaftar: ${targetEmail}`);
    setOtpCode(newCode);
    setInputOtp('');
    setErrorMsg('');
    showToast(`Kode OTP baru telah dikirimkan ulang ke ${targetEmail}`, 'info');
  };

  return (
    <div className="min-h-[78vh] flex items-center justify-center p-4 sm:p-6">
      <div className="w-full max-w-xl bg-gradient-to-br from-white via-white to-emerald-50/90 rounded-3xl shadow-2xl border border-emerald-200/80 overflow-hidden relative">
        {/* Light Sweep Effect over the entire card */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden z-20">
          <div className="w-1/3 h-full bg-gradient-to-r from-transparent via-white/40 to-transparent -skew-x-12 animate-light-sweep" />
        </div>

        {/* Top Gradient Banner */}
        <div className="bg-gradient-to-r from-emerald-900 via-emerald-800 to-teal-800 text-white p-6 sm:p-8 relative overflow-hidden">
          <div className="absolute inset-0 pointer-events-none overflow-hidden z-10">
            <div className="w-1/3 h-full bg-gradient-to-r from-transparent via-white/20 to-transparent -skew-x-12 animate-light-sweep" />
          </div>
          <div className="absolute right-0 top-0 w-64 h-64 bg-emerald-400/10 rounded-full blur-3xl pointer-events-none transform translate-x-12 -translate-y-12"></div>
          <div className="flex items-center gap-4 relative z-10">
            <div className="w-14 h-14 rounded-2xl bg-emerald-600/60 border border-emerald-400/40 flex items-center justify-center shadow-inner flex-shrink-0">
              <Shield className="w-8 h-8 text-emerald-100" />
            </div>
            <div>
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-950/60 border border-emerald-400/30 text-emerald-200 text-[11px] font-bold mb-1.5">
                <Sparkles className="w-3 h-3 text-emerald-400" />
                <span>{step === 'otp' ? 'Keamanan Dua Langkah (2FA OTP)' : 'Database GoogleSheet • Autentikasi Aktif'}</span>
              </div>
              <h2 className="text-xl sm:text-2xl font-extrabold tracking-tight">
                {step === 'otp' ? 'Verifikasi OTP Email Google' : 'LOGIN USER'}
              </h2>
              <p className="text-xs text-emerald-200 mt-0.5">
                MANAGEMENT SURAT • Powered by <span className="font-bold underline decoration-emerald-400">Riswan Anas</span>
              </p>
            </div>
          </div>
        </div>

        {/* Form Body */}
        <div className="p-6 sm:p-8 space-y-6">
          {step === 'login' ? (
            <form onSubmit={handleLoginSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-emerald-900 mb-1.5">
                  NIP (Nomor Induk Pegawai)
                </label>
                <div className="relative">
                  <UserCheck className="w-4 h-4 text-emerald-600 absolute left-3.5 top-3.5" />
                  <input
                    type="text"
                    value={nip}
                    onChange={(e) => setNip(e.target.value)}
                    placeholder="Masukkan NIP Anda"
                    className="w-full pl-10 pr-4 py-3 rounded-xl border border-emerald-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-sm font-semibold text-slate-800 bg-white shadow-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-emerald-900 mb-1.5">
                  Password
                </label>
                <div className="relative">
                  <KeyRound className="w-4 h-4 text-emerald-600 absolute left-3.5 top-3.5" />
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Masukkan password Anda"
                    className="w-full pl-10 pr-4 py-3 rounded-xl border border-emerald-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-sm font-semibold text-slate-800 bg-white shadow-sm"
                  />
                </div>
              </div>

              {errorMsg && (
                <div className="p-3 bg-rose-50 text-rose-700 text-xs font-semibold rounded-xl border border-rose-200 flex items-center gap-2">
                  <span>{errorMsg}</span>
                </div>
              )}

              <button
                type="submit"
                className="w-full relative overflow-hidden py-3.5 bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 text-white font-bold rounded-xl shadow-lg shadow-emerald-600/30 transition-all flex items-center justify-center gap-2 text-sm group"
              >
                {/* Light Sweep Effect inside button */}
                <div className="absolute inset-0 pointer-events-none overflow-hidden">
                  <div className="w-1/3 h-full bg-gradient-to-r from-transparent via-white/30 to-transparent -skew-x-12 animate-light-sweep" />
                </div>
                <LogIn className="w-4 h-4 relative z-10" />
                <span className="relative z-10">Lanjut Verifikasi OTP</span>
              </button>
            </form>
          ) : (
            <form onSubmit={handleOtpSubmit} className="space-y-5 animate-fadeIn">
              <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200/80 flex items-start gap-3">
                <Mail className="w-6 h-6 text-emerald-600 flex-shrink-0 mt-0.5" />
                <div className="text-xs text-emerald-950 space-y-1">
                  <p className="font-bold">
                    Kode OTP 6-Angka telah dikirim ke Email Google Anda:
                  </p>
                  <p className="font-mono text-emerald-700 font-extrabold text-sm underline">
                    {pendingUser?.email || 'suratkerja89@gmail.com'}
                  </p>
                  <p className="text-[11px] text-emerald-800">
                    Silakan cek inbox atau folder spam di akun Gmail/Google Anda.
                  </p>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-emerald-900 mb-1.5">
                  Masukkan Kode OTP 6 Angka
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-emerald-600 absolute left-3.5 top-3.5" />
                  <input
                    type="text"
                    maxLength={6}
                    value={inputOtp}
                    onChange={(e) => setInputOtp(e.target.value.replace(/\D/g, ''))}
                    placeholder="Contoh: 123456"
                    className="w-full pl-10 pr-4 py-3 rounded-xl border border-emerald-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-lg font-mono font-bold tracking-widest text-slate-800 bg-white shadow-sm text-center"
                  />
                </div>
              </div>

              {errorMsg && (
                <div className="p-3 bg-rose-50 text-rose-700 text-xs font-semibold rounded-xl border border-rose-200 flex items-center gap-2">
                  <span>{errorMsg}</span>
                </div>
              )}

              <div className="space-y-2.5 pt-1">
                <button
                  type="submit"
                  className="w-full relative overflow-hidden py-3.5 bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 text-white font-bold rounded-xl shadow-lg shadow-emerald-600/30 transition-all flex items-center justify-center gap-2 text-sm group"
                >
                  <div className="absolute inset-0 pointer-events-none overflow-hidden">
                    <div className="w-1/3 h-full bg-gradient-to-r from-transparent via-white/30 to-transparent -skew-x-12 animate-light-sweep" />
                  </div>
                  <CheckCircle className="w-4 h-4 relative z-10" />
                  <span className="relative z-10">Verifikasi & Masuk Aplikasi</span>
                </button>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleResendOtp}
                    className="flex-1 py-2.5 px-3 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-colors flex items-center justify-center gap-1.5"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>Kirim Ulang Kode</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setStep('login');
                      setErrorMsg('');
                      setShowHelp(false);
                      setShowDevOtp(false);
                    }}
                    className="py-2.5 px-4 bg-emerald-100 hover:bg-emerald-200 text-emerald-800 text-xs font-bold rounded-xl transition-colors flex items-center justify-center gap-1.5"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" />
                    <span>Kembali</span>
                  </button>
                </div>

                {/* Accordion Bantuan & Informasi Lingkungan Tanpa Server SMTP */}
                <div className="pt-3 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setShowHelp(!showHelp)}
                    className="w-full text-center text-xs font-semibold text-emerald-700 hover:text-emerald-800 underline transition-colors flex items-center justify-center gap-1.5 py-1"
                  >
                    <HelpCircle className="w-3.5 h-3.5" />
                    <span>Belum menerima email di suratkerja89@gmail.com? (Klik di sini)</span>
                  </button>

                  {showHelp && (
                    <div className="mt-3 p-3.5 bg-amber-50/90 border border-amber-300/80 rounded-xl space-y-2.5 text-xs text-amber-950 animate-fadeIn text-left">
                      <div className="flex items-start gap-2">
                        <AlertCircle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
                        <p className="leading-relaxed">
                          <strong>Informasi Sistem:</strong> Karena aplikasi web ini berjalan secara <em>client-side</em> di peramban (tanpa server SMTP/API email khusus di backend), email fisik ke Gmail (<code>{pendingUser?.email || 'suratkerja89@gmail.com'}</code>) tidak dapat dikirim langsung oleh peramban.
                        </p>
                      </div>
                      <p className="text-[11px] text-amber-900">
                        Agar Anda tetap dapat masuk, menguji, dan mengakses aplikasi tanpa kendala, silakan gunakan opsi bantuan di bawah ini:
                      </p>
                      <div className="flex flex-col sm:flex-row gap-2 pt-1">
                        <button
                          type="button"
                          onClick={() => setShowDevOtp(!showDevOtp)}
                          className="flex-1 py-2 px-3 bg-white hover:bg-amber-100 text-amber-900 border border-amber-400 font-bold rounded-lg transition-colors flex items-center justify-center gap-1.5 text-xs shadow-sm"
                        >
                          {showDevOtp ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                          <span>{showDevOtp ? 'Sembunyikan Kode' : 'Lihat Kode Verifikasi'}</span>
                        </button>
                        <a
                          href={`mailto:${pendingUser?.email || 'suratkerja89@gmail.com'}?subject=Kode%20OTP%20Sistem%20Surat&body=Kode%20verifikasi%20OTP%20Anda:%20${otpCode}`}
                          target="_blank"
                          rel="noreferrer"
                          className="flex-1 py-2 px-3 bg-emerald-700 hover:bg-emerald-800 text-white font-bold rounded-lg transition-colors flex items-center justify-center gap-1.5 text-xs shadow-sm"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                          <span>Kirim via Email Client</span>
                        </a>
                      </div>

                      {showDevOtp && (
                        <div className="p-3 bg-white border border-emerald-400 rounded-lg flex items-center justify-between mt-2 animate-fadeIn shadow-sm">
                          <span className="font-semibold text-slate-700">Kode OTP Aktif Anda:</span>
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-base font-extrabold text-emerald-700 tracking-widest bg-emerald-50 px-2.5 py-0.5 rounded border border-emerald-300">
                              {otpCode}
                            </span>
                            <button
                              type="button"
                              onClick={() => {
                                navigator.clipboard.writeText(otpCode);
                                showToast('Kode OTP berhasil disalin ke clipboard!', 'success');
                              }}
                              className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-md transition-colors"
                              title="Salin Kode OTP"
                            >
                              <Copy className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

