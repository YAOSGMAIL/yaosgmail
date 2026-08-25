import React, { useState, useEffect } from 'react';
import { api } from '../../lib/api';
import { useToast } from '../../context/ToastContext';
import { SystemSettings } from '../../types';
import {
  Settings,
  Coins,
  ArrowDownToLine,
  Users,
  ShieldCheck,
  Save,
  RefreshCw,
  Calculator,
  Bell,
  Sparkles,
} from 'lucide-react';

export const AdminSettings: React.FC = () => {
  const { success, error } = useToast();

  const [settings, setSettings] = useState<SystemSettings | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // Live Calculator Sandbox in Settings
  const [calcGross, setCalcGross] = useState<number>(100000);

  const fetchSettings = async () => {
    setIsLoading(true);
    const res = await api.get<SystemSettings>('/admin/settings');
    if (res.data) {
      setSettings(res.data);
    }
    setIsLoading(false);
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!settings) return;

    setIsSaving(true);
    const res = await api.put('/admin/settings', settings);
    setIsSaving(false);

    if (res.error) {
      error(res.error || 'Gagal menyimpan pengaturan.');
      return;
    }

    success('Pengaturan sistem berhasil diperbarui!');
    fetchSettings();
  };

  if (isLoading && !settings) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <RefreshCw className="w-8 h-8 text-violet-500 animate-spin" />
      </div>
    );
  }

  if (!settings) return null;

  // Sandbox Fee Math
  const feePercent = settings.withdrawal_fee_current || 15;
  const calFeeAmount = Math.round((calcGross * feePercent) / 100);
  const calcNetAmount = Math.max(0, calcGross - calFeeAmount);

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-[#121826] p-5 rounded-3xl border border-white/10 shadow-xl">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-amber-500 to-orange-500 flex items-center justify-center text-white shadow-lg shadow-amber-500/30">
            <Settings className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">Pengaturan Sistem Global</h1>
            <p className="text-xs text-slate-400">
              Konfigurasi rate Gmail, minimum WD, persentase fee, kuota harian, dan pengumuman.
            </p>
          </div>
        </div>

        <button
          onClick={fetchSettings}
          className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 text-xs font-semibold border border-white/10 transition self-start sm:self-auto"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
          <span>Segarkan</span>
        </button>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        {/* 1. GENERAL & ANNOUNCEMENT */}
        <div className="p-6 rounded-3xl bg-[#121826] border border-white/10 shadow-xl space-y-4">
          <div className="flex items-center gap-2 border-b border-white/10 pb-3">
            <Bell className="w-5 h-5 text-violet-400" />
            <h2 className="text-sm font-bold text-white">Informasi Umum & Status Sistem</h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">Nama Platform / Website</label>
              <input
                type="text"
                value={settings.site_name}
                onChange={(e) => setSettings({ ...settings, site_name: e.target.value })}
                className="w-full bg-[#070b14] border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-violet-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">Status Room / Server Global</label>
              <select
                value={settings.room_status}
                onChange={(e) => setSettings({ ...settings, room_status: e.target.value as any })}
                className="w-full bg-[#070b14] border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-violet-500"
              >
                <option value="OPEN">🟢 OPEN (Aktif & Menerima Transaksi)</option>
                <option value="MAINTENANCE">🟡 MAINTENANCE (Pemeliharaan Sistem)</option>
                <option value="CLOSED">🔴 CLOSED (Tutup Sementara)</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">Banner Pengumuman User</label>
            <textarea
              rows={2}
              value={settings.announcement}
              onChange={(e) => setSettings({ ...settings, announcement: e.target.value })}
              placeholder="Teks pengumuman yang muncul di dashboard pengguna..."
              className="w-full bg-[#070b14] border border-white/10 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-violet-500"
            />
          </div>
        </div>

        {/* 2. GMAIL DEPOSIT SETTINGS */}
        <div className="p-6 rounded-3xl bg-[#121826] border border-white/10 shadow-xl space-y-4">
          <div className="flex items-center gap-2 border-b border-white/10 pb-3">
            <Coins className="w-5 h-5 text-emerald-400" />
            <h2 className="text-sm font-bold text-white">Aturan Setoran Gmail</h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">Rate per Gmail (Rp)</label>
              <input
                type="number"
                min={100}
                step={50}
                value={settings.gmail_rate}
                onChange={(e) => setSettings({ ...settings, gmail_rate: Number(e.target.value) })}
                className="w-full bg-[#070b14] border border-white/10 rounded-xl px-3.5 py-2.5 text-xs font-mono font-bold text-emerald-400 focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">Batas Kuota Harian (Per User)</label>
              <input
                type="number"
                min={1}
                value={settings.daily_limit}
                onChange={(e) => setSettings({ ...settings, daily_limit: Number(e.target.value) })}
                className="w-full bg-[#070b14] border border-white/10 rounded-xl px-3.5 py-2.5 text-xs font-mono font-bold text-white focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">Status Fitur Setoran</label>
              <select
                value={settings.deposit_status}
                onChange={(e) => setSettings({ ...settings, deposit_status: e.target.value as any })}
                className="w-full bg-[#070b14] border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-emerald-500"
              >
                <option value="OPEN">🟢 Buka (Terima Setoran)</option>
                <option value="CLOSED">🔴 Tutup</option>
              </select>
            </div>
          </div>
        </div>

        {/* 3. WITHDRAWAL & FEE SETTINGS */}
        <div className="p-6 rounded-3xl bg-[#121826] border border-white/10 shadow-xl space-y-4">
          <div className="flex items-center gap-2 border-b border-white/10 pb-3">
            <ArrowDownToLine className="w-5 h-5 text-blue-400" />
            <h2 className="text-sm font-bold text-white">Aturan Withdrawal & Fee Admin</h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">Minimum WD (Rp)</label>
              <input
                type="number"
                min={10000}
                step={5000}
                value={settings.minimum_withdrawal}
                onChange={(e) => setSettings({ ...settings, minimum_withdrawal: Number(e.target.value) })}
                className="w-full bg-[#070b14] border border-white/10 rounded-xl px-3.5 py-2.5 text-xs font-mono font-bold text-white focus:outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Syarat Min. Gmail Approved
              </label>
              <input
                type="number"
                min={0}
                value={settings.minimum_approved_gmail_for_withdrawal}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    minimum_approved_gmail_for_withdrawal: Number(e.target.value),
                  })
                }
                className="w-full bg-[#070b14] border border-white/10 rounded-xl px-3.5 py-2.5 text-xs font-mono font-bold text-white focus:outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">Status Fitur Withdrawal</label>
              <select
                value={settings.withdrawal_status}
                onChange={(e) => setSettings({ ...settings, withdrawal_status: e.target.value as any })}
                className="w-full bg-[#070b14] border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-blue-500"
              >
                <option value="OPEN">🟢 Buka (User Bisa WD)</option>
                <option value="CLOSED">🔴 Tutup Sementara</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">Fee Minimum (%)</label>
              <input
                type="number"
                min={0}
                max={100}
                value={settings.withdrawal_fee_min}
                onChange={(e) => setSettings({ ...settings, withdrawal_fee_min: Number(e.target.value) })}
                className="w-full bg-[#070b14] border border-white/10 rounded-xl px-3.5 py-2.5 text-xs font-mono font-bold text-white focus:outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">Fee Maksimum (%)</label>
              <input
                type="number"
                min={0}
                max={100}
                value={settings.withdrawal_fee_max}
                onChange={(e) => setSettings({ ...settings, withdrawal_fee_max: Number(e.target.value) })}
                className="w-full bg-[#070b14] border border-white/10 rounded-xl px-3.5 py-2.5 text-xs font-mono font-bold text-white focus:outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Fee Aktif Saat Ini (%)
              </label>
              <input
                type="number"
                min={settings.withdrawal_fee_min}
                max={settings.withdrawal_fee_max}
                value={settings.withdrawal_fee_current}
                onChange={(e) => setSettings({ ...settings, withdrawal_fee_current: Number(e.target.value) })}
                className="w-full bg-[#070b14] border border-white/10 rounded-xl px-3.5 py-2.5 text-xs font-mono font-bold text-amber-400 focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>

          {/* Interactive Fee Sandbox */}
          <div className="p-4 rounded-2xl bg-white/5 border border-white/5 space-y-2">
            <h4 className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
              <Calculator className="w-3.5 h-3.5 text-amber-400" />
              <span>Simulasi Kalkulasi Fee Pengguna:</span>
            </h4>
            <div className="flex flex-wrap items-center gap-4 text-xs">
              <div className="flex items-center gap-2">
                <span className="text-slate-400">Nominal WD Test:</span>
                <input
                  type="number"
                  step={10000}
                  value={calcGross}
                  onChange={(e) => setCalcGross(Number(e.target.value))}
                  className="w-32 bg-[#070b14] border border-white/10 rounded-lg px-2 py-1 font-mono font-bold text-white"
                />
              </div>
              <div className="text-rose-400 font-mono">
                Fee ({feePercent}%): -Rp {calFeeAmount.toLocaleString('id-ID')}
              </div>
              <div className="text-emerald-400 font-mono font-bold">
                Net Transfer: Rp {calcNetAmount.toLocaleString('id-ID')}
              </div>
            </div>
          </div>
        </div>

        {/* 4. REFERRAL & SECURITY SETTINGS */}
        <div className="p-6 rounded-3xl bg-[#121826] border border-white/10 shadow-xl space-y-4">
          <div className="flex items-center gap-2 border-b border-white/10 pb-3">
            <Users className="w-5 h-5 text-indigo-400" />
            <h2 className="text-sm font-bold text-white">Program Referral & Keamanan</h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Reward Referral per Setoran Approved (Rp)
              </label>
              <input
                type="number"
                min={0}
                step={50}
                value={settings.referral_reward_per_deposit}
                onChange={(e) =>
                  setSettings({ ...settings, referral_reward_per_deposit: Number(e.target.value) })
                }
                className="w-full bg-[#070b14] border border-white/10 rounded-xl px-3.5 py-2.5 text-xs font-mono font-bold text-white focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">Status Program Referral</label>
              <select
                value={settings.referral_status}
                onChange={(e) => setSettings({ ...settings, referral_status: e.target.value as any })}
                className="w-full bg-[#070b14] border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-indigo-500"
              >
                <option value="OPEN">🟢 Buka (Memberi Komisi)</option>
                <option value="CLOSED">🔴 Tutup</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">Pesan Peringatan Keamanan</label>
            <textarea
              rows={2}
              value={settings.security_warning}
              onChange={(e) => setSettings({ ...settings, security_warning: e.target.value })}
              className="w-full bg-[#070b14] border border-white/10 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-indigo-500"
            />
          </div>
        </div>

        {/* Save Button */}
        <button
          id="btn-save-admin-settings"
          type="submit"
          disabled={isSaving}
          className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-violet-600 via-indigo-600 to-purple-600 hover:from-violet-500 hover:to-indigo-500 text-white font-bold text-sm shadow-xl shadow-violet-600/30 flex items-center justify-center gap-2 transition active:scale-98 disabled:opacity-50"
        >
          <Save className="w-4 h-4" />
          <span>{isSaving ? 'Menyimpan Pengaturan...' : 'Simpan Seluruh Pengaturan Sistem'}</span>
        </button>
      </form>
    </div>
  );
};
