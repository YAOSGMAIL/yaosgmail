import React, { useState, useEffect } from 'react';
import { api } from '../lib/api';
import { Deposit, Withdrawal, BalanceTransaction } from '../types';
import {
  History,
  Mail,
  ArrowDownToLine,
  Receipt,
  CheckCircle2,
  Clock,
  AlertCircle,
  Search,
  RefreshCw,
  PlusCircle,
  MinusCircle,
} from 'lucide-react';

export const HistoryView: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'deposits' | 'withdrawals' | 'ledger'>('deposits');
  const [deposits, setDeposits] = useState<Deposit[]>([]);
  const [withdrawals, setWithdrawals] = useState<Withdrawal[]>([]);
  const [transactions, setTransactions] = useState<BalanceTransaction[]>([]);
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const fetchHistory = async () => {
    setIsLoading(true);
    const [depRes, wdRes, walletRes] = await Promise.all([
      api.get<Deposit[]>('/user/deposits'),
      api.get<Withdrawal[]>('/user/withdrawals'),
      api.get<any>('/user/wallet'),
    ]);

    if (depRes.data) setDeposits(depRes.data);
    if (wdRes.data) setWithdrawals(wdRes.data);
    if (walletRes.data?.transactions) setTransactions(walletRes.data.transactions);

    setIsLoading(false);
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  // Filtered deposits
  const filteredDeposits = deposits.filter((d) => {
    const matchesStatus = statusFilter === 'ALL' || d.status === statusFilter;
    const matchesSearch =
      !searchTerm ||
      d.gmail.toLowerCase().includes(searchTerm.toLowerCase()) ||
      d.id.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  // Filtered withdrawals
  const filteredWithdrawals = withdrawals.filter((w) => {
    const matchesStatus = statusFilter === 'ALL' || w.status === statusFilter;
    const matchesSearch =
      !searchTerm ||
      w.payment_account.toLowerCase().includes(searchTerm.toLowerCase()) ||
      w.payment_method.toLowerCase().includes(searchTerm.toLowerCase()) ||
      w.id.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  // Filtered ledger
  const filteredTransactions = transactions.filter((tx) => {
    if (!searchTerm) return true;
    return (
      tx.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      tx.type.toLowerCase().includes(searchTerm.toLowerCase())
    );
  });

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-[#121826] p-5 rounded-3xl border border-white/10 shadow-xl">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-violet-600 to-indigo-600 flex items-center justify-center text-white shadow-lg shadow-violet-600/30">
            <History className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">Riwayat & Mutasi</h1>
            <p className="text-xs text-slate-400">
              Laporan lengkap riwayat setoran Gmail, status penarikan dana, dan buku besar saldo.
            </p>
          </div>
        </div>

        <button
          onClick={fetchHistory}
          className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 text-xs font-semibold border border-white/10 transition self-start sm:self-auto"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
          <span>Segarkan</span>
        </button>
      </div>

      {/* Main Tab Switcher */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-white/10 pb-4">
        <div className="flex bg-[#121826] p-1 rounded-2xl border border-white/10">
          <button
            onClick={() => {
              setActiveTab('deposits');
              setStatusFilter('ALL');
            }}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition ${
              activeTab === 'deposits'
                ? 'bg-gradient-to-r from-violet-600 to-indigo-600 text-white shadow-md'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Mail className="w-3.5 h-3.5" />
            <span>Setoran Gmail ({deposits.length})</span>
          </button>

          <button
            onClick={() => {
              setActiveTab('withdrawals');
              setStatusFilter('ALL');
            }}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition ${
              activeTab === 'withdrawals'
                ? 'bg-gradient-to-r from-violet-600 to-indigo-600 text-white shadow-md'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <ArrowDownToLine className="w-3.5 h-3.5" />
            <span>Withdrawal ({withdrawals.length})</span>
          </button>

          <button
            onClick={() => {
              setActiveTab('ledger');
              setStatusFilter('ALL');
            }}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition ${
              activeTab === 'ledger'
                ? 'bg-gradient-to-r from-violet-600 to-indigo-600 text-white shadow-md'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Receipt className="w-3.5 h-3.5" />
            <span>Buku Besar Saldo ({transactions.length})</span>
          </button>
        </div>

        {/* Search & Status Filters */}
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-60">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Cari kata kunci..."
              className="w-full bg-[#121826] border border-white/10 rounded-xl pl-9 pr-3 py-1.5 text-xs text-white placeholder:text-slate-400 focus:outline-none focus:border-violet-500"
            />
          </div>

          {activeTab !== 'ledger' && (
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-[#121826] border border-white/10 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:border-violet-500"
            >
              <option value="ALL">Semua Status</option>
              <option value="PENDING">Pending</option>
              <option value="APPROVED">Approved</option>
              <option value="REJECTED">Rejected</option>
            </select>
          )}
        </div>
      </div>

      {/* Content Section */}
      {activeTab === 'deposits' && (
        <div className="rounded-2xl bg-[#121826] border border-white/10 overflow-hidden shadow-lg">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#1a2234] text-slate-400 border-b border-white/10 uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="px-4 py-3">ID Setoran</th>
                  <th className="px-4 py-3">Alamat Gmail</th>
                  <th className="px-4 py-3">Rate</th>
                  <th className="px-4 py-3">Waktu Submit</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Keterangan / Alasan</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 text-slate-200">
                {filteredDeposits.length > 0 ? (
                  filteredDeposits.map((dep) => (
                    <tr key={dep.id} className="hover:bg-white/5 transition">
                      <td className="px-4 py-3 font-mono text-slate-400">{dep.id.slice(-8)}</td>
                      <td className="px-4 py-3 font-mono font-medium text-slate-100">{dep.gmail}</td>
                      <td className="px-4 py-3 font-mono text-violet-400 font-bold">
                        Rp {dep.amount.toLocaleString('id-ID')}
                      </td>
                      <td className="px-4 py-3 text-slate-400">
                        {new Date(dep.created_at).toLocaleString('id-ID', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
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
                          {dep.status === 'REJECTED' && <AlertCircle className="w-3 h-3" />}
                          {dep.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-slate-400">
                        {dep.reject_reason ? (
                          <span className="text-rose-400 font-medium">{dep.reject_reason}</span>
                        ) : dep.status === 'APPROVED' ? (
                          <span className="text-emerald-400">Disetujui (+Rp {dep.amount.toLocaleString('id-ID')})</span>
                        ) : (
                          'Menunggu pemeriksaan tim Admin'
                        )}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="px-4 py-12 text-center text-slate-400 font-medium">
                      Belum ada data setoran yang cocok.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'withdrawals' && (
        <div className="rounded-2xl bg-[#121826] border border-white/10 overflow-hidden shadow-lg">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#1a2234] text-slate-400 border-b border-white/10 uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="px-4 py-3">ID WD</th>
                  <th className="px-4 py-3">Nominal Gross</th>
                  <th className="px-4 py-3">Fee Admin</th>
                  <th className="px-4 py-3">Diterima Bersih</th>
                  <th className="px-4 py-3">Metode & Rekening</th>
                  <th className="px-4 py-3">Waktu</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Keterangan</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 text-slate-200">
                {filteredWithdrawals.length > 0 ? (
                  filteredWithdrawals.map((wd) => (
                    <tr key={wd.id} className="hover:bg-white/5 transition">
                      <td className="px-4 py-3 font-mono text-slate-400">{wd.id.slice(-8)}</td>
                      <td className="px-4 py-3 font-mono font-bold text-white">
                        Rp {wd.gross_amount.toLocaleString('id-ID')}
                      </td>
                      <td className="px-4 py-3 font-mono text-rose-400">
                        Rp {wd.fee_amount.toLocaleString('id-ID')} ({wd.fee_rate}%)
                      </td>
                      <td className="px-4 py-3 font-mono font-bold text-emerald-400">
                        Rp {wd.net_amount.toLocaleString('id-ID')}
                      </td>
                      <td className="px-4 py-3">
                        <span className="font-semibold text-slate-200">{wd.payment_method}</span>{' '}
                        <span className="text-slate-400 font-mono text-[11px]">({wd.payment_account})</span>
                      </td>
                      <td className="px-4 py-3 text-slate-400">
                        {new Date(wd.created_at).toLocaleString('id-ID', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
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
                          {wd.status === 'REJECTED' && <AlertCircle className="w-3 h-3" />}
                          {wd.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-slate-400">
                        {wd.reject_reason ? (
                          <span className="text-rose-400 font-medium">{wd.reject_reason} (Saldo dikembalikan)</span>
                        ) : wd.status === 'APPROVED' ? (
                          <span className="text-emerald-400">Transfer Selesai</span>
                        ) : (
                          'Menunggu persetujuan Admin'
                        )}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={8} className="px-4 py-12 text-center text-slate-400 font-medium">
                      Belum ada data penarikan dana yang cocok.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'ledger' && (
        <div className="rounded-2xl bg-[#121826] border border-white/10 overflow-hidden shadow-lg">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#1a2234] text-slate-400 border-b border-white/10 uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="px-4 py-3">Tipe Mutasi</th>
                  <th className="px-4 py-3">Perubahan Saldo</th>
                  <th className="px-4 py-3">Saldo Akhir</th>
                  <th className="px-4 py-3">Deskripsi Transaksi</th>
                  <th className="px-4 py-3">Waktu</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 text-slate-200">
                {filteredTransactions.length > 0 ? (
                  filteredTransactions.map((tx) => (
                    <tr key={tx.id} className="hover:bg-white/5 transition">
                      <td className="px-4 py-3">
                        <span className="font-mono text-[11px] font-bold text-slate-300 px-2 py-0.5 rounded bg-white/5 border border-white/10">
                          {tx.type}
                        </span>
                      </td>
                      <td className="px-4 py-3 font-mono font-bold">
                        {tx.amount > 0 ? (
                          <span className="text-emerald-400 flex items-center gap-1">
                            <PlusCircle className="w-3 h-3" />+ Rp {tx.amount.toLocaleString('id-ID')}
                          </span>
                        ) : tx.amount < 0 ? (
                          <span className="text-rose-400 flex items-center gap-1">
                            <MinusCircle className="w-3 h-3" />- Rp {Math.abs(tx.amount).toLocaleString('id-ID')}
                          </span>
                        ) : (
                          <span className="text-slate-400">Rp 0 (Settle)</span>
                        )}
                      </td>
                      <td className="px-4 py-3 font-mono font-bold text-white">
                        Rp {tx.balance_after.toLocaleString('id-ID')}
                      </td>
                      <td className="px-4 py-3 text-slate-300 font-medium max-w-sm">{tx.description}</td>
                      <td className="px-4 py-3 text-slate-400">
                        {new Date(tx.created_at).toLocaleString('id-ID', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} className="px-4 py-12 text-center text-slate-400 font-medium">
                      Belum ada catatan mutasi saldo.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
