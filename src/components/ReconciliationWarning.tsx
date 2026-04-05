import React from 'react';
import { AlertTriangle } from 'lucide-react';

interface ReconciliationWarningProps {
  isVisible: boolean;
  onDismiss: () => void;
}

export const ReconciliationWarning: React.FC<ReconciliationWarningProps> = ({
  isVisible,
  onDismiss,
}) => {
  if (!isVisible) return null;

  return (
    <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-6">
      <div className="flex items-start gap-3">
        <AlertTriangle className="text-amber-600 flex-shrink-0 mt-0.5" size={20} />
        <div className="flex-1">
          <h4 className="font-semibold text-amber-800">Balance Reconciliation Reminder</h4>
          <p className="text-sm text-amber-700 mt-1">
            Your virtual account balances may not reflect recent bank transactions. 
            Please review your Bank statement and update non-Escrow account balances 
            to reflect any charges that have posted.
          </p>
        </div>
        <button
          onClick={onDismiss}
          className="text-amber-600 hover:text-amber-800 text-sm font-medium"
        >
          Dismiss
        </button>
      </div>
    </div>
  );
};
