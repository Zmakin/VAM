import React, { useState } from 'react';
import { VirtualAccount, AllocationFrequency } from '../types';
import { dollarsToCents } from '../utils/currency';
import { getDayName, getNextExecutionDate } from '../utils/allocations';
import { X, Calendar } from 'lucide-react';

interface TransferSetupModalProps {
  isOpen: boolean;
  onClose: () => void;
  accounts: VirtualAccount[];
  onSubmit: (allocation: {
    sourceAccountId: string;
    targetAccountId: string;
    amount: number;
    type: 'SINGLE' | 'RECURRING';
    frequency: AllocationFrequency;
    dayOfWeek?: number;
    dayOfMonth?: number;
    startDate: string;
    endDate: string | null;
    memo?: string;
  }) => void;
}

export const TransferSetupModal: React.FC<TransferSetupModalProps> = ({
  isOpen,
  onClose,
  accounts,
  onSubmit,
}) => {
  const [transferType, setTransferType] = useState<'SINGLE' | 'RECURRING'>('SINGLE');
  const [fromAccountId, setFromAccountId] = useState('');
  const [toAccountId, setToAccountId] = useState('');
  const [amount, setAmount] = useState('');
  const [memo, setMemo] = useState('');
  const [frequency, setFrequency] = useState<AllocationFrequency>('WEEKLY');
  const [dayOfWeek, setDayOfWeek] = useState(3); // Wednesday
  const [dayOfMonth, setDayOfMonth] = useState(1);
  const [monthlyPattern, setMonthlyPattern] = useState<'FIRST' | 'SECOND' | 'THIRD' | 'FOURTH' | 'LAST'>('FIRST');
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [endDateType, setEndDateType] = useState<'indefinite' | 'until'>('indefinite');
  const [endDate, setEndDate] = useState('');

  if (!isOpen) return null;

  const getFrequencyFromMonthlyPattern = (pattern: string, dow: number): AllocationFrequency => {
    const patternMap: { [key: string]: AllocationFrequency } = {
      'FIRST': 'MONTHLY_FIRST_WEEKDAY',
      'SECOND': 'MONTHLY_SECOND_WEEKDAY',
      'THIRD': 'MONTHLY_THIRD_WEEKDAY',
      'FOURTH': 'MONTHLY_FOURTH_WEEKDAY',
      'LAST': 'MONTHLY_LAST_WEEKDAY',
    };
    return patternMap[pattern] || 'MONTHLY_FIRST_WEEKDAY';
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cents = dollarsToCents(parseFloat(amount) || 0);

    if (cents <= 0 || !fromAccountId || !toAccountId || fromAccountId === toAccountId) {
      alert('Please fill in all required fields with valid values');
      return;
    }

    let finalFrequency: AllocationFrequency = frequency;
    let finalDayOfWeek = dayOfWeek;
    let finalDayOfMonth = dayOfMonth;

    // Adjust frequency based on selection
    if (transferType === 'RECURRING') {
      if (frequency === 'MONTHLY_DATE' && !dayOfMonth) {
        alert('Please select a day of month');
        return;
      }
      if (frequency.startsWith('MONTHLY_') && frequency.includes('WEEKDAY')) {
        finalFrequency = getFrequencyFromMonthlyPattern(monthlyPattern, dayOfWeek);
      }
    }

    onSubmit({
      sourceAccountId: fromAccountId,
      targetAccountId: toAccountId,
      amount: cents,
      type: transferType,
      frequency: finalFrequency,
      dayOfWeek: transferType === 'SINGLE' ? undefined : finalDayOfWeek,
      dayOfMonth: finalFrequency === 'MONTHLY_DATE' ? finalDayOfMonth : undefined,
      startDate: startDate + 'T00:00:00Z',
      endDate: endDateType === 'indefinite' ? null : (endDate ? endDate + 'T00:00:00Z' : null),
      memo: memo.trim() || undefined,
    });

    // Reset form
    setFromAccountId('');
    setToAccountId('');
    setAmount('');
    setMemo('');
    setTransferType('SINGLE');
    setFrequency('WEEKLY');
    setStartDate(new Date().toISOString().split('T')[0]);
    setEndDateType('indefinite');
    setEndDate('');
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Set Up Transfer</h2>
          <button
            onClick={onClose}
            className="p-1 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Transfer Type */}
          <div>
            <label className="block text-sm font-semibold text-gray-900 dark:text-white mb-3">Transfer Type</label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setTransferType('SINGLE')}
                className={`p-4 border-2 rounded-lg text-left font-medium transition-all ${
                  transferType === 'SINGLE'
                    ? 'border-blue-600 dark:border-blue-500 bg-blue-50 dark:bg-blue-900/30 text-blue-900 dark:text-blue-100'
                    : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600'
                }`}
              >
                One-Time
                <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">Execute once on a specific date</div>
              </button>
              <button
                type="button"
                onClick={() => setTransferType('RECURRING')}
                className={`p-4 border-2 rounded-lg text-left font-medium transition-all ${
                  transferType === 'RECURRING'
                    ? 'border-blue-600 dark:border-blue-500 bg-blue-50 dark:bg-blue-900/30 text-blue-900 dark:text-blue-100'
                    : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600'
                }`}
              >
                Recurring
                <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">Automatic transfers on a schedule</div>
              </button>
            </div>
          </div>

          {/* From/To Accounts */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">From Account</label>
              <select
                value={fromAccountId}
                onChange={(e) => setFromAccountId(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                required
              >
                <option value="">Select account</option>
                {accounts.map((acc) => (
                  <option key={acc.id} value={acc.id}>
                    {acc.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">To Account</label>
              <select
                value={toAccountId}
                onChange={(e) => setToAccountId(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                required
              >
                <option value="">Select account</option>
                {accounts
                  .filter((a) => a.id !== fromAccountId)
                  .map((acc) => (
                    <option key={acc.id} value={acc.id}>
                      {acc.name}
                    </option>
                  ))}
              </select>
            </div>
          </div>

          {/* Amount */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Amount</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 dark:text-gray-400">$</span>
              <input
                type="number"
                step="0.01"
                min="0"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full pl-8 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="0.00"
                required
              />
            </div>
          </div>

          {/* Memo */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Memo (Optional)
            </label>
            <input
              type="text"
              value={memo}
              onChange={(e) => setMemo(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder={transferType === 'RECURRING' ? 'e.g., Rent payment (persistent for all transfers)' : 'e.g., One-time expense'}
            />
            {transferType === 'RECURRING' && memo && (
              <p className="mt-1 text-xs text-blue-600 dark:text-blue-400">
                This memo will be included in all scheduled transfers
              </p>
            )}
          </div>

          {/* Start Date */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Start Date</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              required
            />
          </div>

          {/* Recurring Options */}
          {transferType === 'RECURRING' && (
            <>
              {/* Frequency */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Frequency</label>
                <select
                  value={frequency}
                  onChange={(e) => setFrequency(e.target.value as AllocationFrequency)}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="DAILY">Daily</option>
                  <option value="WEEKLY">Weekly</option>
                  <option value="BIWEEKLY">Every 2 Weeks</option>
                  <option value="MONTHLY_DATE">Monthly on specific date</option>
                  <option value="MONTHLY_FIRST_WEEKDAY">Monthly on specific day (1st)</option>
                </select>
              </div>

              {/* Day of Week Selection */}
              {(frequency === 'WEEKLY' || frequency === 'BIWEEKLY' || frequency.includes('WEEKDAY')) && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Day of Week</label>
                  <select
                    value={dayOfWeek}
                    onChange={(e) => setDayOfWeek(parseInt(e.target.value))}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    {[0, 1, 2, 3, 4, 5, 6].map((day) => (
                      <option key={day} value={day}>
                        {getDayName(day)}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Monthly Pattern */}
              {frequency.includes('WEEKDAY') && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Which {getDayName(dayOfWeek)}?
                  </label>
                  <select
                    value={monthlyPattern}
                    onChange={(e) => setMonthlyPattern(e.target.value as any)}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="FIRST">1st</option>
                    <option value="SECOND">2nd</option>
                    <option value="THIRD">3rd</option>
                    <option value="FOURTH">4th</option>
                    <option value="LAST">Last</option>
                  </select>
                </div>
              )}

              {/* Day of Month Selection */}
              {frequency === 'MONTHLY_DATE' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Day of Month</label>
                  <input
                    type="number"
                    min="1"
                    max="31"
                    value={dayOfMonth}
                    onChange={(e) => setDayOfMonth(parseInt(e.target.value))}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              )}

              {/* End Date */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Duration</label>
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <input
                      type="radio"
                      id="indefinite"
                      name="endDateType"
                      value="indefinite"
                      checked={endDateType === 'indefinite'}
                      onChange={(e) => setEndDateType(e.target.value as any)}
                      className="cursor-pointer"
                    />
                    <label htmlFor="indefinite" className="text-sm text-gray-700 dark:text-gray-300 cursor-pointer">
                      Indefinite (no end date)
                    </label>
                  </div>
                  <div className="flex items-center gap-3">
                    <input
                      type="radio"
                      id="until"
                      name="endDateType"
                      value="until"
                      checked={endDateType === 'until'}
                      onChange={(e) => setEndDateType(e.target.value as any)}
                      className="cursor-pointer"
                    />
                    <label htmlFor="until" className="text-sm text-gray-700 dark:text-gray-300 cursor-pointer">
                      Until:
                    </label>
                    <input
                      type="date"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      className="flex-1 px-3 py-1 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 text-sm disabled:bg-gray-50 dark:disabled:bg-gray-800 disabled:text-gray-400 dark:disabled:text-gray-600"
                      disabled={endDateType === 'indefinite'}
                    />
                  </div>
                </div>
              </div>
            </>
          )}

          {/* Preview */}
          {fromAccountId && toAccountId && amount && (
            <div className="p-4 bg-blue-50 dark:bg-blue-900/30 rounded-lg border border-blue-200 dark:border-blue-800">
              <div className="flex items-start gap-2">
                <Calendar className="text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" size={18} />
                <div className="text-sm text-blue-900 dark:text-blue-100">
                  <p className="font-medium">Transfer Preview</p>
                  <p className="mt-1">
                    ${parseFloat(amount).toFixed(2)} from{' '}
                    <strong>{accounts.find(a => a.id === fromAccountId)?.name}</strong> to{' '}
                    <strong>{accounts.find(a => a.id === toAccountId)?.name}</strong>
                  </p>
                  {memo && (
                    <p className="mt-1 text-xs italic">
                      Memo: {memo}
                    </p>
                  )}
                  {transferType === 'RECURRING' && (
                    <p className="mt-1 text-xs">
                      Starting {new Date(startDate).toLocaleDateString()} •{' '}
                      {frequency === 'DAILY'
                        ? 'Every day'
                        : frequency === 'WEEKLY'
                        ? `Every ${getDayName(dayOfWeek)}`
                        : frequency === 'BIWEEKLY'
                        ? `Every other ${getDayName(dayOfWeek)}`
                        : frequency === 'MONTHLY_DATE'
                        ? `Monthly on day ${dayOfMonth}`
                        : `${monthlyPattern} ${getDayName(dayOfWeek)} of month`}
                      {endDateType === 'until' && endDate && ` • Until ${new Date(endDate).toLocaleDateString()}`}
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2 px-4 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 py-2 px-4 bg-blue-600 dark:bg-blue-700 text-white rounded-lg hover:bg-blue-700 dark:hover:bg-blue-600 font-medium"
            >
              Create Transfer
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
