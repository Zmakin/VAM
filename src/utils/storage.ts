import { googleDriveStorage } from './googleDriveStorage';

const STORAGE_KEYS = {
  ACCOUNTS: 'vam_accounts',
  TRANSACTIONS: 'vam_transactions',
  ALLOCATIONS: 'vam_allocations',
  SETTINGS: 'vam_settings',
} as const;

// File System Access API state
let fileSystemHandle: FileSystemDirectoryHandle | null = null;

export function loadFromLocalStorage<T>(key: keyof typeof STORAGE_KEYS, defaultValue: T): T {
  try {
    const stored = localStorage.getItem(STORAGE_KEYS[key]);
    if (stored) {
      return JSON.parse(stored) as T;
    }
  } catch (error) {
    console.error(`Error loading ${key} from localStorage:`, error);
  }
  return defaultValue;
}

export function saveToLocalStorage<T>(key: keyof typeof STORAGE_KEYS, data: T): void {
  try {
    localStorage.setItem(STORAGE_KEYS[key], JSON.stringify(data));
  } catch (error) {
    console.error(`Error saving ${key} to localStorage:`, error);
  }
}

export function clearAllStorage(): void {
  Object.values(STORAGE_KEYS).forEach(key => {
    localStorage.removeItem(key);
  });
}

// ============================================
// Google Drive Sync Functions
// ============================================

export async function saveToGoogleDrive<T>(key: keyof typeof STORAGE_KEYS, data: T): Promise<void> {
  try {
    if (!googleDriveStorage.isSignedInToGoogle()) {
      throw new Error('Not signed in to Google Drive');
    }
    
    const filename = `${STORAGE_KEYS[key]}.json`;
    await googleDriveStorage.saveData(filename, data);
  } catch (error) {
    console.error(`Error saving ${key} to Google Drive:`, error);
    throw error;
  }
}

export async function loadFromGoogleDrive<T>(key: keyof typeof STORAGE_KEYS, defaultValue: T): Promise<T> {
  try {
    if (!googleDriveStorage.isSignedInToGoogle()) {
      return defaultValue;
    }
    
    const filename = `${STORAGE_KEYS[key]}.json`;
    return await googleDriveStorage.loadData(filename, defaultValue);
  } catch (error) {
    console.error(`Error loading ${key} from Google Drive:`, error);
    return defaultValue;
  }
}

export async function loadAllFromGoogleDrive(): Promise<{
  accounts: any;
  transactions: any;
  allocations: any;
  settings: any;
} | null> {
  if (!googleDriveStorage.isSignedInToGoogle()) {
    return null;
  }

  try {
    console.log('Loading all data from Google Drive...');
    
    const [accounts, transactions, allocations, settings] = await Promise.all([
      googleDriveStorage.loadData('vam_accounts.json', []),
      googleDriveStorage.loadData('vam_transactions.json', []),
      googleDriveStorage.loadData('vam_allocations.json', []),
      googleDriveStorage.loadData('vam_settings.json', {}),
    ]);

    console.log('Loaded data from Google Drive:', {
      accounts: accounts.length,
      transactions: transactions.length,
      allocations: allocations.length,
      settings: Object.keys(settings).length
    });

    return { accounts, transactions, allocations, settings };
  } catch (error) {
    console.error('Failed to load data from Google Drive:', error);
    
    // If the error is due to authentication issues, return null instead of empty data
    if (error instanceof Error && 
        (error.message.includes('token expired') || 
         error.message.includes('Not authenticated') ||
         error.message.includes('Method doesn\'t allow unregistered callers'))) {
      console.log('Authentication error detected - not returning empty data');
      throw error; // Re-throw auth errors so they can be handled upstream
    }
    
    throw error;
  }
}

export async function syncAllToGoogleDrive(data: { [key: string]: any }): Promise<void> {
  if (!googleDriveStorage.isSignedInToGoogle()) {
    throw new Error('Not signed in to Google Drive');
  }

  console.log('Starting sync to Google Drive...', {
    tokenInfo: googleDriveStorage.getTokenInfo(),
    dataKeys: Object.keys(data)
  });

  try {
    const promises = Object.entries(STORAGE_KEYS).map(([key, filename]) => {
      const keyName = key as keyof typeof STORAGE_KEYS;
      const fileData = data[keyName];
      
      console.log(`Syncing ${keyName}:`, { filename: `${filename}.json`, hasData: !!fileData });
      
      return googleDriveStorage.saveData(`${filename}.json`, fileData);
    });

    await Promise.all(promises);
    console.log('All data synced successfully to Google Drive');
  } catch (error) {
    console.error('Failed to sync all data to Google Drive:', error);
    throw error;
  }
}

