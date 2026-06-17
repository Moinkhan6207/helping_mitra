# Helping Mitra - Phase 0 Backend & Database Foundation

Welcome to the **Helping Mitra** backend codebase. This repository contains the Phase 0 Backend & Database Foundation. The architecture has been built following **Clean Architecture**, **Modular Monolith Architecture**, and **MVC + Service Layer + Repository Pattern** using Node.js, Express, TypeScript, and Prisma.

---

## 📁 Folder Structure

```text
backend/
├── prisma/
│   └── schema.prisma         # Prisma Schema (Neon DB Connectivity)
├── src/
│   ├── app.ts                # Express application configuration (security, middleware, routing)
│   ├── server.ts             # HTTP Server entrypoint (startup, shutdown handling, fatal error logging)
│   ├── config/
│   │   ├── env.ts            # Environment variable validation using Zod
│   │   ├── database.ts       # Prisma Client wrapper, connectivity test, and architectural comments
│   │   └── cors.ts           # CORS settings
│   ├── core/
│   │   ├── errors/
│   │   │   ├── app.error.ts  # Standard AppError parent class and operational error subclasses
│   │   │   └── catchAsync.ts # Async handler decorator resolving repeated try/catch blocks
│   │   ├── responses/
│   │   │   └── api.response.ts # Standard sendSuccess & sendError response formatting helpers
│   │   └── types/
│   │       └── index.ts      # Global response interface types
│   ├── middlewares/
│   │   ├── error.middleware.ts # Standard error response compiler (masks stack traces in production)
│   │   ├── notFound.middleware.ts # Default route fallback matching unmatched paths (returns 404)
│   │   ├── rateLimit.middleware.ts # DDoS mitigation restricting maximum requests per IP
│   │   └── requestLogger.middleware.ts # Traffic audit log censoring credentials and sensitive files
│   ├── modules/
│   │   └── health/           # Health and connection diagnostics module
│   │       ├── health.routes.ts
│   │       ├── health.controller.ts
│   │       └── health.service.ts
│   └── routes/
│       └── index.ts          # Root API router (/api mount point)
├── .env.example              # Variables guide
├── package.json              # Main project definitions & dependencies
├── tsconfig.json             # TypeScript options configuration
└── README.md                 # Project handbook
```

---

## 🛠️ Tech Stack & Security

- **Runtime**: Node.js & TypeScript
- **Framework**: Express.js
- **Database ORM**: Prisma ORM with Neon PostgreSQL integration
- **Security Middlewares**:
  - `Helmet`: Secure response headers validation
  - `CORS`: Cross-Origin Requests permission filters
  - `Express Rate Limit`: Requests throttle limiter protecting api scope
  - Request Size Limit: REST requests restricted to `10mb` to protect from heavy memory spikes
  - Environment Validation: Startup fail-fast validator parsing configurations with `Zod`
- **Request Auditor**: Custom request-logger logging Method, URL, status code, and latency in milliseconds, scrubbing sensitive request tokens (such as `password`, `token`, `jwt`, `aadhaar`, `pan`, `paymentkey`, `secret`, `privatekey`).

---

## 🚀 Getting Started

### 1. Installation
Clone the repository, enter the `backend/` folder and run:
```bash
npm install
```

### 2. Environment Configuration
Create a `.env` file in the root of the `backend/` directory following the blueprint in `.env.example`:
```bash
cp .env.example .env
```
Ensure you update the variables inside `.env` with actual data (especially `DATABASE_URL` for Neon DB).

### 3. Run Development Server
Spins up a dev server using `ts-node-dev`:
```bash
npm run dev
```

### 4. Build for Production
Compiles the TypeScript source into JavaScript inside the `/dist` directory:
```bash
npm run build
```

---

## 📈 Standard API Response Layout

All backend operations yield predictable JSON payloads.

### Success Response
Returned with HTTP Status `2xx`:
```json
{
  "success": true,
  "message": "Success message description",
  "data": {
    "status": "OK"
  }
}
```

### Error Response
Returned with HTTP Status `4xx`/`5xx`:
```json
{
  "success": false,
  "message": "Error description details",
  "error": {
    "code": "ERROR_CODE_STRING",
    "details": null
  }
}
```
*Note: Stack traces are automatically appended under `error.details.stack` only when `NODE_ENV` is set to `development` or `test`.*

---

## 🛣️ API Endpoints

