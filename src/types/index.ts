export interface VirtualAccount {
  id: string;
  name: string;
  balance: number; // Stored in cents
  purpose: string;
  color: string;
  createdAt: string;
  updatedAt: string;
}

export interface Transaction {
  id: string;
  virtualAccountId?: string; // Optional for allocation activities
  amount: number; // Positive = credit, Negative = debit (in cents)
  type: 'MANUAL' | 'SCHEDULED' | 'BANK_SYNC' | 'TRANSFER' | 'ALLOCATION_CREATED' | 'ALLOCATION_EXECUTED' | 'ALLOCATION_PAUSED' | 'ALLOCATION_DELETED';
  description: string;
  occurredAt: string;
  createdAt: string;
  relatedAllocationId?: string; // Link to allocation for activity tracking
}

export type AllocationFrequency = 
  | 'DAILY'
  | 'WEEKLY'
  | 'BIWEEKLY'
  | 'MONTHLY_DATE'
  | 'MONTHLY_FIRST_WEEKDAY'
  | 'MONTHLY_SECOND_WEEKDAY'
  | 'MONTHLY_THIRD_WEEKDAY'
  | 'MONTHLY_FOURTH_WEEKDAY'
  | 'MONTHLY_LAST_WEEKDAY';

export interface ScheduledAllocation {
  id: string;
  sourceAccountId: string;
  targetAccountId: string;
  amount: number; // In cents
  type: 'SINGLE' | 'RECURRING';
  frequency: AllocationFrequency;
  dayOfWeek?: number; // 0-6 (Sunday-Saturday) for WEEKLY, BIWEEKLY, MONTHLY_*_WEEKDAY
  dayOfMonth?: number; // 1-31 for MONTHLY_DATE
  startDate: string; // ISO string
  endDate: string | null; // ISO string or null for indefinite
  isActive: boolean;
  lastExecutedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Settings {
  isSetupComplete: boolean;
  bankName: string;
  lastSyncAt: string | null;
  lastAllocationCheckAt: string | null;
}

export interface AppState {
  accounts: VirtualAccount[];
  transactions: Transaction[];
  allocations: ScheduledAllocation[];
  settings: Settings;

  // Actions
  addAccount: (account: Omit<VirtualAccount, 'id' | 'createdAt' | 'updatedAt'>) => void;
  updateAccount: (id: string, updates: Partial<VirtualAccount>) => void;
  deleteAccount: (id: string) => void;

  addTransaction: (transaction: Omit<Transaction, 'id' | 'createdAt'>) => void;

  addAllocation: (allocation: Omit<ScheduledAllocation, 'id' | 'createdAt' | 'updatedAt'>) => void;
  updateAllocation: (id: string, updates: Partial<ScheduledAllocation>) => void;
  deleteAllocation: (id: string) => void;
  executeAllocationsByDateRange: (fromDate: Date, toDate: Date) => void;
  executeAllocations: () => void;

  updateSettings: (settings: Partial<Settings>) => void;
  completeSetup: () => void;

  transferFunds: (fromAccountId: string, toAccountId: string, amount: number, description: string) => void;

  loadFromStorage: () => void;
  saveToStorage: () => void;
  
  exportData: () => Promise<void>;
  importData: () => Promise<boolean>;
  
  getTotalBalance: () => number;
  getAccountById: (id: string) => VirtualAccount | undefined;
}
