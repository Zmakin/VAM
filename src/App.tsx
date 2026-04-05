import React, { useEffect } from 'react';
import { useStore } from './store/useStore';
import { SetupWizard } from './components/SetupWizard';
import { Dashboard } from './components/Dashboard';

function App() {
  const { settings, loadFromStorage } = useStore();

  useEffect(() => {
    loadFromStorage();
  }, [loadFromStorage]);

  if (!settings.isSetupComplete) {
    return <SetupWizard />;
  }

  return <Dashboard />;
}

export default App;
