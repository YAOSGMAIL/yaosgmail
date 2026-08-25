import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { api } from '../lib/api';
import confetti from 'canvas-confetti';
import {
  MailPlus,
  ShieldAlert,
  Flame,
  CheckCircle2,
  AlertCircle,
  Coins,
  Sparkles,
  Info,
  Check,
  Send,
} from 'lucide-react';

interface DepositViewProps {
  setCurrentTab?: (tab: string) => void;
}

export const DepositView: React.FC<DepositViewProps> = ({ setCurrentTab }) => {
  const { systemSettings, refreshUser } = useAuth();
  const { success, error } = useToast();
  const navigate = useNavigate();

  const [rawText, setRawText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittedResult, setSubmittedResult] = useState<{
    submitted: any[];
    rejected: { gmail: string; reason: string }[];
  } | null>(null);

  const goToHistory = () => {
    if (setCurrentTab) setCurrentTab('history');
    navigate('/history');
  };

  const rate = systemSettings?.gmail_rate || 4300;
  const isDepositOpen = systemSettings?.deposit_status === 'OPEN';
  const isRoomOpen = systemSettings?.room_status !== 'CLOSED';

  // Live parser and deduplication
  const parsedList = useMemo(() => {
    const lines = rawText
      .split('\n')
      .map((l) => l.trim().toLowerCase())
      .filter((l) => l.length > 0);

    const gmailRegex = /^[a-zA-Z0-9._%+-]+@gmail\.com$/i;

    const uniqueValid: string[] = [];
    const duplicates: string[] = [];
    const invalidFormat: string[] = [];
    const seen = new Set<string>();

    for (const item of lines) {
      if (!gmailRegex.test(item)) {
        invalidFormat.push(item);
        continue;
      }
      if (seen.has(item)) {
        duplicates.push(item);
        continue;
      }
      seen.add(item);
      uniqueValid.push(item);
    }

    return {
      totalInputLines: lines.length,
      validGmailList: uniqueValid,
      duplicateCount: duplicates.length,
      invalidCount: invalidFormat.length,
      estimatedEarning: uniqueValid.length * rate,
    };
  }, [rawText, rate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!isDepositOpen || !isRoomOpen) {
      error('Layanan setoran Gmail saat ini sedang ditutup atau maintenance.');
      return;
    }

    if (parsedList.validGmailList.length === 0) {
      error('Masukkan minimal 1 alamat Gmail yang valid (@gmail.com).');
      return;
    }

    setIsSubmitting(true);
    setSubmittedResult(null);

    const res = await api.post('/user/deposits', {
      gmailList: parsedList.validGmailList,
    });

    setIsSubmitting(false);

    if (res.error || !res.data) {
      error(res.error || 'Gagal mengirim setoran.');
      return;
    }

    // Success flow
    if (res.data.submitted && res.data.submitted.length > 0) {
      success(`Berhasil mengirim ${res.data.submitted.length} akun Gmail untuk direview!`);
      try {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 },
        });
      } catch {
        // ignore
      }
      setRawText('');
      setSubmittedResult(res.data);
      refreshUser();
    } else {
      setSubmittedResult(res.data);
      error('Semua Gmail yang dikirim tidak lolos verifikasi sistem.');
    }
  };

  const handleInsertSample = () => {
    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    const sample = `user.test${randomSuffix}@gmail.com
sample.acc${randomSuffix + 1}@gmail.com
worker.sg${randomSuffix + 2}@gmail.com`;
    setRawText(sample);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-[#121826] p-5 rounded-3xl border border-white/10 shadow-xl">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-violet-600 to-indigo-600 flex items-center justify-center text-white shadow-lg shadow-violet-600/30">
            <MailPlus className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">Setor Akun Gmail</h1>
            <p className="text-xs text-slate-400">
              Kirim daftar Gmail Anda untuk ditinjau dan dapatkan saldo secara otomatis.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="px-3.5 py-1.5 rounded-xl bg-violet-500/10 border border-violet-500/30 text-right">
            <p className="text-[10px] text-slate-400 uppercase font-semibold">Rate Saat Ini</p>
            <p className="text-sm font-bold text-violet-400 font-mono">Rp {rate.toLocaleString('id-ID')} / Gmail</p>
          </div>
        </div>
      </div>

      {/* Prominent Security Warning Box */}
      <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 flex items-start gap-3">
        <ShieldAlert className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
        <div className="text-xs text-rose-200 leading-relaxed">
          <p className="font-bold text-rose-300">PERINGATAN KEAMANAN WAJIB:</p>
          <p className="mt-0.5">
            {systemSettings?.security_warning ||
              'Jangan pernah memasukkan password Gmail, kode OTP, nomor pemulihan, atau data sensitif apapun. Sistem hanya memerlukan alamat email berformat @gmail.com.'}
          </p>
        </div>
      </div>

      {/* Main Input Form & Realtime Counter Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Input Column */}
        <div className="lg:col-span-2 space-y-4">
          <form onSubmit={handleSubmit} className="p-5 rounded-3xl bg-[#121826] border border-white/10 shadow-xl space-y-4">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-bold text-slate-200">
                Daftar Alamat Gmail <span className="text-slate-400 font-normal">(1 baris per akun)</span>
              </label>
              <button
                type="button"
                onClick={handleInsertSample}
                className="text-[11px] font-semibold text-violet-400 hover:text-violet-300 transition"
              >
                + Masukkan Contoh
              </button>
            </div>

            <div className="relative">
              <textarea
                id="input-bulk-gmail"
                rows={9}
                value={rawText}
                onChange={(e) => setRawText(e.target.value)}
                placeholder={`contoh1@gmail.com\ncontoh2@gmail.com\ncontoh3@gmail.com`}
                className="w-full bg-[#070b14] border border-white/10 rounded-2xl p-4 text-xs sm:text-sm font-mono text-slate-100 placeholder:text-slate-400 focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500 transition leading-relaxed resize-y"
              />
            </div>

            {/* Validation Breakdown Pills */}
            <div className="flex flex-wrap gap-2 text-[11px]">
              <span className="px-2.5 py-1 rounded-lg bg-white/5 border border-white/10 text-slate-300">
                Total Baris: <strong className="text-white">{parsedList.totalInputLines}</strong>
              </span>
              <span className="px-2.5 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-300">
                Valid: <strong>{parsedList.validGmailList.length}</strong> Gmail
              </span>
              {parsedList.duplicateCount > 0 && (
                <span className="px-2.5 py-1 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-300">
                  Duplikat Dihapus: <strong>{parsedList.duplicateCount}</strong>
                </span>
              )}
              {parsedList.invalidCount > 0 && (
                <span className="px-2.5 py-1 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-300">
                  Bukan Gmail: <strong>{parsedList.invalidCount}</strong>
                </span>
              )}
            </div>

            <button
              id="btn-submit-deposits"
              type="submit"
              disabled={isSubmitting || parsedList.validGmailList.length === 0 || !isDepositOpen}
              className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-violet-600 via-indigo-600 to-purple-600 hover:from-violet-500 hover:to-indigo-500 text-white font-bold text-sm shadow-xl shadow-violet-600/30 flex items-center justify-center gap-2 transition active:scale-98 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? (
                <span>Mengirim dan Memvalidasi...</span>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  <span>
                    Kirim {parsedList.validGmailList.length > 0 ? `${parsedList.validGmailList.length} Gmail` : 'Setoran'}
                  </span>
                </>
              )}
            </button>
          </form>

          {/* Submission Result Notification */}
          {submittedResult && (
            <div className="p-5 rounded-3xl bg-[#121826] border border-white/10 shadow-xl space-y-3">
              <h3 className="text-xs font-bold text-white flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-emerald-400" />
                <span>Hasil Pengiriman Terakhir:</span>
              </h3>

              {submittedResult.submitted.length > 0 && (
                <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-300 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>
                      <strong>{submittedResult.submitted.length} Gmail</strong> berhasil dikirim ke antrian review.
                    </span>
                  </div>
                  <button
                    onClick={goToHistory}
                    className="text-xs underline font-bold hover:text-white"
                  >
                    Lihat Status
                  </button>
                </div>
              )}

              {submittedResult.rejected.length > 0 && (
                <div className="space-y-1.5">
                  <p className="text-[11px] font-semibold text-rose-400 flex items-center gap-1">
                    <AlertCircle className="w-3.5 h-3.5" />
                    <span>{submittedResult.rejected.length} Gmail ditolak sistem:</span>
                  </p>
                  <div className="max-h-32 overflow-y-auto space-y-1 pr-1">
                    {submittedResult.rejected.map((r, i) => (
                      <div
                        key={i}
                        className="p-2 rounded-lg bg-rose-500/5 border border-rose-500/20 text-[11px] flex items-center justify-between"
                      >
                        <span className="font-mono text-slate-300 truncate mr-2">{r.gmail}</span>
                        <span className="text-rose-400 shrink-0 text-[10px]">{r.reason}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Sidebar Summary & Rules Column */}
        <div className="space-y-4">
          {/* Estimated Earning Card */}
          <div className="p-5 rounded-3xl bg-gradient-to-b from-[#1a2234] to-[#121826] border border-white/10 shadow-xl space-y-4">
            <div className="flex items-center gap-2 text-violet-400">
              <Coins className="w-5 h-5" />
              <h3 className="text-xs font-bold text-white uppercase tracking-wider">Kalkulasi Estimasi</h3>
            </div>

            <div className="space-y-2 text-xs">
              <div className="flex justify-between text-slate-400">
                <span>Jumlah Gmail Terdeteksi:</span>
                <span className="text-white font-mono font-bold">{parsedList.validGmailList.length} Akun</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Rate per Gmail:</span>
                <span className="text-white font-mono font-bold">Rp {rate.toLocaleString('id-ID')}</span>
              </div>
              <div className="pt-3 border-t border-white/10 flex justify-between items-baseline">
                <span className="text-xs font-bold text-slate-200">Estimasi Saldo:</span>
                <span className="text-lg font-black text-emerald-400 font-mono">
                  Rp {parsedList.estimatedEarning.toLocaleString('id-ID')}
                </span>
              </div>
            </div>

            <div className="text-[11px] text-slate-400 bg-[#070b14]/60 p-3 rounded-xl border border-white/5">
              💡 Saldo akan langsung bertambah ke dompet Anda saat setoran diperiksa dan disetujui (Approved) oleh Admin.
            </div>
          </div>

          {/* Quick Submission Rules */}
          <div className="p-5 rounded-3xl bg-[#121826] border border-white/10 shadow-xl space-y-3 text-xs">
            <div className="flex items-center gap-2 text-slate-200">
              <Info className="w-4 h-4 text-indigo-400" />
              <h4 className="font-bold">Ketentuan Setoran</h4>
            </div>
            <ul className="space-y-2 text-slate-400 text-[11px]">
              <li className="flex items-start gap-2">
                <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                <span>Hanya menerima alamat berakhiran @gmail.com</span>
              </li>
              <li className="flex items-start gap-2">
                <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                <span>Akun belum pernah disetujui sebelumnya</span>
              </li>
              <li className="flex items-start gap-2">
                <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                <span>Duplikat baris otomatis dibersihkan sistem</span>
              </li>
              <li className="flex items-start gap-2">
                <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                <span>Proses review berkisar 5 - 30 menit</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};
