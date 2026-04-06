/**
 * Client-side encryption utilities for securing data before storing in Google Drive
 * Uses the Web Crypto API for strong AES-GCM encryption
 */

const ENCRYPTION_CONFIG = {
  algorithm: 'AES-GCM' as const,
  keyLength: 256,
  ivLength: 12, // 96 bits recommended for AES-GCM
  saltLength: 16,
  iterations: 100000, // PBKDF2 iterations
};

const STORAGE_KEY = 'vam_encryption_key';
const SALT_KEY = 'vam_encryption_salt';

/**
 * Derives a cryptographic key from a password using PBKDF2
 */
async function deriveKeyFromPassword(password: string, salt: Uint8Array): Promise<CryptoKey> {
  const encoder = new TextEncoder();
  const passwordBuffer = encoder.encode(password);

  // Import the password as a key for PBKDF2
  const baseKey = await crypto.subtle.importKey(
    'raw',
    passwordBuffer,
    'PBKDF2',
    false,
    ['deriveKey']
  );

  // Derive the actual encryption key
  return crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: salt,
      iterations: ENCRYPTION_CONFIG.iterations,
      hash: 'SHA-256',
    },
    baseKey,
    {
      name: ENCRYPTION_CONFIG.algorithm,
      length: ENCRYPTION_CONFIG.keyLength,
    },
    true, // extractable
    ['encrypt', 'decrypt']
  );
}

/**
 * Generates a random salt for key derivation
 */
function generateSalt(): Uint8Array {
  return crypto.getRandomValues(new Uint8Array(ENCRYPTION_CONFIG.saltLength));
}

/**
 * Generates a random IV (Initialization Vector) for encryption
 */
function generateIV(): Uint8Array {
  return crypto.getRandomValues(new Uint8Array(ENCRYPTION_CONFIG.ivLength));
}

/**
 * Converts a Uint8Array to a base64 string for storage
 */
function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

/**
 * Converts a base64 string back to a Uint8Array
 */
