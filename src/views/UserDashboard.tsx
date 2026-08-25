import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { UserDashboardData } from '../types';
import { api } from '../lib/api';
import {
  Wallet,
  Coins,
  CheckCircle2,
  Clock,
  ArrowUpRight,
  Flame,
  ArrowDownToLine,
  Bell,
  Sparkles,
  RefreshCw,
  Share2,
  TrendingUp,
  BarChart3,
  Users,
  Inbox,
  ShieldCheck,
} from 'lucide-react';

interface UserDashboardProps {
  setCurrentTab?: (tab: string) => void;
}

export const UserDashboard: React.FC<UserDashboardProps> = ({ setCurrentTab }) => {
  const { user, refreshUser } = useAuth();
  const navigate = useNavigate();
  const [data, setData] = useState<UserDashboardData | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const goTo = (tabOrPath: string) => {
    if (setCurrentTab) setCurrentTab(tabOrPath);
    const pathMap: Record<string, string> = {
      deposit: '/deposit',
      wallet: '/wallet',
      history: '/history',
      referral: '/referral',
      rules: '/rules',
      profile: '/profile',
      dashboard: '/dashboard',
      home: '/dashboard',
    };
    const destination = pathMap[tabOrPath] || (tabOrPath.startsWith('/') ? tabOrPath : `/${tabOrPath}`);
    navigate(destination);
  };

  const fetchDashboard = async () => {
    setIsLoading(true);
    const res = await api.get<UserDashboardData>('/user/dashboard');
    if (res.data) {
      setData(res.data);
    }
    setIsLoading(false);
  };

  useEffect(() => {
    fetchDashboard();
  }, []);

  const handleRefresh = async () => {
    await Promise.all([fetchDashboard(), refreshUser()]);
  };

  if (isLoading && !data) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-3">
          <RefreshCw className="w-8 h-8 text-violet-500 animate-spin" />
          <p className="text-sm font-medium text-slate-400">Memuat dashboard Anda...</p>
        </div>
      </div>
    );
  }

  const stats = data?.stats || {
    available_balance: user?.available_balance || 0,
    reserved_balance: user?.reserved_balance || 0,
    total_balance: (user?.available_balance || 0) + (user?.reserved_balance || 0),
    gmail_rate: 4300,
    approved_gmail_count: 0,
    pending_gmail_count: 0,
    rejected_gmail_count: 0,
    today_submitted_count: 0,
    daily_limit: 30,
    total_withdrawn: 0,
    pending_withdrawals_count: 0,
  };

  const settings = data?.settings || {
    site_name: 'YAO SGMAIL',
    gmail_rate: 4300,
    minimum_withdrawal: 50000,
    minimum_approved_gmail_for_withdrawal: 2,
    withdrawal_fee_current: 15,
    deposit_status: 'OPEN',
    withdrawal_status: 'OPEN',
    room_status: 'OPEN',
    announcement: 'Selamat datang di YAO SGMAIL! Setor akun Gmail Anda dengan rate tertinggi dan pencairan dana super cepat.',
    security_warning: 'Jangan masukkan password Gmail, OTP, atau data sensitif.',
  };

  const progressPercent =
    settings.daily_limit > 0
      ? Math.min(100, Math.round((stats.today_submitted_count / settings.daily_limit) * 100))
      : 0;

  return (
    <div className="space-y-6">
      {/* Header Welcome & Quick Refresh */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-gradient-to-r from-violet-950/40 via-[#121826] to-[#121826] p-5 rounded-3xl border border-white/10 shadow-xl">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">
              Hai, {user?.username} 👋
            </h1>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
              Akun Aktif
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Pantau saldo, setoran Gmail Anda, dan ajukan penarikan dana dengan mudah.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            id="btn-refresh-user-dash"
            onClick={handleRefresh}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 text-xs font-semibold border border-white/10 transition"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            <span>Segarkan</span>
          </button>

          <button
            id="btn-dash-setor-cta"
            onClick={() => goTo('deposit')}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white text-xs font-bold shadow-lg shadow-violet-600/30 transition active:scale-95"
          >
            <Flame className="w-4 h-4" />
            <span>Setor Gmail</span>
          </button>
        </div>
      </div>

      {/* System Announcement Banner */}
      {settings.announcement && (
        <div className="flex items-start gap-3 p-4 rounded-2xl bg-gradient-to-r from-violet-900/30 via-indigo-900/20 to-purple-900/30 border border-violet-500/30 text-xs text-violet-200">
          <Bell className="w-4 h-4 text-violet-400 shrink-0 mt-0.5" />
          <div className="flex-1">
            <span className="font-bold text-violet-300 mr-1.5">Pengumuman:</span>
            <span>{settings.announcement}</span>
          </div>
        </div>
      )}

      {/* 4 PRIMARY STAT CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Saldo */}
        <div
          id="stat-card-balance"
          className="relative p-5 rounded-2xl bg-[#121826] border border-white/10 shadow-lg overflow-hidden group hover:border-emerald-500/40 transition"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400">Saldo Tersedia</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <Wallet className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-xl sm:text-2xl font-black text-emerald-400 font-mono tracking-tight">
              Rp {stats.available_balance.toLocaleString('id-ID')}
            </div>
            {stats.reserved_balance > 0 && (
              <p className="text-[11px] text-amber-400/90 mt-1 flex items-center gap-1">
                <Clock className="w-3 h-3" />
                <span>Reserved: Rp {stats.reserved_balance.toLocaleString('id-ID')}</span>
              </p>
            )}
          </div>
          <button
            onClick={() => goTo('wallet')}
            className="mt-3 text-[11px] font-semibold text-emerald-400 hover:text-emerald-300 flex items-center gap-1 transition"
          >
            <span>Tarik Saldo</span>
            <ArrowUpRight className="w-3 h-3" />
          </button>
        </div>

        {/* Card 2: Rate Gmail */}
        <div
          id="stat-card-rate"
          className="p-5 rounded-2xl bg-[#121826] border border-white/10 shadow-lg group hover:border-violet-500/40 transition"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400">Rate Gmail Saat Ini</span>
            <div className="w-8 h-8 rounded-xl bg-violet-500/15 border border-violet-500/30 flex items-center justify-center text-violet-400">
              <Coins className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-xl sm:text-2xl font-black text-violet-300 font-mono tracking-tight">
              Rp {settings.gmail_rate.toLocaleString('id-ID')}
            </div>
            <p className="text-[11px] text-slate-400 mt-1 flex items-center gap-1">
              <TrendingUp className="w-3 h-3 text-violet-400" />
              <span>Per Akun Gmail Valid</span>
            </p>
          </div>
          <button
            onClick={() => goTo('deposit')}
            className="mt-3 text-[11px] font-semibold text-violet-400 hover:text-violet-300 flex items-center gap-1 transition"
          >
            <span>Setor Sekarang</span>
            <ArrowUpRight className="w-3 h-3" />
          </button>
        </div>

        {/* Card 3: Total Gmail Approved */}
        <div
          id="stat-card-approved"
          className="p-5 rounded-2xl bg-[#121826] border border-white/10 shadow-lg group hover:border-blue-500/40 transition"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400">Gmail Diterima (Approved)</span>
            <div className="w-8 h-8 rounded-xl bg-blue-500/15 border border-blue-500/30 flex items-center justify-center text-blue-400">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-xl sm:text-2xl font-black text-blue-300 font-mono tracking-tight">
              {stats.approved_gmail_count} <span className="text-xs font-normal text-slate-400">Akun</span>
            </div>
            <p className="text-[11px] text-slate-400 mt-1">
              Total hasil: Rp {(stats.approved_gmail_count * settings.gmail_rate).toLocaleString('id-ID')}
            </p>
          </div>
          <button
            onClick={() => goTo('history')}
            className="mt-3 text-[11px] font-semibold text-blue-400 hover:text-blue-300 flex items-center gap-1 transition"
          >
            <span>Lihat Riwayat</span>
            <ArrowUpRight className="w-3 h-3" />
          </button>
        </div>

        {/* Card 4: Total Gmail Pending */}
        <div
          id="stat-card-pending"
          className="p-5 rounded-2xl bg-[#121826] border border-white/10 shadow-lg group hover:border-amber-500/40 transition"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400">Gmail Menunggu Review</span>
            <div className="w-8 h-8 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-xl sm:text-2xl font-black text-amber-300 font-mono tracking-tight">
              {stats.pending_gmail_count} <span className="text-xs font-normal text-slate-400">Akun</span>
            </div>
            <p className="text-[11px] text-slate-400 mt-1">
              Estimasi: Rp {(stats.pending_gmail_count * settings.gmail_rate).toLocaleString('id-ID')}
            </p>
          </div>
          <button
            onClick={() => goTo('history')}
            className="mt-3 text-[11px] font-semibold text-amber-400 hover:text-amber-300 flex items-center gap-1 transition"
          >
            <span>Periksa Status</span>
            <ArrowUpRight className="w-3 h-3" />
          </button>
        </div>
      </div>

      {/* Progress Setoran Hari Ini & Info Aturan WD */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Progress Setoran Hari Ini */}
        <div className="p-5 rounded-2xl bg-[#121826] border border-white/10 shadow-md">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h3 className="text-xs font-bold text-slate-200">Progress Setoran Hari Ini</h3>
              <p className="text-[11px] text-slate-400">Batas kuota harian akun Gmail yang disetor</p>
            </div>
            <span className="text-xs font-mono font-bold text-violet-400">
              {stats.today_submitted_count} / {settings.daily_limit} Gmail
            </span>
          </div>

          <div className="w-full h-2.5 rounded-full bg-[#070b14] overflow-hidden border border-white/5">
            <div
              className="h-full bg-gradient-to-r from-violet-500 to-indigo-500 transition-all duration-500"
              style={{ width: `${progressPercent}%` }}
            />
          </div>

          <div className="flex items-center justify-between text-[11px] text-slate-400 mt-2">
            <span>Tersedia: {Math.max(0, settings.daily_limit - stats.today_submitted_count)} slot lagi</span>
            <span>Status: {settings.deposit_status === 'OPEN' ? '🟢 Buka' : '🔴 Tutup'}</span>
          </div>
        </div>

        {/* Info Syarat & Ketentuan Penarikan (WD) */}
        <div className="p-5 rounded-2xl bg-[#121826] border border-white/10 shadow-md flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-emerald-400" />
                <span>Ketentuan Withdrawal (WD)</span>
              </h3>
              <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-bold">
                Fee {settings.withdrawal_fee_current}%
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs text-slate-300 mt-3">
              <div className="p-2 rounded-xl bg-white/5 border border-white/5">
                <p className="text-[10px] text-slate-400">Minimum WD</p>
                <p className="font-bold text-white font-mono">
                  Rp {settings.minimum_withdrawal.toLocaleString('id-ID')}
                </p>
              </div>
              <div className="p-2 rounded-xl bg-white/5 border border-white/5">
                <p className="text-[10px] text-slate-400">Syarat Gmail Disetujui</p>
                <p className="font-bold text-white font-mono">
                  Minimal {settings.minimum_approved_gmail_for_withdrawal} Akun Approved
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between mt-3 pt-3 border-t border-white/10 text-[11px]">
            <button
              onClick={() => goTo('rules')}
              className="text-slate-400 hover:text-slate-200 transition underline decoration-dotted"
            >
              Baca Rules Lengkap
            </button>
            <button
              onClick={() => goTo('wallet')}
              className="text-emerald-400 hover:text-emerald-300 font-semibold flex items-center gap-1"
            >
              <span>Buka Wallet</span>
              <ArrowDownToLine className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* GLOBAL STATS PLATFORM (PUBLIC DISPLAY IF ENABLED BY ADMIN) */}
      {data?.global_stats?.enabled && data.global_stats.values && (
        <div className="p-5 sm:p-6 rounded-3xl bg-gradient-to-r from-[#121826] via-[#151c2e] to-[#121826] border border-white/10 shadow-xl space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-violet-500/20 border border-violet-500/30 flex items-center justify-center text-violet-400 shrink-0">
                <BarChart3 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white tracking-tight">
                  Statistik Global Platform
                </h3>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Ringkasan metrik dan performa keseluruhan platform YAO SGMAIL
                </p>
              </div>
            </div>
            <span className="hidden sm:inline-flex text-[10px] font-bold px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              ● Live Platform Stats
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 pt-2 border-t border-white/5">
            {data.global_stats.visibility.total_users && (
              <div className="p-3 rounded-2xl bg-white/[0.03] border border-white/5">
                <span className="text-[11px] text-slate-400 block">Total User Terdaftar</span>
                <span className="text-base sm:text-lg font-black text-white font-mono mt-0.5 block">
                  {data.global_stats.values.total_users?.toLocaleString('id-ID')}
                </span>
              </div>
            )}

            {data.global_stats.visibility.user_aktif && (
              <div className="p-3 rounded-2xl bg-white/[0.03] border border-white/5">
                <span className="text-[11px] text-slate-400 block">User Aktif</span>
                <span className="text-base sm:text-lg font-black text-emerald-400 font-mono mt-0.5 block">
                  {data.global_stats.values.user_aktif?.toLocaleString('id-ID')}
                </span>
              </div>
            )}

            {data.global_stats.visibility.user_nonaktif && (
              <div className="p-3 rounded-2xl bg-white/[0.03] border border-white/5">
                <span className="text-[11px] text-slate-400 block">User Nonaktif</span>
                <span className="text-base sm:text-lg font-black text-slate-400 font-mono mt-0.5 block">
                  {data.global_stats.values.user_nonaktif?.toLocaleString('id-ID')}
                </span>
              </div>
            )}

            {data.global_stats.visibility.total_gmail && (
              <div className="p-3 rounded-2xl bg-white/[0.03] border border-white/5">
                <span className="text-[11px] text-slate-400 block">Total Gmail Disetor</span>
                <span className="text-base sm:text-lg font-black text-violet-300 font-mono mt-0.5 block">
                  {data.global_stats.values.total_gmail?.toLocaleString('id-ID')}
                </span>
              </div>
            )}

            {data.global_stats.visibility.total_setoran && (
              <div className="p-3 rounded-2xl bg-white/[0.03] border border-white/5">
                <span className="text-[11px] text-slate-400 block">Total Setoran</span>
                <span className="text-base sm:text-lg font-black text-indigo-300 font-mono mt-0.5 block">
                  {data.global_stats.values.total_setoran?.toLocaleString('id-ID')}
                </span>
              </div>
            )}

            {data.global_stats.visibility.gmail_acc && (
              <div className="p-3 rounded-2xl bg-white/[0.03] border border-white/5">
                <span className="text-[11px] text-slate-400 block">Gmail Approved (ACC)</span>
                <span className="text-base sm:text-lg font-black text-emerald-300 font-mono mt-0.5 block">
                  {data.global_stats.values.gmail_acc?.toLocaleString('id-ID')}
                </span>
              </div>
            )}

            {data.global_stats.visibility.gmail_pending && (
              <div className="p-3 rounded-2xl bg-white/[0.03] border border-white/5">
                <span className="text-[11px] text-slate-400 block">Gmail Pending</span>
                <span className="text-base sm:text-lg font-black text-amber-300 font-mono mt-0.5 block">
                  {data.global_stats.values.gmail_pending?.toLocaleString('id-ID')}
                </span>
              </div>
            )}

            {data.global_stats.visibility.gmail_reject && (
              <div className="p-3 rounded-2xl bg-white/[0.03] border border-white/5">
                <span className="text-[11px] text-slate-400 block">Gmail Ditolak</span>
                <span className="text-base sm:text-lg font-black text-rose-400 font-mono mt-0.5 block">
                  {data.global_stats.values.gmail_reject?.toLocaleString('id-ID')}
                </span>
              </div>
            )}

            {data.global_stats.visibility.total_wd && (
              <div className="p-3 rounded-2xl bg-white/[0.03] border border-white/5">
                <span className="text-[11px] text-slate-400 block">Total Transaksi WD</span>
                <span className="text-base sm:text-lg font-black text-blue-300 font-mono mt-0.5 block">
                  {data.global_stats.values.total_wd?.toLocaleString('id-ID')}
                </span>
              </div>
            )}

            {data.global_stats.visibility.wd_acc && (
              <div className="p-3 rounded-2xl bg-white/[0.03] border border-white/5">
                <span className="text-[11px] text-slate-400 block">WD Sukses (ACC)</span>
                <span className="text-base sm:text-lg font-black text-teal-300 font-mono mt-0.5 block">
                  {data.global_stats.values.wd_acc?.toLocaleString('id-ID')}
                </span>
              </div>
            )}

            {data.global_stats.visibility.wd_pending && (
              <div className="p-3 rounded-2xl bg-white/[0.03] border border-white/5">
                <span className="text-[11px] text-slate-400 block">WD Pending</span>
                <span className="text-base sm:text-lg font-black text-amber-300 font-mono mt-0.5 block">
                  {data.global_stats.values.wd_pending?.toLocaleString('id-ID')}
                </span>
              </div>
            )}

            {data.global_stats.visibility.wd_reject && (
              <div className="p-3 rounded-2xl bg-white/[0.03] border border-white/5">
                <span className="text-[11px] text-slate-400 block">WD Ditolak</span>
                <span className="text-base sm:text-lg font-black text-rose-400 font-mono mt-0.5 block">
                  {data.global_stats.values.wd_reject?.toLocaleString('id-ID')}
                </span>
              </div>
            )}

            {data.global_stats.visibility.total_nominal_setoran && (
              <div className="p-3 rounded-2xl bg-white/[0.03] border border-white/5">
                <span className="text-[11px] text-slate-400 block">Nominal Setoran</span>
                <span className="text-base sm:text-lg font-black text-purple-300 font-mono mt-0.5 block">
                  Rp {(data.global_stats.values.total_nominal_setoran || 0).toLocaleString('id-ID')}
                </span>
              </div>
            )}

            {data.global_stats.visibility.total_nominal_wd && (
              <div className="p-3 rounded-2xl bg-white/[0.03] border border-white/5">
                <span className="text-[11px] text-slate-400 block">Nominal WD Dicairkan</span>
                <span className="text-base sm:text-lg font-black text-emerald-300 font-mono mt-0.5 block">
                  Rp {(data.global_stats.values.total_nominal_wd || 0).toLocaleString('id-ID')}
                </span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* QUICK SHORTCUTS & RECENT SETORAN TABLE */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold text-slate-200">Setoran Terbaru Anda</h2>
          <button
            id="btn-view-all-deposits"
            onClick={() => goTo('history')}
            className="text-xs font-semibold text-violet-400 hover:text-violet-300 transition"
          >
            Lihat Semua Riwayat →
          </button>
        </div>

        <div className="rounded-2xl bg-[#121826] border border-white/10 overflow-hidden shadow-lg">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#1a2234] text-slate-400 border-b border-white/10 uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="px-4 py-3">Alamat Gmail</th>
                  <th className="px-4 py-3">Rate</th>
                  <th className="px-4 py-3">Waktu Kirim</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Keterangan</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 text-slate-200">
                {data?.recent_deposits && data.recent_deposits.length > 0 ? (
                  data.recent_deposits.map((dep) => (
                    <tr key={dep.id} className="hover:bg-white/5 transition">
                      <td className="px-4 py-3 font-mono font-medium text-slate-100">{dep.gmail}</td>
                      <td className="px-4 py-3 font-mono text-violet-400 font-bold">
                        Rp {dep.amount.toLocaleString('id-ID')}
                      </td>
                      <td className="px-4 py-3 text-slate-400">
                        {new Date(dep.created_at).toLocaleString('id-ID', {
                          day: 'numeric',
                          month: 'short',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-md ${
                            dep.status === 'APPROVED'
                              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                              : dep.status === 'PENDING'
                              ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                              : 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                          }`}
                        >
                          {dep.status === 'APPROVED' && <CheckCircle2 className="w-3 h-3" />}
                          {dep.status === 'PENDING' && <Clock className="w-3 h-3" />}
                          {dep.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-slate-400 max-w-xs truncate">
                        {dep.reject_reason ? (
                          <span className="text-rose-400">{dep.reject_reason}</span>
                        ) : dep.status === 'APPROVED' ? (
                          <span className="text-emerald-400">Saldo ditambahkan</span>
                        ) : (
                          'Sedang ditinjau'
                        )}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} className="px-4 py-8 text-center text-slate-400">
                      <p className="text-sm font-medium">Belum ada setoran Gmail.</p>
                      <button
                        onClick={() => goTo('deposit')}
                        className="mt-2 text-xs font-semibold text-violet-400 hover:underline inline-flex items-center gap-1"
                      >
                        <Flame className="w-3.5 h-3.5" />
                        <span>Mulai setor Gmail sekarang</span>
                      </button>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Referral Quick Card */}
      <div className="p-5 rounded-2xl bg-gradient-to-r from-indigo-950/40 to-violet-950/40 border border-indigo-500/30 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3 text-left">
          <div className="w-10 h-10 rounded-xl bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400 shrink-0">
            <Share2 className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-xs font-bold text-white">Ajak Teman & Dapatkan Bonus Saldo</h3>
            <p className="text-[11px] text-slate-300 mt-0.5">
              Kode Referral Anda: <span className="font-mono font-bold text-violet-300">{user?.referral_code}</span>
            </p>
          </div>
        </div>
        <button
          onClick={() => goTo('referral')}
          className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-md transition shrink-0"
        >
          Lihat Program Referral
        </button>
      </div>
    </div>
  );
};
