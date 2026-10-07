# Balodaya Secondary English Boarding School — Web & School Management System

An ultra-premium, production-ready school portal and comprehensive School Management System (SMS) for **Balodaya Secondary English Boarding School** in Sundar Bazar, Bheerkot-06, Bayarghari, Syangja, Nepal (Estd. 2063 B.S.).

Built with a bespoke light-blue Himalayan identity, pure semantic HTML, vanilla CSS modules, zero AI slop, and a robust embedded SQLite / LibSQL database architecture.

---

## Features

### 1. Public School Website
- **Flagship Identity**: Authentic school motto (*"The Need of Education, Civilization of the Nation"*), historical origin, founding administration, and vision.
- **Rich Photographic Gallery**: Comprehensive catalog of real school photographs categorized into Assemblies, Inter-House Sports, Cultural Celebrations, Campus Infrastructure, and Faculty with full keyboard-accessible lightbox.
- **Admissions Portal**: Real-time admission criteria, step-by-step application walkthrough, and working online application submission.
- **Academics & Curriculum**: Levels from Foundational to Secondary (SEE) with ATAL Tinkering Lab and subject syllabus breakdown.
- **Student Life & House System**: Standings for all 5 Collegiate Houses (Red, Yellow, Blue, Green, Orange) with real-time points leaderboard and elected Student Council roster.
- **Facilities & Fleet**: Overview of classrooms, science hubs, Digicamp ICT lab, auditorium, and dedicated 4-vehicle student transport fleet.
- **Public Notices & News**: Live circulars, events, and exam schedules with instant search and category filtering.
- **Website CMS**: Dynamic Careers vacancies with CV upload, official Tenders announcements, and Contact / Inquiry message routing.

### 2. Integrated School Management System (`/app/*`)
- **Authentication & RBAC**: Session-based encrypted cookies with granular role-based access for Admin, Principal, Teacher, Accountant, Parent, and Student.
- **Role-Tailored Dashboards**: Unique dashboard metrics, rosters, attendance summaries, and pending action items customized per user role.
- **Academic Setup**: Complete management of Academic Years (active toggle), Classes, Sections, and Class-Subject credit assignments.
- **Student Lifecycle**: Directory with search and filters, admission registration, guardian contacts, enrollments, and Transfer Certificate (TC) generation.
- **Attendance Tracking**: Daily single-click section attendance grid (Present, Absent, Late, Excused Leave) with monthly percentage calculations.
- **Leave Request Management**: Online leave submissions by students and parents with teacher/admin approval workflow automatically updating attendance.
- **Examinations & Grading**: Exam scheduling, bulk tabular marks entry with pass/fail validation, percentage, letter grades, GPA calculation, and class ranking.
- **Fee Management & Invoicing**: Custom fee heads, one-click bulk invoice generation per section, payment receipts, balance tracking, and overdue balances.
- **Timetable Scheduling**: Section-wise weekly period allocation with clash detection across teachers and classrooms.
- **Library Management**: Accession cataloging, availability counter, borrowing/return logs, and overdue tracking.
- **Student Transport Fleet**: Route stops, fare tiers, and student passenger manifests.
- **House Points System**: Point allocations and deductions for co-curricular achievements feeding the public leaderboard.
- **Resources & Downloads**: Question banks, syllabus sheets, and circular uploads with secure download streams.
- **Official Print Layouts**: Clean, borderless `@media print` layouts for Payment Receipts, Student Marksheets, and Transfer Certificates.
- **Data Exporting**: Instant UTF-8 BOM CSV exports for Student Directories, Monthly Attendance, Exam Rankings, Fee Dues, Payments, and Overdue Books.

---

## Tech Stack

