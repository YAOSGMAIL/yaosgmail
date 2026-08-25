import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Compass, Home, ShieldCheck, ArrowLeft } from 'lucide-react';

export const NotFoundPage: React.FC = () => {
  const { user } = useAuth();

  const targetPath = user ? (user.role === 'admin' ? '/admin' : '/dashboard') : '/login';
  const targetLabel = user ? (user.role === 'admin' ? 'Kembali ke Panel Admin' : 'Kembali ke Dashboard') : 'Kembali ke Halaman Login';

  return (
    <div className="min-h-[75vh] flex items-center justify-center p-4 sm:p-6 text-center">
      <div className="max-w-md w-full bg-[#121826]/90 border border-white/10 rounded-3xl p-8 shadow-2xl backdrop-blur-xl space-y-4">
        <div className="w-16 h-16 rounded-2xl bg-violet-500/10 border border-violet-500/20 text-violet-400 flex items-center justify-center mx-auto">
          <Compass className="w-8 h-8" />
        </div>
        <div>
          <span className="text-[10px] font-extrabold uppercase tracking-widest px-2.5 py-1 rounded-full bg-violet-500/20 text-violet-300 border border-violet-500/30">
            Error 404
          </span>
          <h2 className="text-2xl font-black text-white mt-3">Halaman Tidak Ditemukan</h2>
          <p className="text-xs text-slate-400 mt-2">
            URL yang Anda tuju tidak tersedia atau telah dipindahkan ke rute lain.
          </p>
        </div>
        <div className="pt-2">
          <Link
            to={targetPath}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white text-xs font-bold shadow-lg shadow-violet-600/25 transition active:scale-95"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>{targetLabel}</span>
          </Link>
        </div>
      </div>
    </div>
  );
};
