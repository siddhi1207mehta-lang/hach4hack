# PROJECT MEMORY — NestKart playground (SellerShield AI, Document 1)

Purpose: one place where a new AI session or teammate learns what exists, what broke, how it was fixed and why decisions were made. Keep it short, true and current. Updated at the end of EVERY stage.

## 1. Snapshot (update every stage)
- Last updated: 2026-11-10 10:05 IST
- Current phase and stage: Phase 2, Stage 7 completed (Returns, state machine and idempotency)
- Last green gate: none. Last git tag: none
- Run: just dev (web 5173, api 8000, agent placeholder 8001)
- Test: just test (160 passed), just lint (clean), store-web npm run lint (clean, 0 warnings), npm test (13 passed), npm run build (clean), just verify-seed (17 passed)
- Demo logins: password Demo@12345. aarav.mehta@example.test (customer), priya.sharma@nestkart.test (seller owner), kiran.rao@nestkart.test (seller staff)
- Keys needed right now: none

## 2. Architecture map (fill in as you build)
- store-api/app/ : main.py, config.py, clock.py, errors.py, middleware.py, logging.py, models.py, discount.py, auth.py, deps.py, audit.py, schemas.py, orders.py, admin.py, idempotency.py, returns.py
- store-api/ : pyproject.toml, uv.lock, db.py (SQLite WAL/foreign_keys/busy_timeout/BEGIN IMMEDIATE recipe)
- store-api/keys/ : jwt_private.pem, jwt_public.pem (git-ignored RS256 key pair)
- store-api/tests/ : test_skeleton.py (3 passing tests), test_schema_and_seed.py (5 passing tests), test_auth.py (31 passing tests), test_orders_and_admin.py (11 passing tests), test_returns_and_state_machine.py (110 passing tests)
- store-web/src/ : App.tsx, App.test.tsx, main.tsx, index.css, vite-env.d.ts, api/client.ts, api/client.test.ts, api/schema.d.ts, context/AuthContext.tsx, hooks/useChatStream.ts, components/ChatWidget.tsx, components/Layout.tsx, pages/LoginPage.tsx, pages/OrdersPage.tsx, pages/OrderDetailPage.tsx, pages/ProfilePage.tsx, utils/money.ts, utils/money.test.ts, utils/date.ts
- store-web/ : package.json, package-lock.json, vite.config.ts, tailwind.config.js, tsconfig.json
- agent/ : main.py (placeholder on 8001 with GET /healthz)
- contracts/ : openapi-store.json (generated from FastAPI app; frozen after Stage 2)
- scenarios/seed/ : seed JSON for SC-01 to SC-17 (users, customers, products, orders, order_items, shipments, shipment_events, returns, return_items, refunds, mail_messages, store_settings)
- scripts/ : export_openapi.py, make_keys.py, dev.py, seed.py, inspect_db.py, verify_seed.py, get_token.py

## 3. Decisions log
| # | Date | Decision | Why | Rejected alternatives |
| --- | --- | --- | --- | --- |
| D1 | 2026-11-06 | SQLite files, no Supabase | Transactions for money, offline demo, 5-second reset | Supabase, Firebase |
| D2 | 2026-11-06 | Section 16 of the spec overrides older text | Strict review fixes | – |
| D3 | 2026-11-09 | Use windows-shell with powershell in justfile | Simple commands work cleanly in both Git Bash and Windows PowerShell | CMD-only shell |
| D4 | 2026-11-09 | Typed Pydantic models for response schemas | Enables concrete TypeScript types in openapi-typescript and compile-time contract checks | Dict response annotations |
| D5 | 2026-11-09 | Largest-remainder (Hare-Niemeyer) rounding for paise discount allocation | Guarantees exact sum of allocated discounts equals order discount in integer paise without float drift | Float division rounding |
| D6 | 2026-11-09 | Partial unique index on return_items(item_id) where status NOT IN ('completed', 'cancelled', 'rejected') | Enforces at the database layer that at most one active return exists per order item | Application-only validation |
| D7 | 2026-11-09 | RS256 JWT with public JWKS & opaque rotating refresh cookies with double-submit CSRF | Secure asymmetric tokens; agent holds only public key; browser tokens never stored in localStorage | HS256 shared secret, localStorage tokens |
| D8 | 2026-11-09 | Generic error messages on login failures ("Invalid email or password") + rate limiting/lockout | Prevents user enumeration and brute force attacks | Specific user-not-found errors |
| D9 | 2026-11-09 | Uniform 404 with exact identical body for non-owned and missing orders | Prevents IDOR enumeration and timing attacks; logs denial to store_audit | Differentiating 403 on resource routes |
| D10 | 2026-11-09 | Silent session restoration via rotating httpOnly refresh cookie on mount with memory-only access token | Complies with strict rule against tokens in localStorage/sessionStorage while providing seamless UX on reload | localStorage token storage |
| D11 | 2026-11-10 | Canonical SHA-256 JSON hashing + DB-backed IdempotencyKey | Eliminates duplicate side-effects while catching payload tampering (409 idempotency_mismatch) safely across restarts | In-memory key caching |
| D12 | 2026-11-10 | Single in-code state table `RETURN_STATE_TRANSITIONS` for return lifecycle | Single source of truth guaranteeing illegal transitions are strictly rejected across all caller roles | Ad-hoc endpoint condition checks |

