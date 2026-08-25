import React, { useState, useEffect } from 'react';
import { api } from '../../lib/api';
import { useToast } from '../../context/ToastContext';
import {
  GlobalStatsConfig,
  GlobalStatsValues,
  GlobalStatsVisibility,
} from '../../types';
import {
  BarChart3,
  Sparkles,
  Database,
  Sliders,
  Eye,
  EyeOff,
  Save,
  RotateCcw,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  TrendingUp,
  Users,
  Inbox,
  ArrowDownToLine,
  ShieldCheck,
  HelpCircle,
  Copy,
  Info,
} from 'lucide-react';

interface StatsResponse {
  config: GlobalStatsConfig;
  auto_stats: GlobalStatsValues;
  active_stats: GlobalStatsValues;
}

interface StatItemDef {
  key: keyof GlobalStatsValues;
  label: string;
  category: 'user' | 'gmail' | 'wd' | 'financial';
  isCurrency?: boolean;
  description: string;
}

const STAT_ITEMS: StatItemDef[] = [
  {
    key: 'total_users',
    label: 'Total User',
    category: 'user',
    description: 'Jumlah seluruh akun pengguna terdaftar di platform.',
  },
  {
    key: 'user_aktif',
    label: 'User Aktif',
    category: 'user',
    description: 'Jumlah pengguna dengan status akun aktif.',
  },
  {
    key: 'user_nonaktif',
    label: 'User Nonaktif / Banned',
    category: 'user',
    description: 'Jumlah pengguna yang dinonaktifkan atau disuspend.',
  },
  {
    key: 'total_gmail',
    label: 'Total Gmail Disetor',
    category: 'gmail',
    description: 'Jumlah keseluruhan akun Gmail yang pernah disetor.',
  },
  {
    key: 'total_setoran',
    label: 'Total Batch Setoran',
    category: 'gmail',
    description: 'Total transaksi setoran Gmail yang masuk.',
  },
  {
    key: 'gmail_acc',
    label: 'Gmail ACC (Approved)',
    category: 'gmail',
    description: 'Jumlah setoran Gmail dengan status ACC / Disetujui.',
  },
  {
    key: 'gmail_pending',
    label: 'Gmail Pending',
    category: 'gmail',
    description: 'Jumlah Gmail yang masih menunggu review Admin.',
  },
  {
    key: 'gmail_reject',
    label: 'Gmail Reject (Ditolak)',
    category: 'gmail',
    description: 'Jumlah setoran Gmail yang ditolak.',
  },
  {
    key: 'total_wd',
    label: 'Total Transaksi WD',
    category: 'wd',
    description: 'Jumlah total pengajuan penarikan dana.',
  },
  {
    key: 'wd_acc',
    label: 'WD ACC (Selesai/Sukses)',
    category: 'wd',
    description: 'Jumlah penarikan dana yang berhasil dicairkan.',
  },
  {
    key: 'wd_pending',
    label: 'WD Pending',
    category: 'wd',
    description: 'Jumlah pengajuan WD yang sedang menunggu proses transfer.',
  },
  {
    key: 'wd_reject',
    label: 'WD Reject (Ditolak)',
    category: 'wd',
    description: 'Jumlah pengajuan WD yang ditolak oleh Admin.',
  },
  {
    key: 'total_nominal_setoran',
    label: 'Total Nominal Setoran',
    category: 'financial',
    isCurrency: true,
    description: 'Akumulasi total nilai rupiah setoran yang disetujui.',
  },
  {
    key: 'total_nominal_wd',
    label: 'Total Nominal WD',
    category: 'financial',
    isCurrency: true,
    description: 'Akumulasi total nilai rupiah yang telah dicairkan ke pengguna.',
  },
];

