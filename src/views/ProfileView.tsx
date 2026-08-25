import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { api } from '../lib/api';
import {
  User,
  Mail,
  Lock,
  CreditCard,
  Key,
  ShieldCheck,
  CheckCircle2,
  Calendar,
  Save,
  Clock,
} from 'lucide-react';

export const ProfileView: React.FC = () => {
  const { user, refreshUser } = useAuth();
  const { success, error } = useToast();

  const [paymentMethod, setPaymentMethod] = useState(user?.payment_method_default || 'DANA');
  const [paymentAccount, setPaymentAccount] = useState(user?.payment_account_default || '');
  const [isSavingPayout, setIsSavingPayout] = useState(false);

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [isChangingPass, setIsChangingPass] = useState(false);

  const handleSavePayout = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingPayout(true);
    const res = await api.put('/user/profile', {
      payment_method_default: paymentMethod,
      payment_account_default: paymentAccount.trim(),
    });
    setIsSavingPayout(false);

    if (res.error) {
      error(res.error || 'Gagal menyimpan data rekening pembayaran.');
      return;
    }

    success('Data rekening pembayaran default berhasil disimpan.');
    refreshUser();
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentPassword || !newPassword) {
      error('Silakan lengkapi password saat ini dan password baru.');
      return;
    }

    if (newPassword.length < 6) {
      error('Password baru minimal 6 karakter.');
      return;
    }

    if (newPassword !== confirmNewPassword) {
      error('Konfirmasi password baru tidak cocok.');
      return;
    }

    setIsChangingPass(true);
    const res = await api.put('/user/profile', {
      current_password: currentPassword,
      new_password: newPassword,
    });
    setIsChangingPass(false);

    if (res.error) {
      error(res.error || 'Gagal mengubah password.');
      return;
    }

    success('Password berhasil diperbarui!');
    setCurrentPassword('');
    setNewPassword('');
    setConfirmNewPassword('');
  };

  if (!user) return null;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3 bg-[#121826] p-5 rounded-3xl border border-white/10 shadow-xl">
        <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-violet-600 to-indigo-600 flex items-center justify-center text-white shadow-lg shadow-violet-600/30">
          <User className="w-6 h-6" />
        </div>
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">Profil & Pengaturan Akun</h1>
          <p className="text-xs text-slate-400">
            Kelola detail identitas, rekening pembayaran default, dan keamanan password Anda.
          </p>
        </div>
      </div>

      {/* Profile Overview Card */}
      <div className="p-6 rounded-3xl bg-[#121826] border border-white/10 shadow-xl grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-4 rounded-2xl bg-white/5 border border-white/5 space-y-1">
          <span className="text-[10px] uppercase font-bold text-slate-400">Username</span>
          <p className="font-bold text-white truncate">{user.username}</p>
        </div>

        <div className="p-4 rounded-2xl bg-white/5 border border-white/5 space-y-1">
          <span className="text-[10px] uppercase font-bold text-slate-400">Alamat Email</span>
          <p className="font-bold text-white truncate">{user.email}</p>
        </div>

        <div className="p-4 rounded-2xl bg-white/5 border border-white/5 space-y-1">
          <span className="text-[10px] uppercase font-bold text-slate-400">Kode Referral</span>
          <p className="font-bold font-mono text-violet-400">{user.referral_code}</p>
        </div>

        <div className="p-4 rounded-2xl bg-white/5 border border-white/5 space-y-1">
          <span className="text-[10px] uppercase font-bold text-slate-400">Status Akun</span>
          <p className="font-bold text-emerald-400 flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Aktif & Terverifikasi</span>
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Default Payout Account Form */}
        <form
          onSubmit={handleSavePayout}
          className="p-6 rounded-3xl bg-[#121826] border border-white/10 shadow-xl space-y-4"
        >
          <div className="flex items-center gap-2 border-b border-white/10 pb-3">
            <CreditCard className="w-5 h-5 text-emerald-400" />
            <h2 className="text-sm font-bold text-white">Rekening Penarikan Default</h2>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">Metode Pembayaran</label>
            <select
              value={paymentMethod}
              onChange={(e) => setPaymentMethod(e.target.value)}
              className="w-full bg-[#070b14] border border-white/10 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-violet-500 transition"
            >
              <optgroup label="e-Wallet">
                <option value="DANA">DANA</option>
                <option value="GoPay">GoPay</option>
                <option value="OVO">OVO</option>
                <option value="ShopeePay">ShopeePay</option>
              </optgroup>
              <optgroup label="Bank Transfer">
                <option value="BCA">Bank BCA</option>
                <option value="BRI">Bank BRI</option>
                <option value="Mandiri">Bank Mandiri</option>
                <option value="BNI">Bank BNI</option>
              </optgroup>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Nomor Rekening / e-Wallet & Atas Nama
            </label>
            <input
              type="text"
              value={paymentAccount}
              onChange={(e) => setPaymentAccount(e.target.value)}
              placeholder="Contoh: 08123456789 (a.n Budi)"
              className="w-full bg-[#070b14] border border-white/10 rounded-xl px-3 py-2.5 text-xs sm:text-sm text-white placeholder:text-slate-400 focus:outline-none focus:border-violet-500 transition"
            />
          </div>

          <button
            id="btn-save-payout-default"
            type="submit"
            disabled={isSavingPayout}
            className="w-full py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs shadow-md transition active:scale-98 disabled:opacity-50 flex items-center justify-center gap-1.5"
          >
            <Save className="w-3.5 h-3.5" />
            <span>{isSavingPayout ? 'Menyimpan...' : 'Simpan Rekening Default'}</span>
          </button>
        </form>

        {/* Change Password Form */}
        <form
          onSubmit={handleChangePassword}
          className="p-6 rounded-3xl bg-[#121826] border border-white/10 shadow-xl space-y-4"
        >
          <div className="flex items-center gap-2 border-b border-white/10 pb-3">
            <Lock className="w-5 h-5 text-violet-400" />
            <h2 className="text-sm font-bold text-white">Ganti Password Akun</h2>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">Password Saat Ini</label>
            <input
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              placeholder="Masukkan password lama"
              className="w-full bg-[#070b14] border border-white/10 rounded-xl px-3 py-2.5 text-xs sm:text-sm text-white placeholder:text-slate-400 focus:outline-none focus:border-violet-500 transition"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">Password Baru</label>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Minimal 6 karakter"
              className="w-full bg-[#070b14] border border-white/10 rounded-xl px-3 py-2.5 text-xs sm:text-sm text-white placeholder:text-slate-400 focus:outline-none focus:border-violet-500 transition"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">Ulangi Password Baru</label>
            <input
              type="password"
              value={confirmNewPassword}
              onChange={(e) => setConfirmNewPassword(e.target.value)}
              placeholder="Konfirmasi password baru"
              className="w-full bg-[#070b14] border border-white/10 rounded-xl px-3 py-2.5 text-xs sm:text-sm text-white placeholder:text-slate-400 focus:outline-none focus:border-violet-500 transition"
            />
          </div>

          <button
            id="btn-save-new-password"
            type="submit"
            disabled={isChangingPass}
            className="w-full py-2.5 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-bold text-xs shadow-md transition active:scale-98 disabled:opacity-50 flex items-center justify-center gap-1.5"
          >
            <Key className="w-3.5 h-3.5" />
            <span>{isChangingPass ? 'Memproses...' : 'Perbarui Password'}</span>
          </button>
        </form>
      </div>

      {/* Account Activity Metadata */}
      <div className="p-5 rounded-2xl bg-white/5 border border-white/10 flex flex-wrap items-center justify-between text-xs text-slate-400 gap-3">
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-violet-400" />
          <span>
            Terdaftar Sejak:{' '}
            <strong className="text-white">
              {new Date(user.created_at).toLocaleDateString('id-ID', {
                day: 'numeric',
                month: 'long',
                year: 'numeric',
              })}
            </strong>
          </span>
        </div>

        <div className="flex items-center gap-2">
          <Clock className="w-4 h-4 text-emerald-400" />
          <span>
            Login Terakhir:{' '}
            <strong className="text-white">
              {user.last_login_at
                ? new Date(user.last_login_at).toLocaleString('id-ID', {
                    day: 'numeric',
                    month: 'short',
                    hour: '2-digit',
                    minute: '2-digit',
                  })
                : '-'}
            </strong>
          </span>
        </div>
      </div>
    </div>
  );
};
