import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { db } from './db';
import {
  generateToken,
  authenticateToken,
  requireAdmin,
  AuthenticatedRequest,
} from './auth';

const router = Router();

// --- PUBLIC / GUEST ENDPOINTS ---

// Public settings & rules
router.get('/settings/public', (_req, res: Response) => {
  const s = db.getSettings();
  res.json({
    success: true,
    data: {
      site_name: s.site_name,
      gmail_rate: s.gmail_rate,
      daily_limit: s.daily_limit,
      minimum_withdrawal: s.minimum_withdrawal,
      minimum_approved_gmail_for_withdrawal: s.minimum_approved_gmail_for_withdrawal,
      withdrawal_fee_type: s.withdrawal_fee_type,
      withdrawal_fee_min: s.withdrawal_fee_min,
      withdrawal_fee_max: s.withdrawal_fee_max,
      withdrawal_fee_current: s.withdrawal_fee_current,
      deposit_status: s.deposit_status,
      withdrawal_status: s.withdrawal_status,
      referral_status: s.referral_status,
      room_status: s.room_status,
      announcement: s.announcement,
      security_warning: s.security_warning,
    },
  });
});

router.get('/rules/public', (_req, res: Response) => {
  const r = db.getRules();
  res.json({ success: true, data: r });
});

// Authentication: Register
router.post('/auth/register', (req, res: Response) => {
  try {
    const { username, email, password, confirmPassword, referralCode } = req.body;

    if (!username || typeof username !== 'string' || username.trim().length < 3) {
      res.status(400).json({ success: false, message: 'Username minimal 3 karakter.' });
      return;
    }

    if (username.trim().toLowerCase() === 'yao') {
      res.status(400).json({ success: false, message: 'Username tidak tersedia.' });
      return;
    }

    if (!email || typeof email !== 'string' || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      res.status(400).json({ success: false, message: 'Format email tidak valid.' });
      return;
    }

    if (!password || typeof password !== 'string' || password.length < 6) {
      res.status(400).json({ success: false, message: 'Password minimal 6 karakter.' });
      return;
    }

    if (password !== confirmPassword) {
      res.status(400).json({ success: false, message: 'Konfirmasi password tidak cocok.' });
      return;
    }

    const { user, error } = db.createUser({
      username: username.trim(),
      email: email.trim(),
      passwordPlain: password,
      referralCodeInput: referralCode,
    });

    if (error) {
      res.status(400).json({ success: false, message: error });
      return;
    }

    const token = generateToken(user);

    res.status(201).json({
      success: true,
      message: 'Registrasi berhasil! Selamat datang di YAO SGMAIL.',
      data: {
        token,
        user,
      },
    });
  } catch (err: any) {
    console.error('Register error:', err);
    res.status(500).json({ success: false, message: 'Terjadi kesalahan pada server saat registrasi.' });
  }
});

// Authentication: Login
router.post('/auth/login', (req, res: Response) => {
  try {
    const { identifier, password } = req.body; // identifier can be email or username

    if (!identifier || !password) {
      res.status(400).json({ success: false, message: 'Email/Username dan Password wajib diisi.' });
      return;
    }

    const cleanId = String(identifier).trim();
    let user = db.getUserByEmail(cleanId);
    if (!user) {
      user = db.getUserByUsername(cleanId);
    }

    if (!user) {
      res.status(401).json({ success: false, message: 'Email atau username tidak ditemukan.' });
      return;
    }

    if (!user.active) {
      res.status(403).json({
        success: false,
        message: 'Akun Anda sedang dinonaktifkan/suspend. Silakan hubungi Admin.',
      });
      return;
    }

    const passHash = db.getPasswordHash(user.id);
    if (!passHash || !bcrypt.compareSync(password, passHash)) {
      res.status(401).json({ success: false, message: 'Password salah. Silakan coba lagi.' });
      return;
    }

    db.recordLogin(user.id);

    const userFull = db.getUserById(user.id)!;
    const token = generateToken(userFull);

    db.logActivity({
      actor_id: user.id,
      actor_role: user.role,
      actor_name: userFull.username,
      action: 'USER_LOGIN',
      description: `Login berhasil: ${userFull.username} (${user.email})`,
    });

    res.json({
      success: true,
      message: 'Login berhasil.',
      data: {
        token,
        user: userFull,
      },
    });
  } catch (err: any) {
    console.error('Login error:', err);
    res.status(500).json({ success: false, message: 'Terjadi kesalahan pada server saat login.' });
  }
});

