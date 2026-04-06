interface GoogleAuthResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
  scope: string;
}

interface GoogleDriveFile {
  id: string;
  name: string;
  modifiedTime: string;
}

interface StoredAuthState {
  accessToken: string;
  expiresAt: number;
  isSignedIn: boolean;
  currentUser: string | null;
}

const GOOGLE_DRIVE_CONFIG = {
  CLIENT_ID: import.meta.env.VITE_GOOGLE_CLIENT_ID || '',
  SCOPES: 'https://www.googleapis.com/auth/drive.file https://www.googleapis.com/auth/userinfo.email',
  DISCOVERY_DOCS: ['https://www.googleapis.com/discovery/v1/apis/drive/v3/rest'],
  FOLDER_NAME: 'Virtual Account Manager Data',
  FILES: {
    ACCOUNTS: 'vam_accounts.json',
    TRANSACTIONS: 'vam_transactions.json',
    ALLOCATIONS: 'vam_allocations.json',
    SETTINGS: 'vam_settings.json',
  }
};

const AUTH_STORAGE_KEY = 'vam_google_auth_state';

class GoogleDriveStorage {
  private accessToken: string | null = null;
  private tokenExpiresAt: number = 0;
  private folderId: string | null = null;
  private isInitialized = false;
  private tokenClient: any = null;
  private isSignedIn = false;
  private currentUser: string | null = null;
  private initializationError: string | null = null;

  async initialize(): Promise<boolean> {
    if (this.isInitialized) return true;
    if (this.initializationError) return false;

    try {
      console.log('Initializing Google Drive API...');
      
      // Check if client ID is configured
      if (!GOOGLE_DRIVE_CONFIG.CLIENT_ID) {
        this.initializationError = 'Google Client ID not configured';
        console.error(this.initializationError);
        return false;
      }

      // Restore authentication state from localStorage
      this.restoreAuthState();
      
      // Load Google Identity Services and Google API Client
      await this.loadGoogleScripts();
      
      // Wait for gapi to be available
      if (typeof window.gapi === 'undefined') {
        throw new Error('Google API client failed to load');
      }

      // Initialize Google API Client
      await new Promise<void>((resolve, reject) => {
        window.gapi.load('client', async () => {
          try {
            await window.gapi.client.init({
              discoveryDocs: GOOGLE_DRIVE_CONFIG.DISCOVERY_DOCS,
            });
            console.log('Google API client initialized');
            resolve();
          } catch (error) {
            reject(error);
          }
        });
      });

      // Check if google accounts is available
      if (typeof window.google?.accounts?.oauth2 === 'undefined') {
        throw new Error('Google Identity Services failed to load');
      }

      // Initialize Google Identity Services Token Client
      this.tokenClient = window.google.accounts.oauth2.initTokenClient({
        client_id: GOOGLE_DRIVE_CONFIG.CLIENT_ID,
        scope: GOOGLE_DRIVE_CONFIG.SCOPES,
        callback: (response: any) => {
          if (response.error) {
            console.error('Google token error:', response.error);
            return;
          }
          
          this.accessToken = response.access_token;
          this.tokenExpiresAt = Date.now() + (response.expires_in * 1000);
          this.isSignedIn = true;
          
          // Save auth state to localStorage
          this.saveAuthState();
          
          // Get user info - but don't fail if this doesn't work
          this.getUserInfo().then(userInfo => {
            this.currentUser = userInfo?.email || userInfo?.name || 'Google User';
            console.log('Successfully signed in as:', this.currentUser);
            console.log('User info details:', userInfo);
            
            // Update saved auth state with user info
            this.saveAuthState();
          }).catch(err => {
            console.warn('Failed to get user info, but sign-in successful:', err);
            this.currentUser = 'Google User'; // Fallback name
            this.saveAuthState();
          });

          // Ensure app folder exists
          this.ensureAppFolder().catch(err => {
            console.error('Failed to ensure app folder:', err);
            // Don't fail initialization if folder creation fails
            // This could be due to API not being enabled
          });
        }
      });

      this.isInitialized = true;
      
      // If we restored a valid token, ensure app folder exists
      if (this.hasValidToken()) {
        console.log('Restored valid authentication state from localStorage');
        try {
          await this.ensureAppFolder();
        } catch (err) {
          console.warn('Failed to ensure app folder on restore:', err);
        }
      }
      
      console.log('Google Drive API initialized successfully');
      return true;
    } catch (error) {
      console.error('Failed to initialize Google Drive API:', error);
      this.initializationError = error instanceof Error ? error.message : 'Unknown initialization error';
      return false;
    }
  }

