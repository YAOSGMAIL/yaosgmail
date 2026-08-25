import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  Home,
  MailPlus,
  History,
  Wallet,
  Users,
  BookOpen,
  User,
  LayoutDashboard,
  Inbox,
  ArrowDownToLine,
  Settings,
  FileCode,
  ScrollText,
  ShieldCheck,
  Gift,
  BarChart3,
} from 'lucide-react';

interface SidebarProps {
  pendingDepositsCount?: number;
  pendingWithdrawalsCount?: number;
  currentTab?: string;
  setCurrentTab?: (tab: string) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  pendingDepositsCount = 0,
  pendingWithdrawalsCount = 0,
}) => {
  const { user } = useAuth();
  const location = useLocation();

  if (!user) return null;

  const isAdmin = user.role === 'admin';

  const userNavItems = [
    { to: '/dashboard', label: 'Beranda', icon: Home },
    { to: '/deposit', label: 'Setor Gmail', icon: MailPlus, badge: 'HOT' },
    { to: '/wallet', label: 'Wallet & WD', icon: Wallet },
    { to: '/history', label: 'Riwayat Transaksi', icon: History },
    { to: '/referral', label: 'Program Referral', icon: Users },
    { to: '/rules', label: 'Aturan & Syarat', icon: BookOpen },
    { to: '/profile', label: 'Profil Saya', icon: User },
  ];

  const adminNavItems = [
    { to: '/admin', label: 'Ringkasan Sistem', icon: LayoutDashboard },
    {
      to: '/admin/deposits',
      label: 'Kelola Setoran',
      icon: Inbox,
      count: pendingDepositsCount,
      countColor: 'bg-violet-500',
    },
    {
      to: '/admin/withdrawals',
      label: 'Kelola Withdrawal',
      icon: ArrowDownToLine,
      count: pendingWithdrawalsCount,
      countColor: 'bg-emerald-500',
    },
    { to: '/admin/users', label: 'Kelola Pengguna', icon: Users },
    { to: '/admin/referral', label: 'Program Referral', icon: Gift },
    { to: '/admin/statistics', label: 'Statistik Global', icon: BarChart3 },
    { to: '/admin/settings', label: 'Pengaturan Sistem', icon: Settings },
    { to: '/admin/rules', label: 'Editor Aturan (Rules)', icon: FileCode },
    { to: '/admin/logs', label: 'Log Aktivitas', icon: ScrollText },
  ];

  const navItems = isAdmin ? adminNavItems : userNavItems;

  return (
    <aside
      id="desktop-sidebar"
      className="hidden md:flex flex-col w-64 shrink-0 bg-[#0c121e]/80 border-r border-white/10 p-4 sticky top-16 h-[calc(100vh-4rem)] overflow-y-auto"
    >
      {/* Role Banner */}
      <div className="mb-4 p-3 rounded-2xl bg-gradient-to-r from-violet-950/40 to-indigo-950/40 border border-violet-500/20">
        <div className="flex items-center gap-2.5">
          <div
            className={`w-8 h-8 rounded-xl flex items-center justify-center font-bold text-sm ${
              isAdmin
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                : 'bg-violet-500/20 text-violet-300 border border-violet-500/30'
            }`}
          >
            {isAdmin ? <ShieldCheck className="w-4 h-4" /> : user.username[0].toUpperCase()}
          </div>
          <div className="overflow-hidden">
            <p className="text-xs font-bold text-slate-100 truncate">{user.username}</p>
            <p className="text-[11px] text-slate-400 capitalize flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
              {isAdmin ? 'Akses Admin Penuh' : 'Member Terdaftar'}
            </p>
          </div>
        </div>
      </div>

      {/* Navigation Label */}
      <div className="px-2 mb-2 text-[10px] font-bold uppercase tracking-wider text-slate-400">
        {isAdmin ? 'Menu Administrator' : 'Menu Utama'}
      </div>

      {/* Nav List */}
      <nav className="flex-1 space-y-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.to;
          return (
            <NavLink
              key={item.to}
              id={`sidebar-nav-${item.to.replace(/\//g, '-')}`}
              to={item.to}
              end={item.to === '/admin' || item.to === '/dashboard'}
              className={({ isActive: active }) =>
                `w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition group ${
                  active
                    ? 'bg-gradient-to-r from-violet-600/90 to-indigo-600/90 text-white shadow-lg shadow-violet-600/25 border border-white/10'
                    : 'text-slate-400 hover:text-slate-100 hover:bg-white/5'
                }`
              }
            >
              {({ isActive: active }) => (
                <>
                  <div className="flex items-center gap-3">
                    <Icon
                      className={`w-4 h-4 transition ${
                        active ? 'text-white' : 'text-slate-400 group-hover:text-violet-400'
                      }`}
                    />
                    <span>{item.label}</span>
                  </div>

                  {item.badge && (
                    <span className="text-[9px] font-extrabold px-1.5 py-0.5 rounded bg-violet-500/30 text-violet-200 border border-violet-400/30 animate-pulse">
                      {item.badge}
                    </span>
                  )}

                  {item.count !== undefined && item.count > 0 && (
                    <span
                      className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full text-white ${
                        item.countColor || 'bg-violet-600'
                      } shadow`}
                    >
                      {item.count}
                    </span>
                  )}
                </>
              )}
            </NavLink>
          );
        })}
      </nav>

      {/* System Status Footnote */}
      <div className="pt-4 mt-auto border-t border-white/10 text-[11px] text-slate-400 flex items-center justify-between">
        <span>YAO SGMAIL Engine</span>
        <span className="text-violet-400 font-mono">v2.4</span>
      </div>
    </aside>
  );
};
