# Nizron ERP - Enterprise Resource Planning System

![Nizron Logo](flash-frontend-next-antd/public/images/images.png)

A comprehensive, professional-grade ERP system built for performance, scalability, and modern aesthetics. This monorepo contains the full-stack ecosystem including a Next.js dashboard, a NestJS backend, and an Expo mobile application.

## 🚀 Overview

Nizron ERP is designed to streamline enterprise operations with a high-density, professional UI and a robust scalable backend. It provides end-to-end management for HR, Fleet, Finance, and Inventory.

### 🍱 Project Structure

```text
.
├── flah-app                  # Mobile Application (Expo / React Native)
├── flash-backend-nestjs      # Core API (NestJS + Drizzle ORM + Supabase/PostgreSQL)
└── flash-frontend-next-antd  # Web Dashboard (Next.js 14 App Router + Ant Design)
```

## ✨ Key Features

### 🏢 Core Modules
- **Human Resources**: Complete workforce management, attendance tracking, leave requests, and payroll processing.
- **Fleet Management**: Vehicle life-cycle management, fuel tracking, maintenance logs, and vehicle assignments.
- **Operations & Procurement**: Comprehensive client/vendor management, purchase orders, and complaint tracking.
- **Inventory Control**: Real-time management for both general and restricted inventory items.
- **Finance & Accounting**: Expense tracking, cash advances, and financial reporting.

### 🎨 UI/UX Excellence
- **High-Density Design**: Optimized for information density and efficiency, refined for professional enterprise use.
- **Modern Tech Stack**: Built with Ant Design 5.0, featuring a sticky header, slim sidebar, and responsive layouts.
- **Global Search & Filter**: Powerful, instant search and advanced filtering across all modules.
- **Fixed-Header Tables**: Smooth data browsing with fixed headers and internal scrolling (Enterprise-grade performance).

### 📱 Mobile Excellence
- **Cross-Platform**: Built with Expo for seamless use on both iOS and Android.
- **Real-time Sync**: Direct integration with the NestJS backend for real-time status updates.

## 🛠 Tech Stack

| Module | Technologies |
|--------|--------------|
| **Frontend** | Next.js 14, Ant Design, TypeScript, Tailwind CSS |
| **Backend** | NestJS, Drizzle ORM, Supabase (PostgreSQL), JWT |
| **Mobile** | Expo, React Native, React Navigation |
| **DevOps** | Nixpacks, GitHub Actions, Vercel/Dockploy |

## ⚙️ Quick Start

### Prerequisites
- Node.js (v18+)
- PostgreSQL or Supabase account
- Git

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/Ab-RAFAY/next-nizron-ERP.git
   cd next-nizron-ERP
   ```

2. **Frontend Setup**
   ```bash
   cd flash-frontend-next-antd
   npm install
   npm run dev
   ```

3. **Backend Setup**
   ```bash
   cd ../flash-backend-nestjs
   npm install
   # Configure your .env (see Guide)
   npm run start:dev
   ```

4. **Mobile Setup**
   ```bash
   cd ../flah-app
   npm install
   npx expo start
   ```

## 📄 License

This project is proprietary and for internal use only.

---
© 2026 Nizron ERP. All rights reserved.