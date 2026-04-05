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
- **Local Storage**: All data stored securely in your browser
- **Offline Support**: Works without an internet connection

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

## Tech Stack

- React 18 + TypeScript
- Vite
- Tailwind CSS
- Zustand (state management)
- Lucide React (icons)

## License

MIT License - see [LICENSE](LICENSE) for details.
