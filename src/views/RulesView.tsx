import React, { useState, useEffect } from 'react';
import { api } from '../lib/api';
import { SystemRules } from '../types';
import { BookOpen, ShieldCheck, Mail, ArrowDownToLine, Users, RefreshCw } from 'lucide-react';

export const RulesView: React.FC = () => {
  const [rules, setRules] = useState<SystemRules | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState<'all' | 'deposit' | 'withdrawal' | 'referral' | 'security'>('all');

  const fetchRules = async () => {
    setIsLoading(true);
    const res = await api.get<SystemRules>('/rules/public');
    if (res.data) {
      setRules(res.data);
    }
    setIsLoading(false);
  };

  useEffect(() => {
    fetchRules();
  }, []);

  if (isLoading && !rules) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <RefreshCw className="w-8 h-8 text-violet-500 animate-spin" />
      </div>
    );
  }

  const renderContent = (text?: string) => {
    if (!text) return <p className="text-slate-400">Belum ada dokumen aturan.</p>;
    return (
      <div className="prose prose-invert max-w-none text-xs sm:text-sm text-slate-300 leading-relaxed space-y-2 whitespace-pre-line">
        {text}
      </div>
    );
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-[#121826] p-5 rounded-3xl border border-white/10 shadow-xl">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-violet-600 to-indigo-600 flex items-center justify-center text-white shadow-lg shadow-violet-600/30">
            <BookOpen className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">Aturan & Syarat Layanan</h1>
            <p className="text-xs text-slate-400">
              Panduan resmi ketentuan setoran akun, penarikan saldo, program referral, dan keamanan.
            </p>
          </div>
        </div>

        <button
          onClick={fetchRules}
          className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 text-xs font-semibold border border-white/10 transition self-start sm:self-auto"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
          <span>Segarkan Rules</span>
        </button>
      </div>

      {/* Category Tabs */}
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => setActiveCategory('all')}
          className={`px-3.5 py-2 rounded-xl text-xs font-bold transition ${
            activeCategory === 'all'
              ? 'bg-violet-600 text-white shadow-md'
              : 'bg-[#121826] text-slate-400 hover:text-slate-200 border border-white/5'
          }`}
        >
          Semua Aturan
        </button>
        <button
          onClick={() => setActiveCategory('deposit')}
          className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition ${
            activeCategory === 'deposit'
              ? 'bg-violet-600 text-white shadow-md'
              : 'bg-[#121826] text-slate-400 hover:text-slate-200 border border-white/5'
          }`}
        >
          <Mail className="w-3.5 h-3.5" />
          <span>Rules Setoran</span>
        </button>
        <button
          onClick={() => setActiveCategory('withdrawal')}
          className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition ${
            activeCategory === 'withdrawal'
              ? 'bg-violet-600 text-white shadow-md'
              : 'bg-[#121826] text-slate-400 hover:text-slate-200 border border-white/5'
          }`}
        >
          <ArrowDownToLine className="w-3.5 h-3.5" />
          <span>Rules Withdrawal</span>
        </button>
        <button
          onClick={() => setActiveCategory('referral')}
          className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition ${
            activeCategory === 'referral'
              ? 'bg-violet-600 text-white shadow-md'
              : 'bg-[#121826] text-slate-400 hover:text-slate-200 border border-white/5'
          }`}
        >
          <Users className="w-3.5 h-3.5" />
          <span>Rules Referral</span>
        </button>
        <button
          onClick={() => setActiveCategory('security')}
          className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition ${
            activeCategory === 'security'
              ? 'bg-violet-600 text-white shadow-md'
              : 'bg-[#121826] text-slate-400 hover:text-slate-200 border border-white/5'
          }`}
        >
          <ShieldCheck className="w-3.5 h-3.5" />
          <span>Kebijakan Keamanan</span>
        </button>
      </div>

      {/* Rules Sections */}
      <div className="space-y-6">
        {(activeCategory === 'all' || activeCategory === 'deposit') && (
          <div className="p-6 rounded-3xl bg-[#121826] border border-white/10 shadow-xl space-y-3">
            <div className="flex items-center gap-2.5 text-violet-400 border-b border-white/10 pb-3">
              <Mail className="w-5 h-5" />
              <h2 className="text-base font-bold text-white">Aturan Setoran Gmail</h2>
            </div>
            {renderContent(rules?.deposit_rules)}
          </div>
        )}

        {(activeCategory === 'all' || activeCategory === 'withdrawal') && (
          <div className="p-6 rounded-3xl bg-[#121826] border border-white/10 shadow-xl space-y-3">
            <div className="flex items-center gap-2.5 text-emerald-400 border-b border-white/10 pb-3">
              <ArrowDownToLine className="w-5 h-5" />
              <h2 className="text-base font-bold text-white">Aturan Penarikan Dana (Withdrawal)</h2>
            </div>
            {renderContent(rules?.withdrawal_rules)}
          </div>
        )}

        {(activeCategory === 'all' || activeCategory === 'referral') && (
          <div className="p-6 rounded-3xl bg-[#121826] border border-white/10 shadow-xl space-y-3">
            <div className="flex items-center gap-2.5 text-indigo-400 border-b border-white/10 pb-3">
              <Users className="w-5 h-5" />
              <h2 className="text-base font-bold text-white">Aturan Program Referral</h2>
            </div>
            {renderContent(rules?.referral_rules)}
          </div>
        )}

        {(activeCategory === 'all' || activeCategory === 'security') && (
          <div className="p-6 rounded-3xl bg-[#121826] border border-white/10 shadow-xl space-y-3">
            <div className="flex items-center gap-2.5 text-amber-400 border-b border-white/10 pb-3">
              <ShieldCheck className="w-5 h-5" />
              <h2 className="text-base font-bold text-white">Kebijakan Keamanan & Privasi</h2>
            </div>
            {renderContent(rules?.security_rules)}
          </div>
        )}
      </div>
    </div>
  );
};
