export type Role = 'user' | 'admin';

export interface User {
  id: string;
  email: string;
  role: Role;
  active: boolean;
  created_at: string;
  last_login_at: string | null;
}

export interface Profile {
  user_id: string;
  username: string;
  referral_code: string;
  referrer_id: string | null;
  payment_method_default?: string | null;
  payment_account_default?: string | null;
  available_balance: number;
  reserved_balance: number;
  total_deposited_approved: number;
  total_withdrawn_approved: number;
}

export interface UserWithProfile extends User, Profile {}

export type DepositStatus = 'PENDING' | 'APPROVED' | 'REJECTED';

export interface Deposit {
  id: string;
  user_id: string;
  username?: string;
  user_email?: string;
  gmail: string;
  amount: number;
  status: DepositStatus;
  reject_reason: string | null;
  created_at: string;
  reviewed_at: string | null;
  reviewed_by: string | null;
}

export type WithdrawalStatus = 'PENDING' | 'APPROVED' | 'REJECTED';

export interface Withdrawal {
  id: string;
  user_id: string;
  username?: string;
  user_email?: string;
  gross_amount: number;
  fee_type: 'percentage' | 'fixed';
  fee_rate: number;
  fee_amount: number;
  net_amount: number;
  payment_method: string;
  payment_account: string;
  status: WithdrawalStatus;
  reject_reason: string | null;
  created_at: string;
  processed_at: string | null;
  processed_by: string | null;
}

export type TransactionType =
  | 'DEPOSIT_CREDIT'
  | 'WITHDRAWAL_RESERVE'
  | 'WITHDRAWAL_REFUND'
  | 'WITHDRAWAL_SETTLE'
  | 'ADMIN_ADJUSTMENT'
  | 'REFERRAL_REWARD';

export interface BalanceTransaction {
  id: string;
  user_id: string;
  type: TransactionType;
  amount: number;
  balance_after: number;
  reference_id: string | null;
  description: string;
  created_at: string;
}

export interface SystemSettings {
  site_name: string;
  gmail_rate: number;
  daily_limit: number;
  minimum_withdrawal: number;
  minimum_approved_gmail_for_withdrawal: number;
  withdrawal_fee_type: 'percentage' | 'fixed';
  withdrawal_fee_min: number;
  withdrawal_fee_max: number;
  withdrawal_fee_current: number;
  deposit_status: 'OPEN' | 'CLOSED';
  withdrawal_status: 'OPEN' | 'CLOSED';
  referral_status: 'OPEN' | 'CLOSED';
  referral_reward: number;
  room_status: 'OPEN' | 'MAINTENANCE' | 'CLOSED';
  announcement: string;
  security_warning: string;
  updated_at?: string;
}

export interface SystemRules {
  deposit_rules: string;
  withdrawal_rules: string;
  referral_rules: string;
  security_rules: string;
  updated_at?: string;
}

export interface ActivityLog {
  id: string;
  actor_id: string;
  actor_role: 'user' | 'admin' | 'system';
  actor_name: string;
  action: string;
  description: string;
  metadata?: Record<string, any>;
  created_at: string;
}

export interface GlobalStatsValues {
  total_users: number;
  total_gmail: number;
  total_setoran: number;
  total_nominal_setoran: number;
  total_wd: number;
  total_nominal_wd: number;
  user_aktif: number;
  user_nonaktif: number;
  gmail_acc: number;
  gmail_pending: number;
  gmail_reject: number;
  wd_acc: number;
  wd_pending: number;
  wd_reject: number;
}

export interface GlobalStatsVisibility {
  total_users: boolean;
  total_gmail: boolean;
  total_setoran: boolean;
  total_nominal_setoran: boolean;
  total_wd: boolean;
  total_nominal_wd: boolean;
  user_aktif: boolean;
  user_nonaktif: boolean;
  gmail_acc: boolean;
  gmail_pending: boolean;
  gmail_reject: boolean;
  wd_acc: boolean;
  wd_pending: boolean;
  wd_reject: boolean;
}

export interface GlobalStatsConfig {
  mode: 'auto' | 'manual';
  show_to_users: boolean;
  manual_stats: GlobalStatsValues;
  visibility: GlobalStatsVisibility;
  updated_at?: string;
}

export interface UserDashboardData {
  user: UserWithProfile;
  stats: {
    available_balance: number;
    reserved_balance: number;
    total_balance: number;
    gmail_rate: number;
    approved_gmail_count: number;
    pending_gmail_count: number;
    rejected_gmail_count: number;
    today_submitted_count: number;
    daily_limit: number;
    total_withdrawn: number;
    pending_withdrawals_count: number;
    approved_withdrawals_count?: number;
    rejected_withdrawals_count?: number;
    total_earnings?: number;
  };
  settings: {
    site_name: string;
    gmail_rate: number;
    minimum_withdrawal: number;
    minimum_approved_gmail_for_withdrawal: number;
    withdrawal_fee_type: 'percentage' | 'fixed';
    withdrawal_fee_current: number;
    deposit_status: 'OPEN' | 'CLOSED';
    withdrawal_status: 'OPEN' | 'CLOSED';
    room_status: 'OPEN' | 'MAINTENANCE' | 'CLOSED';
    announcement: string;
    security_warning: string;
  };
  global_stats?: {
    enabled: boolean;
    mode: 'auto' | 'manual';
    visibility: GlobalStatsVisibility;
    values: GlobalStatsValues;
  } | null;
  recent_deposits: Deposit[];
  recent_withdrawals: Withdrawal[];
}

export interface AdminDashboardData {
  stats: {
    total_users: number;
    active_users: number;
    pending_deposits_count: number;
    approved_deposits_count: number;
    rejected_deposits_count: number;
    total_deposits_count: number;
    pending_withdrawals_count: number;
    approved_withdrawals_count: number;
    rejected_withdrawals_count: number;
    total_user_available_balance: number;
    total_user_reserved_balance: number;
    total_withdrawn_amount: number;
    total_fees_collected: number;
    gmail_rate: number;
    minimum_withdrawal: number;
    minimum_approved_gmail: number;
    withdrawal_fee_type: 'percentage' | 'fixed';
    withdrawal_fee_current: number;
    room_status: 'OPEN' | 'MAINTENANCE' | 'CLOSED';
  };
  global_stats_config?: GlobalStatsConfig;
  global_stats_active?: GlobalStatsValues;
  charts: {
    dates: string[];
    deposits_counts: number[];
    withdrawals_amounts: number[];
    new_users_counts: number[];
  };
  recent_deposits: Deposit[];
  recent_withdrawals: Withdrawal[];
  recent_logs: ActivityLog[];
}