// Authentication: Get current user session
router.get('/auth/me', authenticateToken, (req: AuthenticatedRequest, res: Response) => {
  res.json({
    success: true,
    data: req.user,
  });
});

// Authentication: Logout
router.post('/auth/logout', authenticateToken, (req: AuthenticatedRequest, res: Response) => {
  if (req.user) {
    db.logActivity({
      actor_id: req.user.id,
      actor_role: req.user.role,
      actor_name: req.user.username,
      action: 'USER_LOGOUT',
      description: `Logout user: ${req.user.username}`,
    });
  }
  res.json({
    success: true,
    message: 'Logout berhasil. Sesi telah diakhiri.',
  });
});

// Standard Aliases for User Endpoints
router.get('/users', authenticateToken, (req: AuthenticatedRequest, res: Response) => {
  if (req.user?.role === 'admin') {
    res.json({ success: true, data: db.getAllUsers() });
  } else {
    res.json({ success: true, data: req.user });
  }
});

router.get('/deposits', authenticateToken, (req: AuthenticatedRequest, res: Response) => {
  const status = req.query.status as any;
  const deposits = db.getDeposits({ userId: req.user!.id, status });
  res.json({ success: true, data: deposits });
});

router.post('/deposits', authenticateToken, (req: AuthenticatedRequest, res: Response) => {
  const { gmailList } = req.body;
  if (!Array.isArray(gmailList) || gmailList.length === 0) {
    res.status(400).json({
      success: false,
      message: 'Daftar Gmail tidak boleh kosong. Masukkan minimal 1 alamat Gmail.',
    });
    return;
  }
  const result = db.submitDeposits({
    userId: req.user!.id,
    gmailList,
  });
  if (result.error) {
    res.status(400).json({ success: false, message: result.error });
    return;
  }
  res.json({
    success: true,
    message: `Berhasil mengirim ${result.submitted.length} akun Gmail untuk ditinjau.`,
    data: result,
  });
});

router.get('/withdrawals', authenticateToken, (req: AuthenticatedRequest, res: Response) => {
  const wds = db.getWithdrawals({ userId: req.user!.id });
  res.json({ success: true, data: wds });
});

router.post('/withdrawals', authenticateToken, (req: AuthenticatedRequest, res: Response) => {
  const { grossAmount, paymentMethod, paymentAccount } = req.body;
  const numGross = Number(grossAmount);
  if (isNaN(numGross) || numGross <= 0) {
    res.status(400).json({ success: false, message: 'Nominal penarikan harus angka valid.' });
    return;
  }
  const result = db.requestWithdrawal({
    userId: req.user!.id,
    grossAmount: numGross,
    paymentMethod: String(paymentMethod || ''),
    paymentAccount: String(paymentAccount || ''),
  });
  if (result.error) {
    res.status(400).json({ success: false, message: result.error });
    return;
  }
  res.json({
    success: true,
    message: 'Permintaan penarikan dana berhasil diajukan dan sedang menunggu proses Admin.',
    data: result.withdrawal,
  });
});

router.get('/referral', authenticateToken, (req: AuthenticatedRequest, res: Response) => {
  const data = db.getReferralData(req.user!.id);
  res.json({ success: true, data });
});

// --- USER DASHBOARD & ACTIONS ---

router.get('/user/dashboard', authenticateToken, (req: AuthenticatedRequest, res: Response) => {
  const data = db.getUserDashboardData(req.user!.id);
  if (!data) {
    res.status(404).json({ success: false, message: 'Data dashboard tidak ditemukan.' });
    return;
  }
  res.json({ success: true, data });
});

