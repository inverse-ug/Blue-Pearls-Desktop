```markdown
# Blue Pearls Fleet Management System

A comprehensive desktop application for managing logistics fleet operations, built with Tauri, React, TypeScript, and Shadcn UI.

## 📋 Overview

Blue Pearls Fleet Management System is a cross-platform desktop application designed to streamline fleet operations, fuel management, job tracking, and maintenance scheduling. The system provides role-based interfaces for different personnel including managers, drivers, fuel agents, and security guards.

## 🚀 Tech Stack

- **Frontend Framework**: React 18 with TypeScript
- **Desktop Runtime**: Tauri (Rust backend)
- **UI Components**: Shadcn UI + Tailwind CSS
- **Form Handling**: React Hook Form + Zod
- **State Management**: React Hooks (useState, useReducer)
- **HTTP Client**: Native Fetch API
- **Notifications**: Sonner
- **Icons**: Lucide React
- **Date Handling**: Native Date API
- **Build Tool**: Vite

## 📁 Project Structure

```
src/
├── components/          # Reusable UI components
│   ├── ui/             # Shadcn UI components
│   └── shared/         # Custom shared components
├── layouts/            # Layout components by role
│   ├── Layout.tsx      # Main management layout
│   ├── ImplantLayout.tsx
│   ├── SecurityLayout.tsx
│   ├── FuelLayout.tsx
│   ├── FuelManagerLayout.tsx
│   ├── DriverLayout.tsx
│   └── ...
├── pages/              # Page components by module
│   ├── Dashboard.tsx
│   ├── Staff.tsx
│   ├── StaffDetail.tsx
│   ├── Vehicles.tsx
│   ├── Jobs.tsx
│   ├── Clients.tsx
│   ├── fuel/           # Fuel management pages
│   ├── driver/         # Driver portal pages
│   ├── finance/        # Finance manager pages
│   └── ...
├── lib/                # Utilities and helpers
│   ├── api.ts         # API client
│   ├── auth.ts        # Authentication utilities
│   └── utils.ts       # General utilities
├── types/              # TypeScript type definitions
└── App.tsx            # Main app component with routing
```

## ✨ Features

### 🔐 Authentication & Authorization
- JWT-based authentication
- Role-based access control (RBAC) with 12+ roles
- Automatic redirect based on user role
- Protected routes and role guards

### 👥 User Management
- Staff directory with detailed profiles
- User accounts with role assignment
- Avatar upload and management
- Staff placement tracking at client sites

### 🚛 Fleet Management
- Complete vehicle inventory
- Vehicle images with front/main photo support
- Ownership tracking (Owned/Hired)
- Trailer management for trucks
- Fuel consumption tracking
- Maintenance scheduling
- Real-time vehicle status:
  - Available
  - On Job
  - Under Maintenance
  - Inactive

### ⛽ Fuel Management
- Fuel station directory
- Station agent assignment
- Fuel allocations with approval workflow
- Fuel dispense tracking with:
  - Odometer before/after readings
  - Odometer photos
  - Receipt uploads
- Allocation status tracking (Pending, Approved, Issued, etc.)

### 📋 Job Management
- Job creation and scheduling
- Multi-level approval workflow
- Driver assignment
- Vehicle allocation
- Gate readings (Security Guard)
- Station readings (Fuel Agent)
- Job status tracking

### 💰 Allowances
- Driver allowance requests
- Allowance approval workflow
- Payment tracking
- Receipt uploads

### 🔧 Maintenance
- Workshop directory
- Maintenance records
- Repair cost tracking
- Invoice management

### 📊 Role-Specific Dashboards

| Role | Dashboard |
|------|-----------|
| **SUPER_ADMIN/MANAGER** | Full system overview, all modules |
| **IMPLANT** | Job creation interface |
| **SECURITY_GUARD** | Gate entry/exit logging |
| **FUEL_AGENT** | Fuel dispense interface |
| **FUEL_MANAGER** | Fuel allocation approval, station management |
| **DRIVER** | My jobs, fuel requests, allowances |
| **ALLOWANCE_MANAGER** | Allowance approvals |
| **WORKSHOP_MANAGER** | Maintenance approvals |
| **FINANCE_MANAGER** | Payment approvals, reconciliation |

## 🚦 Routing Structure

```
Public Routes:
├── /login                    # Login page