### 1. App Health Status
- **Method**: `GET`
- **Path**: `/api/health`
- **Description**: Verifies if the backend server application is up and running.
- **Expected Success Response**:
  ```json
  {
    "success": true,
    "message": "Helping Mitra API is running",
    "data": {
      "status": "OK"
    }
  }
  ```

### 2. Database Connection Diagnostic
- **Method**: `GET`
- **Path**: `/api/health/db`
- **Description**: Verifies if the backend server can query the database successfully.
- **Expected Success Response**:
  ```json
  {
    "success": true,
    "message": "Database connection is working",
    "data": {
      "database": "connected"
    }
  }
  ```

---

## 🔑 Admin Bootstrap & Seeding

The Helping Mitra backend supports secure admin account bootstrapping using environment variables and a custom seeding script.

### 1. Configure Admin Environment Variables
Add the following keys to your `.env` file (ensure these values are kept secure and never committed to source control):
```bash
ADMIN_NAME="Mitra Admin"
ADMIN_EMAIL="admin@helpingmitra.com"
ADMIN_MOBILE="9999999999"
ADMIN_PASSWORD="AdminPassword@123"
```

### 2. Run Admin Seeding
Bootstraps the default system Administrator account into Neon DB. It uses `bcrypt` to hash the password and guarantees idempotency (skips creation if the admin already exists):
```bash
npm run seed
```

### 3. Log in as Admin
You can authenticate as the admin by calling `POST /api/auth/login` with either your admin email or mobile identifier:
```bash
curl -X POST http://localhost:5050/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"identifier": "admin@helpingmitra.com", "password": "AdminPassword@123"}'
```
Expected output returns a valid JWT `accessToken` with `role: "ADMIN"`, a raw `refreshToken`, and sanitized profile data.

---

## ⚡ Future-Proof Architecture & Scaling Guidelines

To ensure the backend is fully prepared for future additions (e.g. Wallet, Payments, Refunds, and Orders), the following architectural guidelines must be adhered to:

### 1. Double-Entry Ledger Bookkeeping
- Avoid writing raw wallet balance updates directly to the db in place without an audit trail (e.g. simply running `balance = balance + amount`).
- Implement an immutable ledger journal table:
  - `id`: unique entry identifier (ULID / UUID)
  - `walletId`: reference to wallet
  - `amount`: signed value (positive for credit, negative for debit)
  - `type`: ledger entry type (`CREDIT` | `DEBIT`)
  - `reference`: link to external system (e.g. `order_xxx`, `refund_xxx`)
- The wallet balance can be computed as the sum of its ledger rows. For performance, cache this sum on a `Wallet` table, but enforce that it must match ledger logs.

### 2. Database Concurrency & Race Condition Safeguards
- Financial updates must run within a strict database transaction (`prisma.$transaction`).
- Use **Pessimistic Locking** (`SELECT FOR UPDATE` raw SQL) for wallet balance adjustments to prevent race conditions during concurrent requests:
  ```typescript
  // Lock the wallet row for update
  await prisma.$executeRaw`SELECT * FROM "Wallet" WHERE "id" = ${walletId} FOR UPDATE`;
  ```
- Alternatively, use **Optimistic Concurrency Control (OCC)**. Store a version number on records and assert:
  ```typescript
  // Fails if version was modified concurrently
  await prisma.wallet.update({
    where: { id: walletId, version: currentVersion },
    data: { balance: newBalance, version: currentVersion + 1 }
  });
  ```

### 3. Request Idempotency
- Clients performing state modifications (orders, payments, payouts) must provide an `Idempotency-Key` header (usually a UUIDv4).
- Implement an Idempotency middleware storing keys in Redis or an Idempotency table.
- Workflow:
  - Parse `Idempotency-Key` from header.
  - Assert if key has been resolved:
    - If **Active/Processing**: Return `409 Conflict` (Duplicate request in progress).
    - If **Resolved**: Return the cached HTTP response payload directly without executing downstream code.
    - If **New**: Cache key with status `PROCESSING`, process request, update key state to `RESOLVED` with the final response payload, and return result.

### 4. Prefixed Transaction IDs
- Do not expose raw auto-incrementing integer identifiers to clients for financial items.
- Utilize high-entropy, orderable ID systems (like ULID) with unique modules prefixes to avoid information leakage:
  - Orders: `ord_01J0G1A5G7X29SZ3J4B7FCDG21`
  - Transactions: `txn_01J0G1A5G7X29SZ3J4B7FCDG22`
  - Refunds: `ref_01J0G1A5G7X29SZ3J4B7FCDG23`
