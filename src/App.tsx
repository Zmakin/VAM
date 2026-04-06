import React, { useEffect, useState } from 'react';
import { useStore } from './store/useStore';
import { SetupWizard } from './components/SetupWizard';
import { Dashboard } from './components/Dashboard';
import { ThemeProvider } from './contexts/ThemeContext';
import { 
  isGoogleDriveAvailable,
  isSignedInToGoogleDrive,
  loadAllFromGoogleDrive
} from './utils/storage';

function App() {
  const { settings, loadFromStorage, loadExternalData } = useStore();
  const [isInitializing, setIsInitializing] = useState(true);

  useEffect(() => {
    const initializeApp = async () => {
      // Give the page a moment to fully load before initializing
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // First, try to initialize Google Drive and load data from there
      let googleDriveDataLoaded = false;
      
      try {
        console.log('App startup: Initializing Google Drive...');
        const available = await isGoogleDriveAvailable();
        
        if (available && isSignedInToGoogleDrive()) {
          console.log('App startup: Google Drive available and signed in, attempting to load data...');
          const data = await loadAllFromGoogleDrive();
          
          if (data) {
            // Check if the loaded data is meaningful (not just empty defaults)
            const hasData = 
              (data.accounts && data.accounts.length > 0) ||
              (data.transactions && data.transactions.length > 0) ||
              (data.allocations && data.allocations.length > 0) ||
              (data.settings && data.settings.isSetupComplete);
            
            if (hasData) {
              console.log('App startup: Loading data from Google Drive at app startup');
              loadExternalData(data);
              googleDriveDataLoaded = true;
            } else {
              console.log('App startup: Google Drive data appears empty, will load from localStorage');
            }
          }
        } else {
          console.log('App startup: Google Drive not available or not signed in');
        }
      } catch (error) {
        console.log('App startup: Google Drive initialization failed or no data available:', error);
      }
      
      // Only load from localStorage if we didn't successfully load from Google Drive
      if (!googleDriveDataLoaded) {
        console.log('App startup: Loading data from localStorage');
        loadFromStorage();
      }
      
      // Mark initialization as complete
      setIsInitializing(false);
    };
    
    initializeApp();
  }, [loadFromStorage, loadExternalData]);

  // Show loading state during initialization
  if (isInitializing) {
    return (
      <ThemeProvider>
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600 dark:text-gray-400">Loading...</p>
          </div>
        </div>
      </ThemeProvider>
    );
  }

  return (
    <ThemeProvider>
      {!settings.isSetupComplete ? <SetupWizard /> : <Dashboard />}
    </ThemeProvider>
  );
}

export default App;
