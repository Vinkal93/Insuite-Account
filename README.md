<p align="center">
  <img src="https://img.shields.io/badge/InSuite-Accounts-blueviolet?style=for-the-badge&logo=data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNCAyNCI+PHBhdGggZmlsbD0id2hpdGUiIGQ9Ik0yMSAxOHYxSDNhMiAyIDAgMCAxLTItMlY1YTIgMiAwIDAgMSAyLTJoMTRhMiAyIDAgMCAxIDIgMnYxNHptLTMtNkg2djRoMTJ2LTR6Ii8+PC9zdmc+" alt="InSuite Accounts"/>
</p>

<h1 align="center">🧾 InSuite Accounts</h1>

<p align="center">
  <b>Professional Accounting & Business Management Software</b><br/>
  <i>A Tally-alternative built for Indian businesses — GST ready, offline-first, modern UI</i>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/React-19-61DAFB?style=flat-square&logo=react" alt="React 19"/>
  <img src="https://img.shields.io/badge/TypeScript-5.9-3178C6?style=flat-square&logo=typescript" alt="TypeScript"/>
  <img src="https://img.shields.io/badge/Vite-7-646CFF?style=flat-square&logo=vite" alt="Vite"/>
  <img src="https://img.shields.io/badge/Dexie.js-IndexedDB-orange?style=flat-square" alt="Dexie"/>
  <img src="https://img.shields.io/badge/License-MIT-green?style=flat-square" alt="License"/>
  <img src="https://img.shields.io/badge/Made%20in-India%20🇮🇳-FF9933?style=flat-square" alt="Made in India"/>
</p>

---

## 📌 Overview

**InSuite Accounts** is a comprehensive, offline-first accounting application designed for Indian small and medium businesses. It serves as a modern, lightweight alternative to Tally with GST compliance, beautiful UI, and complete business management features.

> 💡 **Two versions included:**
> - **Vanilla JS version** — Lightweight, zero-dependency frontend (`index.html` + `js/`)
> - **React version** — Full-featured app with 18+ reports, export, print, shortcuts (`insuite-accounts/`)

---

## ✨ Features

### 📊 Accounting & Finance
| Feature | Description |
|---------|-------------|
| **Dashboard** | Real-time overview: income, expenses, profit, receivables with interactive charts |
| **General Ledger** | Double-entry bookkeeping with debit/credit entries and running balances |
| **Parties** | Customer & vendor management with GSTIN, contact, outstanding tracking |
| **Products/Inventory** | Product catalog with HSN codes, stock tracking, purchase & sale pricing |
| **Cash & Bank** | Multiple cash/bank accounts, deposits, withdrawals, transfers |

### 💸 Transactions
| Feature | Description |
|---------|-------------|
| **Sales Invoices** | Tax Invoice, Bill of Supply, Proforma Invoice with GST auto-calculation |
| **Purchase Bills** | Record purchases with vendor details, GST input tax credit |
| **Expenses** | Category-wise expense tracking with receipt management |

### 📈 Reports (18 Types)
| Category | Reports |
|----------|---------|
| **Accounting** | Profit & Loss · Balance Sheet · Trial Balance · Day Book · Cash Flow |
| **Sales & Purchase** | Sales Register · Purchase Register · Sales Summary · Purchase Summary |
| **Party & Ledger** | Party Ledger · Party Statement · Outstanding Receivables · Outstanding Payables |
| **Expense & Inventory** | Expense Report · Stock Summary |
| **GST & Tax** | GSTR-1 (B2B/B2C) · GSTR-3B Summary · GST Tax Summary |

### 📤 Multi-Format Export
- **CSV** — UTF-8 with proper escaping
- **PDF** — Professional layout with company header, formatted tables
- **Excel (XLSX)** — Proper spreadsheet with auto-sized columns
- **JSON** — Raw data for developers & integrations

### 🖨️ Professional Print System
- Formatted company header with business details
- Styled tables with alternating row colors
- Summary cards for key metrics
- Print-specific CSS for clean output
- Opens in new window for preview

### ⌨️ Keyboard Shortcuts (20+)
| Category | Shortcuts |
|----------|-----------|
| **Navigation** | `Ctrl+D` Dashboard · `Alt+1` Parties · `Alt+2` Products · `Alt+3-9` Other pages |
| **Quick Actions** | `F5` New Sale · `F6` New Purchase · `F7` New Party · `F8` New Expense · `F9` Reports |
| **Tools** | `Ctrl+K` Command Palette · `Ctrl+/` Shortcuts Help · `Ctrl+P` Print |
| **General** | `Escape` Close/Back · `Alt+F1` Go Back |

### 🔍 Command Palette (`Ctrl+K`)
- Fuzzy search across all pages, reports, parties, and products
- Keyboard navigable (Arrow keys + Enter)
- Instant navigation — just like VS Code!

### 🔔 Toast Notifications
- 4 variants: Success ✅ · Error ❌ · Warning ⚠️ · Info ℹ️
- Auto-dismiss with animated progress bar
- Stacked notifications support

