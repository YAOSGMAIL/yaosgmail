import React, { useState, useEffect } from 'react';
import { api } from '../lib/api';
import { useToast } from '../context/ToastContext';
import {
  Users,
  Copy,
  Check,
  Coins,
  Share2,
  Gift,
  CheckCircle2,
  RefreshCw,
} from 'lucide-react';

interface ReferralData {
  referral_code: string;
  total_referred_users: number;
  total_referral_earnings: number;
  reward_per_transaction: number;
  referral_status: 'OPEN' | 'CLOSED';
  referred_users: {
    user_id: string;
    username: string;
    email: string;
    joined_at: string;
    approved_deposits_count: number;
  }[];
  transactions: any[];
}

export const ReferralView: React.FC = () => {
  const { success } = useToast();
  const [data, setData] = useState<ReferralData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  const fetchReferral = async () => {
    setIsLoading(true);
    const res = await api.get<ReferralData>('/user/referral');
    if (res.data) {
      setData(res.data);
    }
    setIsLoading(false);
  };

  useEffect(() => {
    fetchReferral();
  }, []);

  const referralCode = data?.referral_code || 'YAO12345';
  const referralLink = `${window.location.origin}/?ref=${referralCode}`;

  const copyToClipboard = (text: string, isLink: boolean) => {
    navigator.clipboard.writeText(text);
    if (isLink) {
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
      success('Link referral berhasil disalin ke clipboard!');
    } else {
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 2000);
      success('Kode referral berhasil disalin!');
    }
  };

  if (isLoading && !data) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <RefreshCw className="w-8 h-8 text-violet-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-[#121826] p-5 rounded-3xl border border-white/10 shadow-xl">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-violet-600 to-purple-600 flex items-center justify-center text-white shadow-lg shadow-violet-600/30">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">Program Referral</h1>
            <p className="text-xs text-slate-400">
              Bagikan kode unik Anda dan nikmati komisi saldo pasif untuk setiap setoran valid.
            </p>
          </div>
        </div>

        <button
          onClick={fetchReferral}
          className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 text-xs font-semibold border border-white/10 transition self-start sm:self-auto"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
          <span>Segarkan Data</span>
        </button>
      </div>

      {/* Referral Code & Share Link Hero Box */}
      <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-r from-violet-950/60 via-[#121826] to-[#121826] border border-violet-500/30 shadow-2xl relative overflow-hidden">
        <div className="max-w-2xl space-y-6">
          <div>
            <span className="text-[10px] uppercase font-bold tracking-wider px-2.5 py-1 rounded-full bg-violet-500/20 text-violet-300 border border-violet-500/30">
              Komisi Langsung Masuk Saldo
            </span>
            <h2 className="text-lg sm:text-xl font-bold text-white mt-2">
              Undang Mitra & Dapatkan Tambahan Saldo Otomatis
            </h2>
            <p className="text-xs text-slate-400 mt-1 leading-relaxed">
              Setiap kali teman yang Anda undang menyetor Gmail dan setoran mereka disetujui (Approved), Anda mendapatkan komisi sebesar{' '}
              <strong className="text-emerald-400">
                Rp {(data?.reward_per_transaction || 500).toLocaleString('id-ID')}
              </strong>{' '}
              per transaksi.
            </p>
          </div>

          {/* Code & Link Copy Inputs */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Referral Code */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-300">Kode Referral Anda</label>
              <div className="flex items-center gap-2">
                <div className="flex-1 bg-[#070b14] border border-white/15 rounded-xl px-3.5 py-2.5 font-mono text-sm font-bold text-violet-300 tracking-wider">
                  {referralCode}
                </div>
                <button
                  id="btn-copy-ref-code"
                  onClick={() => copyToClipboard(referralCode, false)}
                  className="px-3.5 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-white font-bold text-xs flex items-center gap-1.5 transition active:scale-95 shrink-0"
                >
                  {copiedCode ? <Check className="w-4 h-4 text-emerald-300" /> : <Copy className="w-4 h-4" />}
                  <span>{copiedCode ? 'Tersalin' : 'Salin'}</span>
                </button>
              </div>
            </div>

            {/* Referral Link */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-300">Link Registrasi Otomatis</label>
              <div className="flex items-center gap-2">
                <input
                  id="input-ref-link"
                  readOnly
                  value={referralLink}
                  className="flex-1 bg-[#070b14] border border-white/15 rounded-xl px-3 py-2.5 font-mono text-xs text-slate-300 truncate focus:outline-none"
                />
                <button
                  id="btn-copy-ref-link"
                  onClick={() => copyToClipboard(referralLink, true)}
                  className="px-3.5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs flex items-center gap-1.5 transition active:scale-95 shrink-0"
                >
                  {copiedLink ? <Check className="w-4 h-4 text-emerald-300" /> : <Share2 className="w-4 h-4" />}
                  <span>{copiedLink ? 'Tersalin' : 'Bagikan'}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-5 rounded-2xl bg-[#121826] border border-white/10 shadow-lg">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Total Teman Diundang</span>
            <Users className="w-4 h-4 text-violet-400" />
          </div>
          <p className="text-2xl font-black text-white font-mono mt-2">{data?.total_referred_users || 0} Orang</p>
        </div>

        <div className="p-5 rounded-2xl bg-[#121826] border border-white/10 shadow-lg">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Total Pendapatan Komisi</span>
            <Coins className="w-4 h-4 text-emerald-400" />
          </div>
          <p className="text-2xl font-black text-emerald-400 font-mono mt-2">
            Rp {(data?.total_referral_earnings || 0).toLocaleString('id-ID')}
          </p>
        </div>

        <div className="p-5 rounded-2xl bg-[#121826] border border-white/10 shadow-lg">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Reward per Transaksi Valid</span>
            <Gift className="w-4 h-4 text-amber-400" />
          </div>
          <p className="text-2xl font-black text-amber-300 font-mono mt-2">
            Rp {(data?.reward_per_transaction || 500).toLocaleString('id-ID')}
          </p>
        </div>
      </div>

      {/* List of Referred Users */}
      <div className="space-y-3">
        <h3 className="text-sm font-bold text-slate-200">Daftar Anggota Yang Anda Undang</h3>
        <div className="rounded-2xl bg-[#121826] border border-white/10 overflow-hidden shadow-lg">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#1a2234] text-slate-400 border-b border-white/10 uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="px-4 py-3">Username</th>
                  <th className="px-4 py-3">Email</th>
                  <th className="px-4 py-3">Tanggal Bergabung</th>
                  <th className="px-4 py-3">Setoran Approved</th>
                  <th className="px-4 py-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 text-slate-200">
                {data?.referred_users && data.referred_users.length > 0 ? (
                  data.referred_users.map((u) => (
                    <tr key={u.user_id} className="hover:bg-white/5 transition">
                      <td className="px-4 py-3 font-semibold text-white">{u.username}</td>
                      <td className="px-4 py-3 text-slate-400">{u.email}</td>
                      <td className="px-4 py-3 text-slate-400">
                        {new Date(u.joined_at).toLocaleDateString('id-ID', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                        })}
                      </td>
                      <td className="px-4 py-3 font-mono font-bold text-violet-400">
                        {u.approved_deposits_count} Transaksi
                      </td>
                      <td className="px-4 py-3">
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                          <CheckCircle2 className="w-3 h-3" />
                          Aktif
                        </span>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} className="px-4 py-12 text-center text-slate-400 font-medium">
                      Belum ada pengguna yang mendaftar menggunakan kode referral Anda.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};
