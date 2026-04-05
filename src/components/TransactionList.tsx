import React from 'react';
import { Transaction, VirtualAccount } from '../types';
import { formatCurrency } from '../utils/currency';
import { ArrowUpRight, ArrowDownRight, RefreshCw, Calendar, Edit3, Plus, Trash2 } from 'lucide-react';

interface TransactionListProps {
  transactions: Transaction[];
  accounts: VirtualAccount[];
  limit?: number;
}

export const TransactionList: React.FC<TransactionListProps> = ({
  transactions,
  accounts,
  limit,
}) => {
  const displayTransactions = limit ? transactions.slice(0, limit) : transactions;

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
        return <Edit3 size={14} className="text-blue-500" />;
      case 'SCHEDULED':
        return <Calendar size={14} className="text-purple-500" />;
      case 'TRANSFER':
        return <RefreshCw size={14} className="text-orange-500" />;
      case 'BANK_SYNC':
        return <RefreshCw size={14} className="text-green-500" />;
      case 'ALLOCATION_CREATED':
        return <Plus size={14} className="text-green-600" />;
      case 'ALLOCATION_EXECUTED':
        return <Calendar size={14} className="text-purple-600" />;
      case 'ALLOCATION_DELETED':
        return <Trash2 size={14} className="text-red-600" />;
      case 'ALLOCATION_PAUSED':
        return <RefreshCw size={14} className="text-yellow-600" />;
      default:
        return null;
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    });
  };

  if (displayTransactions.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        No transactions yet
      </div>
    );
  }

  return (
    <div className="divide-y divide-gray-100">
      {displayTransactions.map((transaction) => (
        <div
          key={transaction.id}
          className="flex items-center gap-4 py-3 hover:bg-gray-50 px-2 -mx-2 rounded-lg transition-colors"
        >
          <div className="flex items-center justify-center w-10 h-10 rounded-full bg-gray-100">
            {transaction.amount >= 0 ? (
              <ArrowDownRight size={20} className="text-green-600" />
            ) : (
              <ArrowUpRight size={20} className="text-red-600" />
            )}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span
                className="w-2 h-2 rounded-full flex-shrink-0"
                style={{ backgroundColor: getAccountColor(transaction.virtualAccountId) }}
              />
              <span className="font-medium text-gray-900 truncate">
                {getAccountName(transaction.virtualAccountId)}
              </span>
              {getTypeIcon(transaction.type)}
            </div>
            <p className="text-sm text-gray-500 truncate">{transaction.description}</p>
          </div>

          <div className="text-right flex-shrink-0">
            <div className={`font-semibold ${transaction.amount >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {transaction.amount >= 0 ? '+' : ''}{formatCurrency(transaction.amount)}
            </div>
            <div className="text-xs text-gray-400">{formatDate(transaction.occurredAt)}</div>
          </div>
        </div>
      ))}
    </div>
  );
};
