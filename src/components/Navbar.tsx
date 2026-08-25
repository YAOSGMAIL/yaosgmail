import React, { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  Mail,
  ShieldCheck,
  Wallet,
  LogOut,
  User as UserIcon,
  RefreshCw,
  Sparkles,
  AlertTriangle,
  Flame,
} from 'lucide-react';

interface NavbarProps {
  currentTab?: string;
  setCurrentTab?: (tab: string) => void;
  onOpenAuth?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ onOpenAuth }) => {
  const { user, logout, refreshUser, systemSettings } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await refreshUser();
    setTimeout(() => setIsRefreshing(false), 500);
  };

  const handleLogout = async () => {
    setIsDropdownOpen(false);
    await logout();
    navigate('/login', { replace: true });
  };

  const roomStatus = systemSettings?.room_status || 'OPEN';

  return (
    <header id="app-navbar" className="sticky top-0 z-40 bg-[#070b14]/90 backdrop-blur-md border-b border-white/10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        {/* Brand Logo & System Status */}
        <div className="flex items-center gap-3">
          <Link
            id="nav-logo-btn"
            to={user ? (user.role === 'admin' ? '/admin' : '/dashboard') : '/login'}
            className="flex items-center gap-2.5 text-left group transition"
          >
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-violet-600 via-indigo-600 to-purple-500 flex items-center justify-center shadow-lg shadow-violet-600/30 group-hover:scale-105 transition-transform">
              <Mail className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-extrabold text-lg tracking-tight bg-gradient-to-r from-white via-slate-100 to-slate-300 bg-clip-text text-transparent">
                  {systemSettings?.site_name || 'YAO SGMAIL'}
                </span>
                <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-violet-500/20 text-violet-300 border border-violet-500/30">
                  PRO
                </span>
              </div>
              <p className="text-[11px] text-slate-400 -mt-0.5 hidden sm:block">Gmail Deposit & Payout Engine</p>
            </div>
          </Link>

          {/* System Status Pill */}
          <div className="hidden md:flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-white/5 border border-white/10">
            <span
              className={`w-2 h-2 rounded-full ${
                roomStatus === 'OPEN'
                  ? 'bg-emerald-400 animate-pulse'
                  : roomStatus === 'MAINTENANCE'
                  ? 'bg-amber-400'
                  : 'bg-rose-400'
              }`}
            />
            <span className="text-slate-300">
              {roomStatus === 'OPEN' ? 'Sistem Aktif' : roomStatus === 'MAINTENANCE' ? 'Maintenance' : 'Offline'}
            </span>
          </div>
        </div>

        {/* User Balance & Actions */}
        <div className="flex items-center gap-2.5 sm:gap-3">
          {user ? (
            <>
              {/* Saldo Badge with Live Refresh */}
              <div
                id="user-balance-badge"
                className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[#121826] border border-white/10 shadow-inner"
              >
                <div className="w-7 h-7 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                  <Wallet className="w-4 h-4" />
                </div>
                <div className="text-left">
                  <p className="text-[10px] font-medium text-slate-400 leading-none">Saldo Tersedia</p>
                  <p className="text-xs sm:text-sm font-bold text-emerald-400 font-mono">
                    Rp {user.available_balance.toLocaleString('id-ID')}
                  </p>
                </div>
                <button
                  id="btn-refresh-balance"
                  onClick={handleRefresh}
                  disabled={isRefreshing}
                  title="Segarkan Saldo"
                  className={`p-1 text-slate-400 hover:text-slate-200 hover:bg-white/5 rounded-md transition ${
                    isRefreshing ? 'animate-spin text-violet-400' : ''
                  }`}
                  aria-label="Refresh Saldo"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Quick Setor Button for User */}
              {user.role === 'user' && (
                <button
                  id="nav-quick-deposit-btn"
                  onClick={() => navigate('/deposit')}
                  className="hidden sm:inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white text-xs font-semibold shadow-md shadow-violet-600/20 transition active:scale-95"
                >
                  <Flame className="w-3.5 h-3.5" />
                  <span>Setor Gmail</span>
                </button>
              )}

              {/* User Dropdown */}
              <div className="relative">
                <button
                  id="nav-user-menu-btn"
                  onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                  className="flex items-center gap-2 p-1.5 sm:px-3 sm:py-1.5 rounded-xl bg-[#121826] hover:bg-[#1a2234] border border-white/10 transition text-left"
                >
                  <div
                    className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold ${
                      user.role === 'admin'
                        ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                        : 'bg-violet-500/20 text-violet-300 border border-violet-500/30'
                    }`}
                  >
                    {user.role === 'admin' ? <ShieldCheck className="w-4 h-4" /> : user.username[0].toUpperCase()}
                  </div>
                  <div className="hidden sm:block">
                    <p className="text-xs font-semibold text-slate-200 leading-none truncate max-w-[100px]">
                      {user.username}
                    </p>
                    <p className="text-[10px] text-slate-400 capitalize">{user.role}</p>
                  </div>
                </button>

                {/* Dropdown Menu */}
                {isDropdownOpen && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setIsDropdownOpen(false)} />
                    <div className="absolute right-0 mt-2 w-56 rounded-2xl bg-[#121826] border border-white/15 shadow-2xl p-2 z-50 text-sm">
                      <div className="p-2.5 border-b border-white/10 mb-1">
                        <p className="font-semibold text-slate-200 truncate">{user.username}</p>
                        <p className="text-xs text-slate-400 truncate">{user.email}</p>
                        <span
                          className={`inline-block mt-1 text-[10px] font-bold px-2 py-0.5 rounded-md ${
                            user.role === 'admin'
                              ? 'bg-amber-500/20 text-amber-300'
                              : 'bg-violet-500/20 text-violet-300'
                          }`}
                        >
                          {user.role === 'admin' ? 'Administrator' : 'User Member'}
                        </span>
                      </div>

                      {user.role === 'admin' ? (
                        <>
                          <button
                            id="menu-admin-dash"
                            onClick={() => {
                              navigate('/admin');
                              setIsDropdownOpen(false);
                            }}
                            className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-slate-300 hover:text-white hover:bg-violet-600/20 transition text-left text-xs font-medium"
                          >
                            <ShieldCheck className="w-4 h-4 text-violet-400" />
                            <span>Panel Admin</span>
                          </button>
                        </>
                      ) : (
                        <>
                          <button
                            id="menu-user-profile"
                            onClick={() => {
                              navigate('/profile');
                              setIsDropdownOpen(false);
                            }}
                            className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-slate-300 hover:text-white hover:bg-violet-600/20 transition text-left text-xs font-medium"
                          >
                            <UserIcon className="w-4 h-4 text-violet-400" />
                            <span>Profil Akun</span>
                          </button>
                          <button
                            id="menu-user-wallet"
                            onClick={() => {
                              navigate('/wallet');
                              setIsDropdownOpen(false);
                            }}
                            className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-slate-300 hover:text-white hover:bg-violet-600/20 transition text-left text-xs font-medium"
                          >
                            <Wallet className="w-4 h-4 text-emerald-400" />
                            <span>Dompet & Saldo</span>
                          </button>
                        </>
                      )}

                      <div className="border-t border-white/10 mt-1 pt-1">
                        <button
                          id="btn-nav-logout"
                          onClick={handleLogout}
                          className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-rose-400 hover:bg-rose-500/10 transition text-left text-xs font-semibold"
                        >
                          <LogOut className="w-4 h-4" />
                          <span>Keluar (Logout)</span>
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </>
          ) : (
            <div className="flex items-center gap-2">
              <Link
                id="btn-nav-login"
                to="/login"
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white text-xs sm:text-sm font-semibold shadow-lg shadow-violet-600/25 transition active:scale-95"
              >
                <Sparkles className="w-4 h-4" />
                <span>Masuk / Daftar</span>
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* System Warning/Maintenance Bar if any */}
      {systemSettings?.room_status === 'MAINTENANCE' && (
        <div className="bg-amber-500/15 border-b border-amber-500/30 px-4 py-1 text-center text-xs font-medium text-amber-300 flex items-center justify-center gap-2">
          <AlertTriangle className="w-3.5 h-3.5" />
          <span>Sistem sedang dalam mode Maintenance. Layanan setoran mungkin dibatasi sementara.</span>
        </div>
      )}
    </header>
  );
};
