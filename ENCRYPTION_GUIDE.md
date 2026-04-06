# Google Drive Encryption Guide

## Overview

The Virtual Account Manager **requires client-side encryption** for Google Drive storage. Your financial data is automatically encrypted on your device before being uploaded to Google Drive, ensuring that even if someone gains unauthorized access to your Google Drive, they cannot read your data without your encryption password.

**Important: Encryption is mandatory when using Google Drive sync. You cannot sync to Google Drive without setting up encryption first.**

## How It Works

### Encryption Technology

- **Algorithm**: AES-GCM (256-bit) - Industry-standard encryption
- **Key Derivation**: PBKDF2 with 100,000 iterations
- **Random IVs**: Each file is encrypted with a unique initialization vector
- **Browser-Based**: All encryption happens in your browser using the Web Crypto API
- **Mandatory**: You must set up encryption before using Google Drive sync

### Security Model

1. **You create a password** - This is separate from your Google account password
2. **Key derivation** - Your password is used to generate a strong encryption key
3. **Data encryption** - All data is encrypted before being sent to Google Drive
4. **Storage** - Only encrypted data is stored on Google Drive
5. **Decryption** - Data is decrypted in your browser when you load it

### What This Protects Against

? **Google Drive breach** - Your data remains encrypted even if Google Drive is compromised  
? **Unauthorized access** - Someone accessing your Google Drive cannot read your financial data  
? **Shared computer** - Data is encrypted in the cloud, safe from other Google Drive users  
? **Data exposure** - No financial data ever stored unencrypted in the cloud

### What This Does NOT Protect Against

? **Lost password** - If you forget your encryption password, your data is **permanently unrecoverable**  
? **Local browser compromise** - Data is temporarily decrypted in your browser while you use it  
? **Keyloggers** - Malware on your device can still capture your password  

## Setup Guide

### Initial Setup (Required for Google Drive Sync)

1. **Set Up Encryption FIRST** (before signing in to Google Drive)
   - Go to Settings ? Sync
   - You'll see a red "Encryption Required" banner
   - Click "Set Up Encryption Now"
   - Create a strong password (minimum 8 characters, recommended 12+)
   - Confirm your password
   - Click "Enable Encryption"

2. **Sign in to Google Drive**
   - Now that encryption is set up, click "Sign in with Google"
   - Authorize the app to access your Google Drive
   - **Note**: You cannot sign in without encryption enabled

3. **Sync Your Data**
   - Click "Sync Now" to upload your encrypted data to Google Drive
   - All future syncs will automatically encrypt your data

### Password Recommendations

**Weak Password** (not recommended):
- `password123` - Too short, too common

**Medium Password**:
- `MyBudget2024!` - Better, but could be stronger

**Strong Password** (recommended):
- `Correct-Horse-Battery-Staple-2024` - Long, memorable, secure
- `My$avings4Vac@tion!2024` - Mix of characters, meaningful to you

**Tips**:
- Use at least 12 characters
- Mix uppercase, lowercase, numbers, and symbols
- Use a passphrase (multiple words) for better memory
- Don't reuse passwords from other accounts
- Consider using a password manager
- **Write it down in a safe place** - recovery is impossible!

## Using Encryption

### On Your Primary Device

After initial setup:
1. Sign in to Google Drive (encryption already configured)
2. Your data syncs automatically (always encrypted)
3. No additional steps needed

### On a New Device

When accessing your data from a new device:

1. **Set Up Encryption First**
   - You'll be prompted: "Set Up Encryption Now"
   - Enter the **same password** you used on your primary device
   - Click "Enable Encryption"

2. **Sign in to Google Drive**
   - After encryption is set up, sign in with Google
   - Authorize the app

3. **Load Your Data**
   - Click "Load from Drive"
   - Your data will be decrypted and loaded automatically

### Changing Your Password

If you need to change your encryption password:

1. Go to Settings ? Sync
2. Click "Change Password" in the encryption section
3. Enter your current password
4. Enter and confirm your new password
5. Click "Change Password"
6. Click "Sync Now" to upload re-encrypted data

**Note**: Changing your password re-encrypts all data automatically on the next sync.

## File Format

### Encrypted File Structure

All files on Google Drive are encrypted and look like this:

