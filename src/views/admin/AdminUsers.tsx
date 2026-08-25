import React, { useState, useEffect } from 'react';
import { api } from '../../lib/api';
import { useToast } from '../../context/ToastContext';
import { UserWithProfile } from '../../types';
import {
  Users,
  Search,
  RefreshCw,
  Coins,
  ShieldCheck,
  ShieldAlert,
  Edit,
  UserCheck,
  UserX,
  Mail,
  Wallet,
  ArrowDownToLine,
  PlusCircle,
  MinusCircle,
  AlertCircle,
} from 'lucide-react';

interface UserWithStats extends UserWithProfile {
  deposits_count?: number;
  approved_deposits_count?: number;
  pending_deposits_count?: number;
  total_withdrawn?: number;
}

export const AdminUsers: React.FC = () => {
  const { success, error } = useToast();

  const [users, setUsers] = useState<UserWithStats[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  // Balance Adjustment Modal State
  const [balanceModalUser, setBalanceModalUser] = useState<UserWithStats | null>(null);
  const [adjustType, setAdjustType] = useState<'add' | 'deduct'>('add');
  const [adjustAmount, setAdjustAmount] = useState<number | string>('');
  const [adjustReason, setAdjustReason] = useState('Bonus loyalitas sistem');
  const [isAdjusting, setIsAdjusting] = useState(false);

  const fetchUsers = async () => {
    setIsLoading(true);
    const res = await api.get<UserWithStats[]>('/admin/users');
    if (res.data) {
      setUsers(res.data);
    }
    setIsLoading(false);
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleToggleStatus = async (user: UserWithStats) => {
    const newStatus = !user.active;
    const res = await api.put(`/admin/users/${user.id}/status`, {
      isActive: newStatus,
    });

    if (res.error) {
      error(res.error || 'Gagal memperbarui status user.');
      return;
    }

    success(`Akun ${user.username} telah ${newStatus ? 'diaktifkan' : 'disuspend'}!`);
    fetchUsers();
  };

  const handleSaveBalanceAdjustment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!balanceModalUser) return;

    const num = typeof adjustAmount === 'number' ? adjustAmount : Number(adjustAmount);
    if (!num || num <= 0) {
      error('Masukkan nominal saldo yang valid.');
      return;
    }

    if (!adjustReason.trim()) {
      error('Alasan penyesuaian saldo wajib diisi.');
      return;
    }

    const finalAmount = adjustType === 'add' ? num : -num;

    setIsAdjusting(true);
    const res = await api.post(`/admin/users/${balanceModalUser.id}/adjust-balance`, {
      amount: finalAmount,
      reason: adjustReason.trim(),
    });
    setIsAdjusting(false);

    if (res.error) {
      error(res.error || 'Gagal mengubah saldo user.');
      return;
    }

    success(`Saldo ${balanceModalUser.username} berhasil disesuaikan!`);
    setBalanceModalUser(null);
    setAdjustAmount('');
    fetchUsers();
  };

  const filteredUsers = users.filter((u) => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return (
      u.username.toLowerCase().includes(term) ||
      u.email.toLowerCase().includes(term) ||
      u.id.toLowerCase().includes(term) ||
      u.referral_code?.toLowerCase().includes(term)
    );
  });

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-[#121826] p-5 rounded-3xl border border-white/10 shadow-xl">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-blue-600 to-cyan-500 flex items-center justify-center text-white shadow-lg shadow-blue-600/30">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">Kelola Pengguna</h1>
            <p className="text-xs text-slate-400">
              Daftar seluruh akun terdaftar, status saldo, suspensi akun, dan penyesuaian manual saldo.
            </p>
          </div>
        </div>

        <button
          onClick={fetchUsers}
          className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 text-xs font-semibold border border-white/10 transition self-start sm:self-auto"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
          <span>Segarkan</span>
        </button>
      </div>

      {/* Search Bar */}
      <div className="relative w-full sm:w-80">
        <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Cari username, email, ID..."
          className="w-full bg-[#121826] border border-white/10 rounded-2xl pl-10 pr-4 py-2 text-xs text-white placeholder:text-slate-400 focus:outline-none focus:border-blue-500"
        />
      </div>

      {/* Main Users Table */}
      <div className="rounded-2xl bg-[#121826] border border-white/10 overflow-hidden shadow-lg">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#1a2234] text-slate-400 border-b border-white/10 uppercase tracking-wider text-[10px]">
              <tr>
                <th className="px-4 py-3">Pengguna</th>
                <th className="px-4 py-3">Saldo Tersedia</th>
                <th className="px-4 py-3">Saldo Reserved</th>
                <th className="px-4 py-3">Statistik Setoran</th>
                <th className="px-4 py-3">Total WD</th>
                <th className="px-4 py-3">Role & Status</th>
                <th className="px-4 py-3 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 text-slate-200">
              {filteredUsers.length > 0 ? (
                filteredUsers.map((u) => {
                  const isAdmin = u.role === 'admin';

                  return (
                    <tr key={u.id} className="hover:bg-white/5 transition">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div>
                            <p className="font-bold text-white flex items-center gap-1.5">
                              <span>{u.username}</span>
                              {isAdmin && (
                                <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
                                  ADMIN
                                </span>
                              )}
                            </p>
                            <p className="text-[10px] text-slate-400">{u.email}</p>
                            <p className="text-[9px] font-mono text-slate-500">Ref: {u.referral_code}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 font-mono font-bold text-emerald-400 text-sm">
                        Rp {u.available_balance.toLocaleString('id-ID')}
                      </td>
                      <td className="px-4 py-3 font-mono text-amber-400">
                        Rp {u.reserved_balance.toLocaleString('id-ID')}
                      </td>
                      <td className="px-4 py-3 text-slate-300">
                        <p className="font-mono text-xs">
                          <strong className="text-emerald-400">{u.approved_deposits_count || 0}</strong> Approved
                        </p>
                        <p className="text-[10px] text-slate-400">
                          {u.pending_deposits_count || 0} Pending
                        </p>
                      </td>
                      <td className="px-4 py-3 font-mono font-bold text-blue-300">
                        Rp {(u.total_withdrawn || 0).toLocaleString('id-ID')}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-md ${
                            u.active
                              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                              : 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                          }`}
                        >
                          {u.active ? <UserCheck className="w-3 h-3" /> : <UserX className="w-3 h-3" />}
                          {u.active ? 'Aktif' : 'Suspended'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            id={`btn-adjust-bal-${u.id}`}
                            onClick={() => {
                              setBalanceModalUser(u);
                              setAdjustType('add');
                              setAdjustAmount('');
                            }}
                            className="px-2.5 py-1 rounded-lg bg-violet-600/20 hover:bg-violet-600/30 text-violet-300 border border-violet-500/30 font-bold text-[11px] transition active:scale-95 flex items-center gap-1"
                          >
                            <Coins className="w-3 h-3" />
                            <span>Atur Saldo</span>
                          </button>

                          {!isAdmin && (
                            <button
                              id={`btn-toggle-status-${u.id}`}
                              onClick={() => handleToggleStatus(u)}
                              className={`px-2.5 py-1 rounded-lg font-bold text-[11px] transition active:scale-95 ${
                                u.active
                                  ? 'bg-rose-600/20 hover:bg-rose-600/30 text-rose-300 border border-rose-500/30'
                                  : 'bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/30'
                              }`}
                            >
                              {u.active ? 'Suspend' : 'Aktifkan'}
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center text-slate-400 font-medium">
                    Tidak ada data pengguna yang sesuai.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Adjust Balance Modal */}
      {balanceModalUser && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <form
            onSubmit={handleSaveBalanceAdjustment}
            className="w-full max-w-md bg-[#121826] border border-white/10 rounded-3xl p-6 shadow-2xl space-y-4"
          >
            <div className="flex items-center gap-2 text-violet-400">
              <Coins className="w-5 h-5" />
              <h3 className="text-base font-bold text-white">Atur Saldo Pengguna</h3>
            </div>

            <div className="p-3 rounded-xl bg-white/5 border border-white/5 text-xs text-slate-300 space-y-1">
              <p>
                Target User: <strong className="text-white">{balanceModalUser.username}</strong> ({balanceModalUser.email})
              </p>
              <p>
                Saldo Saat Ini:{' '}
                <strong className="text-emerald-400 font-mono">
                  Rp {balanceModalUser.available_balance.toLocaleString('id-ID')}
                </strong>
              </p>
            </div>

            {/* Adjust Type */}
            <div className="flex bg-[#070b14] p-1 rounded-xl border border-white/10">
              <button
                type="button"
                onClick={() => setAdjustType('add')}
                className={`flex-1 py-1.5 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition ${
                  adjustType === 'add'
                    ? 'bg-emerald-600 text-white shadow'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <PlusCircle className="w-3.5 h-3.5" />
                <span>Tambah Saldo</span>
              </button>
              <button
                type="button"
                onClick={() => setAdjustType('deduct')}
                className={`flex-1 py-1.5 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition ${
                  adjustType === 'deduct'
                    ? 'bg-rose-600 text-white shadow'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <MinusCircle className="w-3.5 h-3.5" />
                <span>Kurangi Saldo</span>
              </button>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1.5">Nominal Penyesuaian (Rp)</label>
              <input
                type="number"
                min={100}
                step={100}
                required
                value={adjustAmount}
                onChange={(e) => setAdjustAmount(e.target.value)}
                placeholder="Contoh: 50000"
                className="w-full bg-[#070b14] border border-white/10 rounded-xl px-3 py-2.5 text-xs text-white placeholder:text-slate-400 font-mono font-bold focus:outline-none focus:border-violet-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1.5">Alasan / Catatan Pembukuan</label>
              <input
                type="text"
                required
                value={adjustReason}
                onChange={(e) => setAdjustReason(e.target.value)}
                placeholder="Contoh: Bonus promo khusus / Koreksi saldo"
                className="w-full bg-[#070b14] border border-white/10 rounded-xl px-3 py-2.5 text-xs text-white placeholder:text-slate-400 focus:outline-none focus:border-violet-500"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setBalanceModalUser(null)}
                className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 text-xs font-semibold"
              >
                Batal
              </button>
              <button
                type="submit"
                disabled={isAdjusting}
                className="px-4 py-2 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-xs font-bold shadow-md disabled:opacity-50"
              >
                {isAdjusting ? 'Menyimpan...' : 'Simpan Penyesuaian'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
