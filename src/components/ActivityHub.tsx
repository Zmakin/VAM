import React, { useState, useMemo } from 'react';
import { Transaction, VirtualAccount, ScheduledAllocation } from '../types';
import { formatCurrency } from '../utils/currency';
import { getNextExecutionDate } from '../utils/allocations';
import { AllocationDetailsModal } from './AllocationDetailsModal';
import {
  ArrowUpRight,
  ArrowDownRight,
  Calendar,
  Edit3,
  RefreshCw,
  Plus,
  Trash2,
  ChevronLeft,
  ChevronRight,
  MousePointer,
  ArrowLeftRight,
} from 'lucide-react';

interface ActivityHubProps {
  transactions: Transaction[];
  accounts: VirtualAccount[];
  allocations: ScheduledAllocation[];
  onDeleteAllocation: (allocationId: string) => void;
  onDeleteTransaction?: (transactionId: string) => void;
}

type ActivityTab = 'recent' | 'all' | 'recurring';

interface ActivityRowProps {
  transaction: Transaction;
  showAllocation?: boolean;
  accounts: VirtualAccount[];
  allocations: ScheduledAllocation[];
  onRowClick?: (transaction: Transaction) => void;
}

const ActivityRow: React.FC<ActivityRowProps> = ({
  transaction,
  showAllocation = false,
  accounts,
  allocations,
  onRowClick,
}) => {
  const getAccountName = (accountId: string | undefined) => {
    if (!accountId) return 'System';
    return accounts.find(a => a.id === accountId)?.name || 'Unknown';
  };

  const getAccountColor = (accountId: string | undefined) => {
    if (!accountId) return '#6B7280';
    return accounts.find(a => a.id === accountId)?.color || '#6B7280';
  };

  const getTypeIcon = (type: Transaction['type']) => {
    switch (type) {
      case 'MANUAL':
        return <Edit3 size={12} className="text-blue-500" />;
      case 'SCHEDULED':
        return <Calendar size={12} className="text-purple-500" />;
      case 'TRANSFER':
        return <ArrowLeftRight size={12} className="text-orange-500" />;
      case 'BANK_SYNC':
        return <RefreshCw size={12} className="text-green-500" />;
      case 'ALLOCATION_CREATED':
        return <Plus size={12} className="text-green-600" />;
      case 'ALLOCATION_EXECUTED':
        return <Calendar size={12} className="text-purple-600" />;
      case 'ALLOCATION_DELETED':
        return <Trash2 size={12} className="text-red-600" />;
      case 'ALLOCATION_PAUSED':
        return <RefreshCw size={12} className="text-yellow-600" />;
      default:
        return null;
    }
  };

  const getTypeColor = (type: Transaction['type']) => {
    switch (type) {
      case 'ALLOCATION_CREATED':
        return 'bg-green-50 border-green-200';
      case 'ALLOCATION_EXECUTED':
        return 'bg-purple-50 border-purple-200';
      case 'ALLOCATION_DELETED':
        return 'bg-red-50 border-red-200';
      case 'ALLOCATION_PAUSED':
        return 'bg-yellow-50 border-yellow-200';
      default:
        return 'bg-white border-gray-200';
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const allocation = showAllocation
    ? allocations.find((a) => a.id === transaction.relatedAllocationId)
    : null;

  const isClickable = transaction.relatedAllocationId && allocations.find(a => a.id === transaction.relatedAllocationId);

  return (
    <div
      className={`p-2.5 rounded-lg border transition-all ${getTypeColor(
        transaction.type
      )} ${isClickable ? 'cursor-pointer hover:shadow-md hover:border-blue-300' : ''}`}
      onClick={() => isClickable && onRowClick && onRowClick(transaction)}
    >
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-2 flex-1">
          <div className="flex items-center justify-center w-6 h-6 rounded-full bg-gray-100 mt-0.5">
            {transaction.amount >= 0 ? (
              <ArrowDownRight size={14} className="text-green-600" />
            ) : (
              <ArrowUpRight size={14} className="text-red-600" />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5">
              <span
                className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                style={{
                  backgroundColor: getAccountColor(transaction.virtualAccountId),
                }}
              />
              <span className="text-sm font-medium text-gray-900">
                {getAccountName(transaction.virtualAccountId)}
              </span>
              {getTypeIcon(transaction.type)}
              {isClickable && (
                <MousePointer size={12} className="text-blue-500 ml-1" title="Click for details" />
              )}
            </div>
            <p className="text-xs text-gray-600 mt-0.5">{transaction.description}</p>
          </div>
        </div>
        <div className="text-right flex-shrink-0 ml-3">
          <div
            className={`text-sm font-semibold ${
              transaction.amount >= 0 ? 'text-green-600' : 'text-red-600'
            }`}
          >
            {transaction.amount >= 0 ? '+' : ''}{formatCurrency(transaction.amount)}
          </div>
          <div className="text-xs text-gray-400">
            {formatDateTime(transaction.occurredAt)}
          </div>
        </div>
      </div>

      {/* Show allocation details if this is a recurring activity */}
      {allocation && showAllocation && (
        <div className="mt-2 pl-8 text-xs text-gray-600 border-t border-gray-200 pt-2">
          <div className="font-medium text-gray-900 mb-1.5">
            Allocation Details:
          </div>
          <div className="space-y-0.5">
            <div>
              <span className="text-gray-500">Amount:</span>{' '}
              <span className="font-medium">{formatCurrency(allocation.amount)}</span>
            </div>
            <div>
              <span className="text-gray-500">Status:</span>{' '}
              <span
                className={`font-medium ${
                  allocation.isActive ? 'text-green-600' : 'text-gray-600'
                }`}
              >
                {allocation.isActive ? 'Active' : 'Paused'}
              </span>
            </div>
            {allocation.lastExecutedAt && (
              <div>
                <span className="text-gray-500">Last Executed:</span>{' '}
                <span className="font-medium">
                  {formatDate(allocation.lastExecutedAt)}
                </span>
              </div>
            )}
            {allocation.isActive && (
              <div>
                <span className="text-gray-500">Next Execution:</span>{' '}
                <span className="font-medium">
                  {getNextExecutionDate(allocation)?.toLocaleDateString() ||
                    'N/A'}
                </span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export const ActivityHub: React.FC<ActivityHubProps> = ({
  transactions,
  accounts,
  allocations,
  onDeleteAllocation,
  onDeleteTransaction,
}) => {
  const [activeTab, setActiveTab] = useState<ActivityTab>('recent');
  const [currentPage, setCurrentPage] = useState(1);
  const [dateFrom, setDateFrom] = useState<string>(
    new Date(new Date().setDate(new Date().getDate() - 30)).toISOString().split('T')[0]
  );
  const [dateTo, setDateTo] = useState<string>(
    new Date().toISOString().split('T')[0]
  );
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);

  const itemsPerPage = 20;

  // Recent Activity: Last 10 transactions
  const recentTransactions = useMemo(() => {
    return transactions.slice(0, 10);
  }, [transactions]);

  // All Activity: Paginated and filtered by date
  const allTransactions = useMemo(() => {
    const fromDate = new Date(dateFrom);
    fromDate.setHours(0, 0, 0, 0);
    const toDate = new Date(dateTo);
    toDate.setHours(23, 59, 59, 999);

    return transactions.filter((t) => {
      const tDate = new Date(t.occurredAt);
      return tDate >= fromDate && tDate <= toDate;
    });
  }, [transactions, dateFrom, dateTo]);

  const totalPages = Math.ceil(allTransactions.length / itemsPerPage);
  const paginatedTransactions = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return allTransactions.slice(start, start + itemsPerPage);
  }, [allTransactions, currentPage]);

  // Recurring Activity: All allocation-related activities
  const recurringActivity = useMemo(() => {
    return transactions.filter(
      (t) =>
        t.relatedAllocationId &&
        (t.type === 'ALLOCATION_CREATED' ||
          t.type === 'ALLOCATION_EXECUTED' ||
          t.type === 'ALLOCATION_DELETED' ||
          t.type === 'ALLOCATION_PAUSED' ||
          t.type === 'SCHEDULED')
    );
  }, [transactions]);

  const handleRowClick = (transaction: Transaction) => {
    if (transaction.relatedAllocationId) {
      setSelectedTransaction(transaction);
      setShowDetailsModal(true);
    }
  };

  const selectedAllocation = selectedTransaction?.relatedAllocationId
    ? allocations.find(a => a.id === selectedTransaction.relatedAllocationId)
    : null;

  return (
    <>
      <div className="bg-white rounded-xl shadow-md overflow-hidden">
        {/* Header with Tabs */}
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-lg font-semibold text-gray-900">Activity Hub</h2>
        </div>

        {/* Tabs */}
        <div className="flex border-b bg-gray-50">
          <button
            onClick={() => {
              setActiveTab('recent');
              setCurrentPage(1);
            }}
            className={`flex-1 px-4 py-3 text-base font-medium transition-colors ${
              activeTab === 'recent'
                ? 'text-blue-600 border-b-2 border-blue-600 bg-white'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Recent Activity
          </button>
          <button
            onClick={() => {
              setActiveTab('all');
              setCurrentPage(1);
            }}
            className={`flex-1 px-4 py-3 text-base font-medium transition-colors ${
              activeTab === 'all'
                ? 'text-blue-600 border-b-2 border-blue-600 bg-white'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            All Activity
          </button>
          <button
            onClick={() => {
              setActiveTab('recurring');
              setCurrentPage(1);
            }}
            className={`flex-1 px-4 py-3 text-base font-medium transition-colors ${
              activeTab === 'recurring'
                ? 'text-blue-600 border-b-2 border-blue-600 bg-white'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Recurring
          </button>
        </div>

        {/* Tab Content */}
        <div className="p-4 space-y-3">
          {activeTab === 'recent' && (
            <>
              {recentTransactions.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  <Calendar size={48} className="mx-auto mb-4 opacity-30" />
                  <p className="text-lg font-medium">No activity yet</p>
                </div>
              ) : (
                recentTransactions.map((transaction) => (
                  <ActivityRow
                    key={transaction.id}
                    transaction={transaction}
                    accounts={accounts}
                    allocations={allocations}
                    onRowClick={handleRowClick}
                  />
                ))
              )}
            </>
          )}

          {activeTab === 'all' && (
            <>
              {/* Date Filters */}
              <div className="bg-gray-50 p-3 rounded-lg flex gap-3 mb-4 flex-wrap">
                <div>
                  <label className="text-xs font-medium text-gray-600">From:</label>
                  <input
                    type="date"
                    value={dateFrom}
                    onChange={(e) => {
                      setDateFrom(e.target.value);
                      setCurrentPage(1);
                    }}
                    className="mt-1 px-3 py-2 text-sm border border-gray-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-600">To:</label>
                  <input
                    type="date"
                    value={dateTo}
                    onChange={(e) => {
                      setDateTo(e.target.value);
                      setCurrentPage(1);
                    }}
                    className="mt-1 px-3 py-2 text-sm border border-gray-300 rounded-lg"
                  />
                </div>
              </div>

              {paginatedTransactions.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  <Calendar size={48} className="mx-auto mb-4 opacity-30" />
                  <p className="text-lg font-medium">No activity in this period</p>
                </div>
              ) : (
                <>
                  {paginatedTransactions.map((transaction) => (
                    <ActivityRow
                      key={transaction.id}
                      transaction={transaction}
                      accounts={accounts}
                      allocations={allocations}
                      onRowClick={handleRowClick}
                    />
                  ))}
                </>
              )}
            </>
          )}

          {activeTab === 'recurring' && (
            <>
              {recurringActivity.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  <Calendar size={48} className="mx-auto mb-4 opacity-30" />
                  <p className="text-lg font-medium">No recurring transfer activity</p>
                  <p className="text-sm mt-2">
                    Create a recurring transfer to see it here
                  </p>
                </div>
              ) : (
                recurringActivity.map((transaction) => (
                  <ActivityRow
                    key={transaction.id}
                    transaction={transaction}
                    showAllocation={true}
                    accounts={accounts}
                    allocations={allocations}
                    onRowClick={handleRowClick}
                  />
                ))
              )}
            </>
          )}
        </div>

        {/* Pagination Footer */}
        {(activeTab === 'all' || activeTab === 'recurring') && (
          <div className="p-4 border-t bg-gray-50 flex items-center justify-between">
            <div className="text-sm text-gray-600">
              {activeTab === 'all' && (
                <>
                  Page {currentPage} of {totalPages || 1} • {allTransactions.length}{' '}
                  total
                </>
              )}
              {activeTab === 'recurring' && (
                <>{recurringActivity.length} recurring activities</>
              )}
            </div>
            {activeTab === 'all' && totalPages > 1 && (
              <div className="flex gap-2">
                <button
                  onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1}
                  className="p-2 text-gray-600 hover:bg-white rounded-lg disabled:opacity-50"
                >
                  <ChevronLeft size={18} />
                </button>
                <button
                  onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                  disabled={currentPage === totalPages}
                  className="p-2 text-gray-600 hover:bg-white rounded-lg disabled:opacity-50"
                >
                  <ChevronRight size={18} />
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Allocation Details Modal */}
      <AllocationDetailsModal
        isOpen={showDetailsModal}
        onClose={() => {
          setShowDetailsModal(false);
          setSelectedTransaction(null);
        }}
        allocation={selectedAllocation}
        transaction={selectedTransaction}
        accounts={accounts}
        onDeleteAllocation={onDeleteAllocation}
        onDeleteTransaction={onDeleteTransaction}
      />
    </>
  );
};
