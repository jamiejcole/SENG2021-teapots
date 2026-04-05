# Frontend Plan — UBL Invoice Generator

## Backend overview (what we’re building a UI for)
This backend is a **UBL Invoice Generator**:
- Accepts a **UBL Order XML** payload (string) plus an `invoiceSupplement` object
- Validates the Order XML against **UBL 2.4 XSD**
- Parses XML into a JSON-ish structure (`OrderData`)
- Generates **UBL Invoice XML** (via `InvoiceBuilder`)
- Validates the generated Invoice XML against **UBL 2.4 XSD**
- Persists both Order + Invoice into MongoDB (raw XML + projected fields) via `persistInvoiceRequest`

## Base URL, ports, env
- **Backend base path**: `/api/v1`
- **Backend port**: `PORT` from `backend/.env` (commonly `3002`)
- **Swagger**: `/api/docs`, `/api/docs.json`
- **Mongo env**: `MONGODB_URI`, `MONGODB_DBNAME`

## Auth
- No authentication currently.

## CORS / frontend integration
- Backend does not currently configure CORS.
- During development, we’ll use a **Vite proxy** (frontend dev server proxies `/api` → backend).
- For production, backend will need CORS (or deploy behind same origin / reverse proxy).

## API endpoints (current)
### Health
- **GET** `/api/v1/health`
  - **Response (200)**: `{ status, service, version, uptimeSeconds }`

### Invoices
- **POST** `/api/v1/invoices`
  - **Request (JSON)**:
    - `orderXml: string` (required)
    - `invoiceSupplement: InvoiceSupplement` (required by runtime validation)
  - **Response (201)**: `application/xml` invoice XML string
  - **Errors**: `{ error, message }`

- **POST** `/api/v1/invoices/validate`
  - **Request (JSON)**: `{ orderXml: string }`
  - **Response (200)**: `{ message }`

- **DELETE** `/api/v1/invoices/:invoiceId`
  - Deletes by Mongo `_id` (ObjectId).
  - Note: frontend doesn’t receive `_id` from `POST /invoices` yet, so this is not very usable without additional backend support.

## Data models inferred (frontend)
### InvoiceSupplement (from backend `types/invoice.types.ts`)
Required fields (enforced by backend):
- `currencyCode: string`
- `taxRate: number` (decimal, e.g. `0.1`)
- `taxScheme: { id: string, taxTypeCode: string }`
- `paymentMeans: { code: string, payeeFinancialAccount: { id: string, name: string, branchId?: string } }`

Optional:
- `invoiceNumber`, `issueDate`, `dueDate`, `note`
- `paymentTerms?: { note: string }`
- `customizationId`, `profileId`

## Frontend architecture proposal
- **React + Vite**
- **TypeScript**
- **Tailwind CSS**
- **shadcn/ui** for UI components
- **React Router** for routing
- **No Zod** (per request). Do minimal client-side checks and rely on backend validation messages.

## Pages (MVP)
1. **Dashboard**
   - Service health summary (call `/api/v1/health`)
   - Quick links to Generate / Validate / API Docs

2. **Generate Invoice**
   - Paste/upload Order XML
   - Form for `invoiceSupplement`
   - Submit → show:
     - generated invoice XML (copy/download)
     - validation errors (backend messages)
     - loading + empty states

3. **Validate Order XML**
   - Paste/upload Order XML
   - Submit to `/api/v1/invoices/validate`
   - Show result or errors

## Reusable components
- `AppShell` (top bar + sidebar/nav)
- `PageHeader` (title + description + actions)
- `XmlInput` (tabs: paste vs upload file, with clear/reset)
- `InvoiceSupplementForm` (inputs + selects)
- `ResultPanel` (tabs: output, raw response, error)
- `CopyButton`, `DownloadButton`
- `Callout` / `Alert` (errors)
- `Skeleton` / loading placeholders

## Routing plan
- `/` dashboard
- `/generate` invoice generator
- `/validate` validate order XML

## API client plan
- Central `fetch` wrapper:
  - `GET` JSON
  - `POST` JSON → expects **text** (XML) or JSON
  - error parsing from `{ error, message }`
- Use `VITE_API_BASE_URL` (default to proxy `/api` in dev).

## UX direction
Clean “SaaS utility” dashboard:
- generous spacing, subtle borders/shadows
- readable forms and code-like XML output
- responsive two-column layout on desktop, stacked on mobile