### 🇮🇳 GST Compliance
- GST auto-calculation (CGST, SGST, IGST)
- GSTR-1 report with B2B/B2C segregation
- GSTR-3B summary with output tax & ITC
- GST filing dashboard with tax liability overview
- HSN code support for products

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| **Frontend** | React 19, TypeScript 5.9, Vite 7 |
| **Database** | Dexie.js (IndexedDB — fully offline) |
| **Charts** | Recharts (React) · Chart.js (Vanilla) |
| **PDF** | jsPDF |
| **Excel** | SheetJS (xlsx) |
| **Styling** | Custom CSS with Material Design 3 tokens |
| **Icons** | Google Material Symbols Rounded |
| **Fonts** | Inter · Outfit · Plus Jakarta Sans |

---

## 🚀 Getting Started

### Prerequisites
- **Node.js** 18+ and npm

### Installation

```bash
# Clone the repository
git clone https://github.com/Vinkal93/Insuite-Account.git
cd Insuite-Account

# ── React Version (Full-Featured) ──
cd insuite-accounts
npm install
npm run dev
# Open http://localhost:5173

# ── Vanilla JS Version ──
# Simply open index.html in your browser
# Or use Live Server extension in VS Code
```

### Build for Production

```bash
cd insuite-accounts
npm run build
npm run preview
```

---

## 📁 Project Structure

```
InSuite Accounts/
│
├── index.html              # Vanilla JS — Main HTML
├── styles.css              # Vanilla JS — Stylesheet
├── js/                     # Vanilla JS — Application Logic
│   ├── app.js              # Main controller
│   ├── storage.js          # LocalStorage data layer
│   ├── ui.js               # UI utilities & helpers
│   ├── ledger.js           # Ledger operations
│   ├── invoice.js          # Invoice management
│   ├── reports.js          # Report generation
│   └── gst.js              # GST calculations
│
├── insuite-accounts/       # React Version (Full-Featured)
│   ├── src/
│   │   ├── components/     # Reusable UI components
│   │   │   ├── Toast.tsx           # Notification system
│   │   │   ├── CommandPalette.tsx   # Ctrl+K search
│   │   │   ├── KeyboardShortcuts.tsx # Global shortcuts
│   │   │   ├── ConfirmModal.tsx     # Confirmation dialog
│   │   │   └── layout/             # Sidebar, TopBar, MainLayout
│   │   │
│   │   ├── pages/          # Application pages
│   │   │   ├── Dashboard.tsx    # Home dashboard
│   │   │   ├── Parties.tsx      # Customer/Vendor management
│   │   │   ├── Products.tsx     # Product/Inventory
│   │   │   ├── Sales.tsx        # Invoice creation
│   │   │   ├── Purchases.tsx    # Purchase bills
│   │   │   ├── Expenses.tsx     # Expense tracking
│   │   │   ├── CashBank.tsx     # Cash & Bank accounts
│   │   │   ├── Reports.tsx      # 18 report types
│   │   │   ├── GST.tsx          # GST dashboard
│   │   │   ├── Settings.tsx     # App settings
│   │   │   └── CompanySetup.tsx # Company wizard
│   │   │
│   │   ├── utils/           # Utility functions
│   │   │   ├── exportUtils.ts   # CSV, PDF, Excel, JSON export
│   │   │   ├── printUtils.ts    # Professional print system
│   │   │   └── reportHelpers.ts # Report data loaders
│   │   │
│   │   ├── db/              # Database (Dexie.js)
│   │   │   └── database.ts     # Schema, initialization, queries
│   │   │
│   │   ├── types/           # TypeScript interfaces
│   │   │   └── index.ts        # All type definitions
│   │   │
│   │   ├── context/         # React context providers
│   │   │   └── ThemeContext.tsx # Light/Dark theme
│   │   │
│   │   ├── App.tsx          # Root component
│   │   ├── main.tsx         # Entry point
│   │   └── index.css        # Global styles (1800+ lines)
│   │
│   ├── package.json
│   ├── tsconfig.json
│   └── vite.config.ts
│
└── README.md
```

---

## 📸 Screenshots

> Screenshots coming soon! Run the app locally to see the beautiful UI.

### Key Screens
- 🏠 **Dashboard** — Stats, charts, recent transactions, quick actions
- 📊 **Reports** — 18 report types in a card grid with instant generation
- 📤 **Export** — Dropdown with CSV/PDF/Excel/JSON options
- ⌨️ **Shortcuts** — Full overlay showing all 20+ keyboard shortcuts
- 🔍 **Command Palette** — Spotlight-like search across the entire app

---

## 🎨 Design Highlights

- **Material Design 3** inspired token system
- **Glassmorphism** effects with backdrop blur
- **Dark & Light** theme support
- **Smooth animations** — card entrances, hover effects, micro-interactions
- **Responsive** — works on desktop, tablet, and mobile
- **Mobile bottom navigation** for touch-friendly access

---

## 🗺️ Roadmap

