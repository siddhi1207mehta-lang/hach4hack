# PROJECT MEMORY — NestKart playground (SellerShield AI, Document 1)

Purpose: one place where a new AI session or teammate learns what exists, what broke, how it was fixed and why decisions were made. Keep it short, true and current. Updated at the end of EVERY stage.

## 1. Snapshot (update every stage)
- Last updated: 2026-11-09 19:30 IST
- Current phase and stage: Phase 1, Stage 4 completed (Authentication)
- Last green gate: none. Last git tag: none
- Run: just dev (web 5173, api 8000, agent placeholder 8001)
- Test: just test (39 passed), just lint (clean), store-web npm run lint (clean), npm test (2 passed), npm run build (clean), just verify-seed (17 passed)
- Demo logins: password Demo@12345. aarav.mehta@example.test (customer), priya.sharma@nestkart.test (seller owner), kiran.rao@nestkart.test (seller staff)
- Keys needed right now: none

## 2. Architecture map (fill in as you build)
- store-api/app/ : main.py, config.py, clock.py, errors.py, middleware.py, logging.py, models.py, discount.py, auth.py, deps.py
- store-api/ : pyproject.toml, uv.lock, db.py (SQLite WAL/foreign_keys/busy_timeout/BEGIN IMMEDIATE recipe)
- store-api/keys/ : jwt_private.pem, jwt_public.pem (git-ignored RS256 key pair)
- store-api/tests/ : test_skeleton.py (3 passing tests), test_schema_and_seed.py (5 passing tests), test_auth.py (31 passing tests)
- store-web/src/ : App.tsx, App.test.tsx, main.tsx, index.css, api/client.ts, api/schema.d.ts
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

## 4. Build log (newest first)
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
