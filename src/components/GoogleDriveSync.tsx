import React, { useState, useEffect } from 'react';
import { Cloud, CloudOff, User, CheckCircle, AlertTriangle, Loader, ExternalLink, Info, Shield, Lock } from 'lucide-react';
import { 
  isGoogleDriveAvailable,
  isGoogleDriveConfigured,
  getGoogleDriveError,
  isSignedInToGoogleDrive,
  signInToGoogleDrive,
  signOutFromGoogleDrive,
  getCurrentGoogleUser,
  syncAllToGoogleDrive,
  loadAllFromGoogleDrive,
  getGoogleDriveTokenInfo,
  refreshGoogleUserInfo
} from '../utils/storage';
import { useStore } from '../store/useStore';
import { isEncryptionAvailable } from '../utils/encryption';
import { EncryptionSetupModal } from './EncryptionSetupModal';

export const GoogleDriveSync: React.FC = () => {
  const [isAvailable, setIsAvailable] = useState(false);
  const [isSignedIn, setIsSignedIn] = useState(false);
  const [currentUser, setCurrentUser] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isConfigured, setIsConfigured] = useState(false);
  const [initError, setInitError] = useState<string | null>(null);
  const [message, setMessage] = useState<{ type: 'success' | 'error' | 'info' | 'warning'; text: string } | null>(null);
  const [encryptionEnabled, setEncryptionEnabled] = useState(isEncryptionAvailable());
  const [showEncryptionModal, setShowEncryptionModal] = useState(false);
  const [encryptionModalMode, setEncryptionModalMode] = useState<'setup' | 'unlock' | 'change'>('setup');
  const [pendingSignIn, setPendingSignIn] = useState(false);
  const [pendingLoad, setPendingLoad] = useState(false);
  
  const { accounts, transactions, allocations, settings, loadExternalData } = useStore();

  useEffect(() => {
    initializeGoogleDrive();
    setEncryptionEnabled(isEncryptionAvailable());
  }, []);

  // Add a function to refresh user info manually
  const refreshUserInfo = async () => {
    if (isSignedInToGoogleDrive()) {
      await refreshGoogleUserInfo();
      const user = getCurrentGoogleUser();
      setCurrentUser(user);
      console.log('Manually refreshed user info:', user);
    }
  };

  // Add a function to load data from Google Drive
  const handleLoadFromGoogleDrive = async (skipEncryptionCheck = false) => {
    if (!isSignedIn) return false;
    
    try {
      const data = await loadAllFromGoogleDrive();
      if (data) {
        // Check if the loaded data is meaningful (not just empty defaults)
        const hasData = 
          (data.accounts && data.accounts.length > 0) ||
          (data.transactions && data.transactions.length > 0) ||
          (data.allocations && data.allocations.length > 0) ||
          (data.settings && data.settings.isSetupComplete);
        
        if (hasData) {
          loadExternalData(data);
          console.log('Successfully loaded and applied data from Google Drive');
          return true;
        } else {
          console.log('Google Drive data appears to be empty - not overwriting local data');
          return false;
        }
      }
      return false;
    } catch (error) {
      console.error('Failed to load from Google Drive:', error);
      
      // Check if this is an encryption settings mismatch error
      if (error instanceof Error && error.message.includes('Encryption settings have changed')) {
        setMessage({
          type: 'warning',
          text: 'Your cloud data uses different encryption settings. Please unlock with your password.'
        });
        // Set pending load flag so we retry after unlock
        setPendingLoad(true);
        // Open unlock modal to re-derive key with correct salt
        openEncryptionModal('unlock');
        return false;
      }
      
      // Check if encryption key is not available
      if (error instanceof Error && error.message.includes('This file is encrypted')) {
        setMessage({
          type: 'warning',
          text: 'Please unlock encryption to access your cloud data.'
        });
        // Set pending load flag so we retry after unlock
        setPendingLoad(true);
        // Open unlock modal
        openEncryptionModal('unlock');
        return false;
      }
      
      throw error;
    }
  };

  const initializeGoogleDrive = async () => {
    setIsLoading(true);
    setMessage(null);
    
    try {
      // Check if Google Client ID is configured
      const configured = isGoogleDriveConfigured();
      setIsConfigured(configured);
      
      if (!configured) {
        setIsAvailable(false);
        setIsLoading(false);
        return;
      }
      
      const available = await isGoogleDriveAvailable();
      setIsAvailable(available);
      
      const error = getGoogleDriveError();
      setInitError(error);
      
      if (available) {
        const signedIn = isSignedInToGoogleDrive();
        setIsSignedIn(signedIn);
        
        if (signedIn) {
          const user = getCurrentGoogleUser();
          setCurrentUser(user);
          console.log('GoogleDriveSync component initialized with current user:', user);
          
          // Check if encryption is set up
          const encryptionSetup = isEncryptionAvailable();
          setEncryptionEnabled(encryptionSetup);
          
          if (!encryptionSetup) {
            // User is signed in but encryption not set up - prompt immediately
            setMessage({ 
              type: 'warning', 
              text: 'Encryption is required for Google Drive sync. Please set up encryption to continue.' 
            });
          }
        }
      } else if (error) {
        if (error.includes('API not enabled')) {
          setMessage({ 
            type: 'warning', 
            text: 'Google Drive API needs to be enabled in your Google Cloud project to use sync features.' 
          });
        } else {
          setMessage({ 
            type: 'error', 
            text: `Failed to initialize Google Drive: ${error}` 
          });
        }
      }
    } catch (error) {
      console.error('Failed to initialize Google Drive:', error);
      setIsAvailable(false);
      setMessage({ 
        type: 'error', 
        text: 'Failed to initialize Google Drive. Please check your configuration.' 
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignIn = async () => {
    setIsLoading(true);
    setMessage(null);
    
    // Check if encryption is already set up
    if (!isEncryptionAvailable()) {
      setIsLoading(false);
      setMessage({ 
        type: 'info', 
        text: 'You must set up encryption before signing in to Google Drive.' 
      });
      setPendingSignIn(true);
      openEncryptionModal('setup');
      return;
    }
    
    try {
      const success = await signInToGoogleDrive();
      if (success) {
        setIsSignedIn(true);
        
        // Wait a bit for the user info to be retrieved, then update
        setTimeout(async () => {
          await refreshGoogleUserInfo();
          const user = getCurrentGoogleUser();
          setCurrentUser(user);
          console.log('Updated currentUser state to:', user);
          
          // Load existing data from Google Drive
          console.log('Loading existing data from Google Drive...');
          const loaded = await handleLoadFromGoogleDrive();
          if (loaded) {
            setMessage({ type: 'success', text: 'Successfully signed in and loaded your encrypted data from Google Drive!' });
          } else {
            setMessage({ type: 'success', text: 'Successfully signed in to Google Drive! Your data will be encrypted before syncing.' });
          }
        }, 1000);
        
      } else {
        setMessage({ type: 'error', text: 'Failed to sign in to Google Drive.' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Sign-in was cancelled or failed.' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignOut = async () => {
    setIsLoading(true);
    try {
      await signOutFromGoogleDrive();
      setIsSignedIn(false);
      setCurrentUser(null);
      setMessage({ type: 'info', text: 'Signed out from Google Drive.' });
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to sign out.' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSync = async () => {
    if (!isSignedIn) return;
    
    // Enforce encryption requirement
    if (!isEncryptionAvailable()) {
      setMessage({ 
        type: 'error', 
        text: 'Encryption must be enabled before syncing to Google Drive.' 
      });
      openEncryptionModal('setup');
      return;
    }
    
    setIsLoading(true);
    setMessage(null);
    
    try {
      console.log('Manual sync initiated...');
      const tokenInfo = getGoogleDriveTokenInfo();
      console.log('Token info before sync:', tokenInfo);
      
      if (!tokenInfo.hasToken) {
        // Token might have expired, try to re-authenticate
        setMessage({ 
          type: 'warning', 
          text: 'Session expired. Please sign in again to continue syncing.' 
        });
        setIsSignedIn(false);
        setCurrentUser(null);
        return;
      }
      
      await syncAllToGoogleDrive({
        ACCOUNTS: accounts,
        TRANSACTIONS: transactions,
        ALLOCATIONS: allocations,
        SETTINGS: settings,
      });
      setMessage({ type: 'success', text: 'Data synced to Google Drive successfully (encrypted)!' });
    } catch (error) {
      console.error('Sync failed:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      
      // Check if this is an authentication error
      if (errorMessage.includes('token expired') || errorMessage.includes('Not authenticated')) {
        setMessage({ 
          type: 'warning', 
          text: 'Session expired. Please sign in again to continue syncing.' 
        });
        setIsSignedIn(false);
        setCurrentUser(null);
      } else {
        setMessage({ 
          type: 'error', 
          text: `Failed to sync data to Google Drive: ${errorMessage}` 
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

  const openEncryptionModal = (mode: 'setup' | 'unlock' | 'change') => {
    setEncryptionModalMode(mode);
    setShowEncryptionModal(true);
  };

  const handleEncryptionSetupSuccess = async () => {
    setEncryptionEnabled(true);
    setMessage({ 
      type: 'success', 
      text: 'Encryption enabled! Your data will now be encrypted before syncing to Google Drive.' 
    });
    
    // If this was a pending sign-in, proceed with sign-in now
    if (pendingSignIn) {
      setPendingSignIn(false);
      setTimeout(() => {
        handleSignIn();
      }, 1500);
    } 
    // If this was a pending load (unlock scenario), retry the load
    else if (pendingLoad) {
      setPendingLoad(false);
      setIsLoading(true);
      setMessage({ 
        type: 'info', 
        text: 'Loading your encrypted data from Google Drive...' 
      });
      
      setTimeout(async () => {
        try {
          const loaded = await handleLoadFromGoogleDrive();
          if (loaded) {
            setMessage({ type: 'success', text: 'Data loaded from Google Drive successfully!' });
          } else {
            setMessage({ type: 'info', text: 'No data found in Google Drive.' });
          }
        } catch (error) {
          console.error('Load after unlock failed:', error);
          setMessage({ type: 'error', text: 'Failed to load data from Google Drive.' });
        } finally {
          setIsLoading(false);
        }
      }, 500);
    }
    // If already signed in, offer to sync encrypted data
    else if (isSignedIn) {
      setTimeout(() => {
        setMessage({ 
          type: 'info', 
          text: 'Click "Sync Now" to upload your encrypted data to Google Drive.' 
        });
      }, 3000);
    }
  };

  // Show setup instructions if not configured
  if (!isConfigured) {
    return (
      <div className="p-4 bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800 rounded-lg">
        <h3 className="font-semibold text-blue-900 dark:text-blue-100 mb-3 flex items-center gap-2">
          <Cloud className="w-5 h-5" />
          Google Drive Sync
        </h3>
        
        <div className="text-sm text-blue-800 dark:text-blue-200 space-y-3">
          <p className="font-medium">Google Drive sync requires setup</p>
          <p>To enable cross-device sync:</p>
          <ol className="list-decimal list-inside space-y-1 ml-4">
            <li>Get Google Drive API credentials (one-time setup)</li>
            <li>Add your Client ID to the .env file</li>
            <li>Restart the development server</li>
          </ol>
          
          <a 
            href="https://console.cloud.google.com/"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 dark:bg-blue-700 text-white rounded hover:bg-blue-700 dark:hover:bg-blue-600 text-sm font-medium"
          >
            <ExternalLink className="w-4 h-4" />
            Open Google Cloud Console
          </a>
        </div>
      </div>
    );
  }

  // Show API not enabled error
  if (initError && initError.includes('API not enabled')) {
    return (
      <div className="p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg">
        <h3 className="font-semibold text-amber-900 dark:text-amber-100 mb-3 flex items-center gap-2">
          <AlertTriangle className="w-5 h-5" />
          Google Drive API Not Enabled
        </h3>
        
        <div className="text-sm text-amber-800 dark:text-amber-200 space-y-3">
          <p>The Google Drive API is not enabled in your Google Cloud project.</p>
          <p className="font-medium">To enable the API:</p>
          <ol className="list-decimal list-inside space-y-1 ml-4">
            <li>Go to the Google Cloud Console</li>
            <li>Select your project (ID: {import.meta.env.VITE_GOOGLE_CLIENT_ID?.split('-')[0] || 'Unknown'})</li>
            <li>Navigate to "APIs & Services" &gt; "Library"</li>
            <li>Search for "Google Drive API" and enable it</li>
            <li>Wait a few minutes and refresh this page</li>
          </ol>
          
          <div className="flex gap-2">
            <a 
              href="https://console.developers.google.com/apis/library/drive.googleapis.com"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-4 py-2 bg-amber-600 dark:bg-amber-700 text-white rounded hover:bg-amber-700 dark:hover:bg-amber-600 text-sm font-medium"
            >
              <ExternalLink className="w-4 h-4" />
              Enable Google Drive API
            </a>
            
            <button
              onClick={initializeGoogleDrive}
              className="inline-flex items-center gap-2 px-4 py-2 bg-gray-600 dark:bg-gray-700 text-white rounded hover:bg-gray-700 dark:hover:bg-gray-600 text-sm font-medium"
            >
              <Cloud className="w-4 h-4" />
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!isAvailable) {
    return (
      <div className="p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg">
        <div className="flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400 mt-0.5 flex-shrink-0" />
          <div className="text-sm text-amber-800 dark:text-amber-200">
            <p className="font-medium">Google Drive sync not available</p>
            {initError ? (
              <p className="mt-1">Error: {initError}</p>
            ) : (
              <p className="mt-1">This feature requires a modern browser with Google API support.</p>
            )}
            
            <button
              onClick={initializeGoogleDrive}
              className="mt-2 inline-flex items-center gap-2 px-3 py-1 bg-amber-600 dark:bg-amber-700 text-white rounded hover:bg-amber-700 dark:hover:bg-amber-600 text-sm"
            >
              <Cloud className="w-4 h-4" />
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/30 dark:to-indigo-900/30 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
        <h3 className="font-semibold text-blue-900 dark:text-blue-100 mb-3 flex items-center gap-2">
          <Cloud className="w-5 h-5" />
          Google Drive Sync (Encrypted)
        </h3>
        
        {message && (
          <div className={`mb-4 p-3 rounded ${
            message.type === 'success' 
              ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300' 
              : message.type === 'error'
              ? 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300'
              : message.type === 'warning'
              ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-800 dark:text-amber-300'
              : 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300'
          }`}>
            {message.text}
          </div>
        )}

        {/* Mandatory Encryption Banner */}
        <div className={`mb-4 p-3 rounded-lg border ${
          encryptionEnabled 
            ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800'
            : 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800'
        }`}>
          <div className="flex items-start gap-3">
            <Shield className={`w-5 h-5 flex-shrink-0 mt-0.5 ${
              encryptionEnabled 
                ? 'text-green-600 dark:text-green-400' 
                : 'text-red-600 dark:text-red-400'
            }`} />
            <div className="flex-1">
              <div className="flex items-center justify-between">
                <div>
                  <p className={`font-medium text-sm ${
                    encryptionEnabled 
                      ? 'text-green-900 dark:text-green-100' 
                      : 'text-red-900 dark:text-red-100'
                  }`}>
                    {encryptionEnabled ? 'Encryption Active (Required)' : 'Encryption Required'}
                  </p>
                  <p className={`text-sm mt-1 ${
                    encryptionEnabled 
                      ? 'text-green-800 dark:text-green-300' 
                      : 'text-red-800 dark:text-red-300'
                  }`}>
                    {encryptionEnabled 
                      ? 'All data is encrypted with AES-256 before storing on Google Drive. Only you can decrypt it with your password.'
                      : 'Google Drive sync requires encryption to protect your financial data. You must set up encryption before using sync features.'}
                  </p>
                </div>
              </div>
              <div className="mt-2 flex gap-2">
                {encryptionEnabled ? (
                  <button
                    onClick={() => openEncryptionModal('change')}
                    className="text-sm px-3 py-1.5 bg-green-600 dark:bg-green-700 text-white rounded hover:bg-green-700 dark:hover:bg-green-600"
                  >
                    Change Password
                  </button>
                ) : (
                  <button
                    onClick={() => openEncryptionModal('setup')}
                    className="text-sm px-3 py-1.5 bg-red-600 dark:bg-red-700 text-white rounded hover:bg-red-700 dark:hover:bg-red-600 flex items-center gap-1.5"
                  >
                    <Lock className="w-4 h-4" />
                    Set Up Encryption Now
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        {!isSignedIn ? (
          <div className="space-y-3">
            <p className="text-sm text-gray-600 dark:text-gray-300">
              Sign in with your Google account to sync your data across all devices. 
              Your data will be encrypted before storing in your personal Google Drive.
            </p>
            <div className="flex items-start gap-2 p-3 bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800 rounded">
              <Info className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-blue-800 dark:text-blue-300">
                <strong>Important:</strong> You must set up encryption before signing in. 
                {!encryptionEnabled && ' Click "Set Up Encryption Now" above to begin.'}
              </p>
            </div>
            <button
              onClick={handleSignIn}
              disabled={isLoading || !encryptionEnabled}
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 dark:bg-blue-700 text-white rounded hover:bg-blue-700 dark:hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
              title={!encryptionEnabled ? 'Set up encryption first' : ''}
            >
              {isLoading ? <Loader className="w-4 h-4 animate-spin" /> : <Cloud className="w-4 h-4" />}
              {isLoading ? 'Signing in...' : 'Sign in with Google'}
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-sm">
              <CheckCircle className="w-4 h-4 text-green-600 dark:text-green-400" />
              <span className="text-green-800 dark:text-green-300 font-medium">Signed in as:</span>
              <span className="text-gray-700 dark:text-gray-300">{currentUser || 'Google User'}</span>
            </div>
            
            <p className="text-sm text-gray-600 dark:text-gray-300">
              Your data is automatically encrypted and synced to Google Drive. Access it from any device by signing in with the same Google account and encryption password.
            </p>
            
            <div className="flex gap-2">
              <button
                onClick={handleSync}
                disabled={isLoading}
                className="inline-flex items-center gap-1.5 pl-3 pr-2 py-2 bg-green-600 dark:bg-green-700 text-white rounded hover:bg-green-700 dark:hover:bg-green-600 disabled:opacity-50"
              >
                {isLoading ? (
                  <Loader className="w-6 h-6 animate-spin" />
                ) : (
                  <div className="relative w-6 h-7 flex items-start justify-center">
                    <Cloud className="w-6 h-5 fill-current" />
                    <div className="absolute top-5 left-1/2 -translate-x-1/2">
                      <svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M6 10 L6 0 M6 0 L3 3 M6 0 L9 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </div>
                  </div>
                )}
                <span className="text-[15px]">{isLoading ? 'Syncing...' : 'Sync Now'}</span>
              </button>
              
              <button
                onClick={async () => {
                  setIsLoading(true);
                  try {
                    const loaded = await handleLoadFromGoogleDrive();
                    if (loaded) {
                      setMessage({ type: 'success', text: 'Data loaded from Google Drive successfully!' });
                    } else {
                      setMessage({ type: 'info', text: 'No data found in Google Drive or failed to load.' });
                    }
                  } catch (error) {
                    console.error('Load error:', error);
                    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
                    
                    // Check if this is an encryption error
                    if (errorMessage.includes('encrypted')) {
                      setMessage({ 
                        type: 'error', 
                        text: errorMessage 
                      });
                      if (!encryptionEnabled) {
                        setTimeout(() => {
                          openEncryptionModal('setup');
                        }, 2000);
                      }
                    } else if (errorMessage.includes('token expired') || errorMessage.includes('Not authenticated')) {
                      setMessage({ 
                        type: 'warning', 
                        text: 'Session expired. Please sign in again to continue.' 
                      });
                      setIsSignedIn(false);
                      setCurrentUser(null);
                    } else {
                      setMessage({ type: 'error', text: 'Failed to load data from Google Drive.' });
                    }
                  } finally {
                    setIsLoading(false);
                  }
                }}
                disabled={isLoading}
                className="inline-flex items-center gap-1.5 pl-3 pr-2 py-2 bg-blue-600 dark:bg-blue-700 text-white rounded hover:bg-blue-700 dark:hover:bg-blue-600 disabled:opacity-50"
              >
                {isLoading ? (
                  <Loader className="w-6 h-6 animate-spin" />
                ) : (
                  <div className="relative w-6 h-7 flex items-start justify-center">
                    <Cloud className="w-6 h-5 fill-current" />
                    <div className="absolute top-5 left-1/2 -translate-x-1/2">
                      <svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M6 0 L6 10 M6 10 L3 7 M6 10 L9 7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </div>
                  </div>
                )}
                <span className="text-[15px]">{isLoading ? 'Loading...' : 'Load from Drive'}</span>
              </button>
              
              <button
                onClick={handleSignOut}
                disabled={isLoading}
                className="inline-flex items-center gap-1.5 pl-3 pr-2 py-2 bg-gray-600 dark:bg-gray-700 text-white rounded hover:bg-gray-700 dark:hover:bg-gray-600 disabled:opacity-50"
              >
                <CloudOff className="w-6 h-6" />
                <span className="text-[15px]">Sign Out</span>
              </button>
            </div>
          </div>
        )}
      </div>

      <EncryptionSetupModal
        isOpen={showEncryptionModal}
        onClose={() => setShowEncryptionModal(false)}
        onSuccess={handleEncryptionSetupSuccess}
        mode={encryptionModalMode}
      />
    </div>
  );
};