import React from 'react';
import { useStore } from '../store/useStore';
import { formatCurrency } from '../utils/currency';
import { getFrequencyText, getEndDateText } from '../utils/allocations';
import { Trash2, Play, X, Plus } from 'lucide-react';

interface AllocationManagerProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AllocationManager: React.FC<AllocationManagerProps> = ({ isOpen, onClose }) => {
  const { accounts, allocations, deleteAllocation, updateAllocation, executeAllocations } = useStore();

  if (!isOpen) return null;

  const getAccountName = (id: string) => accounts.find(a => a.id === id)?.name || 'Unknown';

  const handleToggleActive = (id: string, isActive: boolean) => {
    updateAllocation(id, { isActive: !isActive });
  };

  const formatDateDisplay = (dateStr: string | null) => {
    if (!dateStr) return 'Never';
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-3xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-lg font-semibold text-gray-900">Scheduled Allocations</h2>
          <button
            onClick={onClose}
            className="p-1 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
          >
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          {allocations.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <Plus size={48} className="mx-auto mb-4 opacity-30" />
              <p className="text-lg font-medium mb-2">No allocations yet</p>
              <p className="text-sm">Click "Transfer" and choose "Set Up Recurring" to create one</p>
            </div>
          ) : (
            <div className="space-y-3">
              {allocations.map((allocation) => (
                <div
                  key={allocation.id}
                  className={`p-4 rounded-lg border-2 transition-all ${
                    allocation.isActive
                      ? 'bg-white border-blue-200'
                      : 'bg-gray-50 border-gray-200'
                  }`}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <div className="font-semibold text-gray-900">
                        {getAccountName(allocation.sourceAccountId)} → {getAccountName(allocation.targetAccountId)}
                      </div>
                      <div className="text-sm text-gray-600 mt-1">
                        {formatCurrency(allocation.amount)} • {getFrequencyText(allocation)}
                      </div>
                      {allocation.memo && (
                        <div className="text-xs text-gray-500 mt-1 italic">
                          Memo: {allocation.memo}
                        </div>
                      )}
                    </div>
                    <button
                      onClick={() => handleToggleActive(allocation.id, allocation.isActive)}
                      className={`px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap ml-4 ${
                        allocation.isActive
                          ? 'bg-green-100 text-green-700'
                          : 'bg-gray-200 text-gray-600'
                      }`}
                    >
                      {allocation.isActive ? 'Active' : 'Paused'}
                    </button>
                  </div>

                  <div className="text-xs text-gray-500 space-y-1">
                    <div>Start: {new Date(allocation.startDate).toLocaleDateString()}</div>
                    <div>End: {getEndDateText(allocation.endDate)}</div>
                    {allocation.lastExecutedAt && <div>Last: {formatDateDisplay(allocation.lastExecutedAt)}</div>}
                  </div>

                  <button
                    onClick={() => deleteAllocation(allocation.id)}
                    className="mt-3 p-1.5 text-gray-400 hover:text-red-600 rounded hover:bg-red-50"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="p-4 border-t bg-gray-50">
          <button
            onClick={() => { executeAllocations(); onClose(); }}
            disabled={allocations.filter(a => a.isActive).length === 0}
            className="w-full py-2 px-4 bg-purple-600 text-white rounded-lg hover:bg-purple-700 font-medium disabled:bg-gray-300 flex items-center justify-center gap-2"
          >
            <Play size={18} />
            Check & Execute Pending Allocations
          </button>
        </div>
      </div>
    </div>
  );
};