Management Routes (SUPER_ADMIN, MANAGER, PSV_COORDINATOR, TRUCK_COORDINATOR):
├── /dashboard                # Main dashboard
├── /staff                    # Staff directory
├── /staff/:id                # Staff details
├── /accounts                 # User accounts
├── /vehicles                 # Fleet management
├── /jobs                     # Job list
├── /clients                  # Client management
├── /fuel/stations            # Fuel stations
├── /fuel/allocations         # Fuel allocations
├── /fuel/dispenses           # Fuel dispense history
├── /workshops                # Workshop directory
├── /maintenance              # Maintenance records
├── /allowances               # Allowance management
└── /reports/*                # Reports section

Implant Routes:
├── /create-job               # Job creation

Security Routes:
├── /security                 # Security dashboard

Fuel Agent Routes:
├── /fuel/dashboard            # Agent dashboard
├── /fuel/allocations/today    # Today's allocations
├── /fuel/dispense/:id         # Dispense fuel
└── /fuel/history              # My dispenses

Fuel Manager Routes:
├── /fuel-manager/dashboard     # Fuel manager dashboard
├── /fuel-manager/allocations/create
├── /fuel-manager/allocations/pending
├── /fuel-manager/stations
├── /fuel-manager/agents
└── /fuel-manager/analytics

Driver Routes:
├── /driver/dashboard           # Driver portal
├── /driver/jobs                # My jobs
├── /driver/fuel/requests       # My fuel requests
└── /driver/allowances          # My allowances

... (similar for other roles)
```

## 🛠️ Development

### Prerequisites
- Node.js 18+
- Rust (for Tauri)
- PostgreSQL (for backend)

### Installation

1. Clone the repository
```bash
git clone https://github.com/your-org/blue-pearls.git
cd blue-pearls
```

2. Install dependencies
```bash
npm install
```

3. Set up environment variables
```bash
cp .env.example .env
# Edit .env with your configuration
```

4. Run development server
```bash
npm run tauri dev
```

### Building for Production
```bash
npm run tauri build
```

## 🔌 API Integration

The app connects to a Fastify backend server. Configure the API URL in your environment:

```env
VITE_API_URL=https://your-api.vercel.app
```

## 🎨 UI/UX Features

- **Responsive Design**: Works on different screen sizes
- **Dark/Light Mode**: Support for both themes
- **Loading States**: Skeleton loaders and spinners
- **Toast Notifications**: User feedback with Sonner
- **Form Validation**: Real-time validation with Zod
- **Image Upload**: Drag-and-drop with preview
- **Search & Filter**: Advanced filtering in all lists
- **Sorting**: Clickable column headers
- **Pagination**: For large data sets

## 🔒 Security Features

- JWT token authentication
- Token storage in localStorage
- Automatic token refresh
- Role-based route guarding
- API request interception
- Secure Tauri backend with Rust

## 🚀 Performance Optimizations

- Code splitting by route
- Lazy loading for role-specific modules
- Memoized components with useMemo/useCallback
- Optimized re-renders
- Virtual scrolling for long lists
- Image optimization and lazy loading

## 📱 Auto-Updater

The app includes Tauri's built-in auto-updater with:
- Manual update checks
- Progress indicators
- One-click installation
- Automatic relaunch

## 🧪 Testing

```bash
# Run unit tests
npm run test

# Run e2e tests
npm run test:e2e

# Run Tauri tests
npm run tauri test
```

## 📝 TODO

### High Priority
- [ ] **Fuel Management Pages**
  - [ ] FuelStations.tsx - CRUD for stations
  - [ ] FuelAllocations.tsx - List and manage allocations
  - [ ] FuelDispenses.tsx - Dispense history with photos
  - [ ] FuelAgent Dashboard with today's allocations

- [ ] **Driver Portal**
  - [ ] DriverDashboard.tsx - Overview of assigned jobs
  - [ ] MyJobs.tsx - List of jobs with status
  - [ ] MyFuelRequests.tsx - Request fuel
  - [ ] MyAllowances.tsx - View allowance status

- [ ] **Workshop Module**
  - [ ] Workshops.tsx - Workshop directory
  - [ ] MaintenanceRecords.tsx - Complete maintenance history

### Medium Priority
- [ ] **Reports Module**
  - [ ] Fuel consumption reports
  - [ ] Maintenance cost reports
  - [ ] Allowance expenditure reports
  - [ ] Driver performance reports

- [ ] **Finance Manager Pages**
  - [ ] PendingPayments.tsx - Approve payments
  - [ ] Transactions.tsx - Financial transactions
  - [ ] Reconciliation.tsx - Account reconciliation

- [ ] **Analytics Dashboard**
  - [ ] Fleet utilization charts
  - [ ] Fuel efficiency trends
  - [ ] Cost analysis by vehicle

### Low Priority
- [ ] **Mobile Responsive Views**
  - [ ] Driver mobile interface
  - [ ] Fuel agent mobile interface

- [ ] **Offline Support**
  - [ ] IndexedDB for offline data
  - [ ] Sync when online

- [ ] **Export Features**
  - [ ] Export to PDF
  - [ ] Export to Excel
  - [ ] Print views

- [ ] **Notifications**
  - [ ] Email notifications
  - [ ] In-app notifications
  - [ ] Push notifications

### Technical Debt
- [ ] Add comprehensive unit tests
- [ ] Add E2E tests with Playwright
- [ ] Implement error boundaries
- [ ] Add logging service
- [ ] Performance profiling
- [ ] Bundle size optimization
- [ ] Add Storybook for components

### Documentation
- [ ] API documentation
- [ ] User manual
- [ ] Deployment guide
- [ ] Developer setup guide
- [ ] Role-specific guides

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is proprietary and confidential.

## 👥 Team

- Development Team
- Product Management
- QA Team
- DevOps

## 📞 Support

For support, email support@bluepearls.com or create an issue in the repository.

---

**Built with ❤️ for Blue Pearls Logistics**
```