# FinSight — Financial Insights for Small Businesses

> A modular, full-stack financial planning, analytics, and decision-support web application engineered to give small business owners end-to-end visibility into their cash flow, profitability, operating margins, and growth projections.

---

## Table of Contents

1. [Project Overview](https://www.google.com/search?q=%23project-overview)
2. [Key Capabilities & Modules](https://www.google.com/search?q=%23key-capabilities--modules)
3. [Architecture & Technology Stack](https://www.google.com/search?q=%23architecture--technology-stack)
4. [Repository & Directory Structure](https://www.google.com/search?q=%23repository--directory-structure)
5. [Prerequisites & System Requirements](https://www.google.com/search?q=%23prerequisites--system-requirements)
6. [Environment Configuration](https://www.google.com/search?q=%23environment-configuration)
7. [Step-by-Step Installation & Local Setup](https://www.google.com/search?q=%23step-by-step-installation--local-setup)
8. [Available Scripts](https://www.google.com/search?q=%23available-scripts)
9. [API Architecture & Endpoints](https://www.google.com/search?q=%23api-architecture--endpoints)
10. [Database Architecture & Data Models](https://www.google.com/search?q=%23database-architecture--data-models)
11. [Deployment Guide (Render)](https://www.google.com/search?q=%23deployment-guide-render)
12. [Troubleshooting & Known Caveats](https://www.google.com/search?q=%23troubleshooting--known-caveats)
13. [Collaboration & Git Workflow](https://www.google.com/search?q=%23collaboration--git-workflow)
14. [Academic Attribution](https://www.google.com/search?q=%23academic-attribution)

---

## Project Overview

Many small business enterprises (retailers, independent service providers, traders, and small manufacturers) track their daily financial transactions across fragmented spreadsheets, paper ledgers, or siloed accounting books. This makes it difficult to assess real-time liquidity, evaluate profit margins, or model operational shifts.

**FinSight** centralizes and processes this data, providing:

- **Centralized Record Keeping:** Direct transactional inputs and batch spreadsheet uploads.
- **Automated Analytics:** Immediate calculation of unit economics, burn rates, and financial ratios.
- **Scenario Simulation:** Interactive "What-If" and Break-Even modeling engines to evaluate decisions before capital is deployed.

---

## Key Capabilities & Modules

### Data Ingestion & Management

- **Manual Data Entry:** Record operational revenue and expenditure with category attribution.
- **Batch Data Ingestion:** Parse bulk transactional data from **CSV** (`papaparse`) and **Excel** (`xlsx`) formats directly in the client application.
- **Business Profile Management:** Link transactional ledgers to business metadata and operational parameters.

### Analytical Engines & Dashboards

- **Executive KPI Dashboard:** Visualized high-level metrics for revenue, expenses, net income, and gross margins.
- **Profit & Loss (P&L):** Categorized operational breakdown over customizable periods.
- **Cash Flow Analysis:** Net movement tracking distinguishing operational inflow from outflow.
- **Financial Ratio Analysis:** Standard business health metrics (liquidity, margins, operational efficiency).
- **Trend Analysis:** Period-over-period tracking to detect revenue leakage and runaway operational expenses.
- **Break-Even Analysis:** Dynamic assessment of fixed costs, variable costs, and target unit pricing to identify sustainability thresholds.
- **Product Profitability:** Item-level margin contribution tracking.
- **Scenario ("What-If") Modeling:** Real-time assumption adjustments (e.g., price shifts, volume swings, raw material increases).
- **Goal Planning:** Target tracking for cash reserves and revenue goals.

### Platform Security

- **JWT-Based Authentication:** Stateless session token propagation stored securely via browser storage (`finsight_token`) and validated through Axios interceptors.
- **Role-Based Access Control (RBAC):** Middleware-enforced endpoint protection separating administrative capabilities from standard business ownership.
- **Input Validation:** Strict schema and request payload validation on both frontend and backend entry points.

---

## Architecture & Technology Stack

FinSight follows a decoupled client-server architecture:

```
[ Client Application (React + Vite) ]
                |
          Axios (JWT Bearer)
                |
                v
[ Node.js + Express REST API ] <---> [ MongoDB (Atlas / Community) ]
        |             |
  (Middleware)   (Calculations)

```

### Technology Matrix

| Layer                  | Technology                     | Primary Functionality                                             |
| ---------------------- | ------------------------------ | ----------------------------------------------------------------- |
| **Frontend Framework** | React 19 + Vite                | SPA architecture with HMR and high-performance compilation        |
| **Styling & UI**       | Tailwind CSS v4 + DaisyUI      | Utility-first responsive design system and theming                |
| **Data Visualization** | Chart.js + react-chartjs-2     | Visual financial reporting, trend curves, and distributions       |
| **File Processing**    | Papa Parse & XLSX              | Client-side spreadsheet ingestion and data normalization          |
| **Icons & Feedback**   | Lucide React + react-hot-toast | UI symbology and non-blocking notification alerts                 |
| **Routing**            | React Router DOM v7            | Client-side declarative routing and protected boundaries          |
| **Backend Runtime**    | Node.js + Express              | Enterprise REST API, request lifecycle, and route handlers        |
| **Database**           | MongoDB + Mongoose/Driver      | Document-based schema storage for users, profiles, and financials |
| **Code Quality**       | Oxlint                         | High-speed static analysis and React hook rule enforcement        |

---

## Repository & Directory Structure

```text
FinSight/
├── .gitignore                          # Global version control exclusion rules
├── README.md                           # Master architectural and developer documentation
├── backend/                            # Server-side REST API runtime
│   ├── .env                            # Backend environment secrets (DO NOT COMMIT)
│   ├── package.json                    # Server dependencies and lifecycle scripts
│   ├── package-lock.json               # Locked dependency resolution tree
│   ├── server.js                       # Primary HTTP listener and runtime entry point
│   ├── scripts/                        # Administrative seed and migration utilities
│   │   ├── assignBusinessOwner.js      # Associate ownership privileges to profiles
│   │   └── createAdmin.js              # Bootstrap initial administrative user
│   └── src/
│       ├── app.js                      # Express configuration, CORS, and route aggregation
│       ├── calculations/               # Core deterministic mathematical engines
│       │   ├── BreakEvenCalculations.js
│       │   ├── CashFlowCalculations.js
│       │   ├── FinancialCalculations.js
│       │   ├── FinancialRatioCalculations.js
│       │   ├── FinancialTrendCalculations.js
│       │   └── WhatIfCalculations.js
│       ├── config/
│       │   └── database.js             # Database client connection orchestration
│       ├── controllers/                # Request orchestration and HTTP response formats
│       │   ├── AuthController.js
│       │   ├── BusinessProfileController.js
│       │   ├── FinancialAnalysisController.js
│       │   └── FinancialDataController.js
│       ├── middleware/                 # Interceptors: authentication, roles, validations
│       │   ├── Authenticate.js
│       │   ├── AuthorizeRoles.js
│       │   └── Validate.js
│       ├── models/                     # Data schemas for MongoDB entities
│       │   ├── BusinessProfile.js
│       │   ├── FinancialData.js
│       │   └── User.js
│       ├── routes/                     # REST endpoint definitions
│       │   ├── AuthRoutes.js
│       │   ├── BusinessProfileRoutes.js
│       │   ├── FinancialAnalysisRoutes.js
│       │   └── FinancialDataRoutes.js
│       ├── services/                   # Business logic and cross-controller operations
│       │   └── FinancialAnalysisService.js
│       └── validators/                 # Request payload schema guards
│           ├── AuthValidator.js
│           ├── BusinessProfileUpdateValidator.js
│           ├── BusinessProfileValidator.js
│           ├── FinancialDataUpdateValidator.js
│           └── FinancialDataValidator.js
└── frontend/                           # Client-side SPA
    ├── .env                            # Client environment variables (build-time injected)
    ├── .gitignore                      # Frontend-scoped build and artifact exclusions
    ├── .oxlintrc.json                  # Static code quality rules
    ├── index.html                      # HTML entry template and viewport boundaries
    ├── package.json                    # Frontend package dependencies and scripts
    ├── package-lock.json               # Locked dependency tree
    ├── vite.config.js                  # Vite pipeline, Tailwind, and React plugin bin
    └── src/
        ├── App.jsx                     # Top-level shell and route provider mount
        ├── index.css                   # Global Tailwind utilities
        ├── main.jsx                    # React virtual DOM root mount
        ├── components/                 # Shared UI component primitives
        │   ├── Button.jsx
        │   ├── Card.jsx
        │   ├── ErrorMessage.jsx
        │   ├── Input.jsx
        │   ├── Loading.jsx
        │   ├── Modal.jsx
        │   └── Sidebar.jsx
        ├── hooks/                      # Custom React hooks
        │   └── UseInactivityLogout.js
        ├── layouts/                    # Layout templates
        │   ├── AuthLayout.jsx          # Public/Authentication screens
        │   └── DashboardLayout.jsx     # Authenticated application shell
        ├── pages/                      # Routed views and feature dashboards
        │   ├── BreakEven.jsx
        │   ├── BusinessProfile.jsx
        │   ├── CashFlow.jsx
        │   ├── Dashboard.jsx
        │   ├── ExpenseAnalysis.jsx
        │   ├── FinancialData.jsx
        │   ├── GoalPlanning.jsx
        │   ├── Home.jsx
        │   ├── ImportData.jsx
        │   ├── Login.jsx
        │   ├── NotFound.jsx
        │   ├── ProductProfitability.jsx
        │   ├── ProfitLoss.jsx
        │   ├── ProfitMargin.jsx
        │   ├── RatioAnalysis.jsx
        │   ├── Register.jsx
        │   ├── RevenueAnalysis.jsx
        │   ├── ScenarioAnalysis.jsx
        │   └── TrendAnalysis.jsx
        ├── routes/                     # Router hierarchy and protected route barriers
        │   ├── AppRoutes.jsx
        │   └── ProtectedRoutes.jsx
        ├── services/                   # HTTP client interfaces
        │   ├── Api.js                  # Axios client with bearer token interceptor
        │   ├── AuthService.js
        │   ├── BusinessProfileService.js
        │   └── FinancialDataService.js
        └── utils/                      # Client-side calculation and data parsing helpers
            └── FinancialCalculations.js

```

---

## Prerequisites & System Requirements

Before running the application locally, ensure you have:

- **Node.js:** `v18.0.0` or higher (`v20.x LTS` recommended).
- **npm:** `v9.0.0` or higher.
- **MongoDB:** Active local MongoDB instance (`localhost:27017`) or an accessible MongoDB Atlas cluster URI.
- **Git:** Version control client installed.

Verify your environment:

```bash
node --version
npm --version
git --version

```

---

## Environment Configuration

Never commit real `.env` files to source control. Configure both environments independently:

### 1. Backend Configuration (`backend/.env`)

Create a file at `backend/.env` with the following variables:

```ini
# Server Network Settings
PORT=5000
NODE_ENV=development

# Database Connection (MongoDB URI)
MONGODB_URI=mongodb://localhost:27017/finsight
# For Atlas: mongodb+srv://<username>:<password>@<cluster>.mongodb.net/finsight?retryWrites=true&w=majority

# Security Keys
JWT_SECRET=your_super_secret_high_entropy_key_here
JWT_EXPIRES_IN=7d

# CORS Configuration
CLIENT_URL=http://localhost:5173

```

### 2. Frontend Configuration (`frontend/.env`)

Create a file at `frontend/.env`:

```ini
# Vite API Target (Must point to active backend REST prefix)
VITE_API_URL=http://localhost:5000/api

```

---

## Step-by-Step Installation & Local Setup

Run the backend and frontend in separate terminals.

### Terminal 1: Backend Setup & Execution

1. Navigate to the backend directory:

```bash
cd backend

```

2. Install dependencies:

```bash
npm install

```

3. _(Optional)_ Seed or initialize an administrative user:

```bash
node scripts/createAdmin.js

```

4. Start the backend development server:

```bash
npm run dev
# Or standard execution if dev is not configured:
# npm start / node server.js

```

5. Confirm startup: Look for console verification confirming that the HTTP listener is active on port `5000` and the MongoDB connection is open.

### Terminal 2: Frontend Setup & Execution

1. Navigate to the frontend directory:

```bash
cd frontend

```

2. Install dependencies:

```bash
npm install

```

3. Run Oxlint to verify code quality:

```bash
npm run lint

```

4. Start the Vite development server:

```bash
npm run dev

```

5. Launch the application: Open the displayed local address (typically `http://localhost:5173`) in your browser.

---

## Available Scripts

### Backend (`/backend`)

- `npm start`: Runs the Node production server using `server.js`.
- `npm run dev`: Starts the backend server with hot-reload (if configured with tools like `nodemon`).

### Frontend (`/frontend`)

- `npm run dev`: Starts the local Vite development server with HMR.
- `npm run build`: Compiles production-ready minified assets into `frontend/dist`.
- `npm run lint`: Runs `oxlint` static code analysis.
- `npm run preview`: Spins up a local static server to preview production build artifacts.

---

## API Architecture & Endpoints

All backend routes are mounted under the `/api` prefix and return JSON payloads. Protected routes require an `Authorization: Bearer <token>` header, handled automatically by the frontend Axios interceptor (`src/services/Api.js`).

### Base Routes Overview

| Route Domain           | Path Prefix             | Handled Entities                           | Auth Required         |
| ---------------------- | ----------------------- | ------------------------------------------ | --------------------- |
| **Authentication**     | `/api/auth`             | Login, Register, Session Validation        | Public / User Context |
| **Business Profiles**  | `/api/business-profile` | Company metadata, industry, currency       | Yes (JWT)             |
| **Financial Records**  | `/api/financial-data`   | Ingestion, CRUD on operational ledger rows | Yes (JWT)             |
| **Financial Analysis** | `/api/analysis`         | P&L, Trends, Ratios, Break-Even, Scenarios | Yes (JWT)             |

---

## Database Architecture & Data Models

The persistence layer uses document collections designed around business segregation:

- **Users (`models/User.js`):** Contains identity data, credentials (hashed via bcrypt or similar hashing algorithm), role levels (`admin`, `business_owner`), and profile associations.
- **Business Profile (`models/BusinessProfile.js`):** Company identifier, registered operational name, target currency, fiscal year definition, and operational parameters.
- **Financial Data (`models/FinancialData.js`):** Transaction-level entries tagged with timestamps, category (Revenue, COGS, Operating Expense, Capital Expenditure), amount, payment terms, and user/business relational ID references.

---

## Deployment Guide (Render)

FinSight is designed to be deployed as two decoupled services:

```
[ Frontend: Render Static Site ]  -->  [ Backend: Render Web Service ]  -->  [ MongoDB Atlas ]

```

### 1. Database Deployment (MongoDB Atlas)

1. Provision a free or dedicated cluster on MongoDB Atlas.
2. Under **Network Access**, allow the IP addresses used by your hosting environment (or `0.0.0.0/0` with secure credentials).
3. Under **Database Access**, create an application user with read/write permissions.
4. Copy the connection string format:
   `mongodb+srv://<db_user>:<db_password>@<cluster_host>/finsight?retryWrites=true&w=majority`

### 2. Backend Deployment (Render Web Service)

1. Create a new **Web Service** on Render and link your GitHub repository.
2. Configure settings:

- **Root Directory:** `backend`
- **Environment:** `Node`
- **Build Command:** `npm install`
- **Start Command:** `npm start` (or `node server.js`)

3. Add the required environment variables:

- `PORT`: `10000` (Render defaults to internal port assignment)
- `NODE_ENV`: `production`
- `MONGODB_URI`: `<Your Atlas Connection MongoDB String>`
- `JWT_SECRET`: `<Secure Production Random Secret>`
- `CLIENT_URL`: `[https://your-frontend-subdomain.onrender.com](https://your-frontend-subdomain.onrender.com)`

### 3. Frontend Deployment (Render Static Site)

1. Create a new **Static Site** on Render and link the same GitHub repository.
2. Configure settings:

- **Root Directory:** `frontend`
- **Build Command:** `npm install && npm run build`
- **Publish Directory:** `dist`

3. Add environment variables:

- `VITE_API_URL`: `[https://your-backend-subdomain.onrender.com/api](https://your-backend-subdomain.onrender.com/api)`

4. Set up client-side rewrite rules:

- Add a rewrite rule redirecting `/*` to `/index.html` (Status `200`) so React Router can handle direct URL refreshes.

---

## Troubleshooting & Known Caveats

### 1. MongoDB `querySrv ENOTFOUND`

- **Symptoms:** The backend crashes at startup with `querySrv ENOTFOUND _mongodb._tcp.<cluster>`.
- **Root Cause:** Node's DNS resolver fails to query the DNS SRV records used by `mongodb+srv://` connection strings on certain local networks or ISP configurations.
- **Resolution:**

1. Test network DNS resolution or swap your system DNS to public resolvers like Google (`8.8.8.8`) or Cloudflare (`1.1.1.1`).
2. Alternatively, switch to the standard (non-SRV) three-node direct connection string format available in the Atlas console under "Connect using driver 2.2.12 or earlier".

### 2. Frontend Render Deployment Shows a Blank Screen

- **Root Cause:** Direct navigation to subpaths (e.g., `/dashboard`) returns a 404 from the static server if rewrite rules are missing.
- **Resolution:** Configure the static host to route all fallback traffic to `/index.html`.

### 3. Calculation Discrepancies (Frontend vs. Backend)

- **Design Rule:** The backend calculation modules (`backend/src/calculations/`) are the single source of truth for business metrics and reports. Frontend utilities in `frontend/src/utils/FinancialCalculations.js` are reserved for local UI previews, dynamic form feedback, and instant estimations.

### 4. Unused Components & Stale Links

- **Sidebar Link (`/dashboard-insights`):** The sidebar includes a navigation link pointing to `/dashboard-insights`. Verify route definitions in `frontend/src/routes/AppRoutes.jsx` before modifying or removing this route.
- **Component Deduplication:** Ensure you import shared components directly from `frontend/src/components/`. If you encounter duplicate local components inside view pages (such as `StatCard`), keep them intact unless you are explicitly running a refactoring pass with visual verification.

---

## Collaboration & Git Workflow

This repository uses a trunk-based branching model:

1. **Keep the Base Updated:**

```bash
git checkout main
git pull origin main

```

2. **Branch per Feature / Fix:**

```bash
git checkout -b feature/financial-ratio-refinement

```

3. **Commit Cleanly:**

```bash
git add <modified-files>
git commit -m "feat(calculations): refine zero-denominator handling in financial ratios"

```

4. **Push & Create Pull Request:**

```bash
git push origin feature/financial-ratio-refinement

```

Open a pull request into `main` for review.

---

## Academic Attribution

- **Project:** FinSight — Financial Insights for Small Businesses
- **Curriculum:** Mini Project – I | Real-World Application Development
- **Course Code:** CHMCSV5
- **Academic Programme:** TYCS, Semester V
- **Team Size:** 2 Students (Shivam Mallick & Atharva Pawar)
