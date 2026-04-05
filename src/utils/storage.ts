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
