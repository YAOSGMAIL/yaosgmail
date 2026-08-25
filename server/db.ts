import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import {
  User,
  Profile,
  UserWithProfile,
  Deposit,
  Withdrawal,
  BalanceTransaction,
  SystemSettings,
  SystemRules,
  ActivityLog,
  GlobalStatsValues,
  GlobalStatsVisibility,
  GlobalStatsConfig,
} from '../src/types';

interface DatabaseSchema {
  users: User[];
  profiles: Profile[];
  user_passwords: { user_id: string; password_hash: string }[];
  deposits: Deposit[];
  withdrawals: Withdrawal[];
  balance_transactions: BalanceTransaction[];
  settings: SystemSettings;
  rules: SystemRules;
  global_stats: GlobalStatsConfig;
  activity_logs: ActivityLog[];
}

const DB_DIR = path.join(process.cwd(), 'data');
const DB_FILE = path.join(DB_DIR, 'yaosgmail_db.json');

const DEFAULT_GLOBAL_STATS: GlobalStatsConfig = {
  mode: 'auto',
  show_to_users: true,
  manual_stats: {
    total_users: 1500,
    total_gmail: 23890,
    total_setoran: 12450,
    total_nominal_setoran: 53535000,
    total_wd: 4280,
    total_nominal_wd: 18450000,
    user_aktif: 1430,
    user_nonaktif: 70,
    gmail_acc: 21450,
    gmail_pending: 1200,
    gmail_reject: 1240,
    wd_acc: 3800,
    wd_pending: 300,
    wd_reject: 180,
  },
  visibility: {
    total_users: true,
    total_gmail: true,
    total_setoran: true,
    total_nominal_setoran: false,
    total_wd: true,
    total_nominal_wd: false,
    user_aktif: true,
    user_nonaktif: false,
    gmail_acc: true,
    gmail_pending: false,
    gmail_reject: false,
    wd_acc: true,
    wd_pending: false,
    wd_reject: false,
  },
  updated_at: new Date().toISOString(),
};

const DEFAULT_SETTINGS: SystemSettings = {
  site_name: 'YAO SGMAIL',
  gmail_rate: 4300,
  daily_limit: 30,
  minimum_withdrawal: 50000,
  minimum_approved_gmail_for_withdrawal: 2,
  withdrawal_fee_type: 'percentage',
  withdrawal_fee_min: 12,
  withdrawal_fee_max: 35,
  withdrawal_fee_current: 15,
  deposit_status: 'OPEN',
  withdrawal_status: 'OPEN',
  referral_status: 'OPEN',
  referral_reward: 500,
  room_status: 'OPEN',
  announcement: '🔥 Selamat datang di YAO SGMAIL! Setor akun Gmail Anda dengan rate tertinggi dan pencairan dana super cepat.',
  security_warning: '⚠️ PENTING: Jangan pernah memasukkan password Gmail, OTP, nomor HP, atau data pemulihan. Cukup cantumkan alamat email Gmail saja.',
  updated_at: new Date().toISOString(),
};

const DEFAULT_RULES: SystemRules = {
  deposit_rules: `### RULES SETORAN GMAIL
1. **Format Akun**: Hanya menerima format email valid berakhiran **@gmail.com**.
2. **Kualitas Akun**: Akun Gmail wajib masih aktif dan belum pernah terdaftar sebelumnya di sistem.
3. **Anti Duplikasi**: Akun yang sudah pernah disubmit atau disetujui otomatis ditolak sistem.
4. **Waktu Review**: Setoran diperiksa dan divalidasi oleh tim admin secara berkala (rata-rata 5-30 menit).
5. **Rate Setoran**: Rate yang didapatkan mengacu pada rate saat form setoran disubmit.
6. **Batas Harian**: Pengguna dapat menyetor hingga limit harian yang ditentukan oleh sistem.`,
  withdrawal_rules: `### RULES PENCAIRAN DANA (WITHDRAWAL)
1. **Minimum Penarikan**: Penarikan saldo minimum adalah Rp50.000 (dapat disesuaikan admin).
2. **Syarat Akun Approved**: Pengguna wajib memiliki minimal 2 Gmail dengan status APPROVED sebelum mengajukan WD.
3. **Biaya Admin (Fee)**: Biaya penarikan dihitung otomatis dan transparan sesuai persentase yang berlaku saat pengajuan.
4. **Metode Pembayaran**: Mendukung e-Wallet (DANA, GoPay, OVO, ShopeePay) dan Transfer Bank (BCA, BRI, Mandiri, BNI).
5. **Keabsahan Nomor**: Pastikan nomor e-Wallet atau nomor rekening dan nama pemilik sudah benar. Kesalahan input menjadi tanggung jawab pengguna.
6. **Waktu Proses**: Permintaan WD diproses admin dalam waktu 1x24 jam kerja.`,
  referral_rules: `### RULES PROGRAM REFERRAL
1. Bagikan kode atau link referral unik Anda kepada teman atau rekan kerja.
2. Dapatkan bonus komisi saldo untuk setiap transaksi yang valid sesuai program aktif.
3. Dilarang melakukan spamming massal atau kecurangan registrasi mandiri. Akun yang terindikasi kecurangan akan dinonaktifkan permanen.`,
  security_rules: `### KEBIJAKAN KEAMANAN DATA
1. YAO SGMAIL tidak pernah meminta password Gmail, kode autentikasi 2FA, SMS OTP, atau data pribadi lainnya.
2. Seluruh transaksi saldo dicatat secara transparan dalam balance ledger permanen.
3. Hubungi Admin resmi jika menemukan kendala teknis atau pertanyaan seputar akun.`,
  updated_at: new Date().toISOString(),
};

class Database {
  private data: DatabaseSchema;
  private isSaving: boolean = false;
  private queueSave: boolean = false;

  constructor() {
    this.ensureDirectory();
    this.data = this.loadDatabase();
    this.seedAdminAndDefaults();
  }

  private ensureDirectory() {
    if (!fs.existsSync(DB_DIR)) {
      fs.mkdirSync(DB_DIR, { recursive: true });
    }
  }

  private loadDatabase(): DatabaseSchema {
    if (fs.existsSync(DB_FILE)) {
      try {
        const raw = fs.readFileSync(DB_FILE, 'utf-8');
        const parsed = JSON.parse(raw);
        return {
          users: parsed.users || [],
          profiles: parsed.profiles || [],
          user_passwords: parsed.user_passwords || [],
          deposits: parsed.deposits || [],
          withdrawals: parsed.withdrawals || [],
          balance_transactions: parsed.balance_transactions || [],
          settings: { ...DEFAULT_SETTINGS, ...(parsed.settings || {}) },
          rules: { ...DEFAULT_RULES, ...(parsed.rules || {}) },
          global_stats: {
            ...DEFAULT_GLOBAL_STATS,
            ...(parsed.global_stats || {}),
            manual_stats: {
              ...DEFAULT_GLOBAL_STATS.manual_stats,
              ...(parsed.global_stats?.manual_stats || {}),
            },
            visibility: {
              ...DEFAULT_GLOBAL_STATS.visibility,
              ...(parsed.global_stats?.visibility || {}),
            },
          },
          activity_logs: parsed.activity_logs || [],
        };
      } catch (err) {
        console.error('Failed to parse database file, re-initializing...', err);
      }
    }

    const initial: DatabaseSchema = {
      users: [],
      profiles: [],
      user_passwords: [],
      deposits: [],
      withdrawals: [],
      balance_transactions: [],
      settings: DEFAULT_SETTINGS,
      rules: DEFAULT_RULES,
      global_stats: DEFAULT_GLOBAL_STATS,
      activity_logs: [],
    };
    return initial;
  }

