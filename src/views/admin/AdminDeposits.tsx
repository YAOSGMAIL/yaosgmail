import React, { useState, useEffect } from 'react';
import { api } from '../../lib/api';
import { useToast } from '../../context/ToastContext';
import { Deposit } from '../../types';
import {
  Inbox,
  CheckCircle2,
  XCircle,
  Clock,
  Search,
  RefreshCw,
  CheckSquare,
  Square,
  AlertCircle,
  Filter,
} from 'lucide-react';

export const AdminDeposits: React.FC = () => {
  const { success, error } = useToast();

  const [deposits, setDeposits] = useState<Deposit[]>([]);
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  // Multi-select state
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isBulkApproving, setIsBulkApproving] = useState(false);

  // Reject modal state
  const [rejectTargetId, setRejectTargetId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState('Akun Gmail tidak valid atau dinonaktifkan.');
  const [isRejecting, setIsRejecting] = useState(false);

  const fetchDeposits = async () => {
    setIsLoading(true);
    const res = await api.get<Deposit[]>(`/admin/deposits?status=${statusFilter}`);
    if (res.data) {
      setDeposits(res.data);
    }
    setIsLoading(false);
  };

  useEffect(() => {
    fetchDeposits();
  }, [statusFilter]);

  const handleApproveOne = async (id: string) => {
    const res = await api.put(`/admin/deposits/${id}/approve`, {});
    if (res.error) {
      error(res.error || 'Gagal menyetujui setoran.');
      return;
    }
    success('Setoran berhasil disetujui dan saldo user telah ditambahkan!');
    fetchDeposits();
  };

  const handleConfirmReject = async () => {
    if (!rejectTargetId) return;
    setIsRejecting(true);
    const res = await api.put(`/admin/deposits/${rejectTargetId}/reject`, {
      rejectReason: rejectReason.trim() || 'Ditolak oleh admin',
    });
    setIsRejecting(false);

    if (res.error) {
      error(res.error || 'Gagal menolak setoran.');
      return;
    }
    success('Setoran telah ditolak.');
    setRejectTargetId(null);
    fetchDeposits();
  };

  const handleBulkApprove = async () => {
    if (selectedIds.length === 0) return;
    setIsBulkApproving(true);
    const res = await api.post('/admin/deposits/bulk-approve', {
      depositIds: selectedIds,
    });
    setIsBulkApproving(false);

    if (res.error) {
      error(res.error || 'Gagal menyetujui massal.');
      return;
    }

    success(`Berhasil menyetujui ${res.data?.approvedCount || selectedIds.length} setoran Gmail!`);
    setSelectedIds([]);
    fetchDeposits();
  };

  const toggleSelectAll = () => {
    const pendingDeposits = filteredDeposits.filter((d) => d.status === 'PENDING');
    if (selectedIds.length === pendingDeposits.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(pendingDeposits.map((d) => d.id));
    }
  };

  const toggleSelectOne = (id: string) => {
    if (selectedIds.includes(id)) {
      setSelectedIds(selectedIds.filter((item) => item !== id));
    } else {
      setSelectedIds([...selectedIds, id]);
    }
  };

  const filteredDeposits = deposits.filter((d) => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return (
      d.gmail.toLowerCase().includes(term) ||
      (d.username && d.username.toLowerCase().includes(term)) ||
      (d.user_email && d.user_email.toLowerCase().includes(term)) ||
      d.id.toLowerCase().includes(term)
    );
  });

  const pendingCount = deposits.filter((d) => d.status === 'PENDING').length;

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-[#121826] p-5 rounded-3xl border border-white/10 shadow-xl">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-violet-600 to-indigo-600 flex items-center justify-center text-white shadow-lg shadow-violet-600/30">
            <Inbox className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">Kelola Setoran Gmail</h1>
            <p className="text-xs text-slate-400">
              Tinjau setoran akun Gmail, setujui untuk menambah saldo pengguna, atau tolak dengan alasan.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {selectedIds.length > 0 && (
            <button
              id="btn-bulk-approve-deposits"
              onClick={handleBulkApprove}
              disabled={isBulkApproving}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-lg shadow-emerald-600/30 transition active:scale-95 disabled:opacity-50"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Setujui {selectedIds.length} Terpilih</span>
            </button>
          )}

          <button
            onClick={fetchDeposits}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 text-xs font-semibold border border-white/10 transition"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            <span>Segarkan</span>
          </button>
        </div>
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
                  ? 'bg-gradient-to-r from-violet-600 to-indigo-600 text-white shadow'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {st === 'ALL'
                ? `Semua (${deposits.length})`
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
            placeholder="Cari Gmail, Username, ID..."
            className="w-full bg-[#121826] border border-white/10 rounded-2xl pl-10 pr-4 py-2 text-xs text-white placeholder:text-slate-400 focus:outline-none focus:border-violet-500"
          />
        </div>
      </div>

      {/* Main Table */}
      <div className="rounded-2xl bg-[#121826] border border-white/10 overflow-hidden shadow-lg">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#1a2234] text-slate-400 border-b border-white/10 uppercase tracking-wider text-[10px]">
              <tr>
                <th className="px-3 py-3 w-10 text-center">
                  <button onClick={toggleSelectAll} title="Pilih Semua Pending">
                    {selectedIds.length > 0 && selectedIds.length === filteredDeposits.filter((d) => d.status === 'PENDING').length ? (
                      <CheckSquare className="w-4 h-4 text-violet-400 mx-auto" />
                    ) : (
                      <Square className="w-4 h-4 text-slate-500 mx-auto" />
                    )}
                  </button>
                </th>
                <th className="px-4 py-3">Pengirim (User)</th>
                <th className="px-4 py-3">Alamat Gmail</th>
                <th className="px-4 py-3">Nominal Rate</th>
                <th className="px-4 py-3">Waktu Submit</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 text-slate-200">
              {filteredDeposits.length > 0 ? (
                filteredDeposits.map((dep) => {
                  const isSelected = selectedIds.includes(dep.id);
                  const isPending = dep.status === 'PENDING';

                  return (
                    <tr
                      key={dep.id}
                      className={`hover:bg-white/5 transition ${isSelected ? 'bg-violet-950/20' : ''}`}
                    >
                      <td className="px-3 py-3 text-center">
                        {isPending ? (
                          <button onClick={() => toggleSelectOne(dep.id)}>
                            {isSelected ? (
                              <CheckSquare className="w-4 h-4 text-violet-400 mx-auto" />
                            ) : (
                              <Square className="w-4 h-4 text-slate-500 mx-auto" />
                            )}
                          </button>
                        ) : (
                          <span className="text-slate-600">-</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <p className="font-bold text-white">{dep.username || 'User'}</p>
                        <p className="text-[10px] text-slate-400 font-mono">{dep.user_email}</p>
                      </td>
                      <td className="px-4 py-3 font-mono font-medium text-violet-300 select-all">
                        {dep.gmail}
                      </td>
                      <td className="px-4 py-3 font-mono font-bold text-emerald-400">
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
                          {dep.status === 'REJECTED' && <XCircle className="w-3 h-3" />}
                          {dep.status}
                        </span>
                        {dep.reject_reason && (
                          <p className="text-[10px] text-rose-400 mt-0.5 truncate max-w-[150px]">
                            {dep.reject_reason}
                          </p>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right">
                        {isPending ? (
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              id={`btn-approve-dep-${dep.id}`}
                              onClick={() => handleApproveOne(dep.id)}
                              className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-[11px] shadow-sm transition active:scale-95"
                            >
                              Approve
                            </button>
                            <button
                              id={`btn-reject-dep-${dep.id}`}
                              onClick={() => {
                                setRejectTargetId(dep.id);
                                setRejectReason('Akun Gmail tidak valid atau dinonaktifkan.');
                              }}
                              className="px-2.5 py-1 rounded-lg bg-rose-600/20 hover:bg-rose-600/30 text-rose-300 border border-rose-500/30 font-bold text-[11px] transition active:scale-95"
                            >
                              Reject
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
                  <td colSpan={7} className="px-4 py-12 text-center text-slate-400 font-medium">
                    Tidak ada data setoran yang sesuai filter.
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
              <h3 className="text-base font-bold text-white">Tolak Setoran Gmail</h3>
            </div>

            <p className="text-xs text-slate-300">
              Berikan alasan penolakan agar pengguna memahami mengapa akun Gmail ini tidak disetujui:
            </p>

            <div className="space-y-2">
              <textarea
                id="input-reject-reason"
                rows={3}
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="Tulis alasan penolakan..."
                className="w-full bg-[#070b14] border border-white/10 rounded-xl p-3 text-xs text-white placeholder:text-slate-400 focus:outline-none focus:border-rose-500"
              />

              <div className="flex flex-wrap gap-1.5">
                {[
                  'Akun tidak aktif / disabled',
                  'Akun duplikat di sistem',
                  'Format email salah',
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
                id="btn-confirm-reject-deposit"
                type="button"
                onClick={handleConfirmReject}
                disabled={isRejecting}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold shadow-md"
              >
                {isRejecting ? 'Memproses...' : 'Konfirmasi Tolak'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
