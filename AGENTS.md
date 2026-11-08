# AGENTS.md — rules for any AI coding assistant working in this repo

Read this file and docs/PROJECT_MEMORY.md at the start of EVERY session. If they conflict with what the user says in chat, stop and ask.

## 1. The project in 6 lines
- NestKart = a FAKE online store (the playground) where the SellerShield support agent is tested. Everything is mock data: no real money, e-mail or couriers.
- Services: store-api (FastAPI, port 8000), store-web (React + Vite, port 5173), agent (port 8001; only a placeholder until Document 2 is built).
- Database: SQLite file store-api/data/store.db. No cloud database. Python 3.12 + uv, Node LTS + npm, task runner just.
- Full spec: docs/01-playground-spec.md. Section 16 OVERRIDES earlier sections. Contract: contracts/openapi-store.json (generated, frozen after Stage 2).
- Core rule: the AI proposes, the backend decides. The store enforces money and ownership itself and never trusts the caller.
- IDs: ORD-####, RET-####, RFD-####, CASE-####, APR-####, C###, S###.

## 2. Golden rules (never break; if a task seems to need breaking one, STOP and ask)
1. Money is integer paise (₹1 = 100 paise). Never floats for money. Money columns end in _paise.
2. Store times in UTC. All business-logic time comes from the Clock service. Never call datetime.now(), utcnow() or time.time() for business logic.
3. Ownership: a resource the caller does not own returns the SAME 404 not_found as a missing one. Never 403 for orders, returns, refunds or evidence.
4. Every mutating POST needs an Idempotency-Key. Same key + different payload = idempotency_mismatch.
5. Money-moving code runs in BEGIN IMMEDIATE transactions and NEVER holds a write transaction across an await or an HTTP call.
6. No SQL built from strings. ORM or bound parameters only.
7. Secrets live only in .env (git-ignored). Never print, log or commit tokens, passwords, keys or full e-mail addresses. .env.example has fake values only.
8. Frontend access token lives in memory only. Never localStorage or sessionStorage. Refresh token = httpOnly cookie.
9. Everything under /demo and /sim exists only when DEMO_MODE=true; otherwise 404.
10. Everything simulated is labelled SIMULATED (payments, carrier events, mail).
11. Frontend: no raw HTML from data or from a model. Sanitize with DOMPurify. No dangerouslySetInnerHTML with data.
12. Never weaken a guardrail (caps, limits, ownership, state table, idempotency) to make a test pass or a demo easier.

## 3. How to work
1. One stage at a time. Do ONLY what the prompt asks. Do not start the next stage.
2. Before coding, post a plan of at most 10 bullets (files to create or change). Then proceed, unless something is a surprise (new dependency, contract change, deleting a file). Then ask first.
3. Smallest change that works. No big rewrites. No renaming, moving or deleting files unless the prompt says so.
4. No new dependency without asking: name, why, version. Check the package really exists and that the functions you use are in its CURRENT docs. Do not invent APIs. Pin exact versions and commit lockfiles.
5. Never invent endpoints, fields, error codes or scenario data. Use the spec and the contract. If something is missing, ask, then record the decision in PROJECT_MEMORY.md.
6. Write tests together with the code. NEVER delete, skip, xfail, loosen or rewrite a test just to make it pass. If a test looks wrong, explain and ask.
7. Never fake success. Run the real commands and paste the real output. If you could not run something, say so plainly.
8. No placeholders in finished code: no TODO that hides a gap, no empty pass, no hard-coded demo values outside seed data, no silent except-pass, no mock data in real code paths.
9. Errors must surface in the standard format {error:{code,message,request_id,details}}. No catch-all that hides bugs.
10. When something breaks: reproduce, find the ROOT cause, fix it, add a regression test, log it in PROJECT_MEMORY.md (Bug log). Do not patch symptoms. After 3 failed attempts STOP and report what you tried.
11. Small, clearly named files. Comments explain WHY, not WHAT.
12. Match existing style. ruff (Python) and ESLint (TypeScript) must pass.

## 4. Git rules
- Do not run git commit, push, tag or branch commands unless asked. The human commits at the end of each stage.
- NEVER: force push, --date, GIT_AUTHOR_DATE, GIT_COMMITTER_DATE, rebase, filter-repo, reset --hard, clean -fdx, or anything that rewrites history or timestamps. (Only exception: removing a leaked secret before the first push, after rotating it, with the human’s explicit approval.)
- Never stage .env, *.db, uploads/, keys/, node_modules/, .venv/. If one is staged, say so.
- Stay inside the stage’s folders. Run destructive commands (rm -rf, DROP, delete database) only inside store-api/data, uploads, node_modules, .venv, dist.

## 5. Common AI mistakes in THIS project (watch yourself)
- Float money. Discount allocation that does not add up (use largest-remainder rounding in paise so parts sum exactly).
- Using datetime.now() or the machine clock (breaks time travel).
- Returning 403 for another customer’s order (leaks that it exists).
- Forgetting the ownership filter in a new query or list endpoint.
- Holding a SQLite write transaction while awaiting HTTP.
- Trusting amounts sent by the client or agent instead of the store’s own max_refundable calculation.
- Tokens in localStorage, CORS set to *, a wide-open CSP.
- Letting a service token mint tokens, or release large money without a stored authorization.
- Editing generated files by hand (contracts/openapi-store.json, store-web/src/api/schema.d.ts). Regenerate with just openapi and npm run gen:api.
- Changing the frozen contract without telling the human.
- Windows problems: backslash paths, missing tzdata, shell-specific justfile commands.
- Saying “all tests pass” without running them.

## 6. Definition of done (every stage)
- just dev starts, just test and just lint pass; frontend lint, test and build pass if touched.
- New behaviour has tests. Guardrail tests must FAIL when the guardrail is removed.
- No secrets, .db or key files in git status.
- docs/PROJECT_MEMORY.md updated (Build log, Bug log, Decisions, Gotchas as needed).
- Report written in the format below.

## 7. Report format (end of every stage)
1. Summary: 3–5 plain-English lines for a beginner.
2. Files created or changed.
3. How to verify: exact commands (with copy-paste curl examples for new endpoints) and the exact output I should see.
4. Test results: real numbers (passed, failed, skipped).
5. Decisions made and anything that differs from the spec.
6. Known gaps and things the human should double-check.
7. Questions (maximum 3).

## 8. New session or lost context
Re-read this file, docs/PROJECT_MEMORY.md and the spec sections named in the prompt. Summarize in 5 lines where the project stands before doing anything.