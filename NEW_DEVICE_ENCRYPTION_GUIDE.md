# How to Access Your Encrypted Data on a New Device

## Quick Steps

### Option 1: Brand New Setup on Second Device

1. **Open app on Device 2**
2. **Sign in to Google Drive** (same account as Device 1)
3. **Click "Load from Drive"**
4. **You'll see**: "Encryption settings retrieved from cloud. Please unlock with your password."
5. **Enter your encryption password** (same one from Device 1)
6. **Done!** Your data will decrypt and load

### Option 2: After Changing Password on Device 1

1. **On Device 1**: Change encryption password
2. **On Device 1**: Click "Sync Now" (uploads new salt)
3. **On Device 2**: Sign in to Google Drive
4. **On Device 2**: Click "Load from Drive"
5. **You'll see**: "Encryption settings have changed. Please unlock with your password."
6. **Enter your NEW password** (the one you changed to)
7. **Done!** Your data decrypts with the new password

## What's Happening Behind the Scenes

### The Problem We Fixed

**Before:**
- Device 1: Password123 + SecretSalt1 = Key1
- Device 2: Password123 + ??? = Can't decrypt (no salt!)

**After:**
- Device 1: Password123 + SecretSalt1 = Key1
  - Uploads: `{encrypted: "data", salt: "SecretSalt1"}`
- Device 2: Downloads salt ? Password123 + SecretSalt1 = Key1 ?

### Why You Need to "Unlock" Again

When you load data from Google Drive on a new device:

1. The app downloads your encrypted files
2. It notices the **salt is different** (or missing locally)
3. It updates the local salt to match the cloud
4. But now the locally stored key is **invalid** (it was derived with the old salt)
5. So it clears the key and asks you to unlock
6. You enter your password ? new key is derived with correct salt ? decryption works!

## Troubleshooting

### "Encryption settings retrieved. Please unlock with your password."

**What it means:** You're on a new device (or cleared browser data).

**What to do:**
1. Enter your encryption password
2. System will derive the correct key using the salt from the cloud
3. Your data will decrypt

### "Encryption settings have changed. Please unlock again."

**What it means:** The encryption password was changed on another device.

**What to do:**
1. Enter your **new** encryption password (the one you changed to)
2. System updates your local encryption key
3. Your data will decrypt

### "Failed to decrypt. Please check your encryption password."

**What it means:** Wrong password or corrupted data.

**What to do:**
1. Double-check your password (case-sensitive!)
2. Make sure you're using the **current** password, not an old one
3. If you recently changed your password, use the **new** one

### Still Can't Access?

**Check these:**
- [ ] Are you signed in to the same Google account?
- [ ] Did you sync from Device 1 after changing password?
- [ ] Are you sure you're using the current password?
- [ ] Is Google Drive API enabled in your project?

**Last resort:**
1. Go to your original device (Device 1)
2. Export your data (Settings ? Export)
3. Send the file to Device 2 (email, USB, etc.)
4. Import on Device 2 (Settings ? Import)
5. Set up new encryption on Device 2
6. Sync to Google Drive

## Best Practices

### ? DO

- **Write down your password** in a secure location
- **Test on a second device** soon after setup
- **Sync after changing password** on all devices
- **Use a password manager** for your encryption password

### ? DON'T

- Forget your password (no recovery!)
- Use different passwords on different devices
- Change password without syncing
- Clear browser data without syncing first

## Common Scenarios

### Scenario 1: New Phone

**Steps:**
1. Open app on phone
2. Sign in to Google Drive
3. Load from Drive
4. Enter your encryption password
5. ? All your data appears!

### Scenario 2: New Laptop

**Steps:**
1. Install app on laptop
2. Go to Settings ? Sync
3. Set up encryption (wait! Don't create a new password!)
4. Actually, you'll be prompted to unlock, not set up
5. Enter your existing password
6. ? Data loads!

### Scenario 3: Changed Password Yesterday

**On your second device:**
1. Try to load data ? error
2. See message about encryption settings changed
3. Enter NEW password (the one you changed to yesterday)
4. ? Works with new password!

### Scenario 4: Completely Forgot Password

**Unfortunately:**
- Your cloud data is **permanently encrypted**
- Cannot be recovered without the password
- This is by design for security

**Options:**
1. Try to remember the password
2. Check your password manager
3. Check written notes (did you write it down?)
4. If you have local data, export and start fresh

## Technical Note

**Why does this work now?**

We fixed the system to store the **salt** (a random value used in encryption) with your cloud data. Now:

- Device 1 syncs: Uploads data + salt
- Device 2 loads: Downloads data + salt
- Device 2 uses: Your password + cloud salt = correct key
- Device 2 decrypts: ? Success!

The salt is not secret (it's designed to be public), so storing it with your encrypted data is secure. Only your password is secret.

---

**Remember:** Your encryption password is the ONLY way to access your encrypted cloud data. Write it down in a safe place!