- **Framework**: Next.js 16 (App Router with Server Components & Route Handlers)
- **Language**: TypeScript
- **Database**: SQLite powered by `@libsql/client` (stored in `data/balodaya.db`)
- **Authentication**: Custom HTTP-only session cookies with `jose` JWT and `bcryptjs` password hashing
- **Styling**: Vanilla CSS Modules with strict HSL design tokens (`src/styles/tokens.css` and `src/styles/globals.css`)
- **Icons & Graphics**: Pure SVG icons and genuine Balodaya photographic media

---

## Getting Started

### 1. Installation

```bash
cd balodaya-web
npm install
```

### 2. Environment Setup

Create `.env.local` (or copy from `.env.example`):

```env
DATABASE_URL="file:./data/balodaya.db"
SESSION_SECRET="balodaya-super-secret-key-32-chars-long-change-in-prod!"
NODE_ENV="development"
```

### 3. Database Initialization & Seeding

```bash
npm run seed
```

This sets up all SQLite schema tables, seeds academic tiers, subjects, fee heads, collegiate houses, library books, transport routes, and creates default user accounts.

### 4. Running the Development Server

```bash
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000) for the public site, or [http://localhost:3000/login](http://localhost:3000/login) to access the School Management System.

---

## Seed Accounts & Credentials

| Role | Email | Password | Access Level |
|---|---|---|---|
| **Administrator** | `admin@balodaya.edu.np` | `AdminBalodaya2063!` | Full system administration, settings, users, CMS |
| **Teacher** | `bishnu.pokharel@balodaya.edu.np` | `Balodaya2063!` | Attendance, marks entry, timetable, student rosters |
| **Accountant** | `accountant@balodaya.edu.np` | `Balodaya2063!` | Invoices, fee collection, payments, receipts, dues |
| **Parent** | `sita.sharma@balodaya.edu.np` | `Balodaya2063!` | Children grades, attendance, fee invoices, leaves |
| **Student** | `aarav.sharma@balodaya.edu.np` | `Balodaya2063!` | Timetable, marksheet, homework, leaves, library |

---

## Project Structure

```
balodaya-web/
├── data/                    # SQLite database storage (balodaya.db)
├── public/                  # Static assets and real school photos
│   └── assets/images/       # Authentic campus, gallery, and house imagery
├── scripts/                 # Database seed and automated verification scripts
│   ├── seed.mjs             # Seed database with realistic school data
│   ├── smoke.mjs            # Comprehensive automated smoke test suite
│   └── verify-public-pages.mjs
├── src/
│   ├── app/
│   │   ├── (site)/          # Public website routes (about, academics, gallery, etc.)
│   │   ├── app/             # School Management System (SMS) authenticated routes
│   │   │   ├── dashboard/   # Role-tailored operational dashboards
│   │   │   ├── students/    # Student directory, admissions, and student profiles
│   │   │   ├── attendance/  # Daily attendance recording and monthly reporting
│   │   │   ├── exams/       # Exam setup, marks entry, and result publishing
│   │   │   ├── fees/        # Fee heads, invoice generation, and receipt payments
│   │   │   ├── timetable/   # Timetable slot scheduling with conflict detection
│   │   │   ├── library/     # Book accession catalog and loan issuance
│   │   │   ├── transport/   # Bus routes, stops, and passenger manifests
│   │   │   ├── houses/      # Inter-house competition points ledger
│   │   │   ├── reports/     # CSV reporting suite
│   │   │   └── print/       # Dedicated A4 print layouts (receipt, marksheet, tc)
│   │   ├── api/             # RESTful JSON API endpoints for all modules
│   │   └── login/           # Authentication login portal
│   ├── components/
│   │   ├── layout/          # Public SiteHeader, SiteFooter, AppShell, Sidebar
│   │   └── ui/              # Button, Field, Modal, Table, Badge, Card, etc.
│   ├── content/             # School facts, leadership, houses, gallery metadata
│   ├── server/              # Database connection, HTTP guards, session utilities
│   └── styles/              # Design tokens and global CSS
├── Dockerfile               # Production multi-stage Docker build
└── next.config.ts           # Next.js configuration and legacy URL redirects
```