// Setor Gmail (Deposit)
router.post('/user/deposits', authenticateToken, (req: AuthenticatedRequest, res: Response) => {
  try {
    const { gmailList } = req.body;

    if (!Array.isArray(gmailList) || gmailList.length === 0) {
      res.status(400).json({
        success: false,
        message: 'Daftar Gmail tidak boleh kosong. Masukkan minimal 1 alamat Gmail.',
      });
      return;
    }

    const result = db.submitDeposits({
      userId: req.user!.id,
      gmailList,
    });

    if (result.error) {
      res.status(400).json({ success: false, message: result.error });
      return;
    }

    res.json({
      success: true,
      message: `Berhasil mengirim ${result.submitted.length} akun Gmail untuk ditinjau.`,
      data: result,
    });
  } catch (err: any) {
    console.error('Deposit error:', err);
    res.status(500).json({ success: false, message: 'Gagal mengirim setoran Gmail.' });
  }
});

router.get('/user/deposits', authenticateToken, (req: AuthenticatedRequest, res: Response) => {
  const status = req.query.status as any;
  const deposits = db.getDeposits({ userId: req.user!.id, status });
  res.json({ success: true, data: deposits });
});

// User Wallet & History
router.get('/user/wallet', authenticateToken, (req: AuthenticatedRequest, res: Response) => {
  const user = db.getUserById(req.user!.id)!;
  const txs = db.getTransactionsByUserId(req.user!.id);
  const wds = db.getWithdrawals({ userId: req.user!.id });
  const settings = db.getSettings();

  const approvedDepositsCount = db
    .getDeposits({ userId: req.user!.id })
    .filter((d) => d.status === 'APPROVED').length;

  res.json({
    success: true,
    data: {
      available_balance: user.available_balance,
      reserved_balance: user.reserved_balance,
      total_balance: user.available_balance + user.reserved_balance,
      total_deposited_approved: user.total_deposited_approved,
      total_withdrawn_approved: user.total_withdrawn_approved,
      approved_deposits_count: approvedDepositsCount,
      settings: {
        minimum_withdrawal: settings.minimum_withdrawal,
        minimum_approved_gmail: settings.minimum_approved_gmail_for_withdrawal,
        withdrawal_fee_type: settings.withdrawal_fee_type,
        withdrawal_fee_current: settings.withdrawal_fee_current,
        withdrawal_status: settings.withdrawal_status,
      },
      payment_method_default: user.payment_method_default,
      payment_account_default: user.payment_account_default,
      withdrawals: wds,
      transactions: txs,
    },
  });
});

// Ajukan WD (Withdrawal)
router.post('/user/withdrawals', authenticateToken, (req: AuthenticatedRequest, res: Response) => {
  try {
    const { grossAmount, paymentMethod, paymentAccount } = req.body;

    const numGross = Number(grossAmount);
    if (isNaN(numGross) || numGross <= 0) {
      res.status(400).json({ success: false, message: 'Nominal penarikan harus angka valid.' });
      return;
    }

    const result = db.requestWithdrawal({
      userId: req.user!.id,
      grossAmount: numGross,
      paymentMethod: String(paymentMethod || ''),
      paymentAccount: String(paymentAccount || ''),
    });

    if (result.error) {
      res.status(400).json({ success: false, message: result.error });
      return;
    }

    res.json({
      success: true,
      message: 'Permintaan penarikan dana berhasil diajukan dan sedang menunggu proses Admin.',
      data: result.withdrawal,
    });
  } catch (err: any) {
    console.error('Withdrawal request error:', err);
    res.status(500).json({ success: false, message: 'Gagal mengajukan penarikan dana.' });
  }
});

router.get('/user/withdrawals', authenticateToken, (req: AuthenticatedRequest, res: Response) => {
  const wds = db.getWithdrawals({ userId: req.user!.id });
  res.json({ success: true, data: wds });
});

// User Referral Program
router.get('/user/referral', authenticateToken, (req: AuthenticatedRequest, res: Response) => {
  const data = db.getReferralData(req.user!.id);
  res.json({ success: true, data });
});

// User Update Profile & Password
router.put('/user/profile', authenticateToken, (req: AuthenticatedRequest, res: Response) => {
  const { payment_method_default, payment_account_default, current_password, new_password } =
    req.body;

  if (payment_method_default !== undefined || payment_account_default !== undefined) {
    db.updateProfileDefaults(req.user!.id, {
      payment_method_default,
      payment_account_default,
    });
  }

  if (new_password) {
    if (!current_password) {
      res.status(400).json({ success: false, message: 'Password saat ini wajib diisi untuk mengubah password.' });
      return;
    }
    const currentHash = db.getPasswordHash(req.user!.id);
    if (!currentHash || !bcrypt.compareSync(current_password, currentHash)) {
      res.status(400).json({ success: false, message: 'Password saat ini tidak cocok.' });
      return;
    }
    if (new_password.length < 6) {
      res.status(400).json({ success: false, message: 'Password baru minimal 6 karakter.' });
      return;
    }
    db.updatePassword(req.user!.id, new_password);
  }

  const updatedUser = db.getUserById(req.user!.id);
  res.json({
    success: true,
    message: 'Profil berhasil diperbarui.',
    data: updatedUser,
  });
});

// --- ADMIN ENDPOINTS (Role-Protected) ---

router.get('/admin/dashboard', authenticateToken, requireAdmin, (_req: AuthenticatedRequest, res: Response) => {
  const data = db.getAdminDashboardData();
  res.json({ success: true, data });
});

// Admin Deposits Management
router.get('/admin/deposits', authenticateToken, requireAdmin, (req: AuthenticatedRequest, res: Response) => {
  const status = req.query.status as any;
  const search = req.query.search as string;
  const deposits = db.getDeposits({ status, search });
  res.json({ success: true, data: deposits });
});

const handleApproveDeposit = (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const result = db.approveDeposit(id, req.user!.id);
  if (!result.success) {
    res.status(400).json({ success: false, message: result.error });
    return;
  }
  res.json({ success: true, message: 'Setoran berhasil disetujui. Saldo user telah bertambah.' });
};
router.post('/admin/deposits/:id/approve', authenticateToken, requireAdmin, handleApproveDeposit);
router.put('/admin/deposits/:id/approve', authenticateToken, requireAdmin, handleApproveDeposit);

const handleRejectDeposit = (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const { reason } = req.body;
  const result = db.rejectDeposit(id, reason, req.user!.id);
  if (!result.success) {
    res.status(400).json({ success: false, message: result.error });
    return;
  }
  res.json({ success: true, message: 'Setoran berhasil ditolak.' });
};
router.post('/admin/deposits/:id/reject', authenticateToken, requireAdmin, handleRejectDeposit);
router.put('/admin/deposits/:id/reject', authenticateToken, requireAdmin, handleRejectDeposit);

// Admin Bulk Deposit Actions
router.post('/admin/deposits/bulk-approve', authenticateToken, requireAdmin, (req: AuthenticatedRequest, res: Response) => {
  const { ids } = req.body;
  if (!Array.isArray(ids) || ids.length === 0) {
    res.status(400).json({ success: false, message: 'Pilih minimal 1 setoran.' });
    return;
  }

  let approvedCount = 0;
  for (const id of ids) {
    const res = db.approveDeposit(id, req.user!.id);
    if (res.success) approvedCount++;
  }

  res.json({
    success: true,
    message: `Berhasil menyetujui ${approvedCount} dari ${ids.length} setoran terpilih.`,
  });
});

// Admin Withdrawals Management
router.get('/admin/withdrawals', authenticateToken, requireAdmin, (req: AuthenticatedRequest, res: Response) => {
  const status = req.query.status as any;
  const search = req.query.search as string;
  const wds = db.getWithdrawals({ status, search });
  res.json({ success: true, data: wds });
});

const handleApproveWithdrawal = (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const result = db.approveWithdrawal(id, req.user!.id);
  if (!result.success) {
    res.status(400).json({ success: false, message: result.error });
    return;
  }
  res.json({ success: true, message: 'Penarikan dana (WD) berhasil disetujui dan diselesaikan.' });
};
router.post('/admin/withdrawals/:id/approve', authenticateToken, requireAdmin, handleApproveWithdrawal);
router.put('/admin/withdrawals/:id/approve', authenticateToken, requireAdmin, handleApproveWithdrawal);

const handleRejectWithdrawal = (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const { reason, rejectReason } = req.body;
  const effectiveReason = reason || rejectReason;
  if (!effectiveReason || !String(effectiveReason).trim()) {
    res.status(400).json({ success: false, message: 'Alasan penolakan penarikan dana wajib diisi.' });
    return;
  }
  const result = db.rejectWithdrawal(id, effectiveReason, req.user!.id);
  if (!result.success) {
    res.status(400).json({ success: false, message: result.error });
    return;
  }
  res.json({
    success: true,
    message: 'Penarikan dana ditolak. Saldo yang dicadangkan telah dikembalikan ke saldo user.',
  });
};
router.post('/admin/withdrawals/:id/reject', authenticateToken, requireAdmin, handleRejectWithdrawal);
router.put('/admin/withdrawals/:id/reject', authenticateToken, requireAdmin, handleRejectWithdrawal);

// Admin User Management
router.get('/admin/users', authenticateToken, requireAdmin, (_req: AuthenticatedRequest, res: Response) => {
  const users = db.getAllUsers();
  res.json({ success: true, data: users });
});

router.get('/admin/users/:id', authenticateToken, requireAdmin, (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const user = db.getUserById(id);
  if (!user) {
    res.status(404).json({ success: false, message: 'User tidak ditemukan' });
    return;
  }
  const deposits = db.getDeposits({ userId: id });
  const withdrawals = db.getWithdrawals({ userId: id });
  const transactions = db.getTransactionsByUserId(id);

  res.json({
    success: true,
    data: {
      user,
      deposits,
      withdrawals,
      transactions,
    },
  });
});

router.post('/admin/users/:id/status', authenticateToken, requireAdmin, (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const { active } = req.body;
  const ok = db.toggleUserStatus(id, Boolean(active), req.user!.id);
  if (!ok) {
    res.status(400).json({ success: false, message: 'Gagal mengubah status user atau akun adalah admin.' });
    return;
  }
  res.json({
    success: true,
    message: `Status user berhasil diubah menjadi ${active ? 'Aktif' : 'Suspend'}.`,
  });
});

router.post('/admin/users/:id/adjust-balance', authenticateToken, requireAdmin, (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const { amount, description, reason } = req.body;
  const effectiveDesc = description || reason;

  const numAmount = Number(amount);
  if (isNaN(numAmount) || numAmount === 0) {
    res.status(400).json({ success: false, message: 'Nominal penyesuaian harus berupa angka bukan nol.' });
    return;
  }

  if (!effectiveDesc || !String(effectiveDesc).trim()) {
    res.status(400).json({ success: false, message: 'Catatan/alasan penyesuaian saldo wajib diisi.' });
    return;
  }

  const result = db.adjustUserBalance({
    userId: id,
    amount: numAmount,
    description: String(effectiveDesc).trim(),
    type: 'ADMIN_ADJUSTMENT',
    adminId: req.user!.id,
  });

  if (!result.success) {
    res.status(400).json({ success: false, message: result.error });
    return;
  }

  res.json({
    success: true,
    message: `Saldo user berhasil disesuaikan (${numAmount >= 0 ? '+' : ''}${numAmount.toLocaleString('id-ID')}). Saldo baru: Rp${result.newBalance?.toLocaleString('id-ID')}`,
    data: { newBalance: result.newBalance },
  });
});

