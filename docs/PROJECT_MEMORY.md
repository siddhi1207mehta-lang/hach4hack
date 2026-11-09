# PROJECT MEMORY — NestKart playground (SellerShield AI, Document 1)

Purpose: one place where a new AI session or teammate learns what exists, what broke, how it was fixed and why decisions were made. Keep it short, true and current. Updated at the end of EVERY stage.

## 1. Snapshot (update every stage)
- Last updated: 2026-11-09 18:25 IST
- Current phase and stage: Phase 0, Stage 2 completed (Ready for Gate 0)
- Last green gate: none. Last git tag: none
- Run: just dev (web 5173, api 8000, agent placeholder 8001)
- Test: just test (3 passed), just lint (clean), store-web npm run lint (clean), npm test (2 passed), npm run build (clean)
- Demo logins: password Demo@12345. aarav.mehta@example.test (customer), priya.sharma@nestkart.test (seller owner), kiran.rao@nestkart.test (seller staff)
- Keys needed right now: none

## 2. Architecture map (fill in as you build)
- store-api/app/ : main.py, config.py, clock.py, errors.py, middleware.py, logging.py
- store-api/ : pyproject.toml, uv.lock, db.py (SQLite WAL/foreign_keys/busy_timeout/BEGIN IMMEDIATE recipe)
- store-api/keys/ : jwt_private.pem, jwt_public.pem (git-ignored RS256 key pair)
- store-api/tests/ : test_skeleton.py (3 passing tests)
- store-web/src/ : App.tsx, App.test.tsx, main.tsx, index.css, api/client.ts, api/schema.d.ts
- store-web/ : package.json, package-lock.json, vite.config.ts, tailwind.config.js, tsconfig.json
- agent/ : main.py (placeholder on 8001 with GET /healthz)
- contracts/ : openapi-store.json (generated from FastAPI app; frozen after Stage 2)
- scenarios/seed/ : seed JSON for SC-01 to SC-17
- scripts/ : export_openapi.py, make_keys.py, dev.py

## 3. Decisions log
| # | Date | Decision | Why | Rejected alternatives |
| --- | --- | --- | --- | --- |
| D1 | 2026-11-06 | SQLite files, no Supabase | Transactions for money, offline demo, 5-second reset | Supabase, Firebase |
| D2 | 2026-11-06 | Section 16 of the spec overrides older text | Strict review fixes | – |
| D3 | 2026-11-09 | Use windows-shell with powershell in justfile | Simple commands work cleanly in both Git Bash and Windows PowerShell | CMD-only shell |
| D4 | 2026-11-09 | Typed Pydantic models for response schemas | Enables concrete TypeScript types in openapi-typescript and compile-time contract checks | Dict response annotations |

## 4. Build log (newest first)
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
| B-001 | 2026-11-09 | TestClient / pytest asyncio blocked in sandbox | Windows sandbox isolates network loopback sockets needed by asyncio worker threads | Run test commands with network/socket access permitted | test_skeleton.py | store-api/tests/test_skeleton.py |

## 6. Known issues and tech debt
- (none yet)

## 7. Gotchas for the AI (lessons learned; read before coding)
- SQLite: BEGIN IMMEDIATE on every transaction; never hold a write transaction across await or HTTP.
- Windows: install tzdata; keep the repo outside OneDrive; use simple justfile commands.
- Generated files (openapi json, schema.d.ts) are never edited by hand.
- datetime.now() strictly isolated to Clock service file only.
- Endpoint response models must use explicit Pydantic models so openapi-typescript generates strict types (not generic string dictionaries).

## 8. Contract changes (after the Stage 2 freeze)
| Date | Endpoint or field | Change | Who agreed |
| --- | --- | --- | --- |

## 9. Open questions
- (none yet)

## 10. Handoff prompt (paste into a brand-new AI chat)
You are continuing the NestKart playground project. Read AGENTS.md, docs/PROJECT_MEMORY.md and the spec sections I name. Summarize in 5 lines where the project stands (stage, last tag, open bugs). Do not write code until I confirm. Current task: <paste the stage prompt or describe the bug>.