export const AdminStatistics: React.FC = () => {
  const { success, error } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // Server state
  const [config, setConfig] = useState<GlobalStatsConfig | null>(null);
  const [autoStats, setAutoStats] = useState<GlobalStatsValues | null>(null);
  const [activeStats, setActiveStats] = useState<GlobalStatsValues | null>(null);

  // Editable form state
  const [mode, setMode] = useState<'auto' | 'manual'>('auto');
  const [showToUsers, setShowToUsers] = useState<boolean>(true);
  const [manualValues, setManualValues] = useState<GlobalStatsValues>({
    total_users: 0,
    total_gmail: 0,
    total_setoran: 0,
    total_nominal_setoran: 0,
    total_wd: 0,
    total_nominal_wd: 0,
    user_aktif: 0,
    user_nonaktif: 0,
    gmail_acc: 0,
    gmail_pending: 0,
    gmail_reject: 0,
    wd_acc: 0,
    wd_pending: 0,
    wd_reject: 0,
  });
  const [visibility, setVisibility] = useState<GlobalStatsVisibility>({
    total_users: true,
    total_gmail: true,
    total_setoran: true,
    total_nominal_setoran: false,
    total_wd: true,
    total_nominal_wd: false,
    user_aktif: true,
    user_nonaktif: false,
    gmail_acc: true,
    gmail_pending: false,
    gmail_reject: false,
    wd_acc: true,
    wd_pending: false,
    wd_reject: false,
  });

  const [activeCategory, setActiveCategory] = useState<'all' | 'user' | 'gmail' | 'wd' | 'financial'>('all');

  const fetchStats = async () => {
    setIsLoading(true);
    const res = await api.get<StatsResponse>('/admin/statistics');
    if (res.data) {
      const cfg = res.data.config;
      setConfig(cfg);
      setAutoStats(res.data.auto_stats);
      setActiveStats(res.data.active_stats);

      setMode(cfg.mode);
      setShowToUsers(cfg.show_to_users);
      setManualValues(cfg.manual_stats);
      setVisibility(cfg.visibility);
    }
    setIsLoading(false);
  };

  useEffect(() => {
    fetchStats();
  }, []);

  const handleManualChange = (key: keyof GlobalStatsValues, value: string) => {
    const cleanVal = value.replace(/[^0-9]/g, '');
    const num = cleanVal === '' ? 0 : parseInt(cleanVal, 10);
    setManualValues((prev) => ({
      ...prev,
      [key]: num,
    }));
  };

  const handleToggleVisibility = (key: keyof GlobalStatsVisibility) => {
    setVisibility((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const handleToggleAllVisibility = (enabled: boolean) => {
    const updated: any = {};
    STAT_ITEMS.forEach((item) => {
      updated[item.key] = enabled;
    });
    setVisibility(updated);
  };

  const handleCopyAutoToManual = () => {
    if (!autoStats) return;
    setManualValues({ ...autoStats });
    success('Nilai database otomatis berhasil disalin ke form manual!');
  };

  const handleSave = async () => {
    setIsSaving(true);
    const payload: Partial<GlobalStatsConfig> = {
      mode,
      show_to_users: showToUsers,
      manual_stats: manualValues,
      visibility,
    };

    const res = await api.put<StatsResponse>('/admin/statistics', payload);
    setIsSaving(false);

    if (res.error) {
      error(res.error || 'Gagal menyimpan pengaturan statistik.');
      return;
    }

    if (res.data) {
      setConfig(res.data.config);
      setAutoStats(res.data.auto_stats);
      setActiveStats(res.data.active_stats);
    }

    success('Statistik global berhasil diperbarui dan tersimpan ke audit log!');
  };

  const handleResetToAuto = async () => {
    if (!window.confirm('Reset semua statistik ke Mode Otomatis dari database asli?')) return;
    setIsSaving(true);
    const res = await api.post<StatsResponse>('/admin/statistics/reset', {});
    setIsSaving(false);

    if (res.error) {
      error(res.error || 'Gagal mereset statistik.');
      return;
    }

    if (res.data) {
      setConfig(res.data.config);
      setAutoStats(res.data.auto_stats);
      setActiveStats(res.data.active_stats);
      setMode('auto');
      setManualValues(res.data.config.manual_stats);
    }

    success('Statistik berhasil dikembalikan ke Mode Otomatis (Database)!');
  };

  if (isLoading && !config) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <RefreshCw className="w-8 h-8 text-violet-500 animate-spin" />
      </div>
    );
  }

  const filteredItems =
    activeCategory === 'all'
      ? STAT_ITEMS
      : STAT_ITEMS.filter((item) => item.category === activeCategory);

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-12">
      {/* Header Banner */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-gradient-to-r from-violet-950/50 via-[#121826] to-[#121826] p-6 rounded-3xl border border-white/10 shadow-xl">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-violet-600 to-indigo-600 flex items-center justify-center text-white shadow-lg shadow-violet-600/30 shrink-0">
            <BarChart3 className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                Statistik Global Platform
              </h1>
              <span
                className={`text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full border ${
                  mode === 'auto'
                    ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                    : 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                }`}
              >
                {mode === 'auto' ? 'Mode Otomatis' : 'Mode Manual'}
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Atur metrik publik yang ditampilkan kepada pengguna. Mode manual hanya memanipulasi tampilan display tanpa mengubah data transaksi asli.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            id="btn-refresh-stats"
            onClick={fetchStats}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 text-xs font-semibold border border-white/10 transition"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            <span>Segarkan</span>
          </button>
          <button
            id="btn-save-stats-top"
            onClick={handleSave}
            disabled={isSaving}
            className="flex items-center gap-1.5 px-5 py-2 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white text-xs font-bold shadow-lg shadow-violet-600/30 transition disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            <span>{isSaving ? 'Menyimpan...' : 'Simpan Statistik'}</span>
          </button>
        </div>
      </div>

      {/* Mode & Master Visibility Controls */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Card 1: Mode Selection */}
        <div className="bg-[#121826] p-5 rounded-3xl border border-white/10 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <Sliders className="w-5 h-5 text-violet-400" />
              <h2 className="text-sm font-bold text-white">Mode Pengoperasian Statistik</h2>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 p-1 bg-white/5 rounded-2xl border border-white/5">
            <button
              type="button"
              id="btn-mode-auto"
              onClick={() => setMode('auto')}
              className={`flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-xs font-bold transition ${
                mode === 'auto'
                  ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-lg shadow-emerald-600/30'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Database className="w-4 h-4" />
              <span>Otomatis (Database)</span>
            </button>

            <button
              type="button"
              id="btn-mode-manual"
              onClick={() => setMode('manual')}
              className={`flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-xs font-bold transition ${
                mode === 'manual'
                  ? 'bg-gradient-to-r from-amber-600 to-orange-600 text-white shadow-lg shadow-amber-600/30'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Sliders className="w-4 h-4" />
              <span>Manual (Custom)</span>
            </button>
          </div>

          <div className="p-3.5 rounded-2xl bg-white/[0.03] border border-white/5 text-xs space-y-1 text-slate-300">
            {mode === 'auto' ? (
              <p className="flex items-start gap-2 text-emerald-300">
                <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
                <span>
                  <strong>Mode Otomatis Aktif:</strong> Semua angka dihitung real-time langsung dari database (user terdaftar, total deposit, transaksi WD, dsb).
                </span>
              </p>
            ) : (
              <p className="flex items-start gap-2 text-amber-300">
                <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>
                  <strong>Mode Manual Aktif:</strong> Anda bebas memasukkan angka kustom untuk keperluan display. Saldo dan data user riil tetap aman dan tidak terpengaruh.
                </span>
              </p>
            )}
          </div>
        </div>

        {/* Card 2: Master Visibility */}
        <div className="bg-[#121826] p-5 rounded-3xl border border-white/10 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              {showToUsers ? (
                <Eye className="w-5 h-5 text-emerald-400" />
              ) : (
                <EyeOff className="w-5 h-5 text-rose-400" />
              )}
              <h2 className="text-sm font-bold text-white">Tampilkan ke Dashboard Pengguna</h2>
            </div>

            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                id="toggle-master-visibility"
                checked={showToUsers}
                onChange={(e) => setShowToUsers(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500"></div>
            </label>
          </div>

          <p className="text-xs text-slate-400 leading-relaxed">
            Jika diaktifkan, widget <strong>Statistik Platform</strong> akan muncul di Beranda Pengguna sesuai centang metrik yang diizinkan di bawah ini.
          </p>

          <div className="flex items-center justify-between pt-2 border-t border-white/5">
            <span className="text-xs text-slate-400">Kontrol Cepat Visibilitas:</span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                id="btn-show-all-metrics"
                onClick={() => handleToggleAllVisibility(true)}
                className="text-[11px] font-semibold text-violet-400 hover:text-violet-300 px-2 py-1 rounded bg-violet-500/10"
              >
                Pilih Semua
              </button>
              <button
                type="button"
                id="btn-hide-all-metrics"
                onClick={() => handleToggleAllVisibility(false)}
                className="text-[11px] font-semibold text-slate-400 hover:text-slate-300 px-2 py-1 rounded bg-white/5"
              >
                Sembunyikan Semua
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Category Tabs & Quick Copy Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-[#121826] p-3 rounded-2xl border border-white/10">
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
          {[
            { id: 'all', label: 'Semua 14 Metrik' },
            { id: 'user', label: 'Pengguna' },
            { id: 'gmail', label: 'Gmail' },
            { id: 'wd', label: 'Penarikan (WD)' },
            { id: 'financial', label: 'Nominal (Rp)' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveCategory(tab.id as any)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition ${
                activeCategory === tab.id
                  ? 'bg-violet-600 text-white shadow'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {mode === 'manual' && (
          <button
            type="button"
            id="btn-copy-auto-values"
            onClick={handleCopyAutoToManual}
            className="flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 text-xs font-bold border border-amber-500/30 transition shrink-0"
          >
            <Copy className="w-3.5 h-3.5" />
            <span>Salin Nilai Otomatis ke Input</span>
          </button>
        )}
      </div>

      {/* Grid of 14 Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredItems.map((item, idx) => {
          const isVisible = visibility[item.key as keyof GlobalStatsVisibility];
          const autoVal = autoStats ? autoStats[item.key] : 0;
          const manualVal = manualValues[item.key];
          const activeVal = mode === 'auto' ? autoVal : manualVal;

          return (
            <div
              key={item.key}
              id={`stat-card-${item.key}`}
              className={`relative bg-[#121826] p-5 rounded-3xl border transition duration-200 ${
                isVisible
                  ? 'border-white/10 shadow-lg'
                  : 'border-white/5 opacity-70 bg-[#0d121c]'
              }`}
            >
              {/* Card Header: Label & Visibility Toggle */}
              <div className="flex items-start justify-between gap-3 mb-3">
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] font-mono text-slate-500">#{idx + 1}</span>
                    <h3 className="text-sm font-bold text-white tracking-tight">{item.label}</h3>
                  </div>
                  <p className="text-[11px] text-slate-400 mt-0.5 line-clamp-1">{item.description}</p>
                </div>

                <button
                  type="button"
                  id={`btn-vis-${item.key}`}
                  onClick={() => handleToggleVisibility(item.key as keyof GlobalStatsVisibility)}
                  title={isVisible ? 'Ditampilkan ke Pengguna' : 'Disembunyikan dari Pengguna'}
                  className={`p-2 rounded-xl border transition ${
                    isVisible
                      ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                      : 'bg-white/5 text-slate-500 border-white/10 hover:text-slate-400'
                  }`}
                >
                  {isVisible ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                </button>
              </div>

              {/* Display / Input Value */}
              <div className="space-y-3 pt-2 border-t border-white/5">
                {mode === 'manual' ? (
                  <div>
                    <label className="block text-[11px] font-semibold text-amber-300 mb-1">
                      Input Nilai Manual {item.isCurrency ? '(Nominal Rp)' : '(Jumlah)'}:
                    </label>
                    <div className="relative">
                      {item.isCurrency && (
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">
                          Rp
                        </span>
                      )}
                      <input
                        type="text"
                        id={`input-stat-${item.key}`}
                        value={manualVal.toLocaleString('id-ID')}
                        onChange={(e) => handleManualChange(item.key, e.target.value)}
                        className={`w-full bg-[#0c101a] border border-amber-500/30 focus:border-amber-400 rounded-xl py-2 text-sm font-bold text-white outline-none transition ${
                          item.isCurrency ? 'pl-9 pr-3' : 'px-3'
                        }`}
                        placeholder="0"
                      />
                    </div>
                  </div>
                ) : (
                  <div>
                    <span className="text-[11px] text-slate-400">Nilai Aktif (Database):</span>
                    <p className="text-xl font-black text-white mt-0.5">
                      {item.isCurrency
                        ? `Rp${autoVal.toLocaleString('id-ID')}`
                        : autoVal.toLocaleString('id-ID')}
                    </p>
                  </div>
                )}

                {/* Database Comparison Indicator */}
                <div className="flex items-center justify-between text-[11px] pt-2 border-t border-white/5 text-slate-400">
                  <span>Data Asli DB:</span>
                  <span className="font-mono font-bold text-slate-300">
                    {item.isCurrency
                      ? `Rp${autoVal.toLocaleString('id-ID')}`
                      : autoVal.toLocaleString('id-ID')}
                  </span>
                </div>

                {/* Display status chip */}
                <div className="flex items-center justify-between pt-1 text-[10px]">
                  <span className="text-slate-400">Status Tampil User:</span>
                  <span
                    className={`font-semibold ${
                      isVisible && showToUsers ? 'text-emerald-400' : 'text-slate-500'
                    }`}
                  >
                    {isVisible && showToUsers ? '● Tampil' : '○ Tersembunyi'}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Action Footer */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-[#121826] p-6 rounded-3xl border border-white/10 shadow-xl">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-violet-500/10 border border-violet-500/20 flex items-center justify-center text-violet-400 shrink-0">
            <Info className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs font-bold text-white">Konfirmasi & Simpan Perubahan</p>
            <p className="text-[11px] text-slate-400">
              Setiap kali Anda menekan tombol simpan, log aktivitas tersimpan dengan catatan sebelum dan sesudah perubahan.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          <button
            type="button"
            id="btn-reset-stats-bottom"
            onClick={handleResetToAuto}
            disabled={isSaving}
            className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 text-xs font-bold border border-white/10 transition"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Reset ke Otomatis</span>
          </button>

          <button
            type="button"
            id="btn-save-stats-bottom"
            onClick={handleSave}
            disabled={isSaving}
            className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white text-xs font-bold shadow-lg shadow-violet-600/30 transition disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            <span>{isSaving ? 'Menyimpan...' : 'Simpan Statistik'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
