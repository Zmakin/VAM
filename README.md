# Virtual Account Manager (VAM)

A browser-based application for managing virtual sub-accounts within a single pooled bank account using the envelope budgeting method.

## Features

- **Virtual Accounts**: Create and manage multiple virtual "envelopes" for budgeting
- **Transactions**: Record income and expenses against specific accounts
- **Quick Transfers**: Move funds instantly between accounts
- **Recurring Transfers**: Schedule automatic transfers with flexible options:
  - Daily, weekly, biweekly, or monthly
  - Specific day of week or date
  - Start/end dates or indefinite
  - Automatic catch-up for missed executions
- **Dark Mode**: Toggle between light and dark themes for comfortable viewing
- **Google Drive Sync**: Optional cloud backup and synchronization across devices
- **Local Storage**: All data stored securely in your browser
- **Offline Support**: Works without an internet connection
- **Privacy-First**: Your data stays in your browser or your Google Drive

## Getting Started

### Prerequisites

- Node.js 18+
- npm

### Installation

```bash
# Clone the repository
git clone https://github.com/yourusername/virtual-account-manager.git
cd virtual-account-manager

# Install dependencies
npm install

# Start development server
npm run dev
```

Open `http://localhost:5173` in your browser.

### Optional: Google Drive Sync Setup

If you want to enable Google Drive synchronization:

1. Copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```

2. Follow the instructions in [GOOGLE_DRIVE_SETUP.md](GOOGLE_DRIVE_SETUP.md) to:
   - Create a Google Cloud project
   - Enable the Google Drive API
   - Get your OAuth Client ID
   - Add it to your `.env` file

**Note:** Google Drive sync is completely optional. The app works perfectly fine using only local browser storage.

### Build for Production

```bash
npm run build
```

Output will be in the `dist/` directory.

## Usage

1. **Setup**: Enter your bank name and configure initial virtual accounts
2. **Add Funds**: Click "+" on any account to record income
3. **Deduct Funds**: Click "-" to record expenses
4. **Transfer**: Move money between accounts instantly or set up recurring transfers
5. **Track**: View transaction history and account balances
6. **Dark Mode**: Toggle dark mode using the moon/sun icon in the header
7. **Sync** (optional): Sign in with Google Drive to backup and sync across devices

## Tech Stack

- React 18 + TypeScript
- Vite
- Tailwind CSS
- Zustand (state management)
- Lucide React (icons)
- Google Drive API (optional sync)

## Documentation

- [START_HERE.md](START_HERE.md) - Overview and getting started
- [GOOGLE_DRIVE_SETUP.md](GOOGLE_DRIVE_SETUP.md) - Google Drive sync setup guide
- [DARK_MODE_QUICK_REFERENCE.md](DARK_MODE_QUICK_REFERENCE.md) - Dark mode implementation details

## License

MIT License - see [LICENSE](LICENSE) for details.

## Privacy & Security

- All data is stored locally in your browser by default
- Google Drive sync is optional and requires your explicit consent
- Your data is never sent to any third-party servers (except Google Drive if you enable it)
- The Google Client ID in the code is safe to be public - it only identifies the app, not your data
- Each user's data stays completely separate in their own Google Drive
