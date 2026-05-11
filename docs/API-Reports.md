# Reports — API reference

**Auth:** All routes require `Authorization: Bearer <access_token>` (JWT from `POST /auth/login`). The app mounts these after global `authenticate` middleware.

**Base URL:** `/api` (same as the rest of the API). Report paths are **`/api/v1/reports/...`**.

**Postman:** Import `SRM-API.postman_collection.json` → folder **Reports**. Collection variable **`baseUrl`** defaults to **`http://localhost:3000/api/v1`** (all requests share this versioned root: `{{baseUrl}}/auth/login`, `{{baseUrl}}/reports/repairs`, …). Environment **`SRM-Local.postman_environment.json`** overrides the same **`baseUrl`** if selected.

---

## Shared query parameters

| Query        | Applies to                         | Values / notes |
| ------------ | ---------------------------------- | -------------- |
| `period`     | All reports except **revenue** when using preset window | `daily`, `weekly`, `monthly` (default), `yearly`. Invalid → **400** `{ "error": "period must be one of: ..." }`. |
| `period`     | Revenue (optional preset)           | Same; ignored if **`from`** and **`to`** are both set. |
| `from`, `to` | Revenue only                        | ISO date strings; inclusive day bounds. `from` ≤ `to`. Invalid → **400**. |

---

## 1. Repairs report — `GET /v1/reports/repairs`

| Method | Path              | Roles                    | Request | Success response |
| ------ | ----------------- | ------------------------ | ------- | ---------------- |
| GET    | `/v1/reports/repairs` | ADMIN, MANAGER, TECHNICIAN | Query: optional `period` | **200** JSON (see below) |

**Technicians** only see repairs **assigned to them** (`technicianId` = current user).

**Success body:** JSON with `totalRepairs`, `completedRepairs`, `pendingRepairs`, `generatedAt` (ISO timestamp), and `repairs` (array of rows). Response is returned as this object directly (no `success` / `data` wrapper).

**`repairs[]` row (all string fields are display-ready for the UI):**

| Field | Source / meaning |
| ----- | ----------------- |
| `reference` | `Repair.reference` |
| `customer` | `Customer.name` |
| `phone` | `Customer.phone` (`null` allowed) |
| `device` | `Device.brand` + `Device.model` (trimmed; `"Unknown Device"` if both empty) |
| `issue` | `Repair.issue` (trimmed; may be empty string) |
| `status` | `Repair.status` (`RepairStatus`): `NOT_STARTED` → Pending, `IN_PROGRESS` → In Progress, `READY_TO_TAKE` → Ready, `DELIVERED` → Completed, `PAID` → Paid |
| `priority` | `Repair.priority` (`Priority`): `URGENT` → Urgent, `HIGH` → High, `MEDIUM` → Medium, `LOW` → Low |
| `technician` | `User.fullName` or `User.name`; `"Unassigned"` if no technician |
| `amount` | `Repair.finalCost` if set, otherwise `Repair.estimatedCost` (same integer units as stored; `null` if neither) |
| `dueDate` | `Repair.estimatedCompletionDate` formatted (e.g. `May 11, 2026`, locale `en-US`); **empty string** if not set |

**Errors:** **400** invalid `period` (`{ "error": "<message>" }`); **401** missing/invalid token; **403** CUSTOMER; **500** `{ "error": "Unable to generate repair report" }`.

**Schema (conceptual):** Rows are `Repair` rows in the window filtered by `Repair.createdAt` (tenant/shop/technician scope as above), with nested `Customer`, `Device`, and optional `User` (technician). **`completedRepairs`** counts repairs whose `status` is **`DELIVERED`** or **`PAID`**. **`pendingRepairs`** is `totalRepairs - completedRepairs`.

---

## 2. Technician performance — `GET /v1/reports/technician`

| Method | Path                   | Roles          | Request | Success response |
| ------ | ---------------------- | -------------- | ------- | ---------------- |
| GET    | `/v1/reports/technician` | ADMIN, MANAGER | Query: optional `period` | **200** JSON (see below) |

**Success body:** `generatedAt`, `technicians` (array).

**`technicians[]` row:** `name`, `email`, `phone`, `role` (Admin / Manager / Technician), `branch`, `status` (Available / Unavailable), `rating` (`null` until modeled), `activeJobs`, `repairsCompleted`, `avgCompletionTimeHours` (`null` if no completions in period).

