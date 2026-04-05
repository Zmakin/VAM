import React, { useState, useEffect } from 'react';
import { Upload, Download, HardDrive, AlertCircle } from 'lucide-react';
import { useStore } from '../store/useStore';
import { isFileSystemAccessSupported, requestFileSystemAccess, hasFileSystemAccess } from '../utils/storage';

export const SyncSettings: React.FC = () => {
  const { exportData, importData } = useStore();
  const [fileSystemSupported, setFileSystemSupported] = useState(false);
  const [hasAccess, setHasAccess] = useState(hasFileSystemAccess());
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    isFileSystemAccessSupported().then(setFileSystemSupported);
  }, []);

  const handleEnableFileSystemAccess = async () => {
    setIsLoading(true);
    try {
      const success = await requestFileSystemAccess();
      if (success) {
        setHasAccess(true);
        setMessage({ type: 'success', text: 'File system access enabled! Your data will now sync automatically.' });
      } else {
        setMessage({ type: 'error', text: 'File system access request was cancelled.' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to enable file system access.' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleExport = async () => {
    setIsLoading(true);
    try {
      await exportData();
      setMessage({ type: 'success', text: 'Data exported successfully!' });
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to export data.' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleImport = async () => {
    setIsLoading(true);
    try {
      const success = await importData();
      if (success) {
        setMessage({ type: 'success', text: 'Data imported successfully!' });
      } else {
        setMessage({ type: 'error', text: 'Failed to import data.' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to import data.' });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h3 className="font-semibold text-blue-900 mb-3">Data Synchronization</h3>
        
        {/* Message */}
        {message && (
          <div className={`mb-4 p-3 rounded ${
            message.type === 'success' 
              ? 'bg-green-100 text-green-800' 
              : 'bg-red-100 text-red-800'
          }`}>
            {message.text}
          </div>
        )}

        {/* File System Access Section */}
        {fileSystemSupported && (
          <div className="mb-4 p-3 bg-white border border-blue-100 rounded">
            <div className="flex items-start gap-3">
              <HardDrive className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                <h4 className="font-medium text-gray-900 mb-1">PC File Storage</h4>
                <p className="text-sm text-gray-600 mb-3">
                  {hasAccess 
                    ? 'Your data is syncing to your PC. Access data from any browser on this computer.'
                    : 'Enable file storage to sync your data across all browsers on this PC.'}
                </p>
                {!hasAccess && (
                  <button
                    onClick={handleEnableFileSystemAccess}
                    disabled={isLoading}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
                  >
                    <HardDrive className="w-4 h-4" />
                    {isLoading ? 'Enabling...' : 'Enable File Storage'}
                  </button>
                )}
                {hasAccess && (
                  <div className="inline-flex items-center gap-2 px-3 py-2 bg-green-100 text-green-800 rounded text-sm font-medium">
                    <div className="w-2 h-2 bg-green-600 rounded-full"></div>
                    Active
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {!fileSystemSupported && (
          <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0" />
            <div className="text-sm text-amber-800">
              <p className="font-medium">Your browser doesn't support PC file storage</p>
              <p className="mt-1">Use Chrome, Edge, or Opera for automatic cross-browser sync. Use export/import for other browsers.</p>
            </div>
          </div>
        )}

        {/* Export/Import Section */}
        <div className="space-y-2">
          <p className="text-sm font-medium text-gray-700">Manual Backup & Restore</p>
          <p className="text-sm text-gray-600 mb-3">Download a backup of your data or restore from a previous backup.</p>
          
          <div className="flex gap-2">
            <button
              onClick={handleExport}
              disabled={isLoading}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50"
            >
              <Download className="w-4 h-4" />
              {isLoading ? 'Exporting...' : 'Export Data'}
            </button>
            
            <button
              onClick={handleImport}
              disabled={isLoading}
              className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 disabled:opacity-50"
            >
              <Upload className="w-4 h-4" />
              {isLoading ? 'Importing...' : 'Import Data'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
