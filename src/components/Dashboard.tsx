import React, { useState, useEffect } from 'react';
import { useStore } from '../store/useStore';
import { VirtualAccount } from '../types';
import { formatCurrency } from '../utils/currency';
import { AccountCard } from './AccountCard';
import { TransactionModal } from './TransactionModal';
import { TransferSetupModal } from './TransferSetupModal';
import { ReconciliationWarning } from './ReconciliationWarning';
import { EditAccountModal } from './EditAccountModal';
import { AddAccountModal } from './AddAccountModal';
import { SyncSettings } from './SyncSettings';
import { ActivityHub } from './ActivityHub';
import { DarkModeToggle } from './DarkModeToggle';
import {
  Wallet,
  ArrowLeftRight,
  Plus,
  CheckCircle,
  AlertCircle,
  Settings,
  X,
} from 'lucide-react';

export const Dashboard: React.FC = () => {
  const {
    accounts,
    transactions,
    settings,
    allocations,
    getTotalBalance,
    addTransaction,
    transferFunds,
    updateAccount,
    deleteAccount,
    executeAllocations,
    addAllocation,
    deleteAllocation,
    deleteTransaction,
    updateSettings,
  } = useStore();

  const [selectedAccount, setSelectedAccount] = useState<VirtualAccount | null>(null);
  const [transactionType, setTransactionType] = useState<'add' | 'deduct'>('add');
  const [showTransactionModal, setShowTransactionModal] = useState(false);
  const [showTransferSetupModal, setShowTransferSetupModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showAddAccountModal, setShowAddAccountModal] = useState(false);
  const [showReconciliationWarning, setShowReconciliationWarning] = useState(false);
  const [showSyncSettings, setShowSyncSettings] = useState(false);
  const [accountToDelete, setAccountToDelete] = useState<VirtualAccount | null>(null);
  const [showBankNameModal, setShowBankNameModal] = useState(false);
  const [editedBankName, setEditedBankName] = useState('');

  const totalBalance = getTotalBalance();

  // Check for pending allocations on load
  useEffect(() => {
    executeAllocations();
  }, [executeAllocations]);

  // Show reconciliation warning if there are accounts with stale data
  useEffect(() => {
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    
    const hasStaleAccounts = accounts.some(acc => {
      const updated = new Date(acc.updatedAt);
      return updated < oneWeekAgo;
    });

    if (hasStaleAccounts && accounts.length > 0) {
      setShowReconciliationWarning(true);
    }
  }, [accounts]);

  const handleAddFunds = (account: VirtualAccount) => {
    setSelectedAccount(account);
    setTransactionType('add');
    setShowTransactionModal(true);
  };

  const handleWithdraw = (account: VirtualAccount) => {
    setSelectedAccount(account);
    setTransactionType('deduct');
    setShowTransactionModal(true);
  };

  const handleEdit = (account: VirtualAccount) => {
    setSelectedAccount(account);
    setShowEditModal(true);
  };

  const handleDeleteClick = (account: VirtualAccount) => {
    setAccountToDelete(account);
  };

  const confirmDelete = () => {
    if (accountToDelete) {
      deleteAccount(accountToDelete.id);
      setAccountToDelete(null);
    }
  };

  const handleTransactionSubmit = (accountId: string, amount: number, description: string) => {
    addTransaction({
      virtualAccountId: accountId,
      amount,
      type: 'MANUAL',
      description,
      occurredAt: new Date().toISOString(),
    });
  };

  const handleEditSubmit = (id: string, updates: Partial<VirtualAccount>) => {
    updateAccount(id, updates);
  };

  const handleTransferSetupSubmit = (allocation: any) => {
    // Handle one-time transfers immediately
    if (allocation.type === 'SINGLE') {
      transferFunds(
        allocation.sourceAccountId,
        allocation.targetAccountId,
        allocation.amount,
        'One-time transfer',
        allocation.memo
      );
    } else {
      addAllocation({
        ...allocation,
        isActive: true,
      });
    }
  };

  const handleBankNameClick = () => {
    setEditedBankName(settings.bankName || 'Bank');
    setShowBankNameModal(true);
  };

  const handleBankNameSave = () => {
    updateSettings({ bankName: editedBankName });
    setShowBankNameModal(false);
  };

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 transition-colors">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 shadow-sm transition-colors">
        <div className="max-w-7xl mx-auto px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button
                onClick={handleBankNameClick}
                className="p-2 text-blue-600 dark:text-blue-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                title="Edit bank name"
              >
                <Wallet size={32} />
              </button>
              <div>
                <h1 className="text-xl font-bold text-gray-900 dark:text-white">Virtual Account Manager</h1>
                <p className="text-sm text-gray-500 dark:text-gray-400">{settings.bankName || 'Bank'}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <DarkModeToggle />
              <button
                onClick={() => setShowSyncSettings(true)}
                className="p-2 text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                title="Sync and backup settings"
              >
                <Settings size={18} />
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8">
        {/* Reconciliation Warning */}
        <ReconciliationWarning
          isVisible={showReconciliationWarning}
          onDismiss={() => setShowReconciliationWarning(false)}
        />

        {/* Total Balance Card */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-700 dark:to-indigo-700 rounded-xl shadow-lg p-6 text-white mb-6 transition-colors">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-100 dark:text-blue-200 text-sm font-medium">Total Pooled Balance</p>
              <p className="text-3xl font-bold mt-1">{formatCurrency(totalBalance)}</p>
            </div>
            <div className="flex items-center gap-2">
              {totalBalance >= 0 ? (
                <>
                  <CheckCircle size={24} />
                  <span className="font-medium">Balanced</span>
                </>
              ) : (
                <>
                  <AlertCircle size={24} className="text-yellow-300" />
                  <span className="font-medium text-yellow-300">Negative Balance</span>
                </>
              )}
            </div>
          </div>
          <div className="flex gap-3 mt-4">
            <button
              onClick={() => setShowTransferSetupModal(true)}
              className="px-4 py-2 bg-white/20 hover:bg-white/30 rounded-lg flex items-center gap-2 font-medium transition-colors"
            >
              <ArrowLeftRight size={18} />
              Transfer
            </button>
            <button
              onClick={() => setShowAddAccountModal(true)}
              className="px-4 py-2 bg-white/20 hover:bg-white/30 rounded-lg flex items-center gap-2 font-medium transition-colors"
            >
              <Plus size={18} />
              Add Account
            </button>
          </div>
        </div>

        {/* Account Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {accounts.map((account) => (
            <AccountCard
              key={account.id}
              account={account}
              onAddFunds={handleAddFunds}
              onWithdraw={handleWithdraw}
              onEdit={handleEdit}
              onDelete={handleDeleteClick}
            />
          ))}
          {accounts.length === 0 && (
            <div className="col-span-full text-center py-12 bg-white dark:bg-gray-800 rounded-xl shadow-md transition-colors">
              <Wallet className="mx-auto text-gray-400 dark:text-gray-600 mb-4" size={48} />
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No accounts yet</h3>
              <p className="text-gray-500 dark:text-gray-400 mb-4">Create your first virtual account to get started</p>
              <button
                onClick={() => setShowAddAccountModal(true)}
                className="px-4 py-2 bg-blue-600 dark:bg-blue-700 text-white rounded-lg hover:bg-blue-700 dark:hover:bg-blue-600 font-medium inline-flex items-center gap-2 transition-colors"
              >
                <Plus size={18} />
                Add Account
              </button>
            </div>
          )}
        </div>

        {/* Activity Hub - Inline with Tabs */}
        <ActivityHub
          transactions={transactions}
          accounts={accounts}
          allocations={allocations}
          onDeleteAllocation={deleteAllocation}
          onDeleteTransaction={deleteTransaction}
        />
      </main>

      {/* Modals */}
      <TransactionModal
        isOpen={showTransactionModal}
        onClose={() => setShowTransactionModal(false)}
        account={selectedAccount}
        type={transactionType}
        onSubmit={handleTransactionSubmit}
      />

      <TransferSetupModal
        isOpen={showTransferSetupModal}
        onClose={() => setShowTransferSetupModal(false)}
        accounts={accounts}
        onSubmit={handleTransferSetupSubmit}
      />

      <EditAccountModal
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        account={selectedAccount}
        onSubmit={handleEditSubmit}
      />

      <AddAccountModal
        isOpen={showAddAccountModal}
        onClose={() => setShowAddAccountModal(false)}
      />

      {/* Sync Settings Modal */}
      {showSyncSettings && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-md w-full p-6 transition-colors">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Sync & Backup</h2>
              <button
                onClick={() => setShowSyncSettings(false)}
                className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
              >
                <X size={20} />
              </button>
            </div>
            <SyncSettings />
          </div>
        </div>
      )}

      {/* Bank Name Edit Modal */}
      {showBankNameModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-sm w-full p-6 transition-colors">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Edit Bank Name</h2>
              <button
                onClick={() => setShowBankNameModal(false)}
                className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
              >
                <X size={20} />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Bank Name
                </label>
                <input
                  type="text"
                  value={editedBankName}
                  onChange={(e) => setEditedBankName(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="e.g., Marcus by Goldman Sachs"
                />
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowBankNameModal(false)}
                  className="flex-1 py-2 px-4 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 font-medium transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleBankNameSave}
                  className="flex-1 py-2 px-4 bg-blue-600 dark:bg-blue-700 text-white rounded-lg hover:bg-blue-700 dark:hover:bg-blue-600 font-medium transition-colors"
                >
                  Save
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {accountToDelete && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-sm w-full p-6 transition-colors">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Delete Account?</h3>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              Are you sure you want to delete <strong>{accountToDelete.name}</strong>? 
              This will also remove all associated transactions.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setAccountToDelete(null)}
                className="flex-1 py-2 px-4 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 font-medium transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                className="flex-1 py-2 px-4 bg-red-600 dark:bg-red-700 text-white rounded-lg hover:bg-red-700 dark:hover:bg-red-600 font-medium transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