// Admin System Settings
router.get('/admin/settings', authenticateToken, requireAdmin, (_req: AuthenticatedRequest, res: Response) => {
  const settings = db.getSettings();
  res.json({ success: true, data: settings });
});

router.put('/admin/settings', authenticateToken, requireAdmin, (req: AuthenticatedRequest, res: Response) => {
  const result = db.updateSettings(req.body, req.user!.id);
  if (result.error) {
    res.status(400).json({ success: false, message: result.error });
    return;
  }
  res.json({ success: true, message: 'Pengaturan sistem berhasil disimpan.', data: result.settings });
});

// Admin Rules Editor
router.get('/admin/rules', authenticateToken, requireAdmin, (_req: AuthenticatedRequest, res: Response) => {
  const rules = db.getRules();
  res.json({ success: true, data: rules });
});

router.put('/admin/rules', authenticateToken, requireAdmin, (req: AuthenticatedRequest, res: Response) => {
  const result = db.updateRules(req.body, req.user!.id);
  if (result.error) {
    res.status(400).json({ success: false, message: result.error });
    return;
  }
  res.json({ success: true, message: 'Dokumen rules berhasil diperbarui.', data: result.rules });
});

// Admin Referral Management
router.get('/admin/referral', authenticateToken, requireAdmin, (_req: AuthenticatedRequest, res: Response) => {
  const data = db.getAdminReferralData();
  res.json({ success: true, data });
});

router.get('/admin/referrals', authenticateToken, requireAdmin, (_req: AuthenticatedRequest, res: Response) => {
  const data = db.getAdminReferralData();
  res.json({ success: true, data });
});

// Admin Global Statistics
router.get('/admin/statistics', authenticateToken, requireAdmin, (_req: AuthenticatedRequest, res: Response) => {
  const config = db.getGlobalStatsConfig();
  const autoStats = db.getCalculatedAutoStats();
  const activeStats = db.getActiveGlobalStats();

  res.json({
    success: true,
    data: {
      config,
      auto_stats: autoStats,
      active_stats: activeStats,
    },
  });
});

router.put('/admin/statistics', authenticateToken, requireAdmin, (req: AuthenticatedRequest, res: Response) => {
  const result = db.updateGlobalStats(req.body, req.user!.id);
  if (result.error) {
    res.status(400).json({ success: false, message: result.error });
    return;
  }
  const autoStats = db.getCalculatedAutoStats();
  const activeStats = db.getActiveGlobalStats();

  res.json({
    success: true,
    message: 'Statistik global berhasil diperbarui.',
    data: {
      config: result.config,
      auto_stats: autoStats,
      active_stats: activeStats,
    },
  });
});

router.post('/admin/statistics/reset', authenticateToken, requireAdmin, (req: AuthenticatedRequest, res: Response) => {
  const result = db.resetGlobalStatsToAuto(req.user!.id);
  const autoStats = db.getCalculatedAutoStats();
  const activeStats = db.getActiveGlobalStats();

  res.json({
    success: true,
    message: 'Statistik global telah direset ke Mode Otomatis.',
    data: {
      config: result.config,
      auto_stats: autoStats,
      active_stats: activeStats,
    },
  });
});

// Public / User Global Statistics
router.get('/public/statistics', (_req: Request, res: Response) => {
  const config = db.getGlobalStatsConfig();
  const activeStats = db.getActiveGlobalStats();

  if (!config.show_to_users) {
    res.json({
      success: true,
      data: {
        enabled: false,
      },
    });
    return;
  }

  res.json({
    success: true,
    data: {
      enabled: true,
      mode: config.mode,
      visibility: config.visibility,
      values: activeStats,
    },
  });
});

// Admin Activity Logs
router.get('/admin/logs', authenticateToken, requireAdmin, (req: AuthenticatedRequest, res: Response) => {
  const limit = req.query.limit ? Number(req.query.limit) : 200;
  const logs = db.getLogs(limit);
  res.json({ success: true, data: logs });
});

export default router;
