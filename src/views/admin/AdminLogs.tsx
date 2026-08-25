import React, { useState, useEffect } from 'react';
import { api } from '../../lib/api';
import { ActivityLog } from '../../types';
import {
  ScrollText,
  Search,
  RefreshCw,
  Clock,
  User,
  ShieldCheck,
  ChevronDown,
  ChevronRight,
} from 'lucide-react';

export const AdminLogs: React.FC = () => {
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [actionFilter, setActionFilter] = useState('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const fetchLogs = async () => {
    setIsLoading(true);
    const res = await api.get<ActivityLog[]>(`/admin/logs?action=${actionFilter}`);
    if (res.data) {
      setLogs(res.data);
    }
    setIsLoading(false);
  };

  useEffect(() => {
    fetchLogs();
  }, [actionFilter]);

  const filteredLogs = logs.filter((log) => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return (
      log.description.toLowerCase().includes(term) ||
      log.action.toLowerCase().includes(term) ||
      (log.user_id && log.user_id.toLowerCase().includes(term))
    );
  });

  const getActionColor = (action: string) => {
    if (action.includes('APPROVE')) return 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30';
    if (action.includes('REJECT')) return 'bg-rose-500/20 text-rose-300 border-rose-500/30';
    if (action.includes('SUBMIT')) return 'bg-violet-500/20 text-violet-300 border-violet-500/30';
    if (action.includes('SETTINGS') || action.includes('RULES'))
      return 'bg-amber-500/20 text-amber-300 border-amber-500/30';
    return 'bg-blue-500/20 text-blue-300 border-blue-500/30';
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-[#121826] p-5 rounded-3xl border border-white/10 shadow-xl">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-indigo-600 to-violet-600 flex items-center justify-center text-white shadow-lg shadow-indigo-600/30">
            <ScrollText className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">Audit Log Aktivitas</h1>
            <p className="text-xs text-slate-400">
              Rekaman jejak transaksi, approval admin, penyesuaian saldo, dan konfigurasi sistem.
            </p>
          </div>
        </div>

        <button
          onClick={fetchLogs}
          className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 text-xs font-semibold border border-white/10 transition self-start sm:self-auto"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
          <span>Segarkan</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex bg-[#121826] p-1 rounded-2xl border border-white/10 text-xs font-bold w-full sm:w-auto overflow-x-auto">
          {['ALL', 'DEPOSIT_APPROVE', 'WITHDRAWAL_APPROVE', 'WITHDRAWAL_REJECT', 'STATISTICS_UPDATE', 'BALANCE_ADJUST', 'SETTINGS_UPDATE'].map(
            (act) => (
              <button
                key={act}
                onClick={() => setActionFilter(act)}
                className={`px-3 py-1.5 rounded-xl whitespace-nowrap transition ${
                  actionFilter === act
                    ? 'bg-gradient-to-r from-violet-600 to-indigo-600 text-white shadow'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {act === 'ALL' ? 'Semua Log' : act.replace(/_/g, ' ')}
              </button>
            )
          )}
        </div>

        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Cari deskripsi / aksi..."
            className="w-full bg-[#121826] border border-white/10 rounded-2xl pl-10 pr-4 py-2 text-xs text-white placeholder:text-slate-400 focus:outline-none focus:border-violet-500"
          />
        </div>
      </div>

      {/* Logs Table / List */}
      <div className="rounded-2xl bg-[#121826] border border-white/10 overflow-hidden shadow-lg">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#1a2234] text-slate-400 border-b border-white/10 uppercase tracking-wider text-[10px]">
              <tr>
                <th className="px-4 py-3">Waktu & Tanggal</th>
                <th className="px-4 py-3">Aksi Sistem</th>
                <th className="px-4 py-3">Deskripsi Aktivitas</th>
                <th className="px-4 py-3">Pelaku / Target</th>
                <th className="px-4 py-3 text-right">Detail</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 text-slate-200">
              {filteredLogs.length > 0 ? (
                filteredLogs.map((log) => {
                  const isExpanded = expandedId === log.id;

                  return (
                    <React.Fragment key={log.id}>
                      <tr className="hover:bg-white/5 transition">
                        <td className="px-4 py-3 text-slate-400 font-mono text-[11px] whitespace-nowrap">
                          {new Date(log.created_at).toLocaleString('id-ID', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                            second: '2-digit',
                          })}
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={`inline-block font-mono text-[10px] font-bold px-2 py-0.5 rounded border ${getActionColor(
                              log.action
                            )}`}
                          >
                            {log.action}
                          </span>
                        </td>
                        <td className="px-4 py-3 font-medium text-slate-100 max-w-md">{log.description}</td>
                        <td className="px-4 py-3 font-mono text-[11px] text-slate-400">
                          {log.user_id ? log.user_id.slice(-8) : 'SYSTEM'}
                        </td>
                        <td className="px-4 py-3 text-right">
                          {log.metadata && Object.keys(log.metadata).length > 0 && (
                            <button
                              onClick={() => setExpandedId(isExpanded ? null : log.id)}
                              className="p-1 text-slate-400 hover:text-white inline-flex items-center gap-1 text-[11px]"
                            >
                              <span>{isExpanded ? 'Tutup' : 'Lihat'}</span>
                              {isExpanded ? (
                                <ChevronDown className="w-3.5 h-3.5" />
                              ) : (
                                <ChevronRight className="w-3.5 h-3.5" />
                              )}
                            </button>
                          )}
                        </td>
                      </tr>

                      {isExpanded && log.metadata && (
                        <tr className="bg-[#070b14]/80">
                          <td colSpan={5} className="px-6 py-3">
                            <pre className="text-[11px] font-mono text-violet-300 p-3 rounded-xl bg-black/40 border border-white/5 overflow-x-auto">
                              {JSON.stringify(log.metadata, null, 2)}
                            </pre>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={5} className="px-4 py-12 text-center text-slate-400 font-medium">
                    Belum ada rekaman audit log yang sesuai.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