  private saveDatabase() {
    if (this.isSaving) {
      this.queueSave = true;
      return;
    }
    this.isSaving = true;

    try {
      const tempFile = `${DB_FILE}.tmp.${Date.now()}`;
      fs.writeFileSync(tempFile, JSON.stringify(this.data, null, 2), 'utf-8');
      fs.renameSync(tempFile, DB_FILE);
    } catch (err) {
      console.error('Error writing database to disk:', err);
    } finally {
      this.isSaving = false;
      if (this.queueSave) {
        this.queueSave = false;
        this.saveDatabase();
      }
    }
  }

  private seedAdminAndDefaults() {
    const adminUsername = (process.env.ADMIN_USERNAME || 'YAO').trim();
    const adminPassword = process.env.ADMIN_PASSWORD || 'IKEH';
    const passwordHash = bcrypt.hashSync(adminPassword, 10);

    // 1. Check if user with username 'YAO' (or configured ADMIN_USERNAME) already exists
    let yaoProfile = this.data.profiles.find(
      (p) => p.username.toLowerCase() === adminUsername.toLowerCase()
    );

    let adminUserId: string;

    if (yaoProfile) {
      adminUserId = yaoProfile.user_id;
      // Normalize username casing
      yaoProfile.username = adminUsername;

      const yaoUser = this.data.users.find((u) => u.id === adminUserId);
      if (yaoUser) {
        yaoUser.role = 'admin';
        yaoUser.active = true;
      }

      // Sync password to ensure configured admin password is always active
      const existingPw = this.data.user_passwords.find((p) => p.user_id === adminUserId);
      if (existingPw) {
        existingPw.password_hash = passwordHash;
      } else {
        this.data.user_passwords.push({ user_id: adminUserId, password_hash: passwordHash });
      }
      console.log(`[Database] Synced primary admin account: ${adminUsername} (role: admin)`);
    } else {
      // Create single primary admin
      adminUserId = 'usr_admin_yao';
      const createdAt = new Date().toISOString();

      const newAdminUser: User = {
        id: adminUserId,
        email: 'yao.admin@system.internal',
        role: 'admin',
        active: true,
        created_at: createdAt,
        last_login_at: null,
      };

      const newAdminProfile: Profile = {
        user_id: adminUserId,
        username: adminUsername,
        referral_code: 'YAOADMIN',
        referrer_id: null,
        available_balance: 0,
        reserved_balance: 0,
        total_deposited_approved: 0,
        total_withdrawn_approved: 0,
      };

      this.data.users.push(newAdminUser);
      this.data.profiles.push(newAdminProfile);
      this.data.user_passwords.push({ user_id: adminUserId, password_hash: passwordHash });

      this.logActivity({
        actor_id: adminUserId,
        actor_role: 'admin',
        actor_name: adminUsername,
        action: 'SYSTEM_INIT',
        description: `Primary system admin initialized: ${adminUsername}`,
      });

      console.log(`[Database] Initialized primary system admin: ${adminUsername} (role: admin)`);
    }

    // 2. Strict Single Admin Guarantee:
    // Demote any other accounts that have role 'admin' to standard 'user' role.
    // Ensure any user with email 'admin@yaosgmail.com' is strictly 'user'.
    let demotedCount = 0;
    this.data.users.forEach((u) => {
      if (u.id !== adminUserId && u.role === 'admin') {
        u.role = 'user';
        demotedCount++;
      }
      if (u.email.toLowerCase() === 'admin@yaosgmail.com' && u.role !== 'user') {
        u.role = 'user';
      }
    });

    if (demotedCount > 0) {
      console.log(`[Database] Demoted ${demotedCount} non-primary admin account(s) to 'user'.`);
    }

    this.saveDatabase();
  }

  // --- ACTIVITY LOGS ---
  public logActivity(params: {
    actor_id: string;
    actor_role: 'user' | 'admin' | 'system';
    actor_name: string;
    action: string;
    description: string;
    metadata?: Record<string, any>;
  }) {
    const log: ActivityLog = {
      id: 'log_' + crypto.randomUUID(),
      actor_id: params.actor_id,
      actor_role: params.actor_role,
      actor_name: params.actor_name,
      action: params.action,
      description: params.description,
      metadata: params.metadata,
      created_at: new Date().toISOString(),
    };
    this.data.activity_logs.unshift(log);
    // Keep max 2000 logs
    if (this.data.activity_logs.length > 2000) {
      this.data.activity_logs = this.data.activity_logs.slice(0, 2000);
    }
    this.saveDatabase();
    return log;
  }

  public getLogs(limit: number = 100): ActivityLog[] {
    return this.data.activity_logs.slice(0, limit);
  }

  // --- USERS & PROFILES ---
  public getUserByEmail(email: string): User | undefined {
    return this.data.users.find((u) => u.email.toLowerCase() === email.toLowerCase().trim());
  }

  public getUserByUsername(username: string): UserWithProfile | undefined {
    const profile = this.data.profiles.find(
      (p) => p.username.toLowerCase() === username.toLowerCase().trim()
    );
    if (!profile) return undefined;
    const user = this.data.users.find((u) => u.id === profile.user_id);
    if (!user) return undefined;
    return { ...user, ...profile };
  }

  public getUserById(userId: string): UserWithProfile | undefined {
    const user = this.data.users.find((u) => u.id === userId);
    if (!user) return undefined;
    const profile = this.data.profiles.find((p) => p.user_id === userId);
    if (!profile) return undefined;
    return { ...user, ...profile };
  }

  public getUserByReferralCode(code: string): UserWithProfile | undefined {
    const profile = this.data.profiles.find(
      (p) => p.referral_code.toUpperCase() === code.toUpperCase().trim()
    );
    if (!profile) return undefined;
    return this.getUserById(profile.user_id);
  }

  public getPasswordHash(userId: string): string | undefined {
    return this.data.user_passwords.find((p) => p.user_id === userId)?.password_hash;
  }

  public updatePassword(userId: string, newPasswordPlain: string): boolean {
    const hash = bcrypt.hashSync(newPasswordPlain, 10);
    const existing = this.data.user_passwords.find((p) => p.user_id === userId);
    if (existing) {
      existing.password_hash = hash;
    } else {
      this.data.user_passwords.push({ user_id: userId, password_hash: hash });
    }
    this.saveDatabase();
    return true;
  }

