import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { api } from '../lib/api';
import {
  Mail,
  Lock,
  User as UserIcon,
  Sparkles,
  ArrowRight,
  Eye,
  EyeOff,
  Users,
  CheckCircle2,
} from 'lucide-react';

interface AuthViewProps {
  defaultMode?: 'login' | 'register';
  onSuccess?: () => void;
}

export const AuthView: React.FC<AuthViewProps> = ({ defaultMode = 'login', onSuccess }) => {
  const { login } = useAuth();
  const { success, error } = useToast();
  const navigate = useNavigate();
  const location = useLocation();

  const isRegisterPath = location.pathname === '/register' || defaultMode === 'register';
  const [mode, setMode] = useState<'login' | 'register'>(isRegisterPath ? 'register' : 'login');
  
  const [identifier, setIdentifier] = useState(''); // email or username for login
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [referralCode, setReferralCode] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Sync mode with route changes
  useEffect(() => {
    if (location.pathname === '/register') {
      setMode('register');
    } else if (location.pathname === '/login') {
      setMode('login');
    }
  }, [location.pathname]);

  // Check URL query parameters for referral code
  useEffect(() => {
    try {
      const urlParams = new URLSearchParams(window.location.search);
      const ref = urlParams.get('ref');
      if (ref) {
        setReferralCode(ref);
        setMode('register');
      }
    } catch {
      // ignore
    }
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!identifier.trim() || !password) {
      error('Silakan lengkapi email/username dan password.');
      return;
    }

    setIsLoading(true);
    const res = await api.post('/auth/login', {
      identifier: identifier.trim(),
      password,
    });
    setIsLoading(false);

    if (res.error || !res.data) {
      error(res.error || 'Gagal login. Silakan periksa kembali kredensial Anda.');
      return;
    }

    const loggedUser = res.data.user;
    login(res.data.token, loggedUser);
    success(`Selamat datang kembali, ${loggedUser.username}!`);

    if (onSuccess) onSuccess();

    // Direct routing based on database role
    if (loggedUser.role === 'admin') {
      navigate('/admin', { replace: true });
    } else {
      navigate('/dashboard', { replace: true });
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !email.trim() || !password || !confirmPassword) {
      error('Semua kolom wajib diisi.');
      return;
    }

    if (username.trim().length < 3) {
      error('Username minimal 3 karakter.');
      return;
    }

    if (password.length < 6) {
      error('Password minimal 6 karakter.');
      return;
    }

    if (password !== confirmPassword) {
      error('Konfirmasi password tidak cocok.');
      return;
    }

    setIsLoading(true);
    const res = await api.post('/auth/register', {
      username: username.trim(),
      email: email.trim(),
      password,
      confirmPassword,
      referralCode: referralCode.trim() || undefined,
    });
    setIsLoading(false);

    if (res.error || !res.data) {
      error(res.error || 'Gagal registrasi akun.');
      return;
    }

    const registeredUser = res.data.user;
    login(res.data.token, registeredUser);
    success('Registrasi berhasil! Selamat datang di YAO SGMAIL.');

    if (onSuccess) onSuccess();
    navigate('/dashboard', { replace: true });
  };

  const switchMode = (newMode: 'login' | 'register') => {
    setMode(newMode);
    navigate(newMode === 'register' ? '/register' : '/login', { replace: true });
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center p-4 sm:p-6">
      <div className="w-full max-w-md bg-[#121826]/95 border border-white/10 rounded-3xl p-6 sm:p-8 shadow-2xl backdrop-blur-xl relative overflow-hidden">
        {/* Glow ambient background */}
        <div className="absolute -top-24 -right-24 w-60 h-60 bg-violet-600/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-60 h-60 bg-indigo-600/20 rounded-full blur-3xl pointer-events-none" />

        {/* Brand Header */}
        <div className="text-center mb-6 relative">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-tr from-violet-600 via-indigo-600 to-purple-500 shadow-xl shadow-violet-600/30 mb-3">
            <Mail className="w-7 h-7 text-white" />
          </div>
          <h1 className="text-2xl font-black text-white tracking-tight">YAO SGMAIL</h1>
          <p className="text-xs text-slate-400 mt-1">Platform Deposit Gmail & Pencairan Dana Instan</p>
        </div>

        {/* Tab Switcher */}
        <div className="flex bg-[#070b14]/80 p-1 rounded-2xl border border-white/10 mb-6">
          <button
            id="tab-btn-login"
            type="button"
            onClick={() => switchMode('login')}
            className={`flex-1 py-2 rounded-xl text-xs font-bold transition ${
              mode === 'login'
                ? 'bg-gradient-to-r from-violet-600 to-indigo-600 text-white shadow-md'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Masuk Akun
          </button>
          <button
            id="tab-btn-register"
            type="button"
            onClick={() => switchMode('register')}
            className={`flex-1 py-2 rounded-xl text-xs font-bold transition ${
              mode === 'register'
                ? 'bg-gradient-to-r from-violet-600 to-indigo-600 text-white shadow-md'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Daftar Baru
          </button>
        </div>

        {/* Login Form */}
        {mode === 'login' ? (
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">Email atau Username</label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  id="input-login-identifier"
                  type="text"
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  placeholder="nama@email.com atau username"
                  required
                  autoComplete="username"
                  className="w-full bg-[#070b14] border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500 transition"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">Password</label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  id="input-login-password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Masukkan password Anda"
                  required
                  autoComplete="current-password"
                  className="w-full bg-[#070b14] border border-white/10 rounded-xl pl-10 pr-10 py-2.5 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500 transition"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 p-1"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              id="btn-submit-login"
              type="submit"
              disabled={isLoading}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-violet-600 via-indigo-600 to-purple-600 hover:from-violet-500 hover:to-indigo-500 text-white font-bold text-sm shadow-xl shadow-violet-600/30 flex items-center justify-center gap-2 transition active:scale-98 disabled:opacity-50"
            >
              {isLoading ? (
                <span>Memproses...</span>
              ) : (
                <>
                  <span>Masuk Sekarang</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        ) : (
          /* Register Form */
          <form onSubmit={handleRegister} className="space-y-3.5">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">Username</label>
              <div className="relative">
                <UserIcon className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  id="input-reg-username"
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Pilih username unik (min. 3 huruf)"
                  required
                  minLength={3}
                  className="w-full bg-[#070b14] border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500 transition"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">Alamat Email</label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  id="input-reg-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="nama@email.com"
                  required
                  className="w-full bg-[#070b14] border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500 transition"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">Password</label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  id="input-reg-password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Minimal 6 karakter"
                  required
                  minLength={6}
                  className="w-full bg-[#070b14] border border-white/10 rounded-xl pl-10 pr-10 py-2.5 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500 transition"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 p-1"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">Konfirmasi Password</label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  id="input-reg-confirm-password"
                  type={showPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Ulangi password di atas"
                  required
                  className="w-full bg-[#070b14] border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500 transition"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Kode Referral <span className="text-slate-400 font-normal">(Opsional)</span>
              </label>
              <div className="relative">
                <Users className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  id="input-reg-referral"
                  type="text"
                  value={referralCode}
                  onChange={(e) => setReferralCode(e.target.value.toUpperCase())}
                  placeholder="Contoh: YAO12345"
                  className="w-full bg-[#070b14] border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500 uppercase transition"
                />
              </div>
            </div>

            <button
              id="btn-submit-register"
              type="submit"
              disabled={isLoading}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-violet-600 via-indigo-600 to-purple-600 hover:from-violet-500 hover:to-indigo-500 text-white font-bold text-sm shadow-xl shadow-violet-600/30 flex items-center justify-center gap-2 transition active:scale-98 disabled:opacity-50 mt-4"
            >
              {isLoading ? (
                <span>Mendaftarkan...</span>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>Daftar Akun Sekarang</span>
                </>
              )}
            </button>
          </form>
        )}

        <div className="mt-6 text-center">
          <p className="text-[11px] text-slate-400 flex items-center justify-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            <span>Enkripsi Password Standar Industri & Data Aman</span>
          </p>
        </div>
      </div>
    </div>
  );
};
