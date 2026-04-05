import { create } from 'zustand';
import { AppState, VirtualAccount, Transaction, ScheduledAllocation, Settings } from '../types';
import { 
  loadFromLocalStorage, 
  saveToLocalStorage,
  saveToFileSystem,
  loadFromFileSystem,
  syncToFileSystem,
  exportData,
  importData,
  createExportData,
  hasFileSystemAccess,
} from '../utils/storage';
import { shouldRunAllocationOnDate } from '../utils/allocations';
import { formatCurrency } from '../utils/currency';

const generateId = (): string => crypto.randomUUID();

const defaultSettings: Settings = {
  isSetupComplete: false,
  bankName: '',
  lastSyncAt: null,
  lastAllocationCheckAt: null,
};

export const useStore = create<AppState>((set, get) => ({
  accounts: [],
  transactions: [],
  allocations: [],
  settings: defaultSettings,

  addAccount: (accountData) => {
    const account: VirtualAccount = {
      ...accountData,
      id: generateId(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    set((state) => {
      const newAccounts = [...state.accounts, account];
      saveToLocalStorage('ACCOUNTS', newAccounts);
      // Sync to file system if available
      if (hasFileSystemAccess()) {
        saveToFileSystem('vam_accounts.json', newAccounts).catch(err => 
          console.warn('File system sync failed:', err)
        );
      }
      return { accounts: newAccounts };
    });
  },

  updateAccount: (id, updates) => {
    set((state) => {
      const newAccounts = state.accounts.map((acc) =>
        acc.id === id ? { ...acc, ...updates, updatedAt: new Date().toISOString() } : acc
      );
      saveToLocalStorage('ACCOUNTS', newAccounts);
      if (hasFileSystemAccess()) {
        saveToFileSystem('vam_accounts.json', newAccounts).catch(err => 
          console.warn('File system sync failed:', err)
        );
      }
      return { accounts: newAccounts };
    });
  },

  deleteAccount: (id) => {
    set((state) => {
      const newAccounts = state.accounts.filter((acc) => acc.id !== id);
      const newTransactions = state.transactions.filter((t) => t.virtualAccountId !== id);
      const newAllocations = state.allocations.filter(
        (a) => a.sourceAccountId !== id && a.targetAccountId !== id
      );
      saveToLocalStorage('ACCOUNTS', newAccounts);
      saveToLocalStorage('TRANSACTIONS', newTransactions);
      saveToLocalStorage('ALLOCATIONS', newAllocations);
      
      if (hasFileSystemAccess()) {
        Promise.all([
          saveToFileSystem('vam_accounts.json', newAccounts),
          saveToFileSystem('vam_transactions.json', newTransactions),
          saveToFileSystem('vam_allocations.json', newAllocations),
        ]).catch(err => console.warn('File system sync failed:', err));
      }
      
      return { accounts: newAccounts, transactions: newTransactions, allocations: newAllocations };
    });
  },

  addTransaction: (transactionData) => {
    const transaction: Transaction = {
      ...transactionData,
      id: generateId(),
      createdAt: new Date().toISOString(),
    };
    set((state) => {
      const newTransactions = [transaction, ...state.transactions];
      
      // Update account balance
      const newAccounts = state.accounts.map((acc) =>
        acc.id === transaction.virtualAccountId
          ? { ...acc, balance: acc.balance + transaction.amount, updatedAt: new Date().toISOString() }
          : acc
      );
      
      saveToLocalStorage('TRANSACTIONS', newTransactions);
      saveToLocalStorage('ACCOUNTS', newAccounts);
      
      if (hasFileSystemAccess()) {
        Promise.all([
          saveToFileSystem('vam_transactions.json', newTransactions),
          saveToFileSystem('vam_accounts.json', newAccounts),
        ]).catch(err => console.warn('File system sync failed:', err));
      }
      
      return { transactions: newTransactions, accounts: newAccounts };
    });
  },

  deleteTransaction: (id) => {
    set((state) => {
      const transactionToDelete = state.transactions.find(t => t.id === id);
      if (!transactionToDelete) return state;

      // For scheduled transfers, we need to find and delete the paired transaction
      let transactionsToDelete = [id];
      if (transactionToDelete.type === 'SCHEDULED' && transactionToDelete.relatedAllocationId) {
        // Find the paired transaction (same allocation, same occurred date, opposite amount)
        const pairedTransaction = state.transactions.find(t => 
          t.id !== id &&
          t.type === 'SCHEDULED' &&
          t.relatedAllocationId === transactionToDelete.relatedAllocationId &&
          t.occurredAt === transactionToDelete.occurredAt &&
          Math.abs(t.amount) === Math.abs(transactionToDelete.amount)
        );
        if (pairedTransaction) {
          transactionsToDelete.push(pairedTransaction.id);
        }
      }

      const newTransactions = state.transactions.filter((t) => !transactionsToDelete.includes(t.id));
      
      // Reverse the balance changes for all deleted transactions
      let newAccounts = [...state.accounts];
      transactionsToDelete.forEach(txId => {
        const tx = state.transactions.find(t => t.id === txId);
        if (tx?.virtualAccountId) {
          newAccounts = newAccounts.map((acc) =>
            acc.id === tx.virtualAccountId
              ? { ...acc, balance: acc.balance - tx.amount, updatedAt: new Date().toISOString() }
              : acc
          );
        }
      });
      
      saveToLocalStorage('TRANSACTIONS', newTransactions);
      saveToLocalStorage('ACCOUNTS', newAccounts);
      
      if (hasFileSystemAccess()) {
        Promise.all([
          saveToFileSystem('vam_transactions.json', newTransactions),
          saveToFileSystem('vam_accounts.json', newAccounts),
        ]).catch(err => console.warn('File system sync failed:', err));
      }
      
      return { transactions: newTransactions, accounts: newAccounts };
    });
  },

  addAllocation: (allocationData) => {
    const allocation: ScheduledAllocation = {
      ...allocationData,
      id: generateId(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      lastExecutedAt: null,
    };
    set((state) => {
      const newAllocations = [...state.allocations, allocation];
      
      // Log allocation creation activity
      const sourceAccount = state.accounts.find(a => a.id === allocation.sourceAccountId);
      const targetAccount = state.accounts.find(a => a.id === allocation.targetAccountId);
      const memoSuffix = allocation.memo ? ` - ${allocation.memo}` : '';
      const creationActivity: Transaction = {
        id: generateId(),
        amount: allocation.amount,
        type: 'ALLOCATION_CREATED',
        description: `Created recurring transfer: ${formatCurrency(allocation.amount)} from ${sourceAccount?.name || 'account'} to ${targetAccount?.name || 'account'}${memoSuffix}`,
        occurredAt: new Date().toISOString(),
        createdAt: new Date().toISOString(),
        relatedAllocationId: allocation.id,
      };
      const newTransactions = [creationActivity, ...state.transactions];
      
      saveToLocalStorage('ALLOCATIONS', newAllocations);
      saveToLocalStorage('TRANSACTIONS', newTransactions);
      if (hasFileSystemAccess()) {
        Promise.all([
          saveToFileSystem('vam_allocations.json', newAllocations),
          saveToFileSystem('vam_transactions.json', newTransactions),
        ]).catch(err => console.warn('File system sync failed:', err));
      }
      return { allocations: newAllocations, transactions: newTransactions };
    });
  },

  updateAllocation: (id, updates) => {
    set((state) => {
      const newAllocations = state.allocations.map((alloc) =>
        alloc.id === id ? { ...alloc, ...updates, updatedAt: new Date().toISOString() } : alloc
      );
      saveToLocalStorage('ALLOCATIONS', newAllocations);
      if (hasFileSystemAccess()) {
        saveToFileSystem('vam_allocations.json', newAllocations).catch(err => 
          console.warn('File system sync failed:', err)
        );
      }
      return { allocations: newAllocations };
    });
  },

  deleteAllocation: (id) => {
    set((state) => {
      const allocationToDelete = state.allocations.find(a => a.id === id);
      const newAllocations = state.allocations.filter((a) => a.id !== id);
      
      // Log allocation deletion activity
      let newTransactions = state.transactions;
      if (allocationToDelete) {
        const sourceAccount = state.accounts.find(a => a.id === allocationToDelete.sourceAccountId);
        const targetAccount = state.accounts.find(a => a.id === allocationToDelete.targetAccountId);
        const memoSuffix = allocationToDelete.memo ? ` - ${allocationToDelete.memo}` : '';
        const deletionActivity: Transaction = {
          id: generateId(),
          amount: allocationToDelete.amount,
          type: 'ALLOCATION_DELETED',
          description: `Deleted recurring transfer: ${formatCurrency(allocationToDelete.amount)} from ${sourceAccount?.name || 'account'} to ${targetAccount?.name || 'account'}${memoSuffix}`,
          occurredAt: new Date().toISOString(),
          createdAt: new Date().toISOString(),
          relatedAllocationId: id,
        };
        newTransactions = [deletionActivity, ...state.transactions];
        saveToLocalStorage('TRANSACTIONS', newTransactions);
      }
      
      saveToLocalStorage('ALLOCATIONS', newAllocations);
      if (hasFileSystemAccess()) {
        Promise.all([
          saveToFileSystem('vam_allocations.json', newAllocations),
          saveToFileSystem('vam_transactions.json', newTransactions),
        ]).catch(err => console.warn('File system sync failed:', err));
      }
      return { allocations: newAllocations, transactions: newTransactions };
    });
  },

  executeAllocationsByDateRange: (fromDate, toDate) => {
    const state = get();
    const allocationsToExecute: { allocation: ScheduledAllocation; date: Date }[] = [];

    // Find all allocations that should run in the date range
    state.allocations.forEach((allocation) => {
      let current = new Date(fromDate);
      while (current <= toDate) {
        if (shouldRunAllocationOnDate(allocation, current)) {
          allocationsToExecute.push({ allocation, date: new Date(current) });
        }
        current.setDate(current.getDate() + 1);
      }
    });

    // Execute allocations and batch updates
    if (allocationsToExecute.length > 0) {
      set((currentState) => {
        let newTransactions = [...currentState.transactions];
        let newAccounts = [...currentState.accounts];
        let newAllocations = [...currentState.allocations];
        const executionActivities: Transaction[] = [];

        allocationsToExecute.forEach(({ allocation, date }) => {
          const memoSuffix = allocation.memo ? ` - ${allocation.memo}` : '';
          
          const debitTransaction: Transaction = {
            id: generateId(),
            virtualAccountId: allocation.sourceAccountId,
            amount: -allocation.amount,
            type: 'SCHEDULED',
            description: `Scheduled transfer to ${currentState.accounts.find(a => a.id === allocation.targetAccountId)?.name || 'account'}${memoSuffix}`,
            occurredAt: date.toISOString(),
            createdAt: new Date().toISOString(),
            relatedAllocationId: allocation.id,
          };

          const creditTransaction: Transaction = {
            id: generateId(),
            virtualAccountId: allocation.targetAccountId,
            amount: allocation.amount,
            type: 'SCHEDULED',
            description: `Scheduled transfer from ${currentState.accounts.find(a => a.id === allocation.sourceAccountId)?.name || 'account'}${memoSuffix}`,
            occurredAt: date.toISOString(),
            createdAt: new Date().toISOString(),
            relatedAllocationId: allocation.id,
          };

          newTransactions = [debitTransaction, creditTransaction, ...newTransactions];

          // Log execution activity
          const executionActivity: Transaction = {
            id: generateId(),
            amount: allocation.amount,
            type: 'ALLOCATION_EXECUTED',
            description: `Executed recurring transfer: ${formatCurrency(allocation.amount)} from ${currentState.accounts.find(a => a.id === allocation.sourceAccountId)?.name || 'account'} to ${currentState.accounts.find(a => a.id === allocation.targetAccountId)?.name || 'account'}${memoSuffix}`,
            occurredAt: date.toISOString(),
            createdAt: new Date().toISOString(),
            relatedAllocationId: allocation.id,
          };
          executionActivities.push(executionActivity);

          newAccounts = newAccounts.map((acc) => {
            if (acc.id === allocation.sourceAccountId) {
              return { ...acc, balance: acc.balance - allocation.amount, updatedAt: new Date().toISOString() };
            }
            if (acc.id === allocation.targetAccountId) {
              return { ...acc, balance: acc.balance + allocation.amount, updatedAt: new Date().toISOString() };
            }
            return acc;
          });
        });

        // Add execution activities to transaction list
        newTransactions = [...executionActivities, ...newTransactions];

        // Update allocations with new lastExecutedAt
        newAllocations = newAllocations.map((a) => {
          const lastExecution = allocationsToExecute
            .filter(e => e.allocation.id === a.id)
            .map(e => e.date)
            .sort((d1, d2) => d2.getTime() - d1.getTime())[0];
          
          return lastExecution 
            ? { ...a, lastExecutedAt: lastExecution.toISOString() }
            : a;
        });

        saveToLocalStorage('TRANSACTIONS', newTransactions);
        saveToLocalStorage('ACCOUNTS', newAccounts);
        saveToLocalStorage('ALLOCATIONS', newAllocations);

        if (hasFileSystemAccess()) {
          Promise.all([
            saveToFileSystem('vam_transactions.json', newTransactions),
            saveToFileSystem('vam_accounts.json', newAccounts),
            saveToFileSystem('vam_allocations.json', newAllocations),
          ]).catch(err => console.warn('File system sync failed:', err));
        }

        return { transactions: newTransactions, accounts: newAccounts, allocations: newAllocations };
      });
    }
  },

  executeAllocations: () => {
    // Execute any pending allocations since last check
    const state = get();
    const now = new Date();
    const lastCheck = state.settings.lastAllocationCheckAt 
      ? new Date(state.settings.lastAllocationCheckAt)
      : new Date(now.getTime() - 24 * 60 * 60 * 1000); // Default to yesterday

    get().executeAllocationsByDateRange(lastCheck, now);

    // Update last check time
    set((state) => {
      const newSettings = { ...state.settings, lastAllocationCheckAt: new Date().toISOString() };
      saveToLocalStorage('SETTINGS', newSettings);
      if (hasFileSystemAccess()) {
        saveToFileSystem('vam_settings.json', newSettings).catch(err => 
          console.warn('File system sync failed:', err)
        );
      }
      return { settings: newSettings };
    });
  },

  updateSettings: (updates) => {
    set((state) => {
      const newSettings = { ...state.settings, ...updates };
      saveToLocalStorage('SETTINGS', newSettings);
      if (hasFileSystemAccess()) {
        saveToFileSystem('vam_settings.json', newSettings).catch(err => 
          console.warn('File system sync failed:', err)
        );
      }
      return { settings: newSettings };
    });
  },

  completeSetup: () => {
    set((state) => {
      const newSettings = { ...state.settings, isSetupComplete: true };
      saveToLocalStorage('SETTINGS', newSettings);
      if (hasFileSystemAccess()) {
        saveToFileSystem('vam_settings.json', newSettings).catch(err => 
          console.warn('File system sync failed:', err)
        );
      }
      return { settings: newSettings };
    });
  },

  transferFunds: (fromAccountId, toAccountId, amount, description, memo) => {
    const state = get();
    const fromAccount = state.accounts.find(a => a.id === fromAccountId);
    const toAccount = state.accounts.find(a => a.id === toAccountId);

    const baseDescription = memo ? `${description} - ${memo}` : description;

    const debitTransaction: Transaction = {
      id: generateId(),
      virtualAccountId: fromAccountId,
      amount: -amount,
      type: 'TRANSFER',
      description: `Transfer to ${toAccount?.name || 'account'}: ${baseDescription}`,
      occurredAt: new Date().toISOString(),
      createdAt: new Date().toISOString(),
    };

    const creditTransaction: Transaction = {
      id: generateId(),
      virtualAccountId: toAccountId,
      amount: amount,
      type: 'TRANSFER',
      description: `Transfer from ${fromAccount?.name || 'account'}: ${baseDescription}`,
      occurredAt: new Date().toISOString(),
      createdAt: new Date().toISOString(),
    };

    set((currentState) => {
      const newTransactions = [debitTransaction, creditTransaction, ...currentState.transactions];
      
      const newAccounts = currentState.accounts.map((acc) => {
        if (acc.id === fromAccountId) {
          return { ...acc, balance: acc.balance - amount, updatedAt: new Date().toISOString() };
        }
        if (acc.id === toAccountId) {
          return { ...acc, balance: acc.balance + amount, updatedAt: new Date().toISOString() };
        }
        return acc;
      });

      saveToLocalStorage('TRANSACTIONS', newTransactions);
      saveToLocalStorage('ACCOUNTS', newAccounts);

      if (hasFileSystemAccess()) {
        Promise.all([
          saveToFileSystem('vam_transactions.json', newTransactions),
          saveToFileSystem('vam_accounts.json', newAccounts),
        ]).catch(err => console.warn('File system sync failed:', err));
      }

      return { transactions: newTransactions, accounts: newAccounts };
    });
  },

  loadFromStorage: () => {
    const accounts = loadFromLocalStorage<VirtualAccount[]>('ACCOUNTS', []);
    const transactions = loadFromLocalStorage<Transaction[]>('TRANSACTIONS', []);
    const allocations = loadFromLocalStorage<ScheduledAllocation[]>('ALLOCATIONS', []);
    const settings = loadFromLocalStorage<Settings>('SETTINGS', defaultSettings);
    set({ accounts, transactions, allocations, settings });
  },

  saveToStorage: () => {
    const state = get();
    saveToLocalStorage('ACCOUNTS', state.accounts);
    saveToLocalStorage('TRANSACTIONS', state.transactions);
    saveToLocalStorage('ALLOCATIONS', state.allocations);
    saveToLocalStorage('SETTINGS', state.settings);
  },

  exportData: async () => {
    const state = get();
    const data = createExportData(
      state.accounts,
      state.transactions,
      state.allocations,
      state.settings
    );
    exportData(data);
  },

  importData: async () => {
    try {
      const data = await importData();
      set({
        accounts: data.accounts,
        transactions: data.transactions,
        allocations: data.allocations,
        settings: data.settings,
      });
      
      // Save to localStorage
      saveToLocalStorage('ACCOUNTS', data.accounts);
      saveToLocalStorage('TRANSACTIONS', data.transactions);
      saveToLocalStorage('ALLOCATIONS', data.allocations);
      saveToLocalStorage('SETTINGS', data.settings);
      
      // Sync to file system if available
      if (hasFileSystemAccess()) {
        await Promise.all([
          saveToFileSystem('vam_accounts.json', data.accounts),
          saveToFileSystem('vam_transactions.json', data.transactions),
          saveToFileSystem('vam_allocations.json', data.allocations),
          saveToFileSystem('vam_settings.json', data.settings),
        ]);
      }
      
      return true;
    } catch (error) {
      console.error('Error importing data:', error);
      return false;
    }
  },

  getTotalBalance: () => {
    return get().accounts.reduce((sum, acc) => sum + acc.balance, 0);
  },

  getAccountById: (id) => {
    return get().accounts.find(acc => acc.id === id);
  },
}));