  public createUser(params: {
    username: string;
    email: string;
    passwordPlain: string;
    referralCodeInput?: string;
  }): { user: UserWithProfile; error?: string } {
    const cleanEmail = params.email.toLowerCase().trim();
    const cleanUsername = params.username.trim();

    if (cleanUsername.toLowerCase() === 'yao') {
      return { user: {} as any, error: 'Username tidak tersedia.' };
    }

    if (this.getUserByEmail(cleanEmail)) {
      return { user: {} as any, error: 'Email sudah terdaftar. Gunakan email lain atau login.' };
    }

    if (this.getUserByUsername(cleanUsername)) {
      return { user: {} as any, error: 'Username sudah digunakan. Silakan pilih username lain.' };
    }

    let referrerId: string | null = null;
    if (params.referralCodeInput && params.referralCodeInput.trim()) {
      const refUser = this.getUserByReferralCode(params.referralCodeInput);
      if (refUser) {
        referrerId = refUser.id;
      }
    }

    const userId = 'usr_' + crypto.randomUUID();
    const passwordHash = bcrypt.hashSync(params.passwordPlain, 10);
    const now = new Date().toISOString();

    // Unique referral code for this user: YAO + 6 random alphanumeric chars
    const userRefCode = 'YAO' + crypto.randomBytes(3).toString('hex').toUpperCase();

    const newUser: User = {
      id: userId,
      email: cleanEmail,
      role: 'user',
      active: true,
      created_at: now,
      last_login_at: now,
    };

    const newProfile: Profile = {
      user_id: userId,
      username: cleanUsername,
      referral_code: userRefCode,
      referrer_id: referrerId,
      available_balance: 0,
      reserved_balance: 0,
      total_deposited_approved: 0,
      total_withdrawn_approved: 0,
    };

    this.data.users.push(newUser);
    this.data.profiles.push(newProfile);
    this.data.user_passwords.push({ user_id: userId, password_hash: passwordHash });

    this.logActivity({
      actor_id: userId,
      actor_role: 'user',
      actor_name: cleanUsername,
      action: 'USER_REGISTER',
      description: `User terdaftar: ${cleanUsername} (${cleanEmail})`,
      metadata: { referrer_id: referrerId },
    });

    this.saveDatabase();
    return { user: { ...newUser, ...newProfile } };
  }

  public recordLogin(userId: string) {
    const user = this.data.users.find((u) => u.id === userId);
    if (user) {
      user.last_login_at = new Date().toISOString();
      this.saveDatabase();
    }
  }

  public getAllUsers(): (UserWithProfile & {
    approved_gmail_count: number;
    pending_gmail_count: number;
    total_withdrawals_count: number;
  })[] {
    return this.data.users.map((u) => {
      const profile = this.data.profiles.find((p) => p.user_id === u.id) || {
        user_id: u.id,
        username: u.email.split('@')[0],
        referral_code: 'YAO' + u.id.slice(-6),
        referrer_id: null,
        available_balance: 0,
        reserved_balance: 0,
        total_deposited_approved: 0,
        total_withdrawn_approved: 0,
      };

      const userDeposits = this.data.deposits.filter((d) => d.user_id === u.id);
      const approvedCount = userDeposits.filter((d) => d.status === 'APPROVED').length;
      const pendingCount = userDeposits.filter((d) => d.status === 'PENDING').length;
      const userWds = this.data.withdrawals.filter((w) => w.user_id === u.id);

      return {
        ...u,
        ...profile,
        approved_gmail_count: approvedCount,
        pending_gmail_count: pendingCount,
        total_withdrawals_count: userWds.length,
      };
    });
  }

  public toggleUserStatus(userId: string, active: boolean, adminId: string): boolean {
    const user = this.data.users.find((u) => u.id === userId);
    if (!user || user.role === 'admin') return false;
    user.active = active;

    const admin = this.getUserById(adminId);
    this.logActivity({
      actor_id: adminId,
      actor_role: 'admin',
      actor_name: admin?.username || 'Admin',
      action: active ? 'USER_ACTIVATE' : 'USER_SUSPEND',
      description: `Status akun ${user.email} diubah menjadi: ${active ? 'AKTIF' : 'SUSPEND'}`,
      metadata: { target_user_id: userId, active },
    });

    this.saveDatabase();
    return true;
  }

  public updateProfileDefaults(
    userId: string,
    params: { payment_method_default?: string; payment_account_default?: string }
  ) {
    const profile = this.data.profiles.find((p) => p.user_id === userId);
    if (profile) {
      if (params.payment_method_default !== undefined) {
        profile.payment_method_default = params.payment_method_default;
      }
      if (params.payment_account_default !== undefined) {
        profile.payment_account_default = params.payment_account_default;
      }
      this.saveDatabase();
    }
  }

  // --- LEDGER & BALANCE OPERATIONS ---
  public adjustUserBalance(params: {
    userId: string;
    amount: number;
    description: string;
    type: BalanceTransaction['type'];
    referenceId?: string | null;
    adminId?: string;
  }): { success: boolean; newBalance?: number; error?: string } {
    const profile = this.data.profiles.find((p) => p.user_id === params.userId);
    if (!profile) return { success: false, error: 'User tidak ditemukan' };

    const newAvailable = profile.available_balance + params.amount;
    if (newAvailable < 0) {
      return { success: false, error: 'Saldo tidak mencukupi untuk pengurangan ini' };
    }

    profile.available_balance = newAvailable;

    const tx: BalanceTransaction = {
      id: 'tx_' + crypto.randomUUID(),
      user_id: params.userId,
      type: params.type,
      amount: params.amount,
      balance_after: newAvailable,
      reference_id: params.referenceId || null,
      description: params.description,
      created_at: new Date().toISOString(),
    };

    this.data.balance_transactions.unshift(tx);

    if (params.adminId) {
      const admin = this.getUserById(params.adminId);
      this.logActivity({
        actor_id: params.adminId,
        actor_role: 'admin',
        actor_name: admin?.username || 'Admin',
        action: 'BALANCE_ADJUST',
        description: `Penyesuaian saldo user ${profile.username} sebesar ${params.amount >= 0 ? '+' : ''}${params.amount.toLocaleString('id-ID')}. Alasan: ${params.description}`,
        metadata: { target_user_id: params.userId, amount: params.amount, balance_after: newAvailable },
      });
    }

    this.saveDatabase();
    return { success: true, newBalance: newAvailable };
  }

  public getTransactionsByUserId(userId: string): BalanceTransaction[] {
    return this.data.balance_transactions.filter((tx) => tx.user_id === userId);
  }

  // --- DEPOSITS ---
  public getDeposits(filter?: {
    userId?: string;
    status?: Deposit['status'];
    search?: string;
  }): Deposit[] {
    let result = this.data.deposits;
    if (filter?.userId) {
      result = result.filter((d) => d.user_id === filter.userId);
    }
    if (filter?.status) {
      result = result.filter((d) => d.status === filter.status);
    }
    if (filter?.search) {
      const q = filter.search.toLowerCase().trim();
      result = result.filter(
        (d) =>
          d.gmail.toLowerCase().includes(q) ||
          d.username?.toLowerCase().includes(q) ||
          d.id.toLowerCase().includes(q)
      );
    }

    // Attach current username/email for admin view
    return result.map((d) => {
      const u = this.getUserById(d.user_id);
      return {
        ...d,
        username: u?.username || 'Unknown',
        user_email: u?.email || '',
      };
    });
  }

