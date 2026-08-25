import React, { useState, useEffect } from 'react';
import { api } from '../../lib/api';
import { useToast } from '../../context/ToastContext';
import { Withdrawal } from '../../types';
import {
  ArrowDownToLine,
  CheckCircle2,
  XCircle,
  Clock,
  Search,
  RefreshCw,
  Copy,
  Check,
  AlertCircle,
  CreditCard,
  RotateCcw,
} from 'lucide-react';

export const AdminWithdrawals: React.FC = () => {
  const { success, error } = useToast();

  const [withdrawals, setWithdrawals] = useState<Withdrawal[]>([]);
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  // Rejection modal
  const [rejectTargetId, setRejectTargetId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState('Nomor rekening / e-Wallet tidak valid.');
  const [isRejecting, setIsRejecting] = useState(false);

  // Copy state
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const fetchWithdrawals = async () => {
    setIsLoading(true);
    const res = await api.get<Withdrawal[]>(`/admin/withdrawals?status=${statusFilter}`);
    if (res.data) {
      setWithdrawals(res.data);
    }
    setIsLoading(false);
  };

  useEffect(() => {
    fetchWithdrawals();
  }, [statusFilter]);

  const handleApproveWd = async (id: string) => {
    const res = await api.put(`/admin/withdrawals/${id}/approve`, {});
    if (res.error) {
      error(res.error || 'Gagal menyetujui penarikan.');
      return;
    }
    success('Penarikan dana disetujui! Status transfer selesai dan saldo telah diselesaikan.');
    fetchWithdrawals();
  };

  const handleConfirmRejectWd = async () => {
    if (!rejectTargetId) return;
    setIsRejecting(true);
    const res = await api.put(`/admin/withdrawals/${rejectTargetId}/reject`, {
      rejectReason: rejectReason.trim() || 'Ditolak oleh admin',
    });
    setIsRejecting(false);

    if (res.error) {
      error(res.error || 'Gagal menolak penarikan.');
      return;
    }

    success('Penarikan ditolak. Saldo yang dicadangkan telah dikembalikan ke saldo user!');
    setRejectTargetId(null);
    fetchWithdrawals();
  };

  const handleCopyAccount = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
    success('Nomor rekening/e-Wallet disalin!');
  };

  const filteredWithdrawals = withdrawals.filter((w) => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return (
      (w.username && w.username.toLowerCase().includes(term)) ||
      (w.user_email && w.user_email.toLowerCase().includes(term)) ||
      w.payment_account.toLowerCase().includes(term) ||
      w.payment_method.toLowerCase().includes(term) ||
      w.id.toLowerCase().includes(term)
    );
  });

  const pendingCount = withdrawals.filter((w) => w.status === 'PENDING').length;

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-[#121826] p-5 rounded-3xl border border-white/10 shadow-xl">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center text-white shadow-lg shadow-emerald-600/30">
            <ArrowDownToLine className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">Kelola Withdrawal (WD)</h1>
            <p className="text-xs text-slate-400">
              Proses transfer dana ke e-Wallet / rekening bank pengguna, dan kelola refund jika data salah.
            </p>
          </div>
        </div>

        <button
          onClick={fetchWithdrawals}
          className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 text-xs font-semibold border border-white/10 transition self-start sm:self-auto"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
          <span>Segarkan Data</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex bg-[#121826] p-1 rounded-2xl border border-white/10 text-xs font-bold w-full sm:w-auto">
          {['ALL', 'PENDING', 'APPROVED', 'REJECTED'].map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`flex-1 sm:flex-initial px-3.5 py-1.5 rounded-xl transition ${
                statusFilter === st
                  ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {st === 'ALL'
                ? `Semua (${withdrawals.length})`
                : st === 'PENDING'
                ? `Pending (${pendingCount})`
                : st}
            </button>
          ))}
        </div>

        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Cari user, nomor e-Wallet, ID..."
            className="w-full bg-[#121826] border border-white/10 rounded-2xl pl-10 pr-4 py-2 text-xs text-white placeholder:text-slate-400 focus:outline-none focus:border-emerald-500"
          />
        </div>
      </div>

      {/* Main WD Table */}
      <div className="rounded-2xl bg-[#121826] border border-white/10 overflow-hidden shadow-lg">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#1a2234] text-slate-400 border-b border-white/10 uppercase tracking-wider text-[10px]">
              <tr>
                <th className="px-4 py-3">Pengguna</th>
                <th className="px-4 py-3">Nominal Gross</th>
                <th className="px-4 py-3">Fee Admin</th>
                <th className="px-4 py-3">Transfer Bersih (Net)</th>
                <th className="px-4 py-3">Tujuan Transfer</th>
                <th className="px-4 py-3">Waktu</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Aksi Admin</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 text-slate-200">
              {filteredWithdrawals.length > 0 ? (
                filteredWithdrawals.map((wd) => {
                  const isPending = wd.status === 'PENDING';

                  return (
                    <tr key={wd.id} className="hover:bg-white/5 transition">
                      <td className="px-4 py-3">
                        <p className="font-bold text-white">{wd.username || 'User'}</p>
                        <p className="text-[10px] text-slate-400 font-mono">{wd.user_email}</p>
                      </td>
                      <td className="px-4 py-3 font-mono font-bold text-white">
                        Rp {wd.gross_amount.toLocaleString('id-ID')}
                      </td>
                      <td className="px-4 py-3 font-mono text-rose-400">
                        Rp {wd.fee_amount.toLocaleString('id-ID')} ({wd.fee_rate}%)
                      </td>
                      <td className="px-4 py-3 font-mono font-extrabold text-emerald-400 text-sm">
                        Rp {wd.net_amount.toLocaleString('id-ID')}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1.5">
                          <span className="font-bold text-slate-200 px-1.5 py-0.5 rounded bg-white/5 border border-white/5 text-[10px]">
                            {wd.payment_method}
                          </span>
                          <span className="font-mono text-xs text-white">{wd.payment_account}</span>
                          <button
                            onClick={() => handleCopyAccount(wd.payment_account, wd.id)}
                            title="Salin No Rekening / e-Wallet"
                            className="p-1 text-slate-400 hover:text-white"
                          >
                            {copiedId === wd.id ? (
                              <Check className="w-3.5 h-3.5 text-emerald-400" />
                            ) : (
                              <Copy className="w-3.5 h-3.5" />
                            )}
                          </button>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-slate-400">
                        {new Date(wd.created_at).toLocaleString('id-ID', {
                          day: 'numeric',
                          month: 'short',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-md ${
                            wd.status === 'APPROVED'
                              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                              : wd.status === 'PENDING'
                              ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                              : 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                          }`}
                        >
                          {wd.status === 'APPROVED' && <CheckCircle2 className="w-3 h-3" />}
                          {wd.status === 'PENDING' && <Clock className="w-3 h-3" />}
                          {wd.status === 'REJECTED' && <XCircle className="w-3 h-3" />}
                          {wd.status}
                        </span>
                        {wd.reject_reason && (
                          <p className="text-[10px] text-rose-400 mt-0.5 truncate max-w-[150px]">
                            {wd.reject_reason}
                          </p>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right">
                        {isPending ? (
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              id={`btn-approve-wd-${wd.id}`}
                              onClick={() => handleApproveWd(wd.id)}
                              className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-[11px] shadow-sm transition active:scale-95 flex items-center gap-1"
                            >
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              <span>Selesai Transfer</span>
                            </button>
                            <button
                              id={`btn-reject-wd-${wd.id}`}
                              onClick={() => {
                                setRejectTargetId(wd.id);
                                setRejectReason('Nomor rekening / e-Wallet tidak valid.');
                              }}
                              className="px-2.5 py-1.5 rounded-lg bg-rose-600/20 hover:bg-rose-600/30 text-rose-300 border border-rose-500/30 font-bold text-[11px] transition active:scale-95 flex items-center gap-1"
                            >
                              <RotateCcw className="w-3.5 h-3.5" />
                              <span>Tolak & Refund</span>
                            </button>
                          </div>
                        ) : (
                          <span className="text-[11px] text-slate-500 italic">Selesai</span>
                        )}
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={8} className="px-4 py-12 text-center text-slate-400 font-medium">
                    Tidak ada data penarikan yang sesuai filter.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Reject Modal */}
      {rejectTargetId && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-[#121826] border border-white/10 rounded-3xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center gap-2.5 text-rose-400">
              <AlertCircle className="w-5 h-5" />
              <h3 className="text-base font-bold text-white">Tolak Penarikan & Kembalikan Saldo</h3>
            </div>

            <p className="text-xs text-slate-300">
              Dana yang dicadangkan akan dikembalikan 100% ke saldo tersedia akun pengguna. Silakan tulis alasan:
            </p>

            <div className="space-y-2">
              <textarea
                id="input-wd-reject-reason"
                rows={3}
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="Alasan penolakan..."
                className="w-full bg-[#070b14] border border-white/10 rounded-xl p-3 text-xs text-white placeholder:text-slate-400 focus:outline-none focus:border-rose-500"
              />

              <div className="flex flex-wrap gap-1.5">
                {[
                  'Nomor rekening / e-Wallet salah',
                  'Nama pemilik rekening tidak cocok',
                  'e-Wallet belum upgrade / limit tercapai',
                ].map((tmpl) => (
                  <button
                    key={tmpl}
                    type="button"
                    onClick={() => setRejectReason(tmpl)}
                    className="text-[10px] px-2 py-0.5 rounded bg-white/5 hover:bg-white/10 text-slate-300 border border-white/5"
                  >
                    {tmpl}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setRejectTargetId(null)}
                className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 text-xs font-semibold"
              >
                Batal
              </button>
              <button
                id="btn-confirm-reject-wd"
                type="button"
                onClick={handleConfirmRejectWd}
                disabled={isRejecting}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold shadow-md"
              >
                {isRejecting ? 'Memproses...' : 'Tolak & Refund Saldo'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
