import React from 'react';
import { ScheduledAllocation, Transaction, VirtualAccount } from '../types';
import { formatCurrency } from '../utils/currency';
import { getFrequencyText, getNextExecutionDate } from '../utils/allocations';
import { X, Trash2, AlertCircle, Calendar, ArrowRight } from 'lucide-react';

interface AllocationDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  allocation: ScheduledAllocation | null;
  transaction: Transaction | null;
  accounts: VirtualAccount[];
  onDeleteAllocation: (allocationId: string) => void;
  onDeleteTransaction?: (transactionId: string) => void;
}

export const AllocationDetailsModal: React.FC<AllocationDetailsModalProps> = ({
  isOpen,
  onClose,
  allocation,
  transaction,
  accounts,
  onDeleteAllocation,
  onDeleteTransaction,
}) => {
  const [showDeleteConfirm, setShowDeleteConfirm] = React.useState<'series' | 'single' | null>(null);

  if (!isOpen || !allocation || !transaction) return null;

  const sourceAccount = accounts.find(a => a.id === allocation.sourceAccountId);
  const targetAccount = accounts.find(a => a.id === allocation.targetAccountId);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const handleDeleteSeries = () => {
    onDeleteAllocation(allocation.id);
    setShowDeleteConfirm(null);
    onClose();
  };

  const handleDeleteSingle = () => {
    if (onDeleteTransaction && transaction) {
      onDeleteTransaction(transaction.id);
      setShowDeleteConfirm(null);
      onClose();
    }
  };

  const nextExecution = allocation.isActive ? getNextExecutionDate(allocation) : null;
  const isScheduledTransaction = transaction.type === 'SCHEDULED';

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Recurring Transfer Details</h2>
          <button
            onClick={onClose}
            className="p-1 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
          >
            <X size={20} />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Transfer Overview */}
          <div className="bg-blue-50 dark:bg-blue-900/30 rounded-lg p-4 border border-blue-200 dark:border-blue-800">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: sourceAccount?.color || '#6B7280' }}
                />
                <span className="font-semibold text-gray-900 dark:text-gray-100">{sourceAccount?.name || 'Unknown'}</span>
              </div>
              <ArrowRight className="text-blue-600 dark:text-blue-400" size={20} />
              <div className="flex items-center gap-2">
                <div
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: targetAccount?.color || '#6B7280' }}
                />
                <span className="font-semibold text-gray-900 dark:text-gray-100">{targetAccount?.name || 'Unknown'}</span>
              </div>
            </div>
            <div className="text-2xl font-bold text-blue-900 dark:text-blue-100">
              {formatCurrency(allocation.amount)}
            </div>
            <div className="text-sm text-blue-700 dark:text-blue-300 mt-1">
              {getFrequencyText(allocation)}
            </div>
          </div>

          {/* Schedule Information */}
          <div>
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
              <Calendar size={16} />
              Schedule Information
            </h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">Status:</span>
                <span className={`font-medium ${allocation.isActive ? 'text-green-600 dark:text-green-400' : 'text-gray-600 dark:text-gray-400'}`}>
                  {allocation.isActive ? 'Active' : 'Paused'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">Created:</span>
                <span className="font-medium text-gray-900 dark:text-gray-100">{formatDate(allocation.createdAt)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">Start Date:</span>
                <span className="font-medium text-gray-900 dark:text-gray-100">{formatDate(allocation.startDate)}</span>
              </div>
              {allocation.endDate && (
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">End Date:</span>
                  <span className="font-medium text-gray-900 dark:text-gray-100">{formatDate(allocation.endDate)}</span>
                </div>
              )}
              {!allocation.endDate && (
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Duration:</span>
                  <span className="font-medium text-gray-900 dark:text-gray-100">Indefinite</span>
                </div>
              )}
              {allocation.lastExecutedAt && (
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Last Execution:</span>
                  <span className="font-medium text-gray-900 dark:text-gray-100">{formatDate(allocation.lastExecutedAt)}</span>
                </div>
              )}
              {nextExecution && (
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Next Execution:</span>
                  <span className="font-medium text-green-600 dark:text-green-400">{formatDate(nextExecution.toISOString())}</span>
                </div>
              )}
            </div>
          </div>

          {/* Memo */}
          {allocation.memo && (
            <div>
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-2">Memo</h3>
              <p className="text-sm text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-gray-900 p-3 rounded-lg italic">
                {allocation.memo}
              </p>
            </div>
          )}

          {/* This Transaction */}
          {isScheduledTransaction && (
            <div>
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-2">This Transaction</h3>
              <div className="bg-gray-50 dark:bg-gray-900 p-3 rounded-lg text-sm">
                <div className="flex justify-between mb-1">
                  <span className="text-gray-600 dark:text-gray-400">Executed On:</span>
                  <span className="font-medium text-gray-900 dark:text-gray-100">{formatDateTime(transaction.occurredAt)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Transaction ID:</span>
                  <span className="font-mono text-xs text-gray-600 dark:text-gray-400">{transaction.id.slice(0, 8)}...</span>
                </div>
              </div>
            </div>
          )}

          {/* Delete Options */}
          {!showDeleteConfirm && (
            <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                <AlertCircle size={16} className="text-red-600 dark:text-red-400" />
                Delete Options
              </h3>
              <div className="space-y-2">
                {isScheduledTransaction && onDeleteTransaction && (
                  <button
                    onClick={() => setShowDeleteConfirm('single')}
                    className="w-full px-4 py-3 text-left border-2 border-gray-200 dark:border-gray-700 rounded-lg hover:border-red-300 dark:hover:border-red-700 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all"
                  >
                    <div className="font-medium text-gray-900 dark:text-gray-100">Delete This Transaction Only</div>
                    <div className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                      Remove this single occurrence. Future transfers will continue.
                    </div>
                  </button>
                )}
                <button
                  onClick={() => setShowDeleteConfirm('series')}
                  className="w-full px-4 py-3 text-left border-2 border-gray-200 dark:border-gray-700 rounded-lg hover:border-red-300 dark:hover:border-red-700 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all"
                >
                  <div className="font-medium text-gray-900 dark:text-gray-100">Delete Entire Series</div>
                  <div className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                    Stop all future transfers and remove the recurring schedule.
                  </div>
                </button>
              </div>
            </div>
          )}

          {/* Confirmation Dialog */}
          {showDeleteConfirm && (
            <div className="border-2 border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/30 rounded-lg p-4">
              <div className="flex items-start gap-3 mb-4">
                <AlertCircle className="text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" size={20} />
                <div>
                  <h4 className="font-semibold text-red-900 dark:text-red-100 mb-1">
                    {showDeleteConfirm === 'single' ? 'Delete This Transaction?' : 'Delete Entire Series?'}
                  </h4>
                  <p className="text-sm text-red-700 dark:text-red-300">
                    {showDeleteConfirm === 'single'
                      ? 'This will remove this single transaction. The recurring transfer will continue for future dates.'
                      : 'This will cancel all future transfers and remove the recurring schedule. Past transactions will remain in history.'}
                  </p>
                </div>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowDeleteConfirm(null)}
                  className="flex-1 py-2 px-4 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-white dark:hover:bg-gray-800 font-medium"
                >
                  Cancel
                </button>
                <button
                  onClick={showDeleteConfirm === 'single' ? handleDeleteSingle : handleDeleteSeries}
                  className="flex-1 py-2 px-4 bg-red-600 dark:bg-red-700 text-white rounded-lg hover:bg-red-700 dark:hover:bg-red-600 font-medium flex items-center justify-center gap-2"
                >
                  <Trash2 size={16} />
                  Delete
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        {!showDeleteConfirm && (
          <div className="sticky bottom-0 p-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
            <button
              onClick={onClose}
              className="w-full py-2 px-4 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 font-medium"
            >
              Close
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