  public getDepositById(id: string): Deposit | undefined {
    return this.data.deposits.find((d) => d.id === id);
  }

  public isGmailAlreadySubmitted(gmail: string): boolean {
    const clean = gmail.toLowerCase().trim();
    return this.data.deposits.some(
      (d) => d.gmail.toLowerCase().trim() === clean && d.status !== 'REJECTED'
    );
  }

  public getTodayDepositCount(userId: string): number {
    const todayStr = new Date().toISOString().split('T')[0];
    return this.data.deposits.filter(
      (d) => d.user_id === userId && d.created_at.startsWith(todayStr)
    ).length;
  }

  public submitDeposits(params: {
    userId: string;
    gmailList: string[];
  }): { submitted: Deposit[]; rejected: { gmail: string; reason: string }[]; error?: string } {
    const user = this.getUserById(params.userId);
    if (!user || !user.active) {
      return { submitted: [], rejected: [], error: 'Akun tidak aktif atau tidak ditemukan' };
    }

    const settings = this.data.settings;
    if (settings.deposit_status === 'CLOSED') {
      return { submitted: [], rejected: [], error: 'Fitur setoran sedang ditutup oleh Admin' };
    }

    if (settings.room_status === 'CLOSED') {
      return { submitted: [], rejected: [], error: 'Sistem YAO SGMAIL sedang offline/closed' };
    }

    const rate = settings.gmail_rate;
    const submitted: Deposit[] = [];
    const rejected: { gmail: string; reason: string }[] = [];
    const now = new Date().toISOString();

    const seenInThisBatch = new Set<string>();
    const gmailRegex = /^[a-zA-Z0-9._%+-]+@gmail\.com$/i;

    const todayCount = this.getTodayDepositCount(params.userId);
    const limit = settings.daily_limit;

    for (const rawGmail of params.gmailList) {
      const clean = rawGmail.toLowerCase().trim();
      if (!clean) continue;

      if (!gmailRegex.test(clean)) {
        rejected.push({ gmail: clean, reason: 'Format email tidak valid (harus @gmail.com)' });
        continue;
      }

      if (seenInThisBatch.has(clean)) {
        rejected.push({ gmail: clean, reason: 'Duplikat dalam input yang sama' });
        continue;
      }
      seenInThisBatch.add(clean);

      // Check duplicate in database
      const existing = this.data.deposits.find((d) => d.gmail.toLowerCase() === clean);
      if (existing) {
        if (existing.status === 'APPROVED') {
          rejected.push({ gmail: clean, reason: 'Gmail sudah pernah diterima sebelumnya' });
          continue;
        }
        if (existing.status === 'PENDING') {
          rejected.push({ gmail: clean, reason: 'Gmail ini sedang menunggu review' });
          continue;
        }
      }

      if (limit > 0 && todayCount + submitted.length >= limit) {
        rejected.push({
          gmail: clean,
          reason: `Melebihi limit harian setoran (${limit} Gmail/hari)`,
        });
        continue;
      }

      const newDeposit: Deposit = {
        id: 'dep_' + crypto.randomUUID(),
        user_id: params.userId,
        gmail: clean,
        amount: rate,
        status: 'PENDING',
        reject_reason: null,
        created_at: now,
        reviewed_at: null,
        reviewed_by: null,
      };

      this.data.deposits.unshift(newDeposit);
      submitted.push(newDeposit);
    }

    if (submitted.length > 0) {
      this.logActivity({
        actor_id: params.userId,
        actor_role: 'user',
        actor_name: user.username,
        action: 'DEPOSIT_SUBMIT',
        description: `Menyetor ${submitted.length} akun Gmail (Rate: Rp${rate.toLocaleString('id-ID')})`,
        metadata: {
          count: submitted.length,
          rate,
          total_estimated: submitted.length * rate,
        },
      });
      this.saveDatabase();
    }

    return { submitted, rejected };
  }

  public approveDeposit(depositId: string, adminId: string): { success: boolean; error?: string } {
    const deposit = this.data.deposits.find((d) => d.id === depositId);
    if (!deposit) return { success: false, error: 'Setoran tidak ditemukan' };
    if (deposit.status === 'APPROVED') {
      return { success: true }; // Idempotent
    }
    if (deposit.status === 'REJECTED') {
      return { success: false, error: 'Setoran yang sudah ditolak tidak dapat langsung diapprove' };
    }

    const admin = this.getUserById(adminId);
    const userProfile = this.data.profiles.find((p) => p.user_id === deposit.user_id);
    if (!userProfile) return { success: false, error: 'User pemilik setoran tidak ditemukan' };

    // Atomically credit user balance and update profile
    const amount = deposit.amount;
    userProfile.available_balance += amount;
    userProfile.total_deposited_approved += amount;

    deposit.status = 'APPROVED';
    deposit.reviewed_at = new Date().toISOString();
    deposit.reviewed_by = adminId;

    // Record ledger transaction
    const tx: BalanceTransaction = {
      id: 'tx_' + crypto.randomUUID(),
      user_id: deposit.user_id,
      type: 'DEPOSIT_CREDIT',
      amount: amount,
      balance_after: userProfile.available_balance,
      reference_id: deposit.id,
      description: `Setoran Gmail disetujui: ${deposit.gmail}`,
      created_at: new Date().toISOString(),
    };
    this.data.balance_transactions.unshift(tx);

    // Referral commission check if applicable
    if (
      this.data.settings.referral_status === 'OPEN' &&
      this.data.settings.referral_reward > 0 &&
      userProfile.referrer_id
    ) {
      const referrerProfile = this.data.profiles.find((p) => p.user_id === userProfile.referrer_id);
      if (referrerProfile) {
        const reward = this.data.settings.referral_reward;
        referrerProfile.available_balance += reward;
        const refTx: BalanceTransaction = {
          id: 'tx_' + crypto.randomUUID(),
          user_id: userProfile.referrer_id,
          type: 'REFERRAL_REWARD',
          amount: reward,
          balance_after: referrerProfile.available_balance,
          reference_id: deposit.id,
          description: `Komisi Referral dari ${userProfile.username} (${deposit.gmail})`,
          created_at: new Date().toISOString(),
        };
        this.data.balance_transactions.unshift(refTx);
      }
    }

    this.logActivity({
      actor_id: adminId,
      actor_role: 'admin',
      actor_name: admin?.username || 'Admin',
      action: 'DEPOSIT_APPROVE',
      description: `Menyetujui setoran ${deposit.gmail} untuk user ${userProfile.username} (+Rp${amount.toLocaleString('id-ID')})`,
      metadata: { deposit_id: deposit.id, gmail: deposit.gmail, amount },
    });

    this.saveDatabase();
    return { success: true };
  }