export async function isGoogleDriveAvailable(): Promise<boolean> {
  return await googleDriveStorage.initialize();
}

export function isGoogleDriveConfigured(): boolean {
  return googleDriveStorage.isConfigured();
}

export function getGoogleDriveError(): string | null {
  return googleDriveStorage.getInitializationError();
}

export function isSignedInToGoogleDrive(): boolean {
  return googleDriveStorage.isSignedInToGoogle();
}

export async function signInToGoogleDrive(): Promise<boolean> {
  return await googleDriveStorage.signIn();
}

export async function signOutFromGoogleDrive(): Promise<void> {
  await googleDriveStorage.signOut();
}

export function getCurrentGoogleUser(): string | null {
  return googleDriveStorage.getCurrentUser();
}

export function getGoogleDriveTokenInfo(): { hasToken: boolean; isSignedIn: boolean; user: string | null } {
  return googleDriveStorage.getTokenInfo();
}

export async function refreshGoogleUserInfo(): Promise<void> {
  await googleDriveStorage.refreshUserInfo();
}

// ============================================
// File System Access API (Chrome, Edge, Opera)
// ============================================

export async function isFileSystemAccessSupported(): Promise<boolean> {
  return 'showDirectoryPicker' in window;
}

export async function requestFileSystemAccess(): Promise<boolean> {
  try {
    if (!('showDirectoryPicker' in window)) {
      return false;
    }
    
    fileSystemHandle = await (window as any).showDirectoryPicker({
      suggestedName: 'VAM_Data',
      mode: 'readwrite',
      id: 'vam-storage',
    });
    
    return true;
  } catch (error) {
    if ((error as any).name !== 'AbortError') {
      console.error('File system access error:', error);
    }
    return false;
  }
}

export function hasFileSystemAccess(): boolean {
  return fileSystemHandle !== null;
}

export async function saveToFileSystem<T>(filename: string, data: T): Promise<void> {
  if (!fileSystemHandle) {
    throw new Error('File system access not granted. Please enable file storage first.');
  }

  try {
    const fileHandle = await fileSystemHandle.getFileHandle(filename, { create: true });
    const writable = await fileHandle.createWritable();
    await writable.write(JSON.stringify(data, null, 2));
    await writable.close();
  } catch (error) {
    console.error(`Error saving ${filename} to file system:`, error);
    throw error;
  }
}

export async function loadFromFileSystem<T>(filename: string, defaultValue: T): Promise<T> {
  if (!fileSystemHandle) {
    throw new Error('File system access not granted.');
  }

  try {
    const fileHandle = await fileSystemHandle.getFileHandle(filename);
    const file = await fileHandle.getFile();
    const text = await file.text();
    return JSON.parse(text) as T;
  } catch (error) {
    if ((error as any).name === 'NotFoundError') {
      return defaultValue;
    }
    console.error(`Error loading ${filename} from file system:`, error);
    throw error;
  }
}

export async function syncToFileSystem<T>(data: { [key: string]: T }): Promise<void> {
  if (!fileSystemHandle) return;

  try {
    for (const [key, value] of Object.entries(data)) {
      await saveToFileSystem(`${key}.json`, value);
    }
  } catch (error) {
    console.error('Error syncing to file system:', error);
  }
}

// ============================================
// Export/Import (Universal - All Browsers)
// ============================================

export interface ExportedData {
  version: string;
  exportedAt: string;
  accounts: any;
  transactions: any;
  allocations: any;
  settings: any;
}

export function exportData(data: ExportedData, filename?: string): void {
  try {
    const json = JSON.stringify(data, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = filename || `vam-backup-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    URL.revokeObjectURL(url);
  } catch (error) {
    console.error('Error exporting data:', error);
    throw error;
  }
}

export async function importData(): Promise<ExportedData> {
  return new Promise((resolve, reject) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    
    input.onchange = async (e: any) => {
      try {
        const file = e.target.files[0];
        if (!file) {
          reject(new Error('No file selected'));
          return;
        }
        
        const text = await file.text();
        const data = JSON.parse(text) as ExportedData;
        
        // Validate exported data structure
        if (!data.version || !data.exportedAt || !data.accounts || !data.transactions || !data.allocations || !data.settings) {
          reject(new Error('Invalid backup file format'));
          return;
        }
        
        resolve(data);
      } catch (error) {
        reject(error);
      }
    };
    
    input.onerror = () => reject(new Error('File selection failed'));
    
    // Trigger file picker
    input.click();
  });
}

export function createExportData(accounts: any, transactions: any, allocations: any, settings: any): ExportedData {
  return {
    version: '1.0',
    exportedAt: new Date().toISOString(),
    accounts,
    transactions,
    allocations,
    settings,
  };
}
