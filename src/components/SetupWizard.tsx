import React, { useState } from 'react';
import { useStore } from '../store/useStore';
import { dollarsToCents } from '../utils/currency';
import { Wallet, Plus, ArrowRight, Check } from 'lucide-react';

const DEFAULT_ACCOUNTS = [
  { name: 'Escrow', purpose: 'Income deposit, bill pay, disbursement hub', color: '#3B82F6' },
  { name: 'House', purpose: 'Mortgage P&I, property taxes, home insurance', color: '#10B981' },
  { name: 'Bills', purpose: 'All non-housing recurring expenses', color: '#F59E0B' },
  { name: 'Vacation', purpose: 'Dedicated vacation savings', color: '#8B5CF6' },
];

interface AccountSetup {
  name: string;
  purpose: string;
  color: string;
  balance: string;
}

export const SetupWizard: React.FC = () => {
  const { addAccount, updateSettings, completeSetup } = useStore();
  
  const [step, setStep] = useState(1);
  const [bankName, setBankName] = useState('');
  const [accounts, setAccounts] = useState<AccountSetup[]>(
    DEFAULT_ACCOUNTS.map(acc => ({ ...acc, balance: '' }))
  );
  const [newAccountName, setNewAccountName] = useState('');
  const [newAccountPurpose, setNewAccountPurpose] = useState('');
  const [newAccountColor, setNewAccountColor] = useState('#6B7280');

  const handleAddAccount = () => {
    if (newAccountName.trim()) {
      setAccounts([
        ...accounts,
        {
          name: newAccountName,
          purpose: newAccountPurpose,
          color: newAccountColor,
          balance: '',
        },
      ]);
      setNewAccountName('');
      setNewAccountPurpose('');
      setNewAccountColor('#6B7280');
    }
  };

  const handleRemoveAccount = (index: number) => {
    setAccounts(accounts.filter((_, i) => i !== index));
  };

  const handleBalanceChange = (index: number, value: string) => {
    const updated = [...accounts];
    updated[index].balance = value;
    setAccounts(updated);
  };

  const handleComplete = () => {
    // Create all accounts
    accounts.forEach((acc) => {
      addAccount({
        name: acc.name,
        purpose: acc.purpose,
        color: acc.color,
        balance: dollarsToCents(parseFloat(acc.balance) || 0),
      });
    });

    // Save settings
    updateSettings({ bankName });
    completeSetup();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl max-w-2xl w-full overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-6 text-white">
          <div className="flex items-center gap-3 mb-2">
            <Wallet size={32} />
            <h1 className="text-2xl font-bold">Virtual Account Manager</h1>
          </div>
          <p className="text-blue-100">Set up your virtual accounts to start tracking</p>
        </div>

        {/* Progress Steps */}
        <div className="flex border-b">
          {[1, 2, 3].map((s) => (
            <div
              key={s}
              className={`flex-1 py-3 text-center text-sm font-medium ${
                step === s
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : step > s
                  ? 'text-green-600'
                  : 'text-gray-400'
              }`}
            >
              {step > s && <Check size={16} className="inline mr-1" />}
              {s === 1 && 'Bank Info'}
              {s === 2 && 'Accounts'}
              {s === 3 && 'Balances'}
            </div>
          ))}
        </div>

        {/* Step Content */}
        <div className="p-6">
          {step === 1 && (
            <div className="space-y-4">
              <h2 className="text-xl font-semibold text-gray-900">Bank Information</h2>
              <p className="text-gray-600">
                Enter the name of your bank where all funds will be pooled.
              </p>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Bank Name
                </label>
                <input
                  type="text"
                  value={bankName}
                  onChange={(e) => setBankName(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="e.g., Marcus by Goldman Sachs"
                />
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              <h2 className="text-xl font-semibold text-gray-900">Configure Accounts</h2>
              <p className="text-gray-600">
                Set up your virtual accounts (envelopes). Default accounts are pre-configured.
              </p>
              
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {accounts.map((acc, index) => (
                  <div
                    key={index}
                    className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg"
                  >
                    <div
                      className="w-4 h-4 rounded-full flex-shrink-0"
                      style={{ backgroundColor: acc.color }}
                    />
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-gray-900">{acc.name}</div>
                      <div className="text-sm text-gray-500 truncate">{acc.purpose}</div>
                    </div>
                    <button
                      onClick={() => handleRemoveAccount(index)}
                      className="text-gray-400 hover:text-red-600 text-sm"
                    >
                      Remove
                    </button>
                  </div>
                ))}
              </div>

              <div className="border-t pt-4">
                <h3 className="font-medium text-gray-900 mb-2">Add Custom Account</h3>
                <div className="flex gap-2">
                  <input
                    type="color"
                    value={newAccountColor}
                    onChange={(e) => setNewAccountColor(e.target.value)}
                    className="w-10 h-10 rounded cursor-pointer"
                  />
                  <input
                    type="text"
                    value={newAccountName}
                    onChange={(e) => setNewAccountName(e.target.value)}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg"
                    placeholder="Account name"
                  />
                  <input
                    type="text"
                    value={newAccountPurpose}
                    onChange={(e) => setNewAccountPurpose(e.target.value)}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg"
                    placeholder="Purpose"
                  />
                  <button
                    onClick={handleAddAccount}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  >
                    <Plus size={20} />
                  </button>
                </div>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-4">
              <h2 className="text-xl font-semibold text-gray-900">Set Initial Balances</h2>
              <p className="text-gray-600">
                Enter the starting balance for each virtual account. This should match your
                current balances in Bank 1.
              </p>

              <div className="space-y-3">
                {accounts.map((acc, index) => (
                  <div key={index} className="flex items-center gap-4">
                    <div
                      className="w-3 h-3 rounded-full flex-shrink-0"
                      style={{ backgroundColor: acc.color }}
                    />
                    <span className="font-medium text-gray-900 w-24">{acc.name}</span>
                    <div className="relative flex-1">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">$</span>
                      <input
                        type="number"
                        step="0.01"
                        value={acc.balance}
                        onChange={(e) => handleBalanceChange(index, e.target.value)}
                        className="w-full pl-8 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        placeholder="0.00"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t bg-gray-50 flex justify-between">
          {step > 1 ? (
            <button
              onClick={() => setStep(step - 1)}
              className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 font-medium"
            >
              Back
            </button>
          ) : (
            <div />
          )}
          
          {step < 3 ? (
            <button
              onClick={() => setStep(step + 1)}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium flex items-center gap-2"
            >
              Continue
              <ArrowRight size={18} />
            </button>
          ) : (
            <button
              onClick={handleComplete}
              className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium flex items-center gap-2"
            >
              <Check size={18} />
              Complete Setup
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