  public rejectDeposit(
    depositId: string,
    reason: string,
    adminId: string
  ): { success: boolean; error?: string } {
    const deposit = this.data.deposits.find((d) => d.id === depositId);
    if (!deposit) return { success: false, error: 'Setoran tidak ditemukan' };
    if (deposit.status === 'APPROVED') {
      return { success: false, error: 'Setoran yang sudah APPROVED tidak dapat di-reject' };
    }

    const admin = this.getUserById(adminId);
    deposit.status = 'REJECTED';
    deposit.reject_reason = reason.trim() || 'Akun tidak memenuhi syarat kriteria validasi';
    deposit.reviewed_at = new Date().toISOString();
    deposit.reviewed_by = adminId;

    this.logActivity({
      actor_id: adminId,
      actor_role: 'admin',
      actor_name: admin?.username || 'Admin',
      action: 'DEPOSIT_REJECT',
      description: `Menolak setoran ${deposit.gmail}. Alasan: ${deposit.reject_reason}`,
      metadata: { deposit_id: deposit.id, gmail: deposit.gmail, reason: deposit.reject_reason },
    });

    this.saveDatabase();
    return { success: true };
  }

  // --- WITHDRAWALS & RESERVED BALANCE ---
  public getWithdrawals(filter?: {
    userId?: string;
    status?: Withdrawal['status'];
    search?: string;
  }): Withdrawal[] {
    let result = this.data.withdrawals;
    if (filter?.userId) {
      result = result.filter((w) => w.user_id === filter.userId);
    }
    if (filter?.status) {
      result = result.filter((w) => w.status === filter.status);
    }
    if (filter?.search) {
      const q = filter.search.toLowerCase().trim();
      result = result.filter(
        (w) =>
          w.payment_account.toLowerCase().includes(q) ||
          w.payment_method.toLowerCase().includes(q) ||
          w.username?.toLowerCase().includes(q) ||
          w.id.toLowerCase().includes(q)
      );
    }

    return result.map((w) => {
      const u = this.getUserById(w.user_id);
      return {
        ...w,
        username: u?.username || 'Unknown',
        user_email: u?.email || '',
      };
    });
  }

  public getWithdrawalById(id: string): Withdrawal | undefined {
    return this.data.withdrawals.find((w) => w.id === id);
  }

  public requestWithdrawal(params: {
    userId: string;
    grossAmount: number;
    paymentMethod: string;
    paymentAccount: string;
  }): { withdrawal?: Withdrawal; error?: string } {
    const user = this.getUserById(params.userId);
    if (!user || !user.active) {
      return { error: 'Akun tidak aktif atau tidak ditemukan' };
    }

    const settings = this.data.settings;
    if (settings.withdrawal_status === 'CLOSED') {
      return { error: 'Fitur Withdrawal sedang ditutup oleh Admin' };
    }

    if (settings.room_status === 'CLOSED') {
      return { error: 'Sistem YAO SGMAIL sedang offline/closed' };
    }

    const gross = Math.floor(params.grossAmount);
    if (isNaN(gross) || gross <= 0) {
      return { error: 'Nominal penarikan tidak valid' };
    }

    // Minimum WD check
    if (gross < settings.minimum_withdrawal) {
      return {
        error: `Minimum WD adalah Rp${settings.minimum_withdrawal.toLocaleString('id-ID')}.`,
      };
    }

    // Approved Gmail threshold check
    const approvedGmailCount = this.data.deposits.filter(
      (d) => d.user_id === params.userId && d.status === 'APPROVED'
    ).length;

    if (approvedGmailCount < settings.minimum_approved_gmail_for_withdrawal) {
      return {
        error: `Belum memenuhi syarat WD. Minimal ${settings.minimum_approved_gmail_for_withdrawal} Gmail harus berstatus ACC. (Saat ini: ${approvedGmailCount} Gmail ACC)`,
      };
    }

    // Payment validation
    const method = params.paymentMethod.trim();
    const account = params.paymentAccount.trim();
    if (!method || !account) {
      return { error: 'Metode pembayaran dan nomor rekening/e-Wallet wajib diisi' };
    }

    const profile = this.data.profiles.find((p) => p.user_id === params.userId);
    if (!profile) return { error: 'Profil tidak ditemukan' };

    // Available Balance Check
    if (profile.available_balance < gross) {
      return {
        error: `Saldo tidak mencukupi. Saldo tersedia: Rp${profile.available_balance.toLocaleString('id-ID')}`,
      };
    }

    // Dynamic fee calculation (Backend authoritative)
    const feeRate = settings.withdrawal_fee_current;
    const feeAmount =
      settings.withdrawal_fee_type === 'fixed'
        ? Math.round(feeRate)
        : Math.round((gross * feeRate) / 100);
    const netAmount = Math.max(0, gross - feeAmount);

    // Atomically reserve the balance
    profile.available_balance -= gross;
    profile.reserved_balance += gross;

    const wdId = 'wd_' + crypto.randomUUID();
    const now = new Date().toISOString();

    const newWithdrawal: Withdrawal = {
      id: wdId,
      user_id: params.userId,
      gross_amount: gross,
      fee_type: settings.withdrawal_fee_type,
      fee_rate: feeRate,
      fee_amount: feeAmount,
      net_amount: netAmount,
      payment_method: method,
      payment_account: account,
      status: 'PENDING',
      reject_reason: null,
      created_at: now,
      processed_at: null,
      processed_by: null,
    };

    this.data.withdrawals.unshift(newWithdrawal);

    // Save default payment method for user convenience
    profile.payment_method_default = method;
    profile.payment_account_default = account;

    // Balance Ledger Transaction
    const tx: BalanceTransaction = {
      id: 'tx_' + crypto.randomUUID(),
      user_id: params.userId,
      type: 'WITHDRAWAL_RESERVE',
      amount: -gross,
      balance_after: profile.available_balance,
      reference_id: wdId,
      description: `Pengajuan WD: ${method} - ${account} (Fee ${feeRate}%: Rp${feeAmount.toLocaleString('id-ID')})`,
      created_at: now,
    };
    this.data.balance_transactions.unshift(tx);

    this.logActivity({
      actor_id: params.userId,
      actor_role: 'user',
      actor_name: user.username,
      action: 'WITHDRAWAL_SUBMIT',
      description: `Mengajukan penarikan dana Rp${gross.toLocaleString('id-ID')} via ${method} (Net: Rp${netAmount.toLocaleString('id-ID')})`,
      metadata: { withdrawal_id: wdId, gross, feeAmount, netAmount, method, account },
    });

    this.saveDatabase();
    return { withdrawal: newWithdrawal };
  }

