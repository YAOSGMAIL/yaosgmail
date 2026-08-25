import React from 'react';
import { Navigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ShieldAlert, RefreshCw, ArrowLeft } from 'lucide-react';

interface AdminRouteProps {
  children: React.ReactNode;
}

export const AdminRoute: React.FC<AdminRouteProps> = ({ children }) => {
  const { user, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="min-h-[80vh] flex flex-col items-center justify-center gap-3">
        <RefreshCw className="w-8 h-8 text-violet-500 animate-spin" />
        <p className="text-xs font-semibold text-slate-400">Memeriksa hak akses administrator...</p>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (user.role !== 'admin') {
    return (
      <div className="min-h-[70vh] flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-[#121826] border border-rose-500/30 rounded-3xl p-6 sm:p-8 text-center shadow-2xl space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-400 flex items-center justify-center mx-auto">
            <ShieldAlert className="w-8 h-8" />
          </div>
          <div>
            <span className="text-[10px] font-extrabold uppercase tracking-widest px-2.5 py-1 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/30">
              403 Forbidden
            </span>
            <h2 className="text-xl font-black text-white mt-3">Akses Administrator Ditolak</h2>
            <p className="text-xs text-slate-400 mt-2">
              Akun Anda (<strong>{user.email}</strong>) memiliki role <strong>{user.role}</strong> dan tidak memiliki otorisasi untuk mengakses panel admin.
            </p>
          </div>
          <div className="pt-2">
            <Link
              to="/dashboard"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-xs font-bold shadow-lg shadow-violet-600/25 transition"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Kembali ke Dashboard User</span>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};
