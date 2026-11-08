# PROJECT MEMORY — NestKart playground (SellerShield AI, Document 1)

Purpose: one place where a new AI session or teammate learns what exists, what broke, how it was fixed and why decisions were made. Keep it short, true and current. Updated at the end of EVERY stage.

## 1. Snapshot (update every stage)
- Last updated: YYYY-MM-DD HH:MM IST
- Current phase and stage: Phase 0, Stage 1 not started
- Last green gate: none. Last git tag: none
- Run: just setup, just seed, just dev (web 5173, api 8000, agent placeholder 8001)
- Test: just test, just lint, then in store-web: npm run lint, npm test
- Demo logins: password Demo@12345. aarav.mehta@example.test (customer), priya.sharma@nestkart.test (seller owner), kiran.rao@nestkart.test (seller staff)
- Keys needed right now: none

## 2. Architecture map (fill in as you build)
- store-api/app/ : routers, models, services, clock, simulators (list real files here)
- store-web/src/ : pages, components, api client (list real folders here)
- agent/ : placeholder until Document 2
- contracts/ : generated OpenAPI. Never hand-edit
- scenarios/seed/ : seed JSON for SC-01 to SC-17
- scripts/ : seed check, smoke tests, token helper, webhook listener

## 3. Decisions log
| # | Date | Decision | Why | Rejected alternatives |
| --- | --- | --- | --- | --- |
| D1 | 2026-11-06 | SQLite files, no Supabase | Transactions for money, offline demo, 5-second reset | Supabase, Firebase |
| D2 | 2026-11-06 | Section 16 of the spec overrides older text | Strict review fixes | – |

## 4. Build log (newest first)
### Stage N — title — date
- Built:
- Files:
- Tests: X passed, Y failed, Z skipped
- Verified by human (which commands):
- Commit and tag:

## 5. Bug and fix log (newest first)
| ID | Date | Symptom (what I saw) | Root cause | Fix | Regression test | Files |
| --- | --- | --- | --- | --- | --- | --- |
| B-000 | example | Seed took 14 s | Rows inserted one by one | One bulk insert in one transaction | test_seed_under_5s | scripts/seed.py |

## 6. Known issues and tech debt
- (none yet)

## 7. Gotchas for the AI (lessons learned; read before coding)
- SQLite: BEGIN IMMEDIATE on every transaction; never hold a write transaction across await or HTTP.
- Windows: install tzdata; keep the repo outside OneDrive; use simple justfile commands.
- Generated files (openapi json, schema.d.ts) are never edited by hand.

## 8. Contract changes (after the Stage 2 freeze)
| Date | Endpoint or field | Change | Who agreed |
| --- | --- | --- | --- |

## 9. Open questions
- (none yet)

## 10. Handoff prompt (paste into a brand-new AI chat)
You are continuing the NestKart playground project. Read AGENTS.md, docs/PROJECT_MEMORY.md and the spec sections I name. Summarize in 5 lines where the project stands (stage, last tag, open bugs). Do not write code until I confirm. Current task: <paste the stage prompt or describe the bug>.