  public approveWithdrawal(
    withdrawalId: string,
    adminId: string
  ): { success: boolean; error?: string } {
    const wd = this.data.withdrawals.find((w) => w.id === withdrawalId);
    if (!wd) return { success: false, error: 'Data penarikan tidak ditemukan' };
    if (wd.status === 'APPROVED') return { success: true }; // Idempotent
    if (wd.status === 'REJECTED') {
      return { success: false, error: 'WD yang sudah di-reject tidak dapat diapprove' };
    }

    const admin = this.getUserById(adminId);
    const profile = this.data.profiles.find((p) => p.user_id === wd.user_id);
    if (!profile) return { success: false, error: 'User tidak ditemukan' };

    // Settle reserved balance
    profile.reserved_balance = Math.max(0, profile.reserved_balance - wd.gross_amount);
    profile.total_withdrawn_approved += wd.net_amount;

    wd.status = 'APPROVED';
    wd.processed_at = new Date().toISOString();
    wd.processed_by = adminId;

    const tx: BalanceTransaction = {
      id: 'tx_' + crypto.randomUUID(),
      user_id: wd.user_id,
      type: 'WITHDRAWAL_SETTLE',
      amount: 0,
      balance_after: profile.available_balance,
      reference_id: wd.id,
      description: `Withdrawal berhasil dicairkan: ${wd.payment_method} - ${wd.payment_account} (Net Rp${wd.net_amount.toLocaleString('id-ID')})`,
      created_at: new Date().toISOString(),
    };
    this.data.balance_transactions.unshift(tx);

    this.logActivity({
      actor_id: adminId,
      actor_role: 'admin',
      actor_name: admin?.username || 'Admin',
      action: 'WITHDRAWAL_APPROVE',
      description: `Menyetujui WD Rp${wd.gross_amount.toLocaleString('id-ID')} (${wd.payment_method} ${wd.payment_account}) untuk user ${profile.username}`,
      metadata: { withdrawal_id: wd.id, gross: wd.gross_amount, net: wd.net_amount },
    });

    this.saveDatabase();
    return { success: true };
  }

  public rejectWithdrawal(
    withdrawalId: string,
    reason: string,
    adminId: string
  ): { success: boolean; error?: string } {
    const wd = this.data.withdrawals.find((w) => w.id === withdrawalId);
    if (!wd) return { success: false, error: 'Data penarikan tidak ditemukan' };
    if (wd.status === 'APPROVED') {
      return { success: false, error: 'WD yang sudah disetujui tidak dapat di-reject' };
    }
    if (wd.status === 'REJECTED') return { success: true };

    const admin = this.getUserById(adminId);
    const profile = this.data.profiles.find((p) => p.user_id === wd.user_id);
    if (!profile) return { success: false, error: 'User tidak ditemukan' };

    // Revert reserved balance back to available balance!
    profile.reserved_balance = Math.max(0, profile.reserved_balance - wd.gross_amount);
    profile.available_balance += wd.gross_amount;

    wd.status = 'REJECTED';
    wd.reject_reason = reason.trim() || 'Nomor rekening/e-Wallet tidak valid atau nama tidak sesuai';
    wd.processed_at = new Date().toISOString();
    wd.processed_by = adminId;

    const tx: BalanceTransaction = {
      id: 'tx_' + crypto.randomUUID(),
      user_id: wd.user_id,
      type: 'WITHDRAWAL_REFUND',
      amount: wd.gross_amount,
      balance_after: profile.available_balance,
      reference_id: wd.id,
      description: `Pengembalian saldo WD ditolak: ${wd.reject_reason}`,
      created_at: new Date().toISOString(),
    };
    this.data.balance_transactions.unshift(tx);

    this.logActivity({
      actor_id: adminId,
      actor_role: 'admin',
      actor_name: admin?.username || 'Admin',
      action: 'WITHDRAWAL_REJECT',
      description: `Menolak WD Rp${wd.gross_amount.toLocaleString('id-ID')} (${profile.username}). Saldo dikembalikan. Alasan: ${wd.reject_reason}`,
      metadata: { withdrawal_id: wd.id, reason: wd.reject_reason, gross: wd.gross_amount },
    });

    this.saveDatabase();
    return { success: true };
  }

  // --- SETTINGS & RULES ---
  public getSettings(): SystemSettings {
    return this.data.settings;
  }

  public updateSettings(
    newSettings: Partial<SystemSettings>,
    adminId: string
  ): { settings: SystemSettings; error?: string } {
    const admin = this.getUserById(adminId);

    // Validation
    if (newSettings.withdrawal_fee_min !== undefined && newSettings.withdrawal_fee_max !== undefined) {
      if (newSettings.withdrawal_fee_min > newSettings.withdrawal_fee_max) {
        return { settings: this.data.settings, error: 'Fee minimum tidak boleh lebih besar dari fee maksimum' };
      }
    }

    const currentMin = newSettings.withdrawal_fee_min ?? this.data.settings.withdrawal_fee_min;
    const currentMax = newSettings.withdrawal_fee_max ?? this.data.settings.withdrawal_fee_max;

    if (newSettings.withdrawal_fee_current !== undefined) {
      if (newSettings.withdrawal_fee_current < currentMin) {
        return {
          settings: this.data.settings,
          error: `Fee saat ini (${newSettings.withdrawal_fee_current}%) tidak boleh kurang dari minimum (${currentMin}%)`,
        };
      }
      if (newSettings.withdrawal_fee_current > currentMax) {
        return {
          settings: this.data.settings,
          error: `Fee saat ini (${newSettings.withdrawal_fee_current}%) tidak boleh lebih dari maksimum (${currentMax}%)`,
        };
      }
    }

    if (newSettings.gmail_rate !== undefined && newSettings.gmail_rate < 0) {
      return { settings: this.data.settings, error: 'Rate Gmail tidak boleh bernilai negatif' };
    }

    if (newSettings.minimum_withdrawal !== undefined && newSettings.minimum_withdrawal < 1000) {
      return { settings: this.data.settings, error: 'Minimum WD minimal Rp1.000' };
    }

    if (
      newSettings.minimum_approved_gmail_for_withdrawal !== undefined &&
      newSettings.minimum_approved_gmail_for_withdrawal < 0
    ) {
      return { settings: this.data.settings, error: 'Syarat Gmail approved tidak boleh negatif' };
    }

    this.data.settings = {
      ...this.data.settings,
      ...newSettings,
      updated_at: new Date().toISOString(),
    };

    this.logActivity({
      actor_id: adminId,
      actor_role: 'admin',
      actor_name: admin?.username || 'Admin',
      action: 'SETTINGS_UPDATE',
      description: 'Pengaturan sistem berhasil diperbarui',
      metadata: newSettings,
    });

    this.saveDatabase();
    return { settings: this.data.settings };
  }

  public getRules(): SystemRules {
    return this.data.rules;
  }

  public updateRules(
    newRules: Partial<SystemRules>,
    adminId: string
  ): { rules: SystemRules; error?: string } {
    const admin = this.getUserById(adminId);
    this.data.rules = {
      ...this.data.rules,
      ...newRules,
      updated_at: new Date().toISOString(),
    };

    this.logActivity({
      actor_id: adminId,
      actor_role: 'admin',
      actor_name: admin?.username || 'Admin',
      action: 'RULES_UPDATE',
      description: 'Dokumen rules sistem berhasil diperbarui',
    });

    this.saveDatabase();
    return { rules: this.data.rules };
  }

