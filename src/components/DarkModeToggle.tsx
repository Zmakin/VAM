import React from 'react';
import { useTheme } from '../contexts/ThemeContext';
import { Moon, Sun } from 'lucide-react';

export const DarkModeToggle: React.FC = () => {
  const { isDarkMode, toggleDarkMode } = useTheme();

  return (
    <button
      onClick={toggleDarkMode}
      className="relative inline-flex items-center h-6 w-11 rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800"
      style={{
        backgroundColor: isDarkMode ? '#3B82F6' : '#D1D5DB',
      }}
      aria-label="Toggle dark mode"
    >
      <span
        className={`inline-flex items-center justify-center h-5 w-5 transform rounded-full bg-white shadow-md transition-transform ${
          isDarkMode ? 'translate-x-6' : 'translate-x-0.5'
        }`}
      >
        {isDarkMode ? (
          <Moon size={12} className="text-blue-600" />
        ) : (
          <Sun size={12} className="text-gray-600" />
        )}
      </span>
    </button>
  );
};