## 4. Build log (newest first)
### Stage 7 — Returns, state machine and idempotency — 2026-11-10
- Built: Returns lifecycle, transition engine, seller receipt & inspection, and full idempotency support conforming to spec sections 5, 6, 16.
  - Idempotency engine (`app/idempotency.py`): validates `Idempotency-Key` header on all mutating POST routes (missing gives 422 `validation_error`). Normalizes payload JSON and computes canonical SHA-256 hash. Replays stored status and payload with zero second effects. Detects changed payloads with 409 `idempotency_mismatch`. Atomic persistence in `idempotency_keys` table.
  - Return creation `POST /api/v1/orders/{id}/returns`: customer only (`require_customer`). Uniform 404 with store_audit log on non-owned or non-existent order. Validates order was delivered (`order.status == 'delivered'`). Enforces item delivered quantity net of past active and completed returns. Blocks duplicate active returns on the same item (HTTP 409 `duplicate`) backed by SQLite partial unique index. Reason text treated as plain string data (never evaluated). Generates RET-#### identifiers.
  - Returns views and cancellation: `GET /api/v1/returns` (customer views own returns, seller/agent-monitor views all); `GET /api/v1/returns/{id}` (uniform 404 with audit logging for non-owner); `POST /api/v1/returns/{id}/cancel` (customer only, restricted to requested state before approval).
  - Return state transition engine `POST /api/v1/returns/{id}/transition`: driven by single source-of-truth table `RETURN_STATE_TRANSITIONS`. Seller token can advance any allowed edge. Agent-executor restricted to requested -> approved or rejected within the autonomy cap from `store_settings` (default ₹500 / 50,000 paise; rejects higher values with 409 `limit_exceeded`). Checks and transitions executed in `BEGIN IMMEDIATE` transactions with store_audit logging.
  - Seller admin endpoints: `POST /api/v1/admin/returns/{id}/receive` (moves `in_transit_back` to `received`); `POST /api/v1/admin/returns/{id}/inspect` (moves `received` to `inspected_ok` or `inspection_failed` with optional note).
  - Test suite (`store-api/tests/test_returns_and_state_machine.py`): 110 tests covering SC-04, SC-09 duplicate blocking, SC-14 concurrent race testing with thread pool (`-k double`), parametrized testing of all illegal transitions across the state table matrix, idempotency replay and mismatch, executor autonomy cap checks, customer ownership 404s, customer cancellation, and admin operations.
- Files: store-api/app/idempotency.py, store-api/app/returns.py, store-api/app/admin.py, store-api/app/schemas.py, store-api/app/main.py, store-api/tests/test_returns_and_state_machine.py, contracts/openapi-store.json, store-web/src/api/schema.d.ts
- Tests: 160 pytest passed (110 returns & state machine, 11 orders & admin, 31 auth, 5 schema & seed, 3 skeleton); 13 Vitest passed; 17 verify-seed passed; ruff & eslint clean; vite build clean.
- Commit: feat(store): stage 7 returns and idempotency