  // --- GLOBAL STATS ---
  public getCalculatedAutoStats(): GlobalStatsValues {
    const users = this.data.users;
    const deposits = this.data.deposits;
    const withdrawals = this.data.withdrawals;

    const totalNominalSetoran = deposits
      .filter((d) => d.status === 'APPROVED')
      .reduce((acc, d) => acc + d.amount, 0);

    const totalNominalWd = withdrawals
      .filter((w) => w.status === 'APPROVED')
      .reduce((acc, w) => acc + w.gross_amount, 0);

    return {
      total_users: users.length,
      total_gmail: deposits.length,
      total_setoran: deposits.length,
      total_nominal_setoran: totalNominalSetoran,
      total_wd: withdrawals.length,
      total_nominal_wd: totalNominalWd,
      user_aktif: users.filter((u) => u.active).length,
      user_nonaktif: users.filter((u) => !u.active).length,
      gmail_acc: deposits.filter((d) => d.status === 'APPROVED').length,
      gmail_pending: deposits.filter((d) => d.status === 'PENDING').length,
      gmail_reject: deposits.filter((d) => d.status === 'REJECTED').length,
      wd_acc: withdrawals.filter((w) => w.status === 'APPROVED').length,
      wd_pending: withdrawals.filter((w) => w.status === 'PENDING').length,
      wd_reject: withdrawals.filter((w) => w.status === 'REJECTED').length,
    };
  }

  public getGlobalStatsConfig(): GlobalStatsConfig {
    return this.data.global_stats;
  }

  public getActiveGlobalStats(): GlobalStatsValues {
    if (this.data.global_stats.mode === 'manual') {
      return { ...this.data.global_stats.manual_stats };
    }
    return this.getCalculatedAutoStats();
  }

  public updateGlobalStats(
    newConfig: Partial<GlobalStatsConfig>,
    adminId: string
  ): { config: GlobalStatsConfig; error?: string } {
    const admin = this.getUserById(adminId);
    const before = JSON.parse(JSON.stringify(this.data.global_stats));

    this.data.global_stats = {
      ...this.data.global_stats,
      ...newConfig,
      manual_stats: {
        ...this.data.global_stats.manual_stats,
        ...(newConfig.manual_stats || {}),
      },
      visibility: {
        ...this.data.global_stats.visibility,
        ...(newConfig.visibility || {}),
      },
      updated_at: new Date().toISOString(),
    };

    const after = this.data.global_stats;

    this.logActivity({
      actor_id: adminId,
      actor_role: 'admin',
      actor_name: admin?.username || 'Admin YAO',
      action: 'STATISTICS_UPDATE',
      description: `Admin ${admin?.username || 'YAO'} memperbarui konfigurasi statistik global (${after.mode === 'manual' ? 'Mode Manual' : 'Mode Otomatis'}).`,
      metadata: {
        before,
        after,
      },
    });

    this.saveDatabase();
    return { config: this.data.global_stats };
  }

  public resetGlobalStatsToAuto(adminId: string): { config: GlobalStatsConfig } {
    const admin = this.getUserById(adminId);
    const autoValues = this.getCalculatedAutoStats();
    const before = JSON.parse(JSON.stringify(this.data.global_stats));

    this.data.global_stats = {
      ...this.data.global_stats,
      mode: 'auto',
      manual_stats: { ...autoValues },
      updated_at: new Date().toISOString(),
    };

    this.logActivity({
      actor_id: adminId,
      actor_role: 'admin',
      actor_name: admin?.username || 'Admin YAO',
      action: 'STATISTICS_UPDATE',
      description: `Admin ${admin?.username || 'YAO'} mereset statistik global ke Mode Otomatis.`,
      metadata: {
        before,
        after: this.data.global_stats,
      },
    });

    this.saveDatabase();
    return { config: this.data.global_stats };
  }

  // --- STATS ---
  public getUserDashboardData(userId: string) {
    const user = this.getUserById(userId);
    if (!user) return null;

    const userDeposits = this.data.deposits.filter((d) => d.user_id === userId);
    const approvedCount = userDeposits.filter((d) => d.status === 'APPROVED').length;
    const pendingCount = userDeposits.filter((d) => d.status === 'PENDING').length;
    const rejectedCount = userDeposits.filter((d) => d.status === 'REJECTED').length;
    const todayCount = this.getTodayDepositCount(userId);

    const userWds = this.data.withdrawals.filter((w) => w.user_id === userId);
    const pendingWds = userWds.filter((w) => w.status === 'PENDING').length;
    const approvedWds = userWds.filter((w) => w.status === 'APPROVED').length;
    const rejectedWds = userWds.filter((w) => w.status === 'REJECTED').length;
    const totalWithdrawn = userWds
      .filter((w) => w.status === 'APPROVED')
      .reduce((acc, curr) => acc + curr.net_amount, 0);

    const referralTx = this.data.balance_transactions.filter(
      (tx) => tx.user_id === userId && tx.type === 'REFERRAL_REWARD'
    );
    const totalReferralEarnings = referralTx.reduce((sum, tx) => sum + tx.amount, 0);
    const totalEarnings = user.total_deposited_approved + totalReferralEarnings;

    const globalStatsConfig = this.data.global_stats;
    const activeGlobalValues = this.getActiveGlobalStats();

    return {
      user,
      stats: {
        available_balance: user.available_balance,
        reserved_balance: user.reserved_balance,
        total_balance: user.available_balance + user.reserved_balance,
        gmail_rate: this.data.settings.gmail_rate,
        approved_gmail_count: approvedCount,
        pending_gmail_count: pendingCount,
        rejected_gmail_count: rejectedCount,
        today_submitted_count: todayCount,
        daily_limit: this.data.settings.daily_limit,
        total_withdrawn: totalWithdrawn,
        pending_withdrawals_count: pendingWds,
        approved_withdrawals_count: approvedWds,
        rejected_withdrawals_count: rejectedWds,
        total_earnings: totalEarnings,
      },
      settings: {
        site_name: this.data.settings.site_name,
        gmail_rate: this.data.settings.gmail_rate,
        minimum_withdrawal: this.data.settings.minimum_withdrawal,
        minimum_approved_gmail_for_withdrawal:
          this.data.settings.minimum_approved_gmail_for_withdrawal,
        withdrawal_fee_type: this.data.settings.withdrawal_fee_type,
        withdrawal_fee_current: this.data.settings.withdrawal_fee_current,
        deposit_status: this.data.settings.deposit_status,
        withdrawal_status: this.data.settings.withdrawal_status,
        room_status: this.data.settings.room_status,
        announcement: this.data.settings.announcement,
        security_warning: this.data.settings.security_warning,
      },
      global_stats: {
        enabled: globalStatsConfig.show_to_users,
        mode: globalStatsConfig.mode,
        visibility: globalStatsConfig.visibility,
        values: activeGlobalValues,
      },
      recent_deposits: userDeposits.slice(0, 8),
      recent_withdrawals: userWds.slice(0, 8),
    };
  }