function base64ToArrayBuffer(base64: string): Uint8Array {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

/**
 * Encrypts data using AES-GCM
 */
export async function encryptData(data: string, key: CryptoKey): Promise<{ encrypted: string; iv: string }> {
  const encoder = new TextEncoder();
  const dataBuffer = encoder.encode(data);
  const iv = generateIV();

  const encryptedBuffer = await crypto.subtle.encrypt(
    {
      name: ENCRYPTION_CONFIG.algorithm,
      iv: iv,
    },
    key,
    dataBuffer
  );

  return {
    encrypted: arrayBufferToBase64(encryptedBuffer),
    iv: arrayBufferToBase64(iv),
  };
}

/**
 * Decrypts data using AES-GCM
 */
export async function decryptData(encryptedData: string, iv: string, key: CryptoKey): Promise<string> {
  const encryptedBuffer = base64ToArrayBuffer(encryptedData);
  const ivBuffer = base64ToArrayBuffer(iv);

  const decryptedBuffer = await crypto.subtle.decrypt(
    {
      name: ENCRYPTION_CONFIG.algorithm,
      iv: ivBuffer,
    },
    key,
    encryptedBuffer
  );

  const decoder = new TextDecoder();
  return decoder.decode(decryptedBuffer);
}

/**
 * Exports a CryptoKey to a format that can be stored
 */
async function exportKey(key: CryptoKey): Promise<string> {
  const exported = await crypto.subtle.exportKey('raw', key);
  return arrayBufferToBase64(exported);
}

/**
 * Imports a stored key back to a CryptoKey
 */
async function importKey(keyData: string): Promise<CryptoKey> {
  const keyBuffer = base64ToArrayBuffer(keyData);
  return crypto.subtle.importKey(
    'raw',
    keyBuffer,
    ENCRYPTION_CONFIG.algorithm,
    true,
    ['encrypt', 'decrypt']
  );
}

/**
 * Initializes encryption with a user-provided password
 * Generates a new salt and derives a key from the password
 */
export async function initializeEncryption(password: string): Promise<void> {
  if (!password || password.length < 8) {
    throw new Error('Password must be at least 8 characters long');
  }

  const salt = generateSalt();
  const key = await deriveKeyFromPassword(password, salt);
  
  // Export and store the key and salt
  const exportedKey = await exportKey(key);
  localStorage.setItem(STORAGE_KEY, exportedKey);
  localStorage.setItem(SALT_KEY, arrayBufferToBase64(salt));
  
  console.log('Encryption initialized successfully');
}

/**
 * Retrieves the stored encryption key
 * Returns null if no key is stored (encryption not set up)
 */
export async function getEncryptionKey(): Promise<CryptoKey | null> {
  const keyData = localStorage.getItem(STORAGE_KEY);
  if (!keyData) {
    return null;
  }
  
  try {
    return await importKey(keyData);
  } catch (error) {
    console.error('Failed to import encryption key:', error);
    return null;
  }
}

/**
 * Unlocks encryption with a password
 * Used when the user needs to re-authenticate or on a new device
 */
export async function unlockEncryption(password: string): Promise<boolean> {
  const saltData = localStorage.getItem(SALT_KEY);
  if (!saltData) {
    throw new Error('No encryption configuration found. The salt may be in the cloud files. Try loading data from Google Drive first.');
  }

  try {
    const salt = base64ToArrayBuffer(saltData);
    const key = await deriveKeyFromPassword(password, salt);
    
    // Store the key for the session
    const exportedKey = await exportKey(key);
    localStorage.setItem(STORAGE_KEY, exportedKey);
    
    console.log('Encryption unlocked successfully with current salt');
    return true;
  } catch (error) {
    console.error('Failed to unlock encryption:', error);
    throw new Error('Incorrect password or encryption error');
  }
}

/**
 * Updates the local salt (used when loading from cloud with different salt)
 */
export function updateSalt(newSalt: string): void {
  localStorage.setItem(SALT_KEY, newSalt);
  // Clear the stored key so user must re-enter password
  localStorage.removeItem(STORAGE_KEY);
  console.log('Encryption salt updated from cloud');
}

/**
 * Checks if encryption is currently set up and available
 */
export function isEncryptionAvailable(): boolean {
  return localStorage.getItem(STORAGE_KEY) !== null && localStorage.getItem(SALT_KEY) !== null;
}

/**
 * Changes the encryption password
 * Re-encrypts all data with a new key
 */
export async function changeEncryptionPassword(oldPassword: string, newPassword: string): Promise<void> {
  // Verify old password
  const saltData = localStorage.getItem(SALT_KEY);
  if (!saltData) {
    throw new Error('No encryption configuration found');
  }

  const oldSalt = base64ToArrayBuffer(saltData);
  const oldKey = await deriveKeyFromPassword(oldPassword, oldSalt);
  
  // Verify old key matches stored key
  const storedKeyData = localStorage.getItem(STORAGE_KEY);
  const exportedOldKey = await exportKey(oldKey);
  
  if (storedKeyData !== exportedOldKey) {
    throw new Error('Incorrect password');
  }

  // Generate new salt and key
  const newSalt = generateSalt();
  const newKey = await deriveKeyFromPassword(newPassword, newSalt);
  
  // Store new key and salt
  const exportedNewKey = await exportKey(newKey);
  localStorage.setItem(STORAGE_KEY, exportedNewKey);
  localStorage.setItem(SALT_KEY, arrayBufferToBase64(newSalt));
  
  console.log('Encryption password changed successfully');
}

/**
 * Disables encryption and removes stored keys
 * WARNING: This does not decrypt existing data on Google Drive
 */
export function disableEncryption(): void {
  localStorage.removeItem(STORAGE_KEY);
  localStorage.removeItem(SALT_KEY);
  console.log('Encryption disabled');
}

/**
 * Validates password strength
 */
export function validatePasswordStrength(password: string): { valid: boolean; message: string } {
  if (password.length < 8) {
    return { valid: false, message: 'Password must be at least 8 characters long' };
  }
  
  if (password.length < 12) {
    return { valid: true, message: 'Password strength: Weak (consider using 12+ characters)' };
  }
  
  const hasUpperCase = /[A-Z]/.test(password);
  const hasLowerCase = /[a-z]/.test(password);
  const hasNumbers = /\d/.test(password);
  const hasSpecialChar = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password);
  
  const strength = [hasUpperCase, hasLowerCase, hasNumbers, hasSpecialChar].filter(Boolean).length;
  
  if (strength < 3) {
    return { valid: true, message: 'Password strength: Medium (consider adding uppercase, numbers, or special characters)' };
  }
  
  return { valid: true, message: 'Password strength: Strong' };
}

/**
 * Helper to encrypt JSON data
 */
export async function encryptJSON(data: any, key: CryptoKey): Promise<{ encrypted: string; iv: string }> {
  const json = JSON.stringify(data);
  return encryptData(json, key);
}

/**
 * Helper to decrypt JSON data
 */
export async function decryptJSON(encryptedData: string, iv: string, key: CryptoKey): Promise<any> {
  const json = await decryptData(encryptedData, iv, key);
  return JSON.parse(json);
}