### Stage 6 — Customer portal (read-only) and chat widget shell — 2026-11-09
- Built: Customer portal and chat widget shell conforming to spec sections 9.1, 9.2, 9.3, 9.6, 9.7 and 16.
  - In-memory token management with `openapi-fetch` wrapper: adds Authorization and X-Request-ID, double-submit CSRF cookie validation, and single-attempt automatic refresh on 401 without infinite loops.
  - Silent session restore on mount via rotating httpOnly cookie.
  - Pages: Login (with DEMO quick-login for 5 customers and 2 sellers, lockout/error messaging), My Orders (status chips, relative IST dates, rupee money formatting, shipment badges, search, skeleton, empty and error-retry states), Order detail (items with prices and discount allocation, shipment timeline with delayed notice, track, disabled return, and ask support buttons; uniform "Order not found" on unowned/missing orders), Profile.
  - Role-based auth guards, route error boundaries, 404 page.
  - Floating bottom-right chat widget: header 'SellerShield Assistant' with AI disclosure, Guided mode banner fallback, 4 quick actions (Track order, Start a return, Refund status, Talk to a human), 1,000-character counter limit, and plain-text/DOMPurify sanitized markdown rendering (no raw HTML).
  - SSE hook built on `@microsoft/fetch-event-source` targeting `/agent/v1/chat/stream` with reconnect, abort, and graceful Guided mode fallback.
  - Vitest unit tests for money formatting (89900 -> ₹899.00) and API client refresh-once retry behavior.
- Files: store-web/src/utils/money.ts, store-web/src/utils/money.test.ts, store-web/src/utils/date.ts, store-web/src/api/client.ts, store-web/src/api/client.test.ts, store-web/src/context/AuthContext.tsx, store-web/src/hooks/useChatStream.ts, store-web/src/components/ChatWidget.tsx, store-web/src/components/Layout.tsx, store-web/src/pages/LoginPage.tsx, store-web/src/pages/OrdersPage.tsx, store-web/src/pages/OrderDetailPage.tsx, store-web/src/pages/ProfilePage.tsx, store-web/src/App.tsx, store-web/src/vite-env.d.ts, store-web/vite.config.ts
- Tests: 13 Vitest tests passed (money formatting, API client refresh-once, router placeholders); 50 pytest passed; store-web lint (0 warnings) and build passed; just lint and verify-seed passed.
- Commit: pending git commit

### Stage 5 — Read-only store endpoints — 2026-11-09
- Built: Orders, shipments, refundable calculation, seller views, and audit logging for denied access conforming to spec sections 4, 5, 6, 16.
  - `GET /api/v1/orders` (own orders only via customer token, cursor pagination with limit and base64 cursor, status filter, search).
  - `GET /api/v1/orders/{id}` (ownership enforcement with uniform 404 and store_audit denial log).
  - `GET /api/v1/orders/{id}/shipment` (carrier, tracking, events, derived delayed flag: `eta_at < Clock.now()` and not delivered).
  - `GET /api/v1/orders/{id}/refundable?items=ITEM_ID:QTY,ITEM_ID:QTY` (calculates remaining item quantity and max_refundable_paise net of active refunds based on line_paid_paise).
  - `GET /api/v1/orders/{id}/refunds` (returns list of refunds for the order).
  - `GET /api/v1/products` (public catalog endpoint).
  - `GET /api/v1/admin/orders` & `/api/v1/admin/orders/{id}` (seller_owner, seller_staff, agent-monitor with orders:read_all; customer gets 403 and denial logged).
  - `GET /api/v1/admin/customers/{id}` (customer summary: returns_30d = 4 for C003, refund_ratio_90d, account age).
  - Store audit table integration (`StoreAudit` logging with X-Request-ID propagation).
  - `just inspect` formatted display for `store_audit` entries.
- Files: store-api/app/orders.py, store-api/app/admin.py, store-api/app/schemas.py, store-api/app/audit.py, store-api/app/deps.py, store-api/app/main.py, store-api/app/auth.py, scripts/inspect_db.py, store-api/tests/test_orders_and_admin.py, contracts/openapi-store.json, store-web/src/api/schema.d.ts
- Tests: 50 pytest passed (11 orders & admin, 31 auth, 5 schema & seed, 3 skeleton); Vitest: 2 passed; Vite build: passed; ruff & eslint: clean.
- Verified: All Stage 5 verification scenarios (Aarav order list & shipment, Diya uniform 404 for ORD-1042 vs ORD-9999, Aarav 403 on admin routes, Priya C003 returns_30d = 4, Diya ORD-2037 delayed = True, Diya ORD-2040 refundable = 50000, store_audit rows in `just inspect`).
- Commit: pending git commit

