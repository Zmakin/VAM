import React from 'react';
import { VirtualAccount } from '../types';
import { formatCurrency } from '../utils/currency';
import { Plus, Minus, Settings, Trash2 } from 'lucide-react';

interface AccountCardProps {
  account: VirtualAccount;
  onAddFunds: (account: VirtualAccount) => void;
  onWithdraw: (account: VirtualAccount) => void;
  onEdit: (account: VirtualAccount) => void;
  onDelete: (account: VirtualAccount) => void;
}

export const AccountCard: React.FC<AccountCardProps> = ({
  account,
  onAddFunds,
  onWithdraw,
  onEdit,
  onDelete,
}) => {
  const isNegative = account.balance < 0;

  return (
    <div
      className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6 border-t-4 hover:shadow-lg transition-all"
      style={{ borderTopColor: account.color }}
    >
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100">{account.name}</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">{account.purpose}</p>
        </div>
        <div className="flex gap-1">
          <button
            onClick={() => onEdit(account)}
            className="p-1.5 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            title="Edit account"
          >
            <Settings size={16} />
          </button>
          <button
            onClick={() => onDelete(account)}
            className="p-1.5 text-gray-400 dark:text-gray-500 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
            title="Delete account"
          >
            <Trash2 size={16} />
          </button>
        </div>
      </div>

      <div className={`text-2xl font-bold mb-4 ${isNegative ? 'text-red-600 dark:text-red-400' : 'text-gray-900 dark:text-gray-100'}`}>
        {formatCurrency(account.balance)}
      </div>

      <div className="flex gap-2">
        <button
          onClick={() => onAddFunds(account)}
          className="flex-1 flex items-center justify-center gap-1 py-2 px-3 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 rounded-lg hover:bg-green-100 dark:hover:bg-green-900/30 transition-colors font-medium text-sm"
        >
          <Plus size={16} />
          Add
        </button>
        <button
          onClick={() => onWithdraw(account)}
          className="flex-1 flex items-center justify-center gap-1 py-2 px-3 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors font-medium text-sm"
        >
          <Minus size={16} />
          Deduct
        </button>
      </div>
    </div>
  );
};
