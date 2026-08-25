import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../../lib/api';
import { useToast } from '../../context/ToastContext';
import { AdminDashboardData } from '../../types';
import {
  Users,
  Inbox,
  ArrowDownToLine,
  CheckCircle2,
  Wallet,
  Coins,
  Receipt,
  Settings,
  RefreshCw,
  Clock,
  ArrowUpRight,
  TrendingUp,
  AlertTriangle,
  FileCode,
  ScrollText,
  BarChart3,
  Sliders,
  Sparkles,
} from 'lucide-react';

interface AdminDashboardProps {
  setCurrentTab?: (tab: string) => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ setCurrentTab }) => {
  const { success, error } = useToast();
  const navigate = useNavigate();
  const [data, setData] = useState<AdminDashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const goTo = (tabOrPath: string) => {
    if (setCurrentTab) setCurrentTab(tabOrPath);
    const pathMap: Record<string, string> = {
      admin_dashboard: '/admin',
      admin_deposits: '/admin/deposits',
      admin_withdrawals: '/admin/withdrawals',
      admin_users: '/admin/users',
      admin_referral: '/admin/referral',
      admin_statistics: '/admin/statistics',
      admin_settings: '/admin/settings',
      admin_rules: '/admin/rules',
      admin_logs: '/admin/logs',
    };
    const destination = pathMap[tabOrPath] || (tabOrPath.startsWith('/') ? tabOrPath : `/admin/${tabOrPath}`);
    navigate(destination);
  };

  const fetchAdminDashboard = async () => {
    setIsLoading(true);
    const res = await api.get<AdminDashboardData>('/admin/dashboard');
    if (res.data) {
      setData(res.data);
    }
    setIsLoading(false);
  };

  useEffect(() => {
    fetchAdminDashboard();
  }, []);

  const handleToggleRoomStatus = async (newStatus: 'OPEN' | 'MAINTENANCE' | 'CLOSED') => {
    const res = await api.put('/admin/settings', { room_status: newStatus });
    if (res.error) {
      error(res.error || 'Gagal mengubah status sistem.');
      return;
    }
    success(`Status sistem diubah menjadi: ${newStatus}`);
    fetchAdminDashboard();
  };

  if (isLoading && !data) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <RefreshCw className="w-8 h-8 text-violet-500 animate-spin" />
      </div>
    );
  }

  const s = data?.stats || {
    total_users: 0,
    active_users: 0,
    pending_deposits_count: 0,
    approved_deposits_count: 0,
    rejected_deposits_count: 0,
    total_deposits_count: 0,
    pending_withdrawals_count: 0,
    approved_withdrawals_count: 0,
    rejected_withdrawals_count: 0,
    total_user_available_balance: 0,
    total_user_reserved_balance: 0,
    total_withdrawn_amount: 0,
    total_fees_collected: 0,
    gmail_rate: 4300,
    minimum_withdrawal: 50000,
    minimum_approved_gmail: 2,
    withdrawal_fee_current: 15,
    room_status: 'OPEN' as const,
  };

  return (
    <div className="space-y-6">
      {/* Header & Quick Status Switcher */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-gradient-to-r from-violet-950/40 via-[#121826] to-[#121826] p-6 rounded-3xl border border-white/10 shadow-xl">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">
              Control Panel Administrator
            </h1>
            <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
              Super Admin
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Monitoring transaksi saldo secara real-time, approval setoran, pencairan dana, dan konfigurasi sistem.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Kelola Statistik Button */}
          <button
            id="btn-admin-manage-stats-top"
            onClick={() => goTo('admin_statistics')}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white text-xs font-bold shadow-lg shadow-violet-600/30 transition active:scale-95"
          >
            <BarChart3 className="w-3.5 h-3.5" />
            <span>Kelola Statistik</span>
          </button>

          {/* Quick Room Status Switcher */}
          <div className="flex bg-[#070b14] p-1 rounded-xl border border-white/10 text-xs font-bold">
            <button
              onClick={() => handleToggleRoomStatus('OPEN')}
              className={`px-2.5 py-1.5 rounded-lg transition ${
                s.room_status === 'OPEN' ? 'bg-emerald-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              🟢 OPEN
            </button>
            <button
              onClick={() => handleToggleRoomStatus('MAINTENANCE')}
              className={`px-2.5 py-1.5 rounded-lg transition ${
                s.room_status === 'MAINTENANCE'
                  ? 'bg-amber-600 text-white shadow'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              🟡 MAINT
            </button>
            <button
              onClick={() => handleToggleRoomStatus('CLOSED')}
              className={`px-2.5 py-1.5 rounded-lg transition ${
                s.room_status === 'CLOSED' ? 'bg-rose-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              🔴 CLOSED
            </button>
          </div>

          <button
            onClick={fetchAdminDashboard}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 text-xs font-semibold border border-white/10 transition"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            <span>Segarkan</span>
          </button>
        </div>
      </div>

      {/* QUICK ACTION TILES */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <button
          id="btn-admin-quick-deposits"
          onClick={() => goTo('admin_deposits')}
          className="p-4 rounded-2xl bg-[#121826] hover:bg-[#1a2234] border border-violet-500/30 text-left transition flex items-center justify-between group shadow-md"
        >
          <div>
            <p className="text-[11px] text-slate-400 font-medium">Setoran Pending</p>
            <p className="text-xl font-black text-violet-400 font-mono mt-0.5">{s.pending_deposits_count}</p>
          </div>
          <div className="w-9 h-9 rounded-xl bg-violet-500/20 text-violet-400 flex items-center justify-center group-hover:scale-110 transition">
            <Inbox className="w-5 h-5" />
          </div>
        </button>

        <button
          id="btn-admin-quick-wd"
          onClick={() => goTo('admin_withdrawals')}
          className="p-4 rounded-2xl bg-[#121826] hover:bg-[#1a2234] border border-emerald-500/30 text-left transition flex items-center justify-between group shadow-md"
        >
          <div>
            <p className="text-[11px] text-slate-400 font-medium">WD Menunggu</p>
            <p className="text-xl font-black text-emerald-400 font-mono mt-0.5">{s.pending_withdrawals_count}</p>
          </div>
          <div className="w-9 h-9 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center group-hover:scale-110 transition">
            <ArrowDownToLine className="w-5 h-5" />
          </div>
        </button>

        <button
          id="btn-admin-quick-users"
          onClick={() => goTo('admin_users')}
          className="p-4 rounded-2xl bg-[#121826] hover:bg-[#1a2234] border border-blue-500/30 text-left transition flex items-center justify-between group shadow-md"
        >
          <div>
            <p className="text-[11px] text-slate-400 font-medium">Total Pengguna</p>
            <p className="text-xl font-black text-blue-400 font-mono mt-0.5">{s.total_users}</p>
          </div>
          <div className="w-9 h-9 rounded-xl bg-blue-500/20 text-blue-400 flex items-center justify-center group-hover:scale-110 transition">
            <Users className="w-5 h-5" />
          </div>
        </button>

        <button
          id="btn-admin-quick-settings"
          onClick={() => goTo('admin_settings')}
          className="p-4 rounded-2xl bg-[#121826] hover:bg-[#1a2234] border border-amber-500/30 text-left transition flex items-center justify-between group shadow-md"
        >
          <div>
            <p className="text-[11px] text-slate-400 font-medium">Fee WD / Rate</p>
            <p className="text-xl font-black text-amber-400 font-mono mt-0.5">{s.withdrawal_fee_current}%</p>
          </div>
          <div className="w-9 h-9 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center group-hover:scale-110 transition">
            <Settings className="w-5 h-5" />
          </div>
        </button>
      </div>

      {/* METRIC OVERVIEW GRID */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total User Saldo Available */}
        <div className="p-5 rounded-2xl bg-[#121826] border border-white/10 shadow-lg">
          <span className="text-xs font-medium text-slate-400 flex items-center gap-1.5">
            <Wallet className="w-4 h-4 text-emerald-400" />
            <span>Total Saldo User (Available)</span>
          </span>
          <p className="text-xl sm:text-2xl font-black text-emerald-400 font-mono mt-2">
            Rp {s.total_user_available_balance.toLocaleString('id-ID')}
          </p>
          <p className="text-[10px] text-slate-400 mt-1">
            + Reserved: Rp {s.total_user_reserved_balance.toLocaleString('id-ID')}
          </p>
        </div>

        {/* Total WD Selesai */}
        <div className="p-5 rounded-2xl bg-[#121826] border border-white/10 shadow-lg">
          <span className="text-xs font-medium text-slate-400 flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-blue-400" />
            <span>Total WD Terbayar</span>
          </span>
          <p className="text-xl sm:text-2xl font-black text-blue-300 font-mono mt-2">
            Rp {s.total_withdrawn_amount.toLocaleString('id-ID')}
          </p>
          <p className="text-[10px] text-slate-400 mt-1">{s.approved_withdrawals_count} transaksi sukses</p>
        </div>

        {/* Total Fee WD Terkumpul */}
        <div className="p-5 rounded-2xl bg-[#121826] border border-white/10 shadow-lg">
          <span className="text-xs font-medium text-slate-400 flex items-center gap-1.5">
            <Receipt className="w-4 h-4 text-purple-400" />
            <span>Total Fee WD Masuk</span>
          </span>
          <p className="text-xl sm:text-2xl font-black text-purple-300 font-mono mt-2">
            Rp {s.total_fees_collected.toLocaleString('id-ID')}
          </p>
          <p className="text-[10px] text-slate-400 mt-1">Pendapatan administrasi sistem</p>
        </div>

        {/* Total Gmail Approved */}
        <div className="p-5 rounded-2xl bg-[#121826] border border-white/10 shadow-lg">
          <span className="text-xs font-medium text-slate-400 flex items-center gap-1.5">
            <Coins className="w-4 h-4 text-amber-400" />
            <span>Total Gmail Approved</span>
          </span>
          <p className="text-xl sm:text-2xl font-black text-amber-300 font-mono mt-2">
            {s.approved_deposits_count} <span className="text-xs font-normal text-slate-400">Akun</span>
          </p>
          <p className="text-[10px] text-slate-400 mt-1">Rate: Rp {s.gmail_rate.toLocaleString('id-ID')}/akun</p>
        </div>
      </div>

      {/* STATISTIK GLOBAL PLATFORM WIDGET */}
      {data?.global_stats_config && (
        <div className="bg-gradient-to-r from-indigo-950/40 via-[#121826] to-[#121826] p-5 rounded-3xl border border-violet-500/20 shadow-xl space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-violet-600/20 border border-violet-500/30 flex items-center justify-center text-violet-400 shrink-0">
                <BarChart3 className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-sm font-bold text-white tracking-tight">Statistik Global Platform</h2>
                  <span
                    className={`text-[9px] font-extrabold uppercase px-2 py-0.5 rounded-full border ${
                      data.global_stats_config.mode === 'auto'
                        ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                        : 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                    }`}
                  >
                    {data.global_stats_config.mode === 'auto' ? 'Mode Otomatis' : 'Mode Manual'}
                  </span>
                  <span
                    className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${
                      data.global_stats_config.show_to_users
                        ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                        : 'bg-slate-500/20 text-slate-400'
                    }`}
                  >
                    {data.global_stats_config.show_to_users ? 'Tampil ke User' : 'Disembunyikan'}
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Menampilkan metrik agregat platform untuk transparansi dan kepercayaan member.
                </p>
              </div>
            </div>

            <button
              id="btn-admin-goto-statistics"
              onClick={() => goTo('admin_statistics')}
              className="flex items-center justify-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-violet-600/20 hover:bg-violet-600/30 text-violet-300 text-xs font-bold border border-violet-500/30 transition self-start sm:self-auto"
            >
              <Sliders className="w-3.5 h-3.5" />
              <span>Atur 14 Metrik Statistik</span>
            </button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2.5 pt-2 border-t border-white/5 text-center">
            <div className="p-2.5 rounded-xl bg-white/[0.03] border border-white/5">
              <span className="text-[10px] text-slate-400 block">Total User</span>
              <span className="text-sm font-black text-white font-mono">
                {data.global_stats_active?.total_users.toLocaleString('id-ID')}
              </span>
            </div>
            <div className="p-2.5 rounded-xl bg-white/[0.03] border border-white/5">
              <span className="text-[10px] text-slate-400 block">Total Gmail</span>
              <span className="text-sm font-black text-violet-300 font-mono">
                {data.global_stats_active?.total_gmail.toLocaleString('id-ID')}
              </span>
            </div>
            <div className="p-2.5 rounded-xl bg-white/[0.03] border border-white/5">
              <span className="text-[10px] text-slate-400 block">Gmail ACC</span>
              <span className="text-sm font-black text-emerald-300 font-mono">
                {data.global_stats_active?.gmail_acc.toLocaleString('id-ID')}
              </span>
            </div>
            <div className="p-2.5 rounded-xl bg-white/[0.03] border border-white/5">
              <span className="text-[10px] text-slate-400 block">Gmail Pending</span>
              <span className="text-sm font-black text-amber-300 font-mono">
                {data.global_stats_active?.gmail_pending.toLocaleString('id-ID')}
              </span>
            </div>
            <div className="p-2.5 rounded-xl bg-white/[0.03] border border-white/5">
              <span className="text-[10px] text-slate-400 block">Total WD</span>
              <span className="text-sm font-black text-blue-300 font-mono">
                {data.global_stats_active?.total_wd.toLocaleString('id-ID')}
              </span>
            </div>
            <div className="p-2.5 rounded-xl bg-white/[0.03] border border-white/5">
              <span className="text-[10px] text-slate-400 block">WD ACC</span>
              <span className="text-sm font-black text-teal-300 font-mono">
                {data.global_stats_active?.wd_acc.toLocaleString('id-ID')}
              </span>
            </div>
            <div className="p-2.5 rounded-xl bg-white/[0.03] border border-white/5">
              <span className="text-[10px] text-slate-400 block">Nominal WD</span>
              <span className="text-sm font-black text-purple-300 font-mono">
                Rp {((data.global_stats_active?.total_nominal_wd || 0) / 1000).toLocaleString('id-ID')}k
              </span>
            </div>
          </div>
        </div>
      )}

      {/* 7-DAY ACTIVITY CHARTS (Pure SVG responsive visualizer) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Setoran 7 Hari */}
        <div className="p-5 rounded-3xl bg-[#121826] border border-white/10 shadow-xl space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
              <TrendingUp className="w-4 h-4 text-violet-400" />
              <span>Setoran Gmail (7 Hari)</span>
            </h3>
            <span className="text-[10px] text-slate-400">Akun</span>
          </div>

          <div className="h-36 flex items-end justify-between gap-2 pt-4 px-2">
            {data?.charts?.dates.map((date, idx) => {
              const count = data.charts.deposits_counts[idx] || 0;
              const maxVal = Math.max(...(data?.charts?.deposits_counts || [1]), 1);
              const heightPercent = Math.max(12, Math.round((count / maxVal) * 100));

              return (
                <div key={idx} className="flex-1 flex flex-col items-center gap-1.5 group">
                  <span className="text-[9px] font-mono text-violet-300 opacity-0 group-hover:opacity-100 transition">
                    {count}
                  </span>
                  <div
                    className="w-full rounded-t-lg bg-gradient-to-t from-violet-700 to-indigo-500 group-hover:from-violet-500 group-hover:to-indigo-400 transition-all duration-300 shadow-sm"
                    style={{ height: `${heightPercent}%` }}
                  />
                  <span className="text-[9px] text-slate-400 font-medium">{date}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Withdrawal 7 Hari */}
        <div className="p-5 rounded-3xl bg-[#121826] border border-white/10 shadow-xl space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
              <ArrowDownToLine className="w-4 h-4 text-emerald-400" />
              <span>Withdrawal Selesai (7 Hari)</span>
            </h3>
            <span className="text-[10px] text-slate-400">IDR</span>
          </div>

          <div className="h-36 flex items-end justify-between gap-2 pt-4 px-2">
            {data?.charts?.dates.map((date, idx) => {
              const amount = data.charts.withdrawals_amounts[idx] || 0;
              const maxVal = Math.max(...(data?.charts?.withdrawals_amounts || [1]), 1);
              const heightPercent = Math.max(12, Math.round((amount / maxVal) * 100));

              return (
                <div key={idx} className="flex-1 flex flex-col items-center gap-1.5 group">
                  <span className="text-[9px] font-mono text-emerald-300 opacity-0 group-hover:opacity-100 transition truncate max-w-[36px]">
                    {amount > 0 ? `${(amount / 1000).toFixed(0)}k` : '0'}
                  </span>
                  <div
                    className="w-full rounded-t-lg bg-gradient-to-t from-emerald-700 to-teal-500 group-hover:from-emerald-500 group-hover:to-teal-400 transition-all duration-300 shadow-sm"
                    style={{ height: `${heightPercent}%` }}
                  />
                  <span className="text-[9px] text-slate-400 font-medium">{date}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* User Baru 7 Hari */}
        <div className="p-5 rounded-3xl bg-[#121826] border border-white/10 shadow-xl space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
              <Users className="w-4 h-4 text-blue-400" />
              <span>Registrasi Pengguna Baru</span>
            </h3>
            <span className="text-[10px] text-slate-400">User</span>
          </div>

          <div className="h-36 flex items-end justify-between gap-2 pt-4 px-2">
            {data?.charts?.dates.map((date, idx) => {
              const count = data.charts.new_users_counts[idx] || 0;
              const maxVal = Math.max(...(data?.charts?.new_users_counts || [1]), 1);
              const heightPercent = Math.max(12, Math.round((count / maxVal) * 100));

              return (
                <div key={idx} className="flex-1 flex flex-col items-center gap-1.5 group">
                  <span className="text-[9px] font-mono text-blue-300 opacity-0 group-hover:opacity-100 transition">
                    {count}
                  </span>
                  <div
                    className="w-full rounded-t-lg bg-gradient-to-t from-blue-700 to-sky-500 group-hover:from-blue-500 group-hover:to-sky-400 transition-all duration-300 shadow-sm"
                    style={{ height: `${heightPercent}%` }}
                  />
                  <span className="text-[9px] text-slate-400 font-medium">{date}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* RECENT PENDING SETORAN & WD TABLES */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Setoran Terbaru */}
        <div className="p-5 rounded-3xl bg-[#121826] border border-white/10 shadow-xl space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-white flex items-center gap-2">
              <Inbox className="w-4 h-4 text-violet-400" />
              <span>Setoran Gmail Terbaru</span>
            </h3>
            <button
              onClick={() => goTo('admin_deposits')}
              className="text-[11px] font-semibold text-violet-400 hover:text-violet-300 transition"
            >
              Buka Semua ({s.total_deposits_count}) →
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#1a2234] text-slate-400 border-b border-white/10 uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="px-3 py-2">Pengirim</th>
                  <th className="px-3 py-2">Gmail</th>
                  <th className="px-3 py-2">Rate</th>
                  <th className="px-3 py-2">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 text-slate-200">
                {data?.recent_deposits && data.recent_deposits.length > 0 ? (
                  data.recent_deposits.slice(0, 6).map((d) => (
                    <tr key={d.id} className="hover:bg-white/5">
                      <td className="px-3 py-2 font-semibold text-slate-100">{d.username}</td>
                      <td className="px-3 py-2 font-mono text-[11px] text-slate-300">{d.gmail}</td>
                      <td className="px-3 py-2 font-mono text-violet-400">Rp {d.amount.toLocaleString('id-ID')}</td>
                      <td className="px-3 py-2">
                        <span
                          className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${
                            d.status === 'APPROVED'
                              ? 'bg-emerald-500/20 text-emerald-300'
                              : d.status === 'PENDING'
                              ? 'bg-amber-500/20 text-amber-300'
                              : 'bg-rose-500/20 text-rose-300'
                          }`}
                        >
                          {d.status}
                        </span>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={4} className="px-3 py-6 text-center text-slate-400 font-medium">
                      Belum ada setoran.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Withdrawal Terbaru */}
        <div className="p-5 rounded-3xl bg-[#121826] border border-white/10 shadow-xl space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-white flex items-center gap-2">
              <ArrowDownToLine className="w-4 h-4 text-emerald-400" />
              <span>Pengajuan WD Terbaru</span>
            </h3>
            <button
              onClick={() => goTo('admin_withdrawals')}
              className="text-[11px] font-semibold text-emerald-400 hover:text-emerald-300 transition"
            >
              Buka Semua ({s.pending_withdrawals_count} pending) →
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#1a2234] text-slate-400 border-b border-white/10 uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="px-3 py-2">User</th>
                  <th className="px-3 py-2">Nominal Bersih</th>
                  <th className="px-3 py-2">Metode / No</th>
                  <th className="px-3 py-2">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 text-slate-200">
                {data?.recent_withdrawals && data.recent_withdrawals.length > 0 ? (
                  data.recent_withdrawals.slice(0, 6).map((w) => (
                    <tr key={w.id} className="hover:bg-white/5">
                      <td className="px-3 py-2 font-semibold text-slate-100">{w.username}</td>
                      <td className="px-3 py-2 font-mono font-bold text-emerald-400">
                        Rp {w.net_amount.toLocaleString('id-ID')}
                      </td>
                      <td className="px-3 py-2 text-slate-300 truncate max-w-[120px]">
                        {w.payment_method} - {w.payment_account}
                      </td>
                      <td className="px-3 py-2">
                        <span
                          className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${
                            w.status === 'APPROVED'
                              ? 'bg-emerald-500/20 text-emerald-300'
                              : w.status === 'PENDING'
                              ? 'bg-amber-500/20 text-amber-300'
                              : 'bg-rose-500/20 text-rose-300'
                          }`}
                        >
                          {w.status}
                        </span>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={4} className="px-3 py-6 text-center text-slate-400 font-medium">
                      Belum ada permintaan penarikan.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* AUDIT ACTIVITY LOGS SNIPPET */}
      <div className="p-5 rounded-3xl bg-[#121826] border border-white/10 shadow-xl space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-bold text-white flex items-center gap-2">
            <ScrollText className="w-4 h-4 text-indigo-400" />
            <span>Audit Log Aktivitas Terakhir</span>
          </h3>
          <button
            onClick={() => goTo('admin_logs')}
            className="text-[11px] font-semibold text-indigo-400 hover:text-indigo-300 transition"
          >
            Lihat Semua Log →
          </button>
        </div>

        <div className="space-y-2">
          {data?.recent_logs && data.recent_logs.length > 0 ? (
            data.recent_logs.slice(0, 5).map((log) => (
              <div
                key={log.id}
                className="p-2.5 rounded-xl bg-white/5 border border-white/5 flex items-center justify-between text-xs gap-3"
              >
                <div className="flex items-center gap-2.5 truncate">
                  <span className="font-mono text-[10px] font-bold px-2 py-0.5 rounded bg-violet-500/20 text-violet-300 shrink-0">
                    {log.action}
                  </span>
                  <span className="text-slate-200 truncate">{log.description}</span>
                </div>
                <span className="text-[10px] text-slate-400 font-mono shrink-0">
                  {new Date(log.created_at).toLocaleTimeString('id-ID', {
                    hour: '2-digit',
                    minute: '2-digit',
                    second: '2-digit',
                  })}
                </span>
              </div>
            ))
          ) : (
            <p className="text-xs text-slate-400 py-4 text-center">Belum ada catatan log.</p>
          )}
        </div>
      </div>
    </div>
  );
};