### Stage 4 — Authentication — 2026-11-09
- Built: Authentication system conforming to spec sections 4, 6, 12, 16. RS256 JWT access tokens (15 min) with claims sub, role, customer_id, aud=[nestkart-api, sellershield-agent], iss, exp, jti, auth_time. Public JWKS endpoint (`/.well-known/jwks.json`) exposing public RSA key only (no private components). Rotating opaque refresh tokens (7 days) stored as hashes, delivered via httpOnly SameSite=Lax cookie with double-submit CSRF token validation. POST /api/v1/auth/login with argon2id verification, 5 attempts/min rate limit per IP+email and 15-minute lock after 10 failures. POST /api/v1/auth/refresh, POST /api/v1/auth/logout, GET /api/v1/auth/me, POST /api/v1/auth/token (OAuth client-credentials for agent-executor and agent-monitor with scoped service tokens). Security headers middleware (CSP with frame-ancestors none, nosniff, DENY frame options), 1 MB body size limiter, restricted CORS allowlist. `just token <email>` recipe via `scripts/get_token.py`. 31 pytest tests in `store-api/tests/test_auth.py`.
- Files: store-api/app/auth.py, store-api/app/deps.py, store-api/app/middleware.py, store-api/app/main.py, store-api/app/config.py, scripts/get_token.py, store-api/tests/test_auth.py, justfile, contracts/openapi-store.json, store-web/src/api/schema.d.ts
- Tests: 39 pytest passed (31 auth, 5 schema & seed, 3 skeleton); Vitest: 2 passed; Vite build: passed; ruff: clean.
- Verified: Login 200 with HttpOnly SameSite=Lax cookies, /auth/me with Bearer token, /auth/me without token 401, JWKS RSA public only, rate limiter 429 after 5 failures, tampered token 401, nosniff & CSP headers on /healthz.
- Commit: feat(store): stage 4 authentication
### Stage 3 — Database tables and seed data — 2026-11-09
- Built: SQLAlchemy 2.0 DeclarativeBase models for every table in spec section 5, store_settings, evidence, and section 16 amendments. Integer paise money columns, optimistic locking `version` columns. Constraints: foreign keys ON, unique email, unique `refunds.idempotency_key`, partial unique index `uq_active_return_item` on `return_items(item_id)`. Largest-remainder discount allocation algorithm in integer paise (`app/discount.py`). Seed data in `scenarios/seed/` for SC-01 to SC-17 with T0 offsets, argon2id hashed `Demo@12345` passwords, 4 historic completed returns for C003, six mailbox messages. Scripts `scripts/seed.py` (<0.3s runtime), `scripts/inspect_db.py`, and `scripts/verify_seed.py` (17 PASS). Pytest suite `store-api/tests/test_schema_and_seed.py`.
- Files: store-api/app/models.py, store-api/app/discount.py, store-api/tests/test_schema_and_seed.py, scripts/seed.py, scripts/inspect_db.py, scripts/verify_seed.py, scenarios/seed/*.json, justfile
- Tests: 8 pytest passed (5 schema & seed, 3 skeleton); 17 scenario verifications passed; Vitest: 2 passed; Vite build: passed; ruff & eslint: clean.
- Verified: just seed (0.26s), just reset (0.28s), just inspect (5 customers, 2 sellers, 10 products, ORD-1048 89900 paise, ORD-2031 164700 paise), just verify-seed (17 PASS), just test (8 passed).
- Commit: feat(store): stage 3 schema and seed

### Stage 2 — Web skeleton and contract pipeline — 2026-11-09
- Built: React 18 + Vite + TypeScript frontend (`store-web`), Tailwind CSS and design tokens (navy/teal/amber/red, 4/8px grid), routes (`/`, `/login`, `/seller`), typed API client calling `/api/v1/clock`, contract export script `scripts/export_openapi.py`, type generation script (`npm run gen:api`), RS256 key generator `scripts/make_keys.py` with overwrite refusal, unified dev runner `scripts/dev.py`, Vite proxy for `/api` and `/agent`.
- Files: store-web/*, contracts/openapi-store.json, scripts/export_openapi.py, scripts/make_keys.py, scripts/dev.py, justfile
- Tests: Python: 3 passed; Vitest: 2 passed; Vite build: passed; Typed-contract proof: verified (failed with TS2551 on now_utcc)
- Verified by human: just openapi, npm run gen:api, just keys, just dev, curl http://localhost:5173/api/v1/clock, curl http://localhost:8001/healthz, just test, just lint, npm run lint, npm test, npm run build
- Commit and tag: pending git commit

### Stage 1 — store-api skeleton — 2026-11-09
- Built: Python 3.12 project managed by uv, FastAPI app with pydantic-settings, Clock service (realtime/frozen + offset), error format {error:{code,message,request_id,details}}, X-Request-ID middleware, structured JSON logs without secrets, GET /healthz, GET /readyz (db & clock checks), GET /api/v1/clock, SQLite db.py matching section 16 recipe, agent placeholder on 8001, justfile with 18 recipes, .env.example.
- Files: store-api/pyproject.toml, store-api/uv.lock, store-api/db.py, store-api/app/main.py, store-api/app/config.py, store-api/app/clock.py, store-api/app/errors.py, store-api/app/middleware.py, store-api/app/logging.py, store-api/tests/test_skeleton.py, agent/main.py, justfile, .env.example, .gitignore
- Tests: 3 passed, 0 failed, 0 skipped
- Verified by human: just setup, just test, just lint, curl /healthz, /readyz, /api/v1/clock, /api/v1/nope, /healthz with X-Request-ID
- Commit: 4cfc58c feat(store): stage 1 api skeleton

## 5. Bug and fix log (newest first)
| ID | Date | Symptom (what I saw) | Root cause | Fix | Regression test | Files |
| --- | --- | --- | --- | --- | --- | --- |
| B-006 | 2026-11-10 | test_seed_loads assertion error (assert 89 == 5) | Parametrized state transition tests inserted temporary rows into store.db without cleanup | Added autouse cleanup fixture and explicit test-teardowns for non-seeded returns | test_seed_loads | store-api/tests/test_returns_and_state_machine.py |
| B-005 | 2026-11-09 | AttributeError: 'list' object has no attribute 'split' in get_current_principal | _mint_service_token payload scopes were list while principal extraction called .split() | Handle both list and string types for scopes claim | test_seller_can_read_any_order | store-api/app/auth.py |
| B-004 | 2026-11-09 | TypeError: can't subtract offset-naive and offset-aware datetimes | SQLite DateTime columns are naive datetimes while Clock.now() is UTC timezone-aware | Convert both datetimes via `_to_utc` helper and use naive datetimes for SQL range filters | test_orders_and_admin.py | store-api/app/admin.py, store-api/app/orders.py |
| B-003 | 2026-11-09 | AttributeError: 'inspect' has no attribute 'signature' during seed/inspect | `scripts/token.py` shadowed Python standard library `token` module | Renamed to `scripts/get_token.py` | just reset, test_auth.py | scripts/get_token.py, justfile |
| B-002 | 2026-11-09 | WinError 32 permission denied deleting store.db during reset | SQLite file handle held open by DB Browser or pooled connection on Windows | Dispose engine and catch PermissionError to drop/recreate tables cleanly | test_seed_loads | scripts/seed.py |
| B-001 | 2026-11-09 | TestClient / pytest asyncio blocked in sandbox | Windows sandbox isolates network loopback sockets needed by asyncio worker threads | Run test commands with network/socket access permitted | test_skeleton.py | store-api/tests/test_skeleton.py |

## 6. Known issues and tech debt
- (none yet)

## 7. Gotchas for the AI (lessons learned; read before coding)
- SQLite: BEGIN IMMEDIATE on every transaction; never hold a write transaction across await or HTTP.
- Windows: install tzdata; keep the repo outside OneDrive; use simple justfile commands.
- Generated files (openapi json, schema.d.ts) are never edited by hand.
- datetime.now() strictly isolated to Clock service file only.
- Endpoint response models must use explicit Pydantic models so openapi-typescript generates strict types (not generic string dictionaries).
- Partial unique indexes in SQLite cannot refer to joined tables; status must reside directly on return_items.

## 8. Contract changes (after the Stage 2 freeze)
| Date | Endpoint or field | Change | Who agreed |
| --- | --- | --- | --- |

## 9. Open questions
- (none yet)

## 10. Handoff prompt (paste into a brand-new AI chat)
You are continuing the NestKart playground project. Read AGENTS.md, docs/PROJECT_MEMORY.md and the spec sections I name. Summarize in 5 lines where the project stands (stage, last tag, open bugs). Do not write code until I confirm. Current task: <paste the stage prompt or describe the bug>.
