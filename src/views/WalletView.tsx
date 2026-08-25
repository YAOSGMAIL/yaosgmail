import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { api } from '../lib/api';
import confetti from 'canvas-confetti';
import {
  Wallet,
  ArrowDownToLine,
  CheckCircle2,
  XCircle,
  Clock,
  Coins,
  Receipt,
  CreditCard,
  AlertCircle,
  ArrowRight,
  ShieldCheck,
  RefreshCw,
} from 'lucide-react';
import { Withdrawal, BalanceTransaction } from '../types';

interface WalletData {
  available_balance: number;
  reserved_balance: number;
  total_balance: number;
  total_deposited_approved: number;
  total_withdrawn_approved: number;
  approved_deposits_count: number;
  settings: {
    minimum_withdrawal: number;
    minimum_approved_gmail: number;
    withdrawal_fee_type: 'percentage' | 'fixed';
    withdrawal_fee_current: number;
    withdrawal_status: 'OPEN' | 'CLOSED';
  };
  payment_method_default?: string | null;
  payment_account_default?: string | null;
  withdrawals: Withdrawal[];
  transactions: BalanceTransaction[];
}

export const WalletView: React.FC = () => {
  const { refreshUser } = useAuth();
  const { success, error } = useToast();

  const [walletData, setWalletData] = useState<WalletData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Form State
  const [grossAmount, setGrossAmount] = useState<number | string>('');
  const [paymentMethod, setPaymentMethod] = useState('DANA');
  const [paymentAccount, setPaymentAccount] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchWallet = async () => {
    setIsLoading(true);
    const res = await api.get<WalletData>('/user/wallet');
    if (res.data) {
      setWalletData(res.data);
      if (res.data.payment_method_default) {
        setPaymentMethod(res.data.payment_method_default);
      }
      if (res.data.payment_account_default && !paymentAccount) {
        setPaymentAccount(res.data.payment_account_default);
      }
    }
    setIsLoading(false);
  };

  useEffect(() => {
    fetchWallet();
  }, []);

  const numGross = typeof grossAmount === 'number' ? grossAmount : Number(grossAmount) || 0;
  const available = walletData?.available_balance || 0;
  const minWd = walletData?.settings.minimum_withdrawal || 50000;
  const minApprovedGmail = walletData?.settings.minimum_approved_gmail || 2;
  const feeRate = walletData?.settings.withdrawal_fee_current || 15;
  const userApprovedGmailCount = walletData?.approved_deposits_count || 0;

  // Realtime Fee & Net Math
  const feeCalculation = useMemo(() => {
    const fee = Math.round((numGross * feeRate) / 100);
    const net = Math.max(0, numGross - fee);
    return {
      feeAmount: fee,
      netAmount: net,
    };
  }, [numGross, feeRate]);

  // Requirement Validations
  const isBalanceSufficient = numGross > 0 && numGross <= available;
  const isMinWdMet = numGross >= minWd;
  const isGmailMet = userApprovedGmailCount >= minApprovedGmail;
  const isAccountFilled = paymentAccount.trim().length > 3;
  const canSubmit = isBalanceSufficient && isMinWdMet && isGmailMet && isAccountFilled && !isSubmitting;

  const handleSubmitWd = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!isBalanceSufficient) {
      error(`Saldo tidak mencukupi. Saldo tersedia: Rp${available.toLocaleString('id-ID')}`);
      return;
    }

    if (!isMinWdMet) {
      error(`Minimum WD adalah Rp${minWd.toLocaleString('id-ID')}.`);
      return;
    }

    if (!isGmailMet) {
      error(
        `Anda harus memiliki minimal ${minApprovedGmail} Gmail yang telah disetujui untuk melakukan WD.`
      );
      return;
    }

    if (!isAccountFilled) {
      error('Silakan lengkapi nomor rekening atau nomor e-Wallet.');
      return;
    }

    setIsSubmitting(true);
    const res = await api.post('/user/withdrawals', {
      grossAmount: numGross,
      paymentMethod,
      paymentAccount: paymentAccount.trim(),
    });
    setIsSubmitting(false);

    if (res.error || !res.data) {
      error(res.error || 'Gagal mengajukan penarikan dana.');
      return;
    }

    success('Withdrawal berhasil diajukan! Saldo dicadangkan dan menunggu proses Admin.');
    try {
      confetti({ particleCount: 70, spread: 60, origin: { y: 0.7 } });
    } catch {
      // ignore
    }

    setGrossAmount('');
    fetchWallet();
    refreshUser();
  };

  const handleSetMax = () => {
    setGrossAmount(available);
  };

  if (isLoading && !walletData) {
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
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center text-white shadow-lg shadow-emerald-600/30">
            <Wallet className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">Dompet & Penarikan Dana</h1>
            <p className="text-xs text-slate-400">
              Kelola saldo, pantau dana yang dicadangkan, dan cairkan pendapatan Anda.
            </p>
          </div>
        </div>

        <button
          onClick={fetchWallet}
          className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 text-xs font-semibold border border-white/10 transition self-start sm:self-auto"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
          <span>Segarkan Data</span>
        </button>
      </div>

      {/* 4 Balance Breakdown Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Available Balance */}
        <div className="p-5 rounded-2xl bg-[#121826] border border-emerald-500/30 shadow-lg">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Saldo Tersedia</span>
            <div className="w-6 h-6 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
              <Coins className="w-3.5 h-3.5" />
            </div>
          </div>
          <p className="text-xl sm:text-2xl font-black text-emerald-400 font-mono mt-2">
            Rp {(walletData?.available_balance || 0).toLocaleString('id-ID')}
          </p>
          <p className="text-[10px] text-slate-400 mt-1">Dapat langsung ditarik</p>
        </div>

        {/* Reserved in Pending WD */}
        <div className="p-5 rounded-2xl bg-[#121826] border border-amber-500/30 shadow-lg">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Saldo Dicadangkan (WD)</span>
            <div className="w-6 h-6 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center">
              <Clock className="w-3.5 h-3.5" />
            </div>
          </div>
          <p className="text-xl sm:text-2xl font-black text-amber-400 font-mono mt-2">
            Rp {(walletData?.reserved_balance || 0).toLocaleString('id-ID')}
          </p>
          <p className="text-[10px] text-slate-400 mt-1">Sedang diproses admin</p>
        </div>

        {/* Total Deposited Approved */}
        <div className="p-5 rounded-2xl bg-[#121826] border border-white/10 shadow-lg">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Total Pendapatan</span>
            <div className="w-6 h-6 rounded-lg bg-violet-500/20 text-violet-400 flex items-center justify-center">
              <Receipt className="w-3.5 h-3.5" />
            </div>
          </div>
          <p className="text-xl sm:text-2xl font-black text-violet-300 font-mono mt-2">
            Rp {(walletData?.total_deposited_approved || 0).toLocaleString('id-ID')}
          </p>
          <p className="text-[10px] text-slate-400 mt-1">Dari setoran yang disetujui</p>
        </div>

        {/* Total Withdrawn */}
        <div className="p-5 rounded-2xl bg-[#121826] border border-white/10 shadow-lg">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Total Dicairkan</span>
            <div className="w-6 h-6 rounded-lg bg-blue-500/20 text-blue-400 flex items-center justify-center">
              <ArrowDownToLine className="w-3.5 h-3.5" />
            </div>
          </div>
          <p className="text-xl sm:text-2xl font-black text-blue-300 font-mono mt-2">
            Rp {(walletData?.total_withdrawn_approved || 0).toLocaleString('id-ID')}
          </p>
          <p className="text-[10px] text-slate-400 mt-1">Bersih masuk ke rekening/e-Wallet</p>
        </div>
      </div>

      {/* Main Withdrawal Form & Realtime Calculator */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Form Column */}
        <div className="lg:col-span-2 space-y-4">
          <form onSubmit={handleSubmitWd} className="p-6 rounded-3xl bg-[#121826] border border-white/10 shadow-xl space-y-5">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold text-white flex items-center gap-2">
                <ArrowDownToLine className="w-4 h-4 text-emerald-400" />
                <span>Formulir Pengajuan Withdrawal (WD)</span>
              </h2>
              <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                Fee WD {feeRate}%
              </span>
            </div>

            {/* Nominal Input */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-bold text-slate-300">Nominal Penarikan (Rp)</label>
                <button
                  type="button"
                  onClick={handleSetMax}
                  className="text-[11px] font-bold text-emerald-400 hover:text-emerald-300 transition"
                >
                  Tarik Semua Saldo (Rp {available.toLocaleString('id-ID')})
                </button>
              </div>

              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm font-bold text-slate-400 font-mono">
                  Rp
                </span>
                <input
                  id="input-wd-amount"
                  type="number"
                  min={minWd}
                  step={1000}
                  value={grossAmount}
                  onChange={(e) => setGrossAmount(e.target.value)}
                  placeholder={`Minimal ${minWd.toLocaleString('id-ID')}`}
                  className="w-full bg-[#070b14] border border-white/10 rounded-2xl pl-12 pr-4 py-3 text-base font-bold font-mono text-white placeholder:text-slate-400 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition"
                />
              </div>

              {/* Quick Nominal Buttons */}
              <div className="flex flex-wrap gap-2 mt-2">
                {[50000, 100000, 250000, 500000].map((amt) => (
                  <button
                    key={amt}
                    type="button"
                    onClick={() => setGrossAmount(amt)}
                    className="px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-[11px] font-mono font-medium text-slate-300 transition"
                  >
                    Rp {(amt / 1000).toFixed(0)}k
                  </button>
                ))}
              </div>
            </div>

            {/* Payment Method & Account */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5">Metode Pembayaran</label>
                <select
                  id="select-wd-method"
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  className="w-full bg-[#070b14] border border-white/10 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-emerald-500 transition"
                >
                  <optgroup label="e-Wallet">
                    <option value="DANA">DANA</option>
                    <option value="GoPay">GoPay</option>
                    <option value="OVO">OVO</option>
                    <option value="ShopeePay">ShopeePay</option>
                  </optgroup>
                  <optgroup label="Transfer Bank">
                    <option value="BCA">Bank BCA</option>
                    <option value="BRI">Bank BRI</option>
                    <option value="Mandiri">Bank Mandiri</option>
                    <option value="BNI">Bank BNI</option>
                  </optgroup>
                </select>
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-bold text-slate-300 mb-1.5">
                  Nomor Rekening / e-Wallet & Nama Pemilik
                </label>
                <div className="relative">
                  <CreditCard className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    id="input-wd-account"
                    type="text"
                    value={paymentAccount}
                    onChange={(e) => setPaymentAccount(e.target.value)}
                    placeholder="08123456789 (a.n. Nama Pemilik)"
                    required
                    className="w-full bg-[#070b14] border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-xs sm:text-sm text-slate-100 placeholder:text-slate-400 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition"
                  />
                </div>
              </div>
            </div>

            {/* Submit Button */}
            <button
              id="btn-submit-withdrawal"
              type="submit"
              disabled={!canSubmit}
              className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-500 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-sm shadow-xl shadow-emerald-600/30 flex items-center justify-center gap-2 transition active:scale-98 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? (
                <span>Memproses Pengajuan...</span>
              ) : (
                <>
                  <span>Ajukan Penarikan Dana</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        </div>

        {/* Live Calculation Preview & Requirements Column */}
        <div className="space-y-4">
          {/* Live Preview Box */}
          <div className="p-5 rounded-3xl bg-gradient-to-b from-[#1a2234] to-[#121826] border border-white/10 shadow-xl space-y-4">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <Receipt className="w-4 h-4 text-emerald-400" />
              <span>Rincian Kalkulasi WD</span>
            </h3>

            <div className="space-y-2.5 text-xs">
              <div className="flex justify-between text-slate-400">
                <span>Nominal Pengajuan (Gross):</span>
                <span className="font-mono font-bold text-white">
                  Rp {numGross > 0 ? numGross.toLocaleString('id-ID') : '0'}
                </span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Biaya Admin ({feeRate}%):</span>
                <span className="font-mono font-bold text-rose-400">
                  - Rp {numGross > 0 ? feeCalculation.feeAmount.toLocaleString('id-ID') : '0'}
                </span>
              </div>
              <div className="pt-3 border-t border-white/10 flex justify-between items-baseline">
                <span className="text-xs font-bold text-slate-200">Dana Diterima (Net):</span>
                <span className="text-lg font-black text-emerald-400 font-mono">
                  Rp {numGross > 0 ? feeCalculation.netAmount.toLocaleString('id-ID') : '0'}
                </span>
              </div>
            </div>
          </div>

          {/* Checklist Syarat WD */}
          <div className="p-5 rounded-3xl bg-[#121826] border border-white/10 shadow-xl space-y-3 text-xs">
            <h4 className="font-bold text-slate-200 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-violet-400" />
              <span>Syarat Kelayakan Withdrawal</span>
            </h4>

            <div className="space-y-2 text-[11px]">
              {/* Check 1: Saldo */}
              <div
                className={`flex items-start gap-2 p-2 rounded-xl border ${
                  isBalanceSufficient
                    ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-300'
                    : 'bg-rose-500/10 border-rose-500/20 text-rose-300'
                }`}
              >
                {isBalanceSufficient ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                ) : (
                  <XCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                )}
                <div>
                  <p className="font-bold">Saldo Tersedia Cukup</p>
                  <p className="text-[10px] text-slate-300">
                    Tersedia: Rp {available.toLocaleString('id-ID')}
                  </p>
                </div>
              </div>

              {/* Check 2: Minimum WD */}
              <div
                className={`flex items-start gap-2 p-2 rounded-xl border ${
                  isMinWdMet
                    ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-300'
                    : 'bg-rose-500/10 border-rose-500/20 text-rose-300'
                }`}
              >
                {isMinWdMet ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                ) : (
                  <XCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                )}
                <div>
                  <p className="font-bold">Minimum WD Terpenuhi</p>
                  <p className="text-[10px] text-slate-300">
                    Batas minimal: Rp {minWd.toLocaleString('id-ID')}
                  </p>
                </div>
              </div>

              {/* Check 3: Gmail Approved Requirement */}
              <div
                className={`flex items-start gap-2 p-2 rounded-xl border ${
                  isGmailMet
                    ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-300'
                    : 'bg-rose-500/10 border-rose-500/20 text-rose-300'
                }`}
              >
                {isGmailMet ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                ) : (
                  <XCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                )}
                <div>
                  <p className="font-bold">Minimal {minApprovedGmail} Gmail Approved</p>
                  <p className="text-[10px] text-slate-300">
                    Gmail Anda yang approved: <strong>{userApprovedGmailCount}</strong> akun
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Withdrawals History Table */}
      <div className="space-y-3">
        <h3 className="text-sm font-bold text-slate-200">Riwayat Penarikan Dana Anda</h3>
        <div className="rounded-2xl bg-[#121826] border border-white/10 overflow-hidden shadow-lg">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#1a2234] text-slate-400 border-b border-white/10 uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="px-4 py-3">Nominal Gross</th>
                  <th className="px-4 py-3">Fee Admin</th>
                  <th className="px-4 py-3">Dana Diterima</th>
                  <th className="px-4 py-3">Metode & Rekening</th>
                  <th className="px-4 py-3">Waktu</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Keterangan</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 text-slate-200">
                {walletData?.withdrawals && walletData.withdrawals.length > 0 ? (
                  walletData.withdrawals.map((wd) => (
                    <tr key={wd.id} className="hover:bg-white/5 transition">
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
                        <span className="font-semibold text-slate-200">{wd.payment_method}</span> -{' '}
                        <span className="text-slate-400 font-mono">{wd.payment_account}</span>
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
                          {wd.status === 'REJECTED' && <AlertCircle className="w-3 h-3" />}
                          {wd.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-slate-400 max-w-xs truncate">
                        {wd.reject_reason ? (
                          <span className="text-rose-400">{wd.reject_reason} (Saldo dikembalikan)</span>
                        ) : wd.status === 'APPROVED' ? (
                          <span className="text-emerald-400">Transfer Selesai</span>
                        ) : (
                          'Menunggu Transfer Admin'
                        )}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={7} className="px-4 py-8 text-center text-slate-400 font-medium">
                      Belum ada riwayat penarikan dana.
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
