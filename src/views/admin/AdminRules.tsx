import React, { useState, useEffect } from 'react';
import { api } from '../../lib/api';
import { useToast } from '../../context/ToastContext';
import { SystemRules } from '../../types';
import { BookOpen, Save, RefreshCw, Mail, ArrowDownToLine, Users, ShieldCheck } from 'lucide-react';

export const AdminRules: React.FC = () => {
  const { success, error } = useToast();

  const [rules, setRules] = useState<SystemRules | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<'deposit' | 'withdrawal' | 'referral' | 'security'>('deposit');

  const fetchRules = async () => {
    setIsLoading(true);
    const res = await api.get<SystemRules>('/admin/rules');
    if (res.data) {
      setRules(res.data);
    }
    setIsLoading(false);
  };

  useEffect(() => {
    fetchRules();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rules) return;

    setIsSaving(true);
    const res = await api.put('/admin/rules', rules);
    setIsSaving(false);

    if (res.error) {
      error(res.error || 'Gagal menyimpan aturan.');
      return;
    }

    success('Aturan sistem berhasil diperbarui dan dipublikasikan!');
    fetchRules();
  };

  if (isLoading && !rules) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <RefreshCw className="w-8 h-8 text-violet-500 animate-spin" />
      </div>
    );
  }

  if (!rules) return null;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-[#121826] p-5 rounded-3xl border border-white/10 shadow-xl">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-violet-600 to-indigo-600 flex items-center justify-center text-white shadow-lg shadow-violet-600/30">
            <BookOpen className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">Kelola Rules & Ketentuan</h1>
            <p className="text-xs text-slate-400">
              Ubah teks aturan resmi yang ditampilkan secara publik kepada pengguna.
            </p>
          </div>
        </div>

        <button
          onClick={fetchRules}
          className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 text-xs font-semibold border border-white/10 transition self-start sm:self-auto"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
          <span>Segarkan</span>
        </button>
      </div>

      {/* Editor Tabs */}
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => setActiveTab('deposit')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition ${
            activeTab === 'deposit'
              ? 'bg-violet-600 text-white shadow-md'
              : 'bg-[#121826] text-slate-400 hover:text-slate-200 border border-white/5'
          }`}
        >
          <Mail className="w-4 h-4" />
          <span>Rules Setoran</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('withdrawal')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition ${
            activeTab === 'withdrawal'
              ? 'bg-violet-600 text-white shadow-md'
              : 'bg-[#121826] text-slate-400 hover:text-slate-200 border border-white/5'
          }`}
        >
          <ArrowDownToLine className="w-4 h-4" />
          <span>Rules Withdrawal</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('referral')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition ${
            activeTab === 'referral'
              ? 'bg-violet-600 text-white shadow-md'
              : 'bg-[#121826] text-slate-400 hover:text-slate-200 border border-white/5'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>Rules Referral</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('security')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition ${
            activeTab === 'security'
              ? 'bg-violet-600 text-white shadow-md'
              : 'bg-[#121826] text-slate-400 hover:text-slate-200 border border-white/5'
          }`}
        >
          <ShieldCheck className="w-4 h-4" />
          <span>Kebijakan Keamanan</span>
        </button>
      </div>

      <form onSubmit={handleSave} className="space-y-4">
        <div className="p-6 rounded-3xl bg-[#121826] border border-white/10 shadow-xl space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-bold text-slate-200 uppercase tracking-wider">
              {activeTab === 'deposit' && 'Editor Aturan Setoran Akun'}
              {activeTab === 'withdrawal' && 'Editor Aturan Penarikan Saldo'}
              {activeTab === 'referral' && 'Editor Aturan Komisi Referral'}
              {activeTab === 'security' && 'Editor Kebijakan Keamanan Platform'}
            </h2>
            <span className="text-[10px] text-slate-400">Gunakan baris baru atau angka untuk daftar</span>
          </div>

          {activeTab === 'deposit' && (
            <textarea
              id="input-rules-deposit"
              rows={12}
              value={rules.deposit_rules}
              onChange={(e) => setRules({ ...rules, deposit_rules: e.target.value })}
              className="w-full bg-[#070b14] border border-white/10 rounded-2xl p-4 text-xs font-mono text-slate-100 placeholder:text-slate-400 focus:outline-none focus:border-violet-500 leading-relaxed resize-y"
            />
          )}

          {activeTab === 'withdrawal' && (
            <textarea
              id="input-rules-withdrawal"
              rows={12}
              value={rules.withdrawal_rules}
              onChange={(e) => setRules({ ...rules, withdrawal_rules: e.target.value })}
              className="w-full bg-[#070b14] border border-white/10 rounded-2xl p-4 text-xs font-mono text-slate-100 placeholder:text-slate-400 focus:outline-none focus:border-violet-500 leading-relaxed resize-y"
            />
          )}

          {activeTab === 'referral' && (
            <textarea
              id="input-rules-referral"
              rows={12}
              value={rules.referral_rules}
              onChange={(e) => setRules({ ...rules, referral_rules: e.target.value })}
              className="w-full bg-[#070b14] border border-white/10 rounded-2xl p-4 text-xs font-mono text-slate-100 placeholder:text-slate-400 focus:outline-none focus:border-violet-500 leading-relaxed resize-y"
            />
          )}

          {activeTab === 'security' && (
            <textarea
              id="input-rules-security"
              rows={12}
              value={rules.security_rules}
              onChange={(e) => setRules({ ...rules, security_rules: e.target.value })}
              className="w-full bg-[#070b14] border border-white/10 rounded-2xl p-4 text-xs font-mono text-slate-100 placeholder:text-slate-400 focus:outline-none focus:border-violet-500 leading-relaxed resize-y"
            />
          )}
        </div>

        <button
          id="btn-save-admin-rules"
          type="submit"
          disabled={isSaving}
          className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-violet-600 via-indigo-600 to-purple-600 hover:from-violet-500 hover:to-indigo-500 text-white font-bold text-sm shadow-xl shadow-violet-600/30 flex items-center justify-center gap-2 transition active:scale-98 disabled:opacity-50"
        >
          <Save className="w-4 h-4" />
          <span>{isSaving ? 'Menyimpan Aturan...' : 'Simpan dan Publikasikan Aturan'}</span>
        </button>
      </form>
    </div>
  );
};
