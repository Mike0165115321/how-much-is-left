# How Much Is Left?

A comprehensive financial tracking application designed to help you manage your money across multiple bank accounts and services. This app features a powerful multi-bank transaction parser to automate your expense tracking.

## 🚀 Features

- **Multi-Bank Sync:** Automatically parse transaction notifications and data from major Thai banks:
  - SCB (Siam Commercial Bank)
  - KKP (Kiatnakin Phatra Bank)
  - K-Plus (Kasikorn Bank)
  - Krungthai Bank
  - TrueMoney Wallet
- **Financial Dashboard:** Get a bird's-eye view of your financial health with intuitive reports and charts.
- **Transaction Management:** Easily search, filter, and categorize your spending.
- **Goals & Lump Sums:** Set financial goals and track large expenditures separately.
- **Platform Support:** Built with Capacitor for a native Android experience.
- **Modern UI:** Clean, responsive interface built with React, Tailwind CSS, and Lucide icons.

## 🛠 Tech Stack

- **Frontend:** React 19, TypeScript
- **State Management:** Zustand
- **Styling:** Tailwind CSS 4
- **Icons & Animation:** Lucide React, Motion (Framer Motion)
- **Mobile Platform:** Capacitor 8
- **Build Tool:** Vite 6

## 📦 Getting Started

### Prerequisites

- Node.js (Latest LTS recommended)
- Android Studio (for Android development)

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/your-username/how-much-is-left.git
   cd how-much-is-left
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

### Development

Run the development server:
```bash
npm run dev
```

### Android Build

1. Build the web project:
   ```bash
   npm run build
   ```

2. Sync with Capacitor:
   ```bash
   npm run android:sync
   ```

3. Open in Android Studio:
   ```bash
   npm run android:open
   ```

## 📂 Project Structure

- `src/app/`: Page components and routing structure.
- `src/components/`: Reusable UI components.
- `src/core/parsers/`: Core logic for parsing bank transaction data.
- `src/store/`: State management using Zustand.
- `android/`: Native Android project files.

---

Built with ❤️ for better financial clarity.