Listed users: tenant/shop scoped, roles **ADMIN**, **MANAGER**, **TECHNICIAN** (not customers).

**Errors:** **403** TECHNICIAN, CUSTOMER; **500** `{ "error": "Unable to generate technician report" }`.

---

## 3. Customer activity — `GET /v1/reports/customers`

| Method | Path                  | Roles          | Request | Success response |
| ------ | --------------------- | -------------- | ------- | ---------------- |
| GET    | `/v1/reports/customers` | ADMIN, MANAGER | Query: optional `period` | **200** JSON (see below) |

**Success body:** `generatedAt`, `customers` (array).

**`customers[]` row:** `name`, `email`, `phone`, `location`, `type` (`New` / `VIP` / `Regular`, derived), `repairs`, `totalSpent`.

**Errors:** **403** TECHNICIAN, CUSTOMER; **500** `{ "error": "Unable to generate customer report" }`.

---

## 4. Inventory — `GET /v1/reports/inventory`

| Method | Path                   | Roles                    | Request | Success response |
| ------ | ---------------------- | ------------------------ | ------- | ---------------- |
| GET    | `/v1/reports/inventory` | ADMIN, MANAGER, TECHNICIAN | Query: optional `period` (drives **`topUsedParts`** only) | **200** JSON (see below) |

**Success body:**

- **`totalItems`**, **`lowStockItems`** — active `PartsInventory` SKU count and count at/below minimum.
- **`generatedAt`**, **`currency`** (from `ShopSettings`).
- **`summary`:** `totalAssets`, `availableStocks`, `inReview`, `soldCollected` (device-level; **`soldCollected`** currently always `0`).
- **`devices[]`:** `deviceName`, `categoryLine`, `identifier`, `ownerName`, `ownerPhone`, `status` (`AVAILABLE` / `IN REVIEW`), `value` (currently `0` if not modeled).
- **`topUsedParts[]`**, **`restockAlerts[]`**.
- Optional **`message`** when there are no parts and no devices.

**Errors:** **403** CUSTOMER; **500** `{ "error": "Unable to generate inventory report" }`.

---

## 5. Revenue — `GET /v1/reports/revenue`

| Method | Path                 | Roles                    | Request | Success response |
| ------ | -------------------- | ------------------------ | ------- | ---------------- |
| GET    | `/v1/reports/revenue` | ADMIN always; MANAGER if feature | Query: `period` **or** `from` + `to` | **200** JSON (see below) |

**Managers** require tenant feature flag **`advanced_reports`** = `true` (`ShopSettings.featureFlags`, merged defaults). Otherwise **403** `{ "error": "FEATURE_NOT_ENABLED" }`.

**Success body:** `totalRevenue`, `currency`, `period` (human-readable label). If no qualifying payments: `totalRevenue: 0` and **`message`** describing no data.

Revenue sums **completed** `Payment` rows in range, **`repairId` set**, linked **`Repair.status` = DELIVERED** (no dedicated Invoice model).

**Errors:** **400** bad dates; **403** TECHNICIAN, CUSTOMER, or manager without flag; **500** `{ "error": "Unable to generate revenue report" }`.

---

## Errors summary

| Status | When |
| ------ | ---- |
| 401    | Missing/malformed `Authorization` or invalid/expired JWT (global auth). |
| 403    | Role not allowed on route, or **revenue** + manager without **`advanced_reports`**. |
| 400    | Invalid `period`, or invalid `from`/`to` on revenue. |
| 500    | `{ "error": "Unable to generate … report" }` (handler catch-all). |

---

## Implementation map

| Concern | Location |
| ------- | -------- |
| Routes | `routes/reports.routes.ts` |
| Repairs report (query + mapping) | `services/reports/repairReport.service.ts`, `controllers/repairReport.controller.ts`, `types/dto/repairReport.dto.ts` |
| Revenue manager gate | `middlewares/revenueReportAccess.middleware.ts` + `getFlags()` cache |
| Period parsing | `utils/reportPeriod.ts`, `utils/revenueReportRange.ts` (revenue) |
| DTOs | `types/dto/*Report*.dto.ts` |

**Feature flags (managers → revenue):** `PATCH /settings/features/advanced_reports` with `{ "enabled": true }` (ADMIN only); see **`API-Reports`** Postman notes and **`types/featureFlags.types.ts`**.
