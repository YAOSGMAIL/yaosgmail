import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  Home,
  MailPlus,
  Wallet,
  History,
  User,
  LayoutDashboard,
  Inbox,
  ArrowDownToLine,
  Settings,
  Gift,
} from 'lucide-react';

interface BottomNavProps {
  pendingDepositsCount?: number;
  pendingWithdrawalsCount?: number;
  currentTab?: string;
  setCurrentTab?: (tab: string) => void;
}

export const BottomNav: React.FC<BottomNavProps> = ({
  pendingDepositsCount = 0,
  pendingWithdrawalsCount = 0,
}) => {
  const { user } = useAuth();

  if (!user) return null;

  const isAdmin = user.role === 'admin';

  const userItems = [
    { to: '/dashboard', label: 'Beranda', icon: Home },
    { to: '/deposit', label: 'Setor', icon: MailPlus, highlight: true },
    { to: '/wallet', label: 'Wallet', icon: Wallet },
    { to: '/history', label: 'Riwayat', icon: History },
    { to: '/profile', label: 'Profil', icon: User },
  ];

  const adminItems = [
    { to: '/admin', label: 'Ringkasan', icon: LayoutDashboard },
    { to: '/admin/deposits', label: 'Setoran', icon: Inbox, count: pendingDepositsCount },
    { to: '/admin/withdrawals', label: 'WD', icon: ArrowDownToLine, count: pendingWithdrawalsCount },
    { to: '/admin/referral', label: 'Referral', icon: Gift },
    { to: '/admin/settings', label: 'Setting', icon: Settings },
  ];

  const items = isAdmin ? adminItems : userItems;

  return (
    <nav
      id="mobile-bottom-nav"
      className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#0c121e]/95 backdrop-blur-xl border-t border-white/10 px-2 py-1.5"
    >
      <div className="flex items-center justify-around">
        {items.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.to}
              id={`mobile-nav-${item.to.replace(/\//g, '-')}`}
              to={item.to}
              end={item.to === '/admin' || item.to === '/dashboard'}
              className={({ isActive }) =>
                `relative flex flex-col items-center justify-center min-w-[56px] min-h-[48px] py-1 px-2 rounded-xl transition ${
                  item.highlight && !isAdmin
                    ? isActive
                      ? 'text-white'
                      : 'text-violet-400'
                    : isActive
                    ? 'text-violet-400 font-bold'
                    : 'text-slate-400 hover:text-slate-200'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  {item.highlight && !isAdmin ? (
                    <div
                      className={`-mt-5 w-11 h-11 rounded-2xl flex items-center justify-center shadow-lg transition-transform ${
                        isActive
                          ? 'bg-gradient-to-tr from-violet-600 to-indigo-500 text-white scale-110 shadow-violet-600/50'
                          : 'bg-gradient-to-tr from-violet-700 to-indigo-600 text-white shadow-violet-700/40'
                      }`}
                    >
                      <Icon className="w-5 h-5" />
                    </div>
                  ) : (
                    <div className="relative">
                      <Icon className={`w-5 h-5 ${isActive ? 'scale-110' : ''} transition-transform`} />
                      {item.count !== undefined && item.count > 0 && (
                        <span className="absolute -top-1.5 -right-2 bg-rose-500 text-white text-[9px] font-bold px-1.5 py-0.2 rounded-full ring-2 ring-[#0c121e]">
                          {item.count}
                        </span>
                      )}
                    </div>
                  )}
                  <span className={`text-[10px] mt-0.5 tracking-tight ${isActive ? 'text-violet-300 font-bold' : ''}`}>
                    {item.label}
                  </span>
                </>
              )}
            </NavLink>
          );
        })}
      </div>
    </nav>
  );
};