  private saveAuthState(): void {
    try {
      const authState: StoredAuthState = {
        accessToken: this.accessToken || '',
        expiresAt: this.tokenExpiresAt,
        isSignedIn: this.isSignedIn,
        currentUser: this.currentUser,
      };
      localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(authState));
      console.log('Saved auth state to localStorage:', {
        hasToken: !!this.accessToken,
        expiresAt: new Date(this.tokenExpiresAt).toLocaleString(),
        isSignedIn: this.isSignedIn,
        user: this.currentUser
      });
    } catch (error) {
      console.warn('Failed to save auth state:', error);
    }
  }

  private restoreAuthState(): void {
    try {
      const stored = localStorage.getItem(AUTH_STORAGE_KEY);
      if (!stored) return;

      const authState: StoredAuthState = JSON.parse(stored);
      
      // Check if token is still valid (with 5 minute buffer)
      const now = Date.now();
      const tokenBuffer = 5 * 60 * 1000; // 5 minutes
      
      if (authState.expiresAt > now + tokenBuffer && authState.accessToken) {
        this.accessToken = authState.accessToken;
        this.tokenExpiresAt = authState.expiresAt;
        this.isSignedIn = authState.isSignedIn;
        this.currentUser = authState.currentUser;
        
        console.log('Restored valid auth state:', {
          user: this.currentUser,
          expiresAt: new Date(this.tokenExpiresAt).toLocaleString(),
          timeUntilExpiry: Math.round((this.tokenExpiresAt - now) / (60 * 1000)) + ' minutes'
        });
      } else {
        // Token is expired or about to expire, clear it
        console.log('Stored token is expired or about to expire, clearing auth state');
        this.clearAuthState();
      }
    } catch (error) {
      console.warn('Failed to restore auth state:', error);
      this.clearAuthState();
    }
  }

  private clearAuthState(): void {
    this.accessToken = null;
    this.tokenExpiresAt = 0;
    this.isSignedIn = false;
    this.currentUser = null;
    this.folderId = null;
    
    try {
      localStorage.removeItem(AUTH_STORAGE_KEY);
    } catch (error) {
      console.warn('Failed to clear auth state from localStorage:', error);
    }
  }

  isConfigured(): boolean {
    return !!GOOGLE_DRIVE_CONFIG.CLIENT_ID;
  }

  getInitializationError(): string | null {
    return this.initializationError;
  }

  private async loadGoogleScripts(): Promise<void> {
    // Load Google API
    await this.loadScript('https://apis.google.com/js/api.js');
    
    // Load Google Identity Services
    await this.loadScript('https://accounts.google.com/gsi/client');
    
    console.log('Google scripts loaded successfully');
  }

  private loadScript(src: string): Promise<void> {
    return new Promise((resolve, reject) => {
      // Check if script is already loaded
      const existingScript = document.querySelector(`script[src="${src}"]`);
      if (existingScript) {
        resolve();
        return;
      }

      const script = document.createElement('script');
      script.src = src;
      script.onload = () => resolve();
      script.onerror = () => reject(new Error(`Failed to load ${src}`));
      document.head.appendChild(script);
    });
  }

  async signIn(): Promise<boolean> {
    try {
      console.log('Attempting Google Drive sign-in...');
      
      if (!this.isInitialized) {
        const initialized = await this.initialize();
        if (!initialized) return false;
      }

      // If we already have a valid token, don't request a new one
      if (this.hasValidToken()) {
        console.log('Already have valid token, skipping sign-in');
        return true;
      }

      if (!this.tokenClient) {
        console.error('Token client not initialized');
        return false;
      }

      // Request access token
      return new Promise((resolve) => {
        const originalCallback = this.tokenClient.callback;
        
        this.tokenClient.callback = (response: any) => {
          // Restore original callback
          this.tokenClient.callback = originalCallback;
          
          if (response.error) {
            console.error('Sign-in failed:', response.error);
            resolve(false);
          } else {
            // Call original callback to set up state
            originalCallback(response);
            resolve(true);
          }
        };

        this.tokenClient.requestAccessToken();
      });
    } catch (error) {
      console.error('Google Drive sign-in failed:', error);
      return false;
    }
  }

  async signOut(): Promise<void> {
    if (this.accessToken && window.google?.accounts?.oauth2) {
      window.google.accounts.oauth2.revoke(this.accessToken, () => {
        console.log('Access token revoked');
      });
    }
    
    this.clearAuthState();
  }

  isSignedInToGoogle(): boolean {
    return this.isSignedIn && this.hasValidToken();
  }

  getCurrentUser(): string | null {
    return this.currentUser;
  }

  // Add method to check if we have a valid access token
  hasValidToken(): boolean {
    if (!this.accessToken) return false;
    
    // Check if token is still valid (with 5 minute buffer)
    const now = Date.now();
    const tokenBuffer = 5 * 60 * 1000; // 5 minutes
    
    return this.tokenExpiresAt > now + tokenBuffer;
  }

  // Add method to get token info for debugging
  getTokenInfo(): { hasToken: boolean; isSignedIn: boolean; user: string | null } {
    return {
      hasToken: this.hasValidToken(),
      isSignedIn: this.isSignedIn,
      user: this.currentUser,
    };
  }

  // Add method to manually refresh user info
  async refreshUserInfo(): Promise<void> {
    if (!this.hasValidToken()) return;
    
    try {
      const userInfo = await this.getUserInfo();
      this.currentUser = userInfo?.email || userInfo?.name || 'Google User';
      console.log('Refreshed user info:', this.currentUser, userInfo);
      this.saveAuthState();
    } catch (error) {
      console.warn('Failed to refresh user info:', error);
    }
  }

  private async getUserInfo(): Promise<any> {
    if (!this.hasValidToken()) return null;

    try {
      const response = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
        },
      });

      if (!response.ok) {
        console.warn('Failed to get user info:', response.status, response.statusText);
        // If we can't get user info, try to extract it from the token or use a fallback
        return null;
      }
      return await response.json();
    } catch (error) {
      console.error('Failed to get user info:', error);
      return null;
    }
  }

  private async ensureAppFolder(): Promise<void> {
    try {
      if (!this.hasValidToken()) {
        throw new Error('Not authenticated or token expired');
      }

      // Set the access token in gapi client before making API calls
      window.gapi.client.setToken({
        access_token: this.accessToken
      });

      // Search for existing folder
      const response = await window.gapi.client.drive.files.list({
        q: `name='${GOOGLE_DRIVE_CONFIG.FOLDER_NAME}' and mimeType='application/vnd.google-apps.folder' and trashed=false`,
        spaces: 'drive',
      });

      if (response.result.files && response.result.files.length > 0) {
        this.folderId = response.result.files[0].id;
        console.log('Found existing app folder:', this.folderId);
      } else {
        // Create the folder
        const createResponse = await window.gapi.client.drive.files.create({
          resource: {
            name: GOOGLE_DRIVE_CONFIG.FOLDER_NAME,
            mimeType: 'application/vnd.google-apps.folder',
          },
        });
        this.folderId = createResponse.result.id;
        console.log('Created new app folder:', this.folderId);
      }
    } catch (error) {
      console.error('Failed to ensure app folder:', error);
      
      // Check if this is the API not enabled error
      if (error && typeof error === 'object' && 'body' in error) {
        try {
          const errorBody = JSON.parse((error as any).body);
          if (errorBody.error?.code === 403 && errorBody.error?.message?.includes('Google Drive API has not been used')) {
            // This is the API not enabled error - we should handle this gracefully
            console.warn('Google Drive API is not enabled in the project. User needs to enable it.');
            this.initializationError = 'Google Drive API not enabled in project';
            return;
          }
        } catch (parseError) {
          // Ignore parsing errors
        }
      }
      
      throw error;
    }
  }

  async saveData<T>(filename: string, data: T): Promise<void> {
    if (!this.hasValidToken()) {
      throw new Error('Not authenticated or token expired - please sign in again');
    }
    
    // Set the access token in gapi client before making API calls
    window.gapi.client.setToken({
      access_token: this.accessToken
    });
    
    if (!this.folderId) {
      console.log('No folder ID, attempting to ensure app folder exists...');
      await this.ensureAppFolder();
      if (!this.folderId) {
        throw new Error('Unable to create or access Google Drive folder');
      }
    }

    try {
      const content = JSON.stringify(data, null, 2);

      // Check if file exists
      const existingFile = await this.findFile(filename);
      
      if (existingFile) {
        // Update existing file
        console.log(`Updating existing file: ${filename}`);
        await this.uploadFile(content, existingFile.id, true);
      } else {
        // Create new file
        console.log(`Creating new file: ${filename}`);
        await this.uploadFile(content, null, false, filename);
      }
      
      console.log(`Successfully saved ${filename} to Google Drive`);
    } catch (error) {
      console.error(`Failed to save ${filename} to Google Drive:`, error);
      throw error;
    }
  }

  async loadData<T>(filename: string, defaultValue: T): Promise<T> {
    if (!this.hasValidToken() || !this.folderId) {
      return defaultValue;
    }

    // Set the access token in gapi client before making API calls
    window.gapi.client.setToken({
      access_token: this.accessToken
    });

    try {
      const file = await this.findFile(filename);
      if (!file) {
        return defaultValue;
      }

      const response = await fetch(`https://www.googleapis.com/drive/v3/files/${file.id}?alt=media`, {
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
        },
      });

      if (!response.ok) {
        return defaultValue;
      }

      const content = await response.text();
      return JSON.parse(content) as T;
    } catch (error) {
      console.error(`Failed to load ${filename} from Google Drive:`, error);
      return defaultValue;
    }
  }

  private async findFile(filename: string): Promise<GoogleDriveFile | null> {
    try {
      // Ensure token is set before making the call
      window.gapi.client.setToken({
        access_token: this.accessToken
      });

      const response = await window.gapi.client.drive.files.list({
        q: `name='${filename}' and parents in '${this.folderId}' and trashed=false`,
        spaces: 'drive',
      });

      if (response.result.files && response.result.files.length > 0) {
        return response.result.files[0] as GoogleDriveFile;
      }
      return null;
    } catch (error) {
      console.error('Failed to find file:', error);
      return null;
    }
  }

  private async uploadFile(content: string, fileId?: string | null, isUpdate = false, filename?: string): Promise<void> {
    const boundary = '-------314159265358979323846';
    const delimiter = "\r\n--" + boundary + "\r\n";
    const close_delim = "\r\n--" + boundary + "--";

    const metadata = isUpdate ? {} : {
      name: filename,
      parents: [this.folderId],
    };

    const multipartRequestBody =
      delimiter +
      'Content-Type: application/json\r\n\r\n' +
      JSON.stringify(metadata) +
      delimiter +
      'Content-Type: application/json\r\n\r\n' +
      content +
      close_delim;

    const url = isUpdate && fileId 
      ? `https://www.googleapis.com/upload/drive/v3/files/${fileId}?uploadType=multipart`
      : 'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart';

    const response = await fetch(url, {
      method: isUpdate ? 'PATCH' : 'POST',
      headers: {
        'Content-Type': `multipart/related; boundary="${boundary}"`,
        'Authorization': `Bearer ${this.accessToken}`,
      },
      body: multipartRequestBody,
    });

    if (!response.ok) {
      throw new Error(`Upload failed: ${response.statusText}`);
    }
  }

  async getLastModified(): Promise<Record<string, string>> {
    const lastModified: Record<string, string> = {};
    
    if (!this.hasValidToken() || !this.folderId) {
      return lastModified;
    }

    // Set the access token in gapi client before making API calls
    window.gapi.client.setToken({
      access_token: this.accessToken
    });
    
    for (const [key, filename] of Object.entries(GOOGLE_DRIVE_CONFIG.FILES)) {
      try {
        const file = await this.findFile(filename);
        if (file) {
          lastModified[key] = file.modifiedTime;
        }
      } catch (error) {
        console.warn(`Failed to get last modified time for ${filename}:`, error);
      }
    }
    
    return lastModified;
  }
}

// Global instance
export const googleDriveStorage = new GoogleDriveStorage();

// Declare global types for new Google Identity Services
declare global {
  interface Window {
    gapi: any;
    google: {
      accounts: {
        oauth2: {
          initTokenClient: (config: any) => any;
          revoke: (token: string, callback: () => void) => void;
        };
      };
    };
  }
}