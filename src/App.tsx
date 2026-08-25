import React, { useState } from 'react';
import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
  Outlet,
  useLocation,
} from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import { Navbar } from './components/Navbar';
import { Sidebar } from './components/Sidebar';
import { BottomNav } from './components/BottomNav';
import { ProtectedRoute } from './components/ProtectedRoute';
import { AdminRoute } from './components/AdminRoute';
import { NotFoundPage } from './components/NotFoundPage';

// Views
import { AuthView } from './views/AuthView';
import { UserDashboard } from './views/UserDashboard';
import { DepositView } from './views/DepositView';
import { WalletView } from './views/WalletView';
import { HistoryView } from './views/HistoryView';
import { ReferralView } from './views/ReferralView';
import { RulesView } from './views/RulesView';
import { ProfileView } from './views/ProfileView';

// Admin Views
import { AdminDashboard } from './views/admin/AdminDashboard';
import { AdminDeposits } from './views/admin/AdminDeposits';
import { AdminWithdrawals } from './views/admin/AdminWithdrawals';
import { AdminUsers } from './views/admin/AdminUsers';
import { AdminReferral } from './views/admin/AdminReferral';
import { AdminSettings } from './views/admin/AdminSettings';
import { AdminRules } from './views/admin/AdminRules';
import { AdminLogs } from './views/admin/AdminLogs';
import { AdminStatistics } from './views/admin/AdminStatistics';

import { ShieldAlert, RefreshCw } from 'lucide-react';

/**
 * Main Layout with Navigation shell
 */
const AppLayout: React.FC = () => {
  const { user, systemSettings, isLoading } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#070b14] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-violet-600 to-indigo-600 flex items-center justify-center text-white shadow-xl shadow-violet-600/30 animate-pulse">
            <RefreshCw className="w-6 h-6 animate-spin" />
          </div>
          <p className="text-sm font-bold text-slate-300">Memuat YAO SGMAIL...</p>
        </div>
      </div>
    );
  }

  const isMaintenance = systemSettings?.room_status === 'MAINTENANCE';

  return (
    <div className="min-h-screen bg-[#070b14] text-slate-100 flex flex-col selection:bg-violet-500 selection:text-white">
      {/* Maintenance Global Alert Banner if active */}
      {isMaintenance && (
        <div className="bg-amber-500/20 border-b border-amber-500/30 px-4 py-2 text-center text-xs font-bold text-amber-300 flex items-center justify-center gap-2">
          <ShieldAlert className="w-4 h-4 text-amber-400 shrink-0" />
          <span>Sistem sedang dalam mode Pemeliharaan (Maintenance). Transaksi baru mungkin mengalami jeda proses.</span>
        </div>
      )}

      {/* Top Navbar */}
      <Navbar toggleSidebar={() => setSidebarOpen(!sidebarOpen)} />

      {/* Main App Body with Sidebar */}
      <div className="flex-1 flex max-w-7xl w-full mx-auto pb-20 md:pb-8">
        <Sidebar
          isOpen={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
        />

        <main className="flex-1 p-4 sm:p-6 md:p-8 min-w-0">
          <Outlet />
        </main>
      </div>

      {/* Mobile Bottom Navigation */}
      <BottomNav />
    </div>
  );
};

/**
 * Root redirection helper based on auth status
 */
const RootRedirect: React.FC = () => {
  const { user, isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#070b14] flex items-center justify-center">
        <RefreshCw className="w-8 h-8 text-violet-500 animate-spin" />
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return <Navigate to="/login" replace />;
  }

  if (user.role === 'admin') {
    return <Navigate to="/admin" replace />;
  }

  return <Navigate to="/dashboard" replace />;
};

/**
 * Auth Route Wrapper: Redirects logged in users to their home dashboard
 */