- [x] Core accounting modules (Sales, Purchases, Expenses)
- [x] 18 report types with data analysis
- [x] Multi-format export (CSV, PDF, Excel, JSON)
- [x] Professional print system
- [x] 20+ keyboard shortcuts
- [x] Command Palette (Ctrl+K)
- [x] Toast notification system
- [x] GST compliance (GSTR-1, GSTR-3B)
- [ ] Multi-company support
- [ ] Credit/Debit notes
- [ ] Bank reconciliation
- [ ] E-Invoice integration
- [ ] Android app (Capacitor)
- [ ] Cloud sync & backup

---

## 👨‍💻 About the Developer

<h3 align="center">Vinkal Prajapati</h3>

<p align="center">
  <i>Developer · Educator · AI Researcher · Entrepreneur</i>
</p>

> *"Technology is not just about coding; it's about connecting people, solving problems, and shaping the world for better."*
> — **Vinkal Prajapati**

### 🧩 Who is Vinkal Prajapati?

| Attribute | Details |
|-----------|---------|
| **Full Name** | Vinkal Prajapati |
| **Profession** | Developer, Educator, AI Researcher |
| **Primary Skills** | Web Development, React.js, TypeScript, Tally Prime, AI Integration |
| **Known For** | Building smart tools & learning ecosystems |
| **Major Projects** | InSuite Accounts, Vinkal041 Chatbot, VinCom UI Library, Typing Tutor Platform |
| **Mission** | To simplify learning and development using AI-driven technologies |

### 💻 Developer Journey

Vinkal began his tech journey by exploring HTML, CSS, and JavaScript, later mastering frameworks like **React.js**, **TypeScript**, and **Next.js**. His passion for UI/UX perfection led him to build advanced, professional-grade applications that compete with modern standards.

From developing AI tools, custom web browsers, and React-based applications, to guiding students in **Tally Prime** and **CCC exams**, Vinkal stands out as a true multi-dimensional innovator.

### 🧰 Core Expertise

| Area | Skills / Tools |
|------|---------------|
| **Frontend** | HTML5, CSS3, JavaScript, React.js, TypeScript, Next.js |
| **Backend** | Node.js, Express.js, Firebase |
| **App Dev** | Android SDK, Gradle, Kotlin Basics, Capacitor |
| **Design & UX** | Figma, Tailwind CSS, Material UI, Material Design 3 |
| **AI Integration** | Chatbot Development, Automation Tools |
| **Education** | Tally Prime, Typing Tutor, CCC Exam Preparation |

### 🚀 Notable Projects

| Project | Description |
|---------|-------------|
| 🧾 **InSuite Accounts** | Professional accounting software — Tally alternative with GST, 18 reports, multi-format export |
| 💬 **Vinkal041 Chatbot** | Custom AI chatbot for intelligent conversation & teaching |
| 🧠 **VinCom UI Library** | 200+ reusable React components with live previews & NPM integration |
| 🧮 **Tally Prime Guide** | Structured learning series (V1–V10) with real-world accounting cases |
| ⌨️ **Typing Tutor** | Gamified typing platform with daily lessons & speed tracking |

### 🧑‍🏫 Educator & Mentor

Vinkal also runs a **Computer Institute**, helping students master:
- ✅ Tally Prime (all versions)
- ✅ CCC Exam Preparation (Bilingual Notes & PDFs)
- ✅ Typing Skill Development
- ✅ Python & Web Development Fundamentals

### 🌍 Connect with Vinkal

<p align="center">
  <a href="https://github.com/Vinkal93"><img src="https://img.shields.io/badge/GitHub-Vinkal93-181717?style=for-the-badge&logo=github" alt="GitHub"/></a>
  <a href="https://github.com/vinkal041"><img src="https://img.shields.io/badge/GitHub-vinkal041-181717?style=for-the-badge&logo=github" alt="GitHub Alt"/></a>
  <a href="https://linkedin.com/in/vinkal041"><img src="https://img.shields.io/badge/LinkedIn-vinkal041-0A66C2?style=for-the-badge&logo=linkedin" alt="LinkedIn"/></a>
  <a href="https://hashnode.com/@vinkal041"><img src="https://img.shields.io/badge/Hashnode-vinkal041-2962FF?style=for-the-badge&logo=hashnode" alt="Hashnode"/></a>
  <a href="https://vinkal041.blogspot.com"><img src="https://img.shields.io/badge/Blog-vinkal041-FF5722?style=for-the-badge&logo=blogger" alt="Blog"/></a>
</p>

### 💡 Vision & Goals

- 🎯 Build a complete **AI-driven learning ecosystem**
- 🎯 Create a verified **student hiring platform**
- 🎯 Launch **smart educational bots**
- 🎯 Promote **digital literacy** and self-learning culture in India

---

## 📄 License

This project is licensed under the **MIT License** — feel free to use, modify, and distribute.

---

<p align="center">
  <b>⭐ Star this repo if you find it useful!</b><br/><br/>
  <img src="https://img.shields.io/github/stars/Vinkal93/Insuite-Account?style=social" alt="Stars"/>
  <img src="https://img.shields.io/github/forks/Vinkal93/Insuite-Account?style=social" alt="Forks"/>
</p>