  public getAdminDashboardData() {
    const totalUsers = this.data.users.length;
    const activeUsers = this.data.users.filter((u) => u.active).length;

    const pendingDeposits = this.data.deposits.filter((d) => d.status === 'PENDING').length;
    const approvedDeposits = this.data.deposits.filter((d) => d.status === 'APPROVED').length;
    const rejectedDeposits = this.data.deposits.filter((d) => d.status === 'REJECTED').length;

    const pendingWds = this.data.withdrawals.filter((w) => w.status === 'PENDING').length;
    const approvedWds = this.data.withdrawals.filter((w) => w.status === 'APPROVED').length;
    const rejectedWds = this.data.withdrawals.filter((w) => w.status === 'REJECTED').length;

    const totalAvailable = this.data.profiles.reduce((acc, p) => acc + p.available_balance, 0);
    const totalReserved = this.data.profiles.reduce((acc, p) => acc + p.reserved_balance, 0);

    const approvedWithdrawalsList = this.data.withdrawals.filter((w) => w.status === 'APPROVED');
    const totalWithdrawnAmount = approvedWithdrawalsList.reduce((acc, w) => acc + w.net_amount, 0);
    const totalFeesCollected = approvedWithdrawalsList.reduce((acc, w) => acc + w.fee_amount, 0);

    // Build last 7 days chart data
    const dates: string[] = [];
    const deposits_counts: number[] = [];
    const withdrawals_amounts: number[] = [];
    const new_users_counts: number[] = [];

    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      const displayDate = d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' });
      dates.push(displayDate);

      const depsOnDay = this.data.deposits.filter((dep) => dep.created_at.startsWith(dateStr)).length;
      deposits_counts.push(depsOnDay);

      const wdsOnDay = this.data.withdrawals
        .filter((w) => w.created_at.startsWith(dateStr) && w.status === 'APPROVED')
        .reduce((sum, w) => sum + w.net_amount, 0);
      withdrawals_amounts.push(wdsOnDay);

      const usersOnDay = this.data.users.filter((u) => u.created_at.startsWith(dateStr)).length;
      new_users_counts.push(usersOnDay);
    }

    return {
      stats: {
        total_users: totalUsers,
        active_users: activeUsers,
        pending_deposits_count: pendingDeposits,
        approved_deposits_count: approvedDeposits,
        rejected_deposits_count: rejectedDeposits,
        total_deposits_count: this.data.deposits.length,
        pending_withdrawals_count: pendingWds,
        approved_withdrawals_count: approvedWds,
        rejected_withdrawals_count: rejectedWds,
        total_user_available_balance: totalAvailable,
        total_user_reserved_balance: totalReserved,
        total_withdrawn_amount: totalWithdrawnAmount,
        total_fees_collected: totalFeesCollected,
        gmail_rate: this.data.settings.gmail_rate,
        minimum_withdrawal: this.data.settings.minimum_withdrawal,
        minimum_approved_gmail: this.data.settings.minimum_approved_gmail_for_withdrawal,
        withdrawal_fee_type: this.data.settings.withdrawal_fee_type,
        withdrawal_fee_current: this.data.settings.withdrawal_fee_current,
        room_status: this.data.settings.room_status,
      },
      global_stats_config: this.data.global_stats,
      global_stats_active: this.getActiveGlobalStats(),
      charts: {
        dates,
        deposits_counts,
        withdrawals_amounts,
        new_users_counts,
      },
      recent_deposits: this.getDeposits().slice(0, 10),
      recent_withdrawals: this.getWithdrawals().slice(0, 10),
      recent_logs: this.getLogs(15),
    };
  }

  public getReferralData(userId: string) {
    const user = this.getUserById(userId);
    if (!user) return null;

    const referredProfiles = this.data.profiles.filter((p) => p.referrer_id === userId);
    const referredUsers = referredProfiles.map((p) => {
      const u = this.data.users.find((user) => user.id === p.user_id);
      const userDeps = this.data.deposits.filter((d) => d.user_id === p.user_id && d.status === 'APPROVED');
      return {
        user_id: p.user_id,
        username: p.username,
        email: u?.email || '',
        joined_at: u?.created_at || '',
        approved_deposits_count: userDeps.length,
      };
    });

    const referralTx = this.data.balance_transactions.filter(
      (tx) => tx.user_id === userId && tx.type === 'REFERRAL_REWARD'
    );
    const totalEarnings = referralTx.reduce((sum, tx) => sum + tx.amount, 0);

    return {
      referral_code: user.referral_code,
      total_referred_users: referredProfiles.length,
      total_referral_earnings: totalEarnings,
      reward_per_transaction: this.data.settings.referral_reward,
      referral_status: this.data.settings.referral_status,
      referred_users: referredUsers,
      transactions: referralTx,
    };
  }

  public getAdminReferralData() {
    const allReferredProfiles = this.data.profiles.filter((p) => p.referrer_id !== null);
    
    // Group by referrer
    const referrerMap = new Map<string, {
      referrer_id: string;
      referrer_username: string;
      referrer_email: string;
      referral_code: string;
      total_referred: number;
      total_commission: number;
      referred_users: Array<{
        user_id: string;
        username: string;
        email: string;
        joined_at: string;
      }>;
    }>();

    for (const p of allReferredProfiles) {
      if (!p.referrer_id) continue;
      const referrerUser = this.getUserById(p.referrer_id);
      if (!referrerUser) continue;

      if (!referrerMap.has(p.referrer_id)) {
        const commTx = this.data.balance_transactions.filter(
          (t) => t.user_id === p.referrer_id && t.type === 'REFERRAL_REWARD'
        );
        const commSum = commTx.reduce((acc, t) => acc + t.amount, 0);

        referrerMap.set(p.referrer_id, {
          referrer_id: p.referrer_id,
          referrer_username: referrerUser.username,
          referrer_email: referrerUser.email,
          referral_code: referrerUser.referral_code,
          total_referred: 0,
          total_commission: commSum,
          referred_users: [],
        });
      }

      const entry = referrerMap.get(p.referrer_id)!;
      entry.total_referred++;
      const refereeUser = this.data.users.find((u) => u.id === p.user_id);
      entry.referred_users.push({
        user_id: p.user_id,
        username: p.username,
        email: refereeUser?.email || '',
        joined_at: refereeUser?.created_at || '',
      });
    }

    const allReferralTx = this.data.balance_transactions.filter(
      (tx) => tx.type === 'REFERRAL_REWARD'
    );
    const totalCommissionsPaid = allReferralTx.reduce((sum, tx) => sum + tx.amount, 0);

    return {
      stats: {
        total_referrals: allReferredProfiles.length,
        total_referrers: referrerMap.size,
        total_commissions_paid: totalCommissionsPaid,
        reward_per_referral: this.data.settings.referral_reward,
        referral_status: this.data.settings.referral_status,
      },
      referrers: Array.from(referrerMap.values()).sort((a, b) => b.total_referred - a.total_referred),
      recent_rewards: allReferralTx.slice(0, 20),
    };
  }
}

export const db = new Database();
