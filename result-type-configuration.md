# Result Type Configuration System
> **Phase 2 — Helping Mitra Platform**  
> Module: Service Catalogue & Order Processing Configuration  
> Status: ✅ Implemented (Configuration-Only)

---

## Overview

Every service in the Helping Mitra platform has two mandatory configuration fields that define how its **final order result is delivered** to the user when processed by an admin in future phases:

| Field | Type | Purpose |
|---|---|---|
| `resultType` | `ResultType` (enum) | Defines the *mechanism* of result delivery |
| `resultLabel` | `string` | Human-readable label for the result artifact |

These fields are **configuration-only in Phase 2**. They are seeded alongside the service definitions and are **read-only** in the admin interface during this phase.

---

## ResultType Enum

```typescript
export enum ResultType {
  FILE_UPLOAD  = "FILE_UPLOAD",   // Admin uploads a file as the result
  STATUS_ONLY  = "STATUS_ONLY",   // Admin marks order status (no file)
  TEXT_RESULT  = "TEXT_RESULT"    // Admin enters a text value as the result
}
```

### Enum Values Explained

---

### `FILE_UPLOAD`

**Meaning:** Admin must upload a physical file (PDF, image, etc.) as the final result when processing an order.

**Phase 3 Impact:**
- Admin order processing form → shows a **file upload input** 
- User order status page → shows a **download link** once file is uploaded
- Validation → file is required before order can be marked Complete

**Services using this type:**

| Service | resultLabel |
|---|---|
| PAN Find Service | PAN Card PDF Copy |
| PAN eSign Service | eSigned PAN PDF |
| Voter ID Find Service | Voter ID PDF Copy |
| Voter Correction Service | Updated Voter ID PDF |
| Vahan RC Find Service | RC Certificate PDF |
| DL Find Service | Driving Licence PDF |
| DL Correction Service | Updated DL PDF |
| Farmer ID Find Service | Farmer ID PDF |
| Samagra ID Find Service | Samagra Profile PDF |

---

### `STATUS_ONLY`

**Meaning:** Admin marks the order as Approved or Rejected — no file or text output required.

**Phase 3 Impact:**
- Admin order processing form → shows **Approve / Reject toggle** only
- User order status page → shows **status badge** (Approved / Rejected)
- Validation → no file or text input required

**Services using this type:**

| Service | resultLabel |
|---|---|
| Samagra Name Correction | Status Updated |
| Samagra Mobile Link | Mobile Linked Status |

---

### `TEXT_RESULT`

**Meaning:** Admin enters a text value (alphanumeric) as the final result output.

**Phase 3 Impact:**
- Admin order processing form → shows a **text input field**
- User order status page → shows the **text value** (e.g. PAN Number)
- Validation → text value is required before order can be marked Complete

**Services using this type:**

| Service | resultLabel |
|---|---|
| Voter New Registration | Voter ID Number |
| Farmer New Registration | Farmer ID Number |

---

## Database Schema

```prisma
enum ResultType {
  FILE_UPLOAD
  STATUS_ONLY
  TEXT_RESULT
}

model Service {
  // ... other fields ...

  /// Controls Phase 3 admin order processing workflow.
  /// FILE_UPLOAD: admin uploads a file. STATUS_ONLY: admin marks status.
  /// TEXT_RESULT: admin enters a text value.
  resultType   ResultType @default(STATUS_ONLY)

  /// Human-readable label for what the result represents.
  /// E.g. "PAN Card PDF Copy", "Voter ID Number", "Status Updated".
  resultLabel  String
}
```

---

## Full Service Configuration Table

| Service | Category | Result Type | Result Label | MRP |
|---|---|---|---|---|
| PAN Find Service | PAN Services | `FILE_UPLOAD` | PAN Card PDF Copy | ₹50 |
| PAN eSign Service | PAN Services | `FILE_UPLOAD` | eSigned PAN PDF | ₹100 |
| Voter ID Find Service | Voter Services | `FILE_UPLOAD` | Voter ID PDF Copy | ₹50 |
| Voter New Registration | Voter Services | `TEXT_RESULT` | Voter ID Number | ₹150 |
| Voter Correction Service | Voter Services | `FILE_UPLOAD` | Updated Voter ID PDF | ₹100 |
| Samagra ID Find Service | Samagra Services | `FILE_UPLOAD` | Samagra Profile PDF | ₹30 |
| Samagra Name Correction | Samagra Services | `STATUS_ONLY` | Status Updated | ₹80 |
| Samagra Mobile Link | Samagra Services | `STATUS_ONLY` | Mobile Linked Status | ₹60 |
| Vahan RC Find Service | Vahan Services | `FILE_UPLOAD` | RC Certificate PDF | ₹50 |
| DL Find Service | Driving Licence Services | `FILE_UPLOAD` | Driving Licence PDF | ₹50 |
| DL Correction Service | Driving Licence Services | `FILE_UPLOAD` | Updated DL PDF | ₹120 |
| Farmer ID Find Service | Farmer Services | `FILE_UPLOAD` | Farmer ID PDF | ₹40 |
| Farmer New Registration | Farmer Services | `TEXT_RESULT` | Farmer ID Number | ₹200 |

---

## Admin Phase 2 Rules

> [!IMPORTANT]
> In Phase 2, `resultType` and `resultLabel` are **read-only** in the admin panel.
> Admin can **view** these fields but **cannot edit or delete** them.
> Configuration is controlled exclusively through seed data.

The admin service edit form enforces this by rendering `resultType` and `resultLabel` as locked display panels with a **"Phase 2 Read-Only"** amber badge when editing an existing service.

---

## API Response Shape

Both public and admin service API endpoints include `resultType` and `resultLabel` in all responses:

```json
{
  "id": "...",
  "name": "PAN Find Service",
  "slug": "pan-find-service",
  "resultType": "FILE_UPLOAD",
  "resultLabel": "PAN Card PDF Copy",
  "mrp": 50,
  "category": { "id": "...", "name": "PAN Services", "slug": "pan-services" }
}
```

---

## Frontend Display

### Public Service Detail Page
- **Hero section** → `resultType` badge (colour-coded: blue/green/purple)
- **Pricing & Delivery card** → Result Label + Delivery Format human description

### Admin Service Detail Page (`/admin/services/:id`)
- **Service Overview grid** → `resultType` and `resultLabel` shown as read-only info cells

### Admin Services Table (`/admin/services`)
- **Result Type column** → type badge
- **Result Label column** → label text

---

## Phase 3 Roadmap

When Phase 3 (Order Management) is implemented, `resultType` will control:

1. **Order submission** — Which fields appear on the order intake form
2. **Admin processing panel** — File upload / text input / status toggle is rendered based on `resultType`
3. **Result delivery** — User notification and download link generation
4. **Validation** — Backend validates that the result matches the declared `resultType`

> [!NOTE]
> In Phase 3, `resultType` and `resultLabel` will become editable by Super Admins only, with a full audit trail.

---

*Generated: Phase 2 Implementation — Helping Mitra Platform*