const AuthRoute: React.FC<{ mode?: 'login' | 'register' }> = ({ mode = 'login' }) => {
  const { user, isAuthenticated, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#070b14] flex items-center justify-center">
        <RefreshCw className="w-8 h-8 text-violet-500 animate-spin" />
      </div>
    );
  }

  if (isAuthenticated && user) {
    const from = (location.state as any)?.from?.pathname;
    if (from && from !== '/login' && from !== '/register') {
      return <Navigate to={from} replace />;
    }
    return <Navigate to={user.role === 'admin' ? '/admin' : '/dashboard'} replace />;
  }

  return (
    <div className="min-h-screen bg-[#070b14] text-slate-100 flex flex-col justify-between selection:bg-violet-500 selection:text-white">
      <header className="border-b border-white/10 bg-[#070b14]/80 backdrop-blur-md px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-violet-600 to-indigo-600 flex items-center justify-center font-black text-white text-base shadow-lg shadow-violet-600/30">
            Y
          </div>
          <span className="font-black text-lg text-white tracking-tight">YAO SGMAIL</span>
        </div>
        <span className="text-xs font-semibold text-slate-400 bg-white/5 border border-white/10 px-3 py-1 rounded-full">
          Platform Deposit & Pencairan Terpercaya
        </span>
      </header>

      <main className="flex-1">
        <AuthView defaultMode={mode} />
      </main>

      <footer className="border-t border-white/10 py-4 text-center text-xs text-slate-400">
        © {new Date().getFullYear()} YAO SGMAIL Platform. All rights reserved. Data tersimpan permanen & aman.
      </footer>
    </div>
  );
};

export function App() {
  return (
    <BrowserRouter>
      <ToastProvider>
        <AuthProvider>
          <Routes>
            {/* Root Redirection */}
            <Route path="/" element={<RootRedirect />} />

            {/* Public Auth Routes */}
            <Route path="/login" element={<AuthRoute mode="login" />} />
            <Route path="/register" element={<AuthRoute mode="register" />} />

            {/* Protected User & Admin Routes inside AppLayout */}
            <Route element={<AppLayout />}>
              {/* User Dashboard & Features (Protected) */}
              <Route
                path="/dashboard"
                element={
                  <ProtectedRoute>
                    <UserDashboard />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/deposit"
                element={
                  <ProtectedRoute>
                    <DepositView />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/wallet"
                element={
                  <ProtectedRoute>
                    <WalletView />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/history"
                element={
                  <ProtectedRoute>
                    <HistoryView />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/referral"
                element={
                  <ProtectedRoute>
                    <ReferralView />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/profile"
                element={
                  <ProtectedRoute>
                    <ProfileView />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/rules"
                element={
                  <ProtectedRoute>
                    <RulesView />
                  </ProtectedRoute>
                }
              />

              {/* Admin Area (Admin Protected) */}
              <Route
                path="/admin"
                element={
                  <AdminRoute>
                    <AdminDashboard />
                  </AdminRoute>
                }
              />
              <Route
                path="/admin/deposits"
                element={
                  <AdminRoute>
                    <AdminDeposits />
                  </AdminRoute>
                }
              />
              <Route
                path="/admin/withdrawals"
                element={
                  <AdminRoute>
                    <AdminWithdrawals />
                  </AdminRoute>
                }
              />
              <Route
                path="/admin/users"
                element={
                  <AdminRoute>
                    <AdminUsers />
                  </AdminRoute>
                }
              />
              <Route
                path="/admin/referral"
                element={
                  <AdminRoute>
                    <AdminReferral />
                  </AdminRoute>
                }
              />
              <Route
                path="/admin/statistics"
                element={
                  <AdminRoute>
                    <AdminStatistics />
                  </AdminRoute>
                }
              />
              <Route
                path="/admin/settings"
                element={
                  <AdminRoute>
                    <AdminSettings />
                  </AdminRoute>
                }
              />
              <Route
                path="/admin/rules"
                element={
                  <AdminRoute>
                    <AdminRules />
                  </AdminRoute>
                }
              />
              <Route
                path="/admin/logs"
                element={
                  <AdminRoute>
                    <AdminLogs />
                  </AdminRoute>
                }
              />

              {/* 404 Inside Layout */}
              <Route path="*" element={<NotFoundPage />} />
            </Route>
          </Routes>
        </AuthProvider>
      </ToastProvider>
    </BrowserRouter>
  );
}

export default App;
