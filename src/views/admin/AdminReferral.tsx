import React, { useState, useEffect } from 'react';
import { api } from '../../lib/api';
import { useToast } from '../../context/ToastContext';
import {
  Users,
  Gift,
  Coins,
  TrendingUp,
  Search,
  RefreshCw,
  Award,
  ChevronRight,
  ExternalLink,
  ShieldCheck,
} from 'lucide-react';

interface ReferralStats {
  total_referrals: number;
  total_referrers: number;
  total_commissions_paid: number;
  reward_per_referral: number;
  referral_status: 'ACTIVE' | 'PAUSED';
}

interface ReferrerItem {
  referrer_id: string;
  referrer_username: string;
  referrer_email: string;
  referral_code: string;
  total_referred: number;
  total_commission: number;
  referred_users: Array<{
    user_id: string;
    username: string;
    email: string;
    joined_at: string;
  }>;
}

export const AdminReferral: React.FC = () => {
  const { success, error } = useToast();
  const [stats, setStats] = useState<ReferralStats | null>(null);
  const [referrers, setReferrers] = useState<ReferrerItem[]>([]);
  const [recentRewards, setRecentRewards] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedReferrer, setSelectedReferrer] = useState<ReferrerItem | null>(null);

  const fetchReferralData = async () => {
    setIsLoading(true);
    const res = await api.get('/admin/referral');
    if (res.data) {
      setStats(res.data.stats);
      setReferrers(res.data.referrers || []);
      setRecentRewards(res.data.recent_rewards || []);
    } else if (res.error) {
      error(res.error);
    }
    setIsLoading(false);
  };

  useEffect(() => {
    fetchReferralData();
  }, []);

  const filteredReferrers = referrers.filter(
    (r) =>
      r.referrer_username.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.referrer_email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.referral_code.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (isLoading && !stats) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <RefreshCw className="w-8 h-8 text-violet-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-white tracking-tight flex items-center gap-2.5">
            <Users className="w-7 h-7 text-violet-400" />
            <span>Kelola Program Referral</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Pantau jaringan referral, performa afiliasi, dan komisi reward yang telah disalurkan.
          </p>
        </div>

        <button
          onClick={fetchReferralData}
          disabled={isLoading}
          className="self-start sm:self-auto flex items-center gap-2 px-4 py-2 rounded-xl bg-[#121826] hover:bg-[#1a2234] border border-white/10 text-xs font-semibold text-slate-200 transition"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin text-violet-400' : ''}`} />
          <span>Segarkan Data</span>
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-[#121826]/90 border border-white/10 rounded-2xl p-4">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-medium">Total Member Terdaftar via Ref</span>
            <Users className="w-4 h-4 text-violet-400" />
          </div>
          <p className="text-2xl font-black text-white font-mono">{stats?.total_referrals || 0}</p>
          <p className="text-[11px] text-slate-400 mt-1">Akun yang mendaftar pakai kode ref</p>
        </div>

        <div className="bg-[#121826]/90 border border-white/10 rounded-2xl p-4">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-medium">Total Afiliator Aktif</span>
            <Award className="w-4 h-4 text-indigo-400" />
          </div>
          <p className="text-2xl font-black text-indigo-400 font-mono">{stats?.total_referrers || 0}</p>
          <p className="text-[11px] text-slate-400 mt-1">User yang berhasil mengundang teman</p>
        </div>

        <div className="bg-[#121826]/90 border border-white/10 rounded-2xl p-4">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-medium">Total Komisi Dibayarkan</span>
            <Coins className="w-4 h-4 text-emerald-400" />
          </div>
          <p className="text-2xl font-black text-emerald-400 font-mono">
            Rp {(stats?.total_commissions_paid || 0).toLocaleString('id-ID')}
          </p>
          <p className="text-[11px] text-slate-400 mt-1">Reward referral otomatis ke saldo</p>
        </div>

        <div className="bg-[#121826]/90 border border-white/10 rounded-2xl p-4">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-medium">Status & Reward Saat Ini</span>
            <Gift className="w-4 h-4 text-amber-400" />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-lg font-bold text-white font-mono">
              Rp {(stats?.reward_per_referral || 0).toLocaleString('id-ID')}
            </span>
            <span
              className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                stats?.referral_status === 'ACTIVE'
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                  : 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
              }`}
            >
              {stats?.referral_status === 'ACTIVE' ? 'AKTIF' : 'NONAKTIF'}
            </span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">Reward per setoran approved bawahan</p>
        </div>
      </div>

      {/* Referrer Table & Search */}
      <div className="bg-[#121826]/90 border border-white/10 rounded-3xl p-5 sm:p-6 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-5">
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-violet-400" />
            <span>Daftar Afiliator & Jaringan Bawahan</span>
          </h2>

          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari afiliator / kode ref..."
              className="w-full bg-[#070b14] border border-white/10 rounded-xl pl-10 pr-3.5 py-1.5 text-xs text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-violet-500"
            />
          </div>
        </div>

        {filteredReferrers.length === 0 ? (
          <div className="py-12 text-center text-slate-400 text-xs">
            <Users className="w-8 h-8 text-slate-600 mx-auto mb-2" />
            <p>Belum ada data afiliator yang cocok dengan pencarian.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-white/10 text-[11px] font-bold uppercase text-slate-400">
                  <th className="pb-3 px-3">Afiliator</th>
                  <th className="pb-3 px-3">Kode Ref</th>
                  <th className="pb-3 px-3 text-center">Bawahan Diundang</th>
                  <th className="pb-3 px-3 text-right">Total Komisi</th>
                  <th className="pb-3 px-3 text-center">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 text-xs">
                {filteredReferrers.map((ref) => (
                  <tr key={ref.referrer_id} className="hover:bg-white/5 transition">
                    <td className="py-3 px-3">
                      <p className="font-bold text-white">{ref.referrer_username}</p>
                      <p className="text-[11px] text-slate-400">{ref.referrer_email}</p>
                    </td>
                    <td className="py-3 px-3">
                      <span className="font-mono font-bold text-violet-300 bg-violet-500/10 border border-violet-500/20 px-2 py-0.5 rounded-lg">
                        {ref.referral_code}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-center font-bold text-slate-200">
                      {ref.total_referred} User
                    </td>
                    <td className="py-3 px-3 text-right font-mono font-bold text-emerald-400">
                      Rp {ref.total_commission.toLocaleString('id-ID')}
                    </td>
                    <td className="py-3 px-3 text-center">
                      <button
                        onClick={() => setSelectedReferrer(ref)}
                        className="px-2.5 py-1 rounded-lg bg-violet-600/20 hover:bg-violet-600/30 text-violet-300 text-xs font-semibold border border-violet-500/30 transition"
                      >
                        Lihat Anggota
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Member Details Modal */}
      {selectedReferrer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="bg-[#121826] border border-white/15 rounded-3xl p-6 w-full max-w-lg shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <div>
                <h3 className="font-bold text-white text-base">
                  Bawahan dari {selectedReferrer.referrer_username}
                </h3>
                <p className="text-xs text-slate-400">Kode: {selectedReferrer.referral_code}</p>
              </div>
              <button
                onClick={() => setSelectedReferrer(null)}
                className="text-slate-400 hover:text-white text-sm px-2 py-1"
              >
                ✕
              </button>
            </div>

            <div className="max-h-72 overflow-y-auto space-y-2">
              {selectedReferrer.referred_users.length === 0 ? (
                <p className="text-xs text-slate-400 py-4 text-center">Belum ada user yang terdaftar.</p>
              ) : (
                selectedReferrer.referred_users.map((u) => (
                  <div
                    key={u.user_id}
                    className="p-2.5 rounded-xl bg-white/5 border border-white/10 flex items-center justify-between text-xs"
                  >
                    <div>
                      <p className="font-bold text-slate-200">{u.username}</p>
                      <p className="text-[11px] text-slate-400">{u.email}</p>
                    </div>
                    <span className="text-[10px] text-slate-400 font-mono">
                      {new Date(u.joined_at).toLocaleDateString('id-ID')}
                    </span>
                  </div>
                ))
              )}
            </div>

            <div className="pt-2 text-right">
              <button
                onClick={() => setSelectedReferrer(null)}
                className="px-4 py-2 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-xs font-bold"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