```json
{
  "encrypted": "base64-encoded-encrypted-data",
  "iv": "base64-encoded-initialization-vector",
  "version": 1,
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

**There is no unencrypted option** - all Google Drive data is always encrypted.

## Troubleshooting

### "Encryption is required for Google Drive sync"

**Problem**: Trying to sign in to Google Drive without setting up encryption.

**Solution**:
1. Click "Set Up Encryption Now" button
2. Create and confirm your encryption password
3. Then sign in to Google Drive

### "This file is encrypted. Please set up encryption to access it."

**Problem**: Encrypted data exists on Google Drive but encryption is not set up locally.

**Solution**:
1. Click "Set Up Encryption Now" or the modal will auto-open
2. Enter your encryption password (same one from original device)
3. Try loading data again

### "Failed to decrypt. Please check your encryption password."

**Problem**: Wrong password or corrupted data.

**Solution**:
1. Double-check your password (case-sensitive)
2. Make sure you're using the password from the original device
3. If you've forgotten the password, recovery is not possible

### Lost Password

**Problem**: You can't remember your encryption password.

**Unfortunately**: 
- There is no password recovery mechanism
- This is by design for security
- Your encrypted data cannot be decrypted without the password

**Options**:
1. Try to remember or find where you saved the password
2. If you have local data (not yet lost), export a backup
3. If all data is lost, you'll need to start fresh

**Prevention** (CRITICAL):
- **Write down your password** in a secure location
- Use a password manager
- Consider periodic exports as additional backup
- **Store your password before setting up sync!**

### "Encryption must be enabled before syncing to Google Drive"

**Problem**: Trying to sync without encryption configured.

**Solution**:
1. Set up encryption first (see Initial Setup above)
2. Then you can sync

## Security Best Practices

### DO:
? Use a strong, unique password  
? **Store your password in a password manager**  
? **Keep a written backup of your password in a safe place**  
? Set up encryption before your first sync  
? Use the same password on all devices  
? Test your password on a second device to ensure you remember it

### DON'T:
? Use a password you use elsewhere  
? Share your encryption password  
? Store your password in Google Drive (defeats the purpose!)  
? Use simple passwords like "12345678"  
? Forget to write down your password somewhere safe
? Try to sign in to Google Drive without encryption set up

## Technical Details

### Encryption Process

1. **Password ? Key Derivation**
   ```
   User Password ? PBKDF2(100k iterations) ? 256-bit AES Key
   ```

2. **Data ? Encryption**
   ```
   JSON Data ? AES-GCM Encryption ? Base64 Encoding ? Google Drive
   ```

3. **Storage**
   ```
   Local: Derived key stored in localStorage (session persistence)
   Cloud: Only encrypted data (no keys, no plaintext)
   ```

### Mandatory Encryption

- **Why**: Protects your sensitive financial data from unauthorized access
- **When**: Required before any Google Drive sync operation
- **Where**: Encryption happens entirely in your browser (client-side)
- **Who**: Only you have the decryption key (derived from your password)

### Key Storage

- **Encryption key**: Stored in browser localStorage (derived from password)
- **Salt**: Stored in browser localStorage (used for key derivation)
- **Password**: Never stored (only you know it)

**Security Note**: The encryption key is stored locally to avoid requiring password entry on every page refresh. If someone gains access to your browser's localStorage AND your encrypted Google Drive files, they could potentially decrypt your data. For maximum security, clear your browser data when not using the app.

### Browser Compatibility

The encryption feature requires modern browser support for:
- Web Crypto API
- SubtleCrypto
- AES-GCM

Supported browsers:
- Chrome 60+
- Firefox 57+
- Safari 11+
- Edge 79+

## FAQ

**Q: Why is encryption mandatory?**  
A: Your financial data is highly sensitive. We enforce encryption to ensure your data is protected, even if your Google Drive is compromised.

**Q: Can I disable encryption?**  
A: No. If you want to use Google Drive sync, encryption is required. If you don't want encryption, you can use local storage only (no cloud sync).

**Q: Is this as secure as bank-level encryption?**  
A: The encryption algorithm (AES-256) is the same standard used by banks and governments. However, overall security also depends on password strength and device security.

**Q: Can Google read my encrypted data?**  
A: No. Google only sees encrypted blobs of data. Without your password, the data is unreadable.

**Q: What happens if I forget my password?**  
A: Your data cannot be recovered. This is the trade-off for security - no backdoors means no recovery. **Write down your password!**

**Q: Can I use different passwords on different devices?**  
A: No. You must use the same encryption password on all devices to decrypt the same data.

**Q: Does encryption slow down syncing?**  
A: Slightly, but the difference is negligible for normal financial data sizes (usually <1MB).

**Q: Can I export encrypted data?**  
A: The export feature creates unencrypted JSON backups. The encryption only applies to Google Drive storage.

**Q: Is the encryption password the same as my Google password?**  
A: No, these are completely separate. Your encryption password is only for the VAM app.

**Q: What if I just want cloud sync without encryption?**  
A: That's not an option with this app. Encryption is mandatory for Google Drive sync to protect your sensitive financial data.

## Support

If you encounter issues with encryption:

1. Check this guide first
2. Review the browser console for error messages
3. Try the troubleshooting steps above
4. Create an issue on GitHub with details (never include your password!)

---

**Remember**: 
- Encryption is **MANDATORY** for Google Drive sync
- Your password **CANNOT BE RECOVERED** if you forget it
- **Write down your password** in a secure location before setting up sync
- Choose a password you can remember or store it securely in a password manager!
