# 💎 DompetKu — Smart Finance Tracker

**DompetKu** adalah personal finance tracker modern yang dibangun untuk membantu kamu mengelola keuangan sehari-hari dengan mudah. Dilengkapi dengan smart insights, budgeting system, savings goals, dan visualisasi data yang intuitif.

🌐 **Live Demo:** [dompetku-alpha.vercel.app](https://dompetku-alpha.vercel.app)

---

## ✨ Features

### 📊 Dashboard
- Ringkasan saldo, pemasukan & pengeluaran bulanan
- Pie chart breakdown pengeluaran per kategori
- Area chart kumulatif harian
- Transaksi terbaru dengan quick actions

### 🎯 Budgeting System
- Set budget per kategori per bulan
- Progress bar real-time dengan color-coded status
- Warning otomatis ketika mendekati atau melebihi limit

### ⭐ Savings Goals
- Buat target menabung dengan deadline
- Track progress otomatis
- Kalkulasi berapa yang harus ditabung per bulan

### 🧠 Smart Insights
- Analisis savings rate dengan saran personal
- Perbandingan pengeluaran vs bulan sebelumnya
- Deteksi hari paling boros
- Prediksi pengeluaran akhir bulan
- Budget warnings otomatis

### 🔐 Authentication & Cloud Sync
- Login dengan Google (OAuth 2.0)
- Data tersimpan di cloud — akses dari device manapun
- Row Level Security (RLS) — data kamu hanya bisa diakses oleh kamu

### 📱 Progressive Web App (PWA)
- Installable di HP dan desktop
- Offline-capable dengan Service Worker
- Responsive design untuk semua ukuran layar

### 🇮🇩 Localized for Indonesia
- Kategori lokal: Kos/Kontrakan, GoRide/Grab, Pulsa & Data, Sembako, Zakat/Infaq
- Format mata uang Rupiah (IDR)
- Sumber pemasukan: Gaji, Freelance, Transfer Ortu, Bisnis

### 📄 Export & Backup
- Export transaksi ke CSV
- Full backup ke JSON
- Import dari JSON backup

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| **Framework** | Next.js 16 (App Router) |
| **Language** | TypeScript |
| **Styling** | Tailwind CSS 4 |
| **Charts** | Recharts |
| **Database** | Supabase (PostgreSQL) |
| **Auth** | Supabase Auth + Google OAuth |
| **Deployment** | Vercel |
| **PWA** | Service Worker + Web Manifest |

---

## 📁 Project Structure

```
dompetku/
├── app/
│   ├── globals.css        # Global styles
│   ├── layout.tsx         # Root layout with PWA meta
│   └── page.tsx           # Main application page
├── components/
│   ├── BudgetForm.tsx     # Budget setting modal
│   ├── ChartTooltip.tsx   # Custom chart tooltip
│   ├── GoalForm.tsx       # Savings goal modal
│   ├── Modal.tsx          # Reusable modal shell
│   ├── TransactionForm.tsx # Add/edit transaction modal
│   └── TxItem.tsx         # Transaction list item
├── lib/
│   ├── constants.ts       # Categories, months, days
│   ├── export.ts          # CSV & JSON export helpers
│   ├── insights.ts        # AI insights engine
│   ├── storage.ts         # Supabase CRUD operations
│   ├── supabase.ts        # Supabase client
│   └── utils.ts           # Formatters & helpers
├── types/
│   └── index.ts           # TypeScript type definitions
├── public/
│   ├── manifest.json      # PWA manifest
│   ├── sw.js              # Service Worker
│   ├── icon-192.png       # PWA icon
│   └── icon-512.png       # PWA icon large
└── .env.local             # Environment variables (not in repo)
```

---

## 🚀 Getting Started

### Prerequisites

- Node.js >= 20.9.0
- npm
- Supabase account (free tier)
- Google Cloud Console (for OAuth)

### 1. Clone the repo

```bash
git clone https://github.com/Gerry-techx/dompetku.git
cd dompetku
npm install
```

### 2. Setup Supabase

Create a new Supabase project, then run this SQL in the SQL Editor:

```sql
-- Create tables
create table transactions (
  id text primary key,
  user_id uuid references auth.users(id) on delete cascade,
  type text not null check (type in ('income', 'expense')),
  amount numeric not null,
  category text not null,
  note text default '',
  date date not null,
  recurring boolean default false,
  created_at bigint not null,
  updated_at bigint not null
);

create table budgets (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade,
  month text not null,
  category text not null,
  amount numeric not null,
  unique(user_id, month, category)
);

create table goals (
  id text primary key,
  user_id uuid references auth.users(id) on delete cascade,
  name text not null,
  target numeric not null,
  saved numeric default 0,
  deadline text default '',
  icon text default '🎯',
  created_at bigint not null
);

-- Enable RLS
alter table transactions enable row level security;
alter table budgets enable row level security;
alter table goals enable row level security;

-- RLS Policies (repeat for each table)
create policy "Users CRUD own data" on transactions for all using (auth.uid() = user_id);
create policy "Users CRUD own data" on budgets for all using (auth.uid() = user_id);
create policy "Users CRUD own data" on goals for all using (auth.uid() = user_id);
```

### 3. Setup Google OAuth

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create OAuth 2.0 credentials
3. Add redirect URI: `https://YOUR_PROJECT.supabase.co/auth/v1/callback`
4. Enable Google provider in Supabase Authentication settings

### 4. Environment Variables

Create `.env.local` in the root directory:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_publishable_key
```

### 5. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

---

## 📦 Deployment

This project is deployed on **Vercel**. Every push to `main` triggers automatic deployment.

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/Gerry-techx/dompetku)

---

## 🗺️ Roadmap

- [x] Core transaction tracking (income & expense)
- [x] Dashboard with charts (Pie, Area, Bar)
- [x] Budget system per category
- [x] Savings goals with deadline tracking
- [x] Smart insights engine
- [x] Google Authentication
- [x] Cloud database (Supabase)
- [x] PWA support
- [x] Export CSV / JSON backup
- [x] Indonesian localization
- [ ] AI-powered insights via LLM API
- [ ] Recurring transaction auto-generation
- [ ] Dark/light theme toggle
- [ ] Multi-currency support
- [ ] Expense receipt scanner (OCR)

---

## 🤝 Contributing

Contributions are welcome! Feel free to open issues or submit PRs.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'feat: add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## 📄 License

This project is open source and available under the [MIT License](LICENSE).

---

## 👨‍💻 Author

**Gerry** — [@Gerry-techx](https://github.com/Gerry-techx)

Built with ❤️ from Palembang, Indonesia 🇮🇩
