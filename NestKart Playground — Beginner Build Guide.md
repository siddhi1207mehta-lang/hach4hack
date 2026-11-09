# NestKart Playground — Beginner Build Guide

*Setup → prompts → verification → GitHub, with the AI-agent rules file and the project-memory document. Prepared 6 Nov 2026 from “SellerShield AI — Document 1: The Agent Playground”.*

## 1. Read this first

**What you are building.** NestKart is a fake online store: a customer website, a seller console, a store API, a simulated courier, payment gateway and mailbox, and a demo control center. Your SellerShield agent (Document 2) will be tested inside it. This guide builds the playground only.

**Final stack.** It is the stack in your spec. I checked it against your goals and kept it.

| Part | Choice | Why it suits a beginner |
| --- | --- | --- |
| Backend | Python 3.12, FastAPI, SQLAlchemy 2, Pydantic 2 | Readable code, automatic API docs at /docs, AI assistants know it well |
| Database | SQLite (one file) | Nothing to install, no account, reset = copy a file |
| Frontend | React 18, Vite, TypeScript | Fast feedback, type errors caught early |
| UI kit | Tailwind CSS + shadcn/ui | Good-looking components without hand-written CSS |
| Tools | uv (Python), npm, just, pytest, ruff | `just dev` starts everything |
| Version control | Git + GitHub | Backup, history, submission |

**Do I need Supabase or any cloud database? No.** Run everything locally. The database is a file, `store-api/data/store.db`, created automatically by `just seed`. The agent will later get its own file, `agent/data/agent.db`. Reasons (from your spec): refunds need real transactions and constraints that SQLite gives you; there are no keys, quotas or network delays; a demo reset takes under 5 seconds. Supabase (Postgres) is the production path later; the code is written so only a connection string changes.

**What this guide covers.** store-api, store-web (customer portal, seller console, chat-widget shell, Demo Control Center), the simulators, tests, README and the GitHub push. **It does not cover** the agent service or the SellerShield dashboard pages (Approvals, Cases, Agent Activity, Audit, Policy Studio, Analytics, Monitor). Those need Document 2. A tiny placeholder agent on port 8001 keeps the layout ready.

**My assumptions (tell me if any is wrong).** You build alone (both backend and frontend roles). You use an AI coding assistant that can edit files and run commands (Claude Code, Cursor, Copilot, etc.). Any operating system. You will save your spec file inside the repo as `docs/01-playground-spec.md`.

**How the guide works.** There are 16 stages in 5 phases. Every stage has the same four parts: **Goal**, **Prompt** (copy and paste into your AI assistant), **Verify** (commands and what you must see), **Commit**. Do not start the next stage until every Verify line passes. At the end of each phase there is a **Gate** and a git tag.

| Phase | Stages | Tag | When (per your spec) |
| --- | --- | --- | --- |
| 0 Foundations | 1–2 | phase-0-foundations | Before 11 Nov |
| 1 Walking skeleton (read-only) | 3–6 | phase-1-walking-skeleton | Before 11 Nov |
| 2 Money path | 7–10 | phase-2-money-path | Before 11 Nov |
| 3 Escalation and autonomy support | 11–13 | phase-3-escalation-autonomy | Before 11 Nov |
| 4 Hardening | 14–16 | phase-4-hardened | Inside the window (from 11 Nov 10:00 IST) |
| 5 Release | – | v1.0-submission | Inside the window |

**Time.** Your spec estimates about 24 focused hours per person for the must-have work with an AI assistant. As a solo beginner doing both sides, expect more. If you run late, use the spec’s cut order (Policy Studio, Analytics, monitor, memory chips, e-mail channel, storefront, sign-up). **Never cut:** confirmation by button, backend refund calculation, store invariants and caps, audit, escalation, guided mode.

**Windows users: run every command in Git Bash** (it installs with Git). Then `curl`, `$(...)`, `grep` and `cp` work exactly as written. Use forward slashes in paths.

**Honesty rules from your spec.** Build locally now. Create the GitHub repository on 11 Nov after 10:00 IST and push phase by phase (Section 12). Never change commit dates or rewrite history to look newer. Keep the organizers’ written permission message (date, channel, exact words) and disclose the timeline in the README.

## 2. Install the tools (30–45 minutes)

You need: Git, uv (it can install Python 3.12 for you), Node.js LTS (20 or newer), just, the GitHub CLI, gitleaks (secret scanner) and VS Code.

**Windows** (PowerShell, normal user). If a name is not found, run `winget search <name>`.

```
winget install Git.Git
winget install astral-sh.uv
winget install OpenJS.NodeJS.LTS
winget install Casey.Just
winget install GitHub.cli
winget install Microsoft.VisualStudioCode
scoop install gitleaks
```

No scoop? Download gitleaks from github.com/gitleaks/gitleaks/releases and put it on your PATH.

**macOS**

```
brew install git uv node just gh gitleaks
brew install --cask visual-studio-code
```

**Linux:** use your package manager for git, node and just; install uv and gitleaks from their official instructions.

Close and reopen the terminal, then:

```
uv python install 3.12
```

**Optional but helpful:** DB Browser for SQLite (sqlitebrowser.org) to look inside your database file. Skip Docker and cloudflared for now.

**Accounts.** GitHub account with two-factor authentication on. Run `gh auth login` now so it is ready. The Hack4Hack fee (₹499) must be paid before 11 Nov 10:00 IST. You do **not** need Supabase, Firebase, Redis, e-mail, SMS, payment or courier accounts. LLM keys (Google AI Studio, Groq) are for the agent in Document 2, not for this guide.

**Verify (all must print a version):**

```
git --version        # 2.40 or newer
uv --version
uv python list       # shows a 3.12.x entry
node --version       # 20 or newer
npm --version
just --version
gh --version
gitleaks version
gh auth status       # logged in
```

## 2A. Your setup: Windows + Google Antigravity

Antigravity is Google’s AI-first editor (a VS Code fork) with an Agent Manager. This section adjusts Sections 2–6 for your setup. Menu names change between Antigravity versions; if a label differs, look in Settings (Ctrl+,) for the closest one.

**Install and sign in.** Download Antigravity from antigravity.google, install it and sign in with your Google account. You do not need VS Code. In Section 3 skip the `code .` line and use File → Open Folder to open your `sellershield` folder.

**Terminal: Git Bash.** In Antigravity press Ctrl+Shift+P, run *Terminal: Select Default Profile* and pick Git Bash. Run every command from this guide there. The assistant may run its own commands in PowerShell; that is fine, because the `justfile` is built to work in both (Stage 1).

**Git on Windows.** In Section 3 use `git config core.autocrlf true` (the guide’s command is already changed for you).

**Safety settings — set these before Stage 1.** In the first-run wizard choose *Review-driven development*. Or open Settings → Agent and set the terminal command policy to *Request review* and the review policy to *Request review*. Antigravity then asks before every command and file change. Do not use *Always proceed* or *Agent-driven* until you have finished a few stages and trust your checks. If you build an allow list, add only harmless commands (`git status`, `just test`, `just lint`). Never allow-list `git push`, `rm` or `del`.

**Rules file.** Antigravity reads `AGENTS.md` from the project root (support was added in v1.20.3, March 2026), so Section 4 works as written. Test it: start a new conversation and ask *List the rules files you loaded and quote golden rule 1.* It must quote the integer-paise rule. If it does not, update Antigravity, then add a root `GEMINI.md` containing one line: `Read and follow AGENTS.md before doing anything.` Keep that file to one line, because `GEMINI.md` outranks `AGENTS.md`. Google limits each rule file to about 12,000 characters; the `AGENTS.md` in this guide is about 9,500, so do not keep growing it. Put extra rules in separate files under `.agents/rules/`.

**Running a stage in Antigravity**

1. In Git Bash, `git status` must be clean (that is your undo point).
2. Open the Agent Manager and start a **new conversation for every stage**.
3. Choose *Planning* mode (not *Fast*) and the most capable model offered. Use Fast only for tiny fixes.
4. Paste the stage prompt. Antigravity shows an Implementation Plan and a Task List first. Read the plan: does it stay inside the stage, in about 10 bullets? If it adds extras, reject it or comment on it.
5. Approve commands one at a time and read them. Say no to anything that touches `.env`, deletes folders, or runs `git commit` or `git push`.
6. The Walkthrough at the end is the AI’s claim, not proof. Run the Verify steps yourself.
7. Do the 8-point check (Section 6), then commit yourself in Git Bash.

Optional: ask Antigravity’s browser agent to open http://localhost:5173 and screenshot pages. It is handy in Stages 6, 10 and 13, but still do the manual checks yourself.

**Windows problems**

| Symptom | Fix |
| --- | --- |
| `npm.ps1 cannot be loaded because running scripts is disabled` (PowerShell) | In PowerShell run `Set-ExecutionPolicy -Scope CurrentUser RemoteSigned`, then reopen the terminal. |
| `just`, `uv` or `node` not found right after installing | Close Antigravity completely and reopen it so the PATH refreshes. |
| Windows Firewall pop-up for Python or Node | Allow on Private networks (ports 8000 and 5173). |
| `gitleaks` not found | Run `winget search gitleaks` and install what it lists. Otherwise download the Windows zip from the gitleaks releases page and put `gitleaks.exe` on your PATH. |
| curl lines with JSON break in PowerShell | Use Git Bash for every curl line in this guide. |

## 3. Create the project folder and Git safely

Keep the project **outside OneDrive, Dropbox or iCloud**; they can corrupt SQLite files. Example: `~/dev/sellershield` (Windows: `C:/dev/sellershield`).

```
mkdir -p ~/dev/sellershield
cd ~/dev/sellershield
mkdir -p docs contracts scenarios store-api store-web agent scripts
touch docs/.gitkeep contracts/.gitkeep scenarios/.gitkeep scripts/.gitkeep
code .
```

In VS Code create these files **before anything else**:

1. `.gitignore`

```
.env
*.db
*.db-wal
*.db-shm
data/
uploads/
keys/
.venv/
node_modules/
dist/
__pycache__/
.pytest_cache/
.ruff_cache/
.DS_Store
*.bundle
*.log
playwright-report/
test-results/
```

2. `.gitattributes` containing one line: `* text=auto`
3. `docs/01-playground-spec.md` — the spec file you uploaded to me (copy it in).
4. `AGENTS.md` — copy from Section 4.
5. `docs/PROJECT_MEMORY.md` — copy from Section 5.

Then set up Git (macOS/Linux use `input`; Windows use `true`):

```
git init -b main
git config user.name 'Your Name'
git config user.email 'you@example.com'
git config core.autocrlf true
git add -A
git commit -m 'chore: repo skeleton, docs and tooling'
```

**Verify**

- `git log --oneline` shows exactly one commit.
- `git status` says “nothing to commit, working tree clean”.
- `git ls-files` lists `.gitignore`, `.gitattributes`, `AGENTS.md`, `docs/01-playground-spec.md`, `docs/PROJECT_MEMORY.md` and the `.gitkeep` files, and **no** `.env`.

Final layout (built stage by stage):

```
sellershield/
  store-api/   FastAPI store and simulators
  store-web/   React app: portal, seller console, widget
  agent/       placeholder now, real agent later (Document 2)
  contracts/   openapi-store.json (generated)
  scenarios/   seed data (JSON)
  scripts/     helper scripts (seed check, smoke tests, tokens)
  docs/        spec, PROJECT_MEMORY.md, README assets
  AGENTS.md  justfile  .env.example
```

## 4. AGENTS.md — the AI rules file (copy the whole block into `AGENTS.md`)

Why it exists: AI assistants sometimes invent packages, delete failing tests, fake “all tests pass”, or quietly break money rules. This file tells every assistant what is forbidden and how to report. Most assistants read `AGENTS.md` automatically. If yours does not, create a one-line pointer file with the name it expects (for example `CLAUDE.md` containing “Read AGENTS.md first”). Every prompt in this guide also says “Read AGENTS.md”, so it works either way.

```markdown
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
```

## 5. PROJECT\_MEMORY.md — the project’s long-term memory (copy the block into `docs/PROJECT_MEMORY.md`)

AI assistants forget everything between chats. This file is the fix. It records what exists, what broke, how it was fixed and why each decision was made, so a new chat (or a new teammate) can continue without guessing. The AI updates it at the end of **every stage**; you read it before every commit. When it grows past about 400 lines, move old Build-log entries to `docs/memory-archive/YYYY-MM.md` and leave a 5-line summary here.

```markdown
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
```

## 6. How to run every stage

**Before the stage.** `git status` must be clean (commit or restore first). That commit is your undo button. Start a **fresh AI chat** for each stage so the context stays small; the first line of every prompt makes the assistant read the rules and memory.

**During.** Paste the prompt. Read the assistant’s plan (max 10 bullets). If it wants a new dependency or a contract change, decide yourself. Let it work.

**After — the 8-point check (do all eight):**

1. Read the report. It must show real command output. If it only says “done”, ask for the commands and their output.
2. Run the Verify commands yourself. Never trust “all tests pass”. Run `just test` yourself.
3. `git status` then `git diff --stat`. Only the stage’s files changed? No `.env`, `.db` or `keys/`.
4. Look for cheating: `git diff | grep -nE 'skip|xfail|TODO|noqa|type: ignore'`. Read every hit.
5. New dependency? `git diff -- store-api/pyproject.toml store-web/package.json`. Was it asked for and explained?
6. Open `docs/PROJECT_MEMORY.md`. Build log and gotchas updated?
7. `gitleaks detect --source . --no-banner` reports no leaks.
8. Commit with a conventional message, for example `git add -A` then `git commit -m 'feat(store): stage 3 schema and seed'`.

**If the AI goes wrong**

| Problem | What to do |
| --- | --- |
| Big mess, wrong direction | `git clean -nd` (dry run: lists new files it would delete), then `git restore .` (undo edits) and `git clean -fd` (delete new files). You are back at your last commit. Re-prompt with a tighter limit. |
| A test fails and the AI loops | After 3 attempts stop it. Paste the exact error and say: explain the root cause first, do not change the test. |
| The AI deleted or loosened a test | Reject it. `git restore <that test file>`. |
| Something worked yesterday and broke today | Add a Bug-log row: symptom, root cause, fix, regression test. `git log --oneline` and `git diff <old commit>` show what changed. |
| Chat is long and the AI seems confused | Open a new chat and paste the handoff prompt (Section 5, part 10). |
| You suspect the tests are fake | Mutation check: break one guardrail on purpose (for example remove the ownership filter), run `just test`, expect failures, then `git restore .`. |

## 7. Phase 0 — Foundations (Stages 1–2)

### Stage 1 — store-api skeleton

**Goal:** a running FastAPI app with config, Clock, error format, request ids, health checks, the SQLite connection recipe, a placeholder agent, the `justfile` and the first tests.

**Prompt**

```
Read AGENTS.md and docs/PROJECT_MEMORY.md first, then docs/01-playground-spec.md sections 0A, 2, 3, 6 (Conventions), 11 and 16. Section 16 overrides older text.

STAGE 1 - store-api skeleton. Build ONLY this:
1. store-api/ as a Python 3.12 project managed by uv (pyproject.toml, uv.lock). Dependencies from the store-api list in spec 0A. Pin exact versions.
2. FastAPI app with: settings via pydantic-settings reading .env (variables listed in spec 0A); a Clock service (modes realtime/frozen plus offset; every business 'now' goes through Clock.now(), never datetime.now() elsewhere); the error format {error:{code,message,request_id,details}} with the error codes from spec 6; X-Request-ID middleware (create if missing, echo in the response, include in logs); structured JSON logs that never contain secrets; GET /healthz; GET /readyz (checks database and clock); GET /api/v1/clock (always on, read-only, returns now_utc and mode).
3. store-api/db.py containing exactly the SQLite recipe from spec section 16 (WAL, foreign_keys, busy_timeout, BEGIN IMMEDIATE). The file store-api/data/store.db is created automatically.
4. agent/ placeholder: a tiny FastAPI app for port 8001 with ONLY GET /healthz.
5. justfile at the repo root with recipes: setup, dev, dev-api, test, lint, keys, seed, reset, inspect, verify-seed, openapi, token, smoke-money, webhook-listener, security-check, perf, demo, demo-check. Recipes not built yet print 'not built yet'. The test recipe forwards extra arguments to pytest (just test -k name). Recipes must be simple one-line commands that work in both Git Bash and Windows PowerShell; put anything complicated in a Python script under scripts/.
6. .env.example with FAKE values for every variable in spec 0A. The real .env stays git-ignored. Create a local .env from it.
7. pytest with 3 tests (healthz, error format on an unknown route, request id echoed) and ruff configured.
Do NOT build tables, auth or business endpoints yet.
```

**Verify**

```
just setup
just dev-api
```

In a second terminal:

```
curl -i http://localhost:8000/healthz
curl http://localhost:8000/readyz
curl http://localhost:8000/api/v1/clock
curl http://localhost:8000/api/v1/nope
curl -i -H 'X-Request-ID: my-test-1' http://localhost:8000/healthz
```

- `/healthz` → 200 and a header `x-request-id`.
- `/readyz` → database and clock both OK.
- `/api/v1/clock` → `now_utc` and `mode` = `realtime`.
- `/api/v1/nope` → 404 JSON with `error.code` = `not_found` and a `request_id`.
- The last command echoes `my-test-1` in the response header.
- Open http://localhost:8000/docs → interactive API page loads.
- `just test` → 3 passed. `just lint` → no errors.
- `grep -rnE 'datetime.now|utcnow' store-api --include=*.py` → hits only inside the Clock file.
- `git status` does not list `store-api/data/store.db` or `.env` (they are ignored).

**Commit:** `git add -A` then `git commit -m 'feat(store): stage 1 api skeleton'`.

### Stage 2 — Web skeleton and contract pipeline

**Goal:** a React app that talks to the API through a typed client, the dev proxy, the OpenAPI export, the JWT key script, and one command that starts everything.

**Prompt**

```
Read AGENTS.md and docs/PROJECT_MEMORY.md first, then docs/01-playground-spec.md sections 3, 9.6, 9.7, 11 and 16.

STAGE 2 - store-web skeleton and contract pipeline. Build ONLY this:
1. store-web/: Vite + React 18 + TypeScript. Set up Tailwind CSS and shadcn/ui using their CURRENT official instructions (read the docs, do not guess). Add react-router-dom, @tanstack/react-query, openapi-fetch, openapi-typescript, lucide-react, clsx, tailwind-merge, date-fns, date-fns-tz, dompurify, react-markdown, @microsoft/fetch-event-source. Pin exact versions and commit package-lock.json. ESLint and Vitest with one passing test.
2. Vite dev proxy: /api to http://localhost:8000 and /agent to http://localhost:8001 (strip the /agent prefix) so the browser sees one origin.
3. Design tokens from spec 9.6 (Inter font, navy/teal/amber/red palette, 4/8 px spacing). Routes: / (customer home placeholder), /login (placeholder), /seller (placeholder). One page that calls GET /api/v1/clock through the generated typed client and shows the result.
4. Contract pipeline: 'just openapi' writes contracts/openapi-store.json straight from the FastAPI app (a script, no running server needed); 'npm run gen:api' in store-web generates src/api/schema.d.ts from it.
5. 'just keys' runs scripts/make_keys.py, which creates an RS256 key pair under store-api/keys/ and refuses to overwrite existing keys. keys/ is already git-ignored.
6. 'just dev' starts store-api (8000), the agent placeholder (8001) and store-web (5173) together.
Freeze the contract after this stage: later changes must be reported.
```

**Verify**

```
just openapi
cd store-web && npm run gen:api && cd ..
just keys
just keys
just dev
```

- `contracts/openapi-store.json` exists and mentions `/api/v1/clock`.
- `store-web/src/api/schema.d.ts` exists.
- First `just keys` creates two key files. The second run **refuses** and changes nothing. `git status` shows no key files.
- With `just dev` running, http://localhost:5173 shows the clock result in the page.
- `curl http://localhost:5173/api/v1/clock` returns the same JSON as port 8000 (proxy works).
- `curl http://localhost:8001/healthz` answers OK.
- `just test`, `just lint`, and in store-web `npm run lint` and `npm test` all pass.
- **Typed-contract proof:** in the clock page change a field name to a wrong one (for example `now_utcc`). `npm run build` must fail with a type error. Undo with `git restore store-web/src`.

**Commit:** `git add -A` then `git commit -m 'feat(web): stage 2 web skeleton and contracts'`.

### Gate 0 — tag `phase-0-foundations`

All true? `just dev` starts three apps; both `/healthz` answer; the OpenAPI file exports; tests and lint pass; `docs/PROJECT_MEMORY.md` snapshot is updated. Then:

```
gitleaks detect --source . --no-banner
git status
git add -A
git commit -m 'feat: phase 0 foundations'
git tag phase-0-foundations
```

(Use a lightweight tag: no `-a`.) If there is nothing new to commit, skip the commit and only tag.

## 8. Phase 1 — Walking skeleton, read-only (Stages 3–6)

### Stage 3 — Database tables and seed data

**Goal:** this is where the database is set up. There is nothing to install or sign up for: the code creates the SQLite file, all tables, the constraints and the seed data for the 17 test scenarios. Reset plus seed takes under 5 seconds.

**Prompt**

```
Read AGENTS.md and docs/PROJECT_MEMORY.md first, then docs/01-playground-spec.md sections 5, 8 (seed times), 10 and 16 (amendments 1 to 5). Section 16 overrides older text.

STAGE 3 - tables and seed data. Build ONLY this:
1. SQLAlchemy 2.0 models for every table in spec section 5, plus store_settings (autonomy_cap_paise default 50000, autonomy_daily_cap_paise default 500000), an evidence table, and any column that section 16 adds. Money columns end in _paise (integers). Mutable tables have a version column. Constraints: foreign keys, unique email, unique refunds.idempotency_key, and a PARTIAL unique index so only one ACTIVE return can exist per order item.
2. Seed data as JSON files in scenarios/seed/ for SC-01 to SC-17 exactly as in spec section 10: users, customers C001-C005, sellers S001-S002, the 10 products, orders, order items, shipments with their carrier script ids, historic completed returns for C003 (ORD-3001 to ORD-3004), six mailbox messages. All seed times are offsets from T0 (the moment of seeding). Default password Demo@12345 hashed with argon2id.
3. Discount allocation per order item uses integer paise with largest-remainder rounding, so the allocations add up EXACTLY to the order discount (needed for SC-08).
4. 'just seed' creates the database file if missing, loads the seed in under 5 seconds and prints row counts and elapsed time. 'just reset' drops and recreates only store-api/data/store.db and reseeds. 'just inspect' prints row counts per table and the status of every scenario order.
5. scripts/verify_seed.py ('just verify-seed'): checks each of SC-01 to SC-17 exists in the stated state and prints PASS or FAIL per scenario.
6. pytest: seed loads; a second active return for the same item is rejected by the database; foreign keys are enforced; discount allocation sums exactly.
No endpoints in this stage.
```

**Verify**

```
just seed
just verify-seed
just inspect
just test
```

- `just seed` prints row counts and an elapsed time under 5 seconds.
- `just verify-seed` prints 17 PASS lines (SC-01 to SC-17) and 0 FAIL.
- `just inspect` shows 5 customers, 2 sellers, 10 products. ORD-1048 total is **89900** paise (₹899). ORD-2031 total is **164700** paise (₹1,647).
- Run `just seed` twice. The counts are the same both times.
- Optional but recommended: open `store-api/data/store.db` in DB Browser for SQLite, tab Browse Data, table `users`. `password_hash` must start with `$argon2id$`, never the plain password.
- `just test` passes, including the second-active-return rejection.
- `git status` does not list the `.db` file.

**Commit:** `git add -A` then `git commit -m 'feat(store): stage 3 schema and seed'`.

### Stage 4 — Authentication

**Goal:** login, short-lived tokens signed with a private key (the agent will only ever hold the public key), refresh cookies, service tokens, and the security headers.

**Prompt**

```
Read AGENTS.md and docs/PROJECT_MEMORY.md first, then docs/01-playground-spec.md sections 4, 6 (Auth rows), 12 and 16 (findings 2, 5, 7).

STAGE 4 - authentication. Build ONLY this:
1. POST /api/v1/auth/login (email and password; argon2id verify; generic error text; 5 attempts per minute per IP and e-mail using slowapi; 15-minute lock after 10 failures).
2. Access JWT signed RS256, 15 minutes, claims sub, role, customer_id, aud=[nestkart-api, sellershield-agent], iss, exp, jti, auth_time. Private key from JWT_PRIVATE_KEY_PATH. Never use HS256.
3. Refresh token: opaque, 7 days, rotating, in an httpOnly SameSite=Lax cookie; only its hash is stored. POST /auth/refresh and /auth/logout rotate or revoke. CSRF double-submit header on cookie endpoints.
4. GET /auth/me. GET /api/v1/.well-known/jwks.json (public key only). POST /auth/token (OAuth client-credentials) for the clients agent-executor and agent-monitor with different scopes; service JWT 10 minutes, aud=nestkart; client secrets from SERVICE_CLIENT_SECRETS (demo values in .env.example).
5. Dependencies get_current_principal, require_role(...), require_scope(...). Verify signature, audience, issuer and expiry; reject alg none.
6. Middleware: security headers (CSP, X-Content-Type-Options nosniff, frame-ancestors none), 1 MB body limit, CORS allowlist from CORS_ORIGINS, no stack traces in responses.
7. 'just token <email>' prints ONLY the access token of a seeded user (for curl tests).
8. Tests: wrong password, throttle, lockout, expired token, wrong audience, bad signature, alg none, refresh rotation (old refresh token fails), customer token rejected on seller-only routes, monitor token cannot use executor scopes.
```

**Verify**

```
just reset
just keys
just dev-api
```

Second terminal:

```
curl -i -X POST http://localhost:8000/api/v1/auth/login -H 'Content-Type: application/json' -d '{"email":"aarav.mehta@example.test","password":"Demo@12345"}'
TOKEN=$(just token aarav.mehta@example.test)
curl -H "Authorization: Bearer $TOKEN" http://localhost:8000/api/v1/auth/me
curl -i http://localhost:8000/api/v1/auth/me
curl http://localhost:8000/api/v1/.well-known/jwks.json
for i in 1 2 3 4 5 6 7; do curl -s -o /dev/null -w '%{http_code}\n' -X POST http://localhost:8000/api/v1/auth/login -H 'Content-Type: application/json' -d '{"email":"aarav.mehta@example.test","password":"wrong"}'; done
```

- Login → 200, an `access_token` in the body, and a `Set-Cookie` header containing `HttpOnly` and `SameSite=Lax`.
- `/auth/me` with the token → `role` = customer, `customer_id` = C001.
- `/auth/me` with no token → 401 in the standard error format.
- The JWKS shows a key with `kty` = RSA and **no** private fields (no `d`).
- The loop prints 401 for the first attempts, then 429. The error text is the same for a wrong password and an unknown e-mail.
- Change one character of `$TOKEN` and call `/auth/me` again → 401.
- `curl -i http://localhost:8000/healthz` shows `x-content-type-options: nosniff` and a `content-security-policy` header.
- `just test` passes (all auth tests). `git ls-files | grep keys` prints nothing.

**Commit:** `git add -A` then `git commit -m 'feat(store): stage 4 authentication'`.

### Stage 5 — Read-only store endpoints

**Goal:** orders, shipments, refundable amounts, seller read views. This is where the “other customers can never see my order” rule is built and tested.

**Prompt**

```
Read AGENTS.md and docs/PROJECT_MEMORY.md first, then docs/01-playground-spec.md sections 4 (matrix), 5, 6 (Orders and Admin rows) and 16 (amendment 5).

STAGE 5 - read-only store endpoints. Build ONLY this:
1. GET /orders (own orders only, cursor pagination with limit and cursor, optional status filter and search), GET /orders/{id}, GET /orders/{id}/shipment (status, ETA, events and a derived delayed flag = eta earlier than Clock.now and not delivered), GET /orders/{id}/refundable?items=ITEM_ID:QTY,ITEM_ID:QTY (per-item remaining quantity and max_refundable_paise net of active refunds, based on line_paid_paise), GET /orders/{id}/refunds (empty list is fine for now), GET /products (public).
2. Ownership in EVERY query: an order the caller does not own returns a uniform 404 not_found, never 403, with the same body as a missing order.
3. Seller routes GET /admin/orders, /admin/orders/{id}, /admin/customers/{id} (customer summary: returns_30d, refund ratio 90 days, account age) for seller_owner, seller_staff and agent-monitor (scope orders:read_all).
4. Propagate X-Request-ID. Write a store_audit row for every denied access.
5. Tests: SC-01, SC-02 (Diya asking for ORD-1042 gets exactly the same 404 as a non-existent order), SC-03, pagination, delayed flag for ORD-2037, refundable for ORD-2040 = 50000, seller can read any order, customer cannot call /admin routes.
```

**Verify** (server running as in Stage 4)

```
TOKEN=$(just token aarav.mehta@example.test)
DIYA=$(just token diya.nair@example.test)
PRIYA=$(just token priya.sharma@nestkart.test)
curl -H "Authorization: Bearer $TOKEN" http://localhost:8000/api/v1/orders
curl -H "Authorization: Bearer $TOKEN" http://localhost:8000/api/v1/orders/ORD-1048
curl -H "Authorization: Bearer $TOKEN" http://localhost:8000/api/v1/orders/ORD-1048/shipment
curl -i -H "Authorization: Bearer $DIYA" http://localhost:8000/api/v1/orders/ORD-1042
curl -i -H "Authorization: Bearer $DIYA" http://localhost:8000/api/v1/orders/ORD-9999
curl -i -H "Authorization: Bearer $TOKEN" http://localhost:8000/api/v1/admin/orders
curl -H "Authorization: Bearer $PRIYA" http://localhost:8000/api/v1/admin/customers/C003
curl -H "Authorization: Bearer $DIYA" http://localhost:8000/api/v1/orders/ORD-2037/shipment
```

- Aarav’s order list includes ORD-1048, ORD-1042, ORD-1051, ORD-1060, ORD-1061 and ORD-1070. Money fields end in `_paise` and are integers.
- ORD-1048: `total_paise` 89900, status in transit. Its shipment shows events and `delayed` = false.
- Diya asking for ORD-1042 (Aarav’s order) → 404 `not_found`. Diya asking for ORD-9999 (does not exist) → the **same** body apart from `request_id`.
- Aarav calling `/admin/orders` → 403 `forbidden` (this is a role-protected route, not a resource).
- Priya’s view of customer C003 shows `returns_30d` = 4.
- ORD-2037 shipment shows `delayed` = true.
- Refundable check: get Diya’s ORD-2040, copy the bottle’s `item_id`, then call `.../orders/ORD-2040/refundable?items=<ITEM_ID>:2`. Expect `max_refundable_paise` 50000 (₹500 remaining).
- `just inspect` shows rows in the store audit table for the denied requests.
- `just test` passes.

**Commit:** `git add -A` then `git commit -m 'feat(store): stage 5 read endpoints'`.

### Stage 6 — Customer portal (read-only) and chat widget shell

**Goal:** log in, see orders, open an order with its shipment timeline, and see a chat widget that works in “Guided mode” until the agent exists.

**Prompt**

```
Read AGENTS.md and docs/PROJECT_MEMORY.md first, then docs/01-playground-spec.md sections 9.1 (J1), 9.2, 9.3, 9.6, 9.7 and 16 (Web amendment, findings 4 and 6).

STAGE 6 - customer portal (read-only) and chat widget shell. Build ONLY this:
1. API client wrapper on openapi-fetch: adds Authorization and X-Request-ID, refreshes the token ONCE on a 401. Access token in memory only, never localStorage or sessionStorage. Refresh uses the httpOnly cookie. On page reload the session is restored silently.
2. Pages: Login (with DEMO quick-login buttons for the five customers and two sellers when VITE_DEMO_MODE=true; lockout and error messages), My Orders (status chips, date, total formatted in rupees from paise, shipment badge, search, skeleton and empty and error-with-retry states), Order detail (items, discount allocation, shipment timeline, buttons Track, Return (disabled for now) and Ask support), Profile. Auth guard by role, error boundary per route, a 404 page. Dates in IST with relative text.
3. Chat widget bottom-right on all customer pages: header 'SellerShield Assistant' with an AI disclosure label, quick actions (Track order, Start a return, Refund status, Talk to a human), message list with aria-live, 1,000-character counter, and an SSE hook built on @microsoft/fetch-event-source (reconnect and abort) that targets /agent/v1/chat/stream. The agent does not exist yet, so when /agent is unreachable show a 'Guided mode' banner and keep the four quick actions working with simple local replies. Render assistant text as plain text plus a small markdown subset, sanitized with DOMPurify, no raw HTML.
4. Vitest tests for money formatting (89900 becomes ₹899.00) and the API client refresh-once behaviour.
No return forms, seller pages or demo pages yet.
```

**Verify** (browser)

```
just reset
just dev
```

- Open http://localhost:5173/login, click the quick-login for Aarav. My Orders lists his orders; ORD-1048 shows ₹899.00. Open it: the shipment timeline appears.
- Press F5. You stay logged in (silent refresh).
- DevTools → Application: Local Storage and Session Storage contain **no tokens**. Cookies: the refresh cookie has HttpOnly ticked.
- Log out, log in as Diya, type `/orders/ORD-1042` in the address bar → an “Order not found” page.
- Open the chat bubble. The placeholder agent has no chat endpoint, so the **Guided mode** banner must show and the four quick actions still respond.
- Type 1,001 characters: the limit stops you.
- Send the text `<img src=x onerror=alert(1)>`. It appears as plain text and no alert pops up.
- DevTools device toolbar at phone width: the layout is usable.
- In store-web: `npm run lint`, `npm test`, `npm run build` all succeed.

**Commit:** `git add -A` then `git commit -m 'feat(web): stage 6 portal and chat shell'`.

### Gate 1 — tag `phase-1-walking-skeleton`

`just reset`, `just verify-seed` (17 PASS), `just test` and the web checks all pass; SC-01, SC-02 and SC-03 are covered by tests; the chat opens in Guided mode. Update the PROJECT\_MEMORY snapshot, then:

```
gitleaks detect --source . --no-banner
git add -A
git commit -m 'feat: phase 1 walking skeleton'
git tag phase-1-walking-skeleton
```

## 9. Phase 2 — The money path (Stages 7–10)

This is the most important phase. The store itself must refuse wrong money moves, even if the agent is faulty or attacked. Take extra care with every Verify line.

### Stage 7 — Returns, state machine and idempotency

**Goal:** customers create returns; a single state table controls every status change; repeating a request never causes a second effect.

**Prompt**

```
Read AGENTS.md and docs/PROJECT_MEMORY.md first, then docs/01-playground-spec.md sections 5 (state machines and invariants), 6 (Returns rows and Conventions) and 16 (findings 1 and 14, amendment 1). Section 16 overrides older text.

STAGE 7 - returns, transition engine, idempotency. Build ONLY this:
1. Idempotency: every mutating POST needs an Idempotency-Key header. Same key and same payload returns the stored response with no second effect. Same key and a different payload is rejected with idempotency_mismatch. A missing key gives validation_error.
2. POST /orders/{id}/returns (customer token only; items, reason_code, reason_text, resolution refund or store_credit; creates status requested). Checks: item was delivered; quantity is at most delivered minus active and completed returns; only one active return per item (code duplicate); ownership through the uniform 404. Treat reason_text as plain data (it may contain attack text): never execute it, escape it on render.
3. GET /returns and GET /returns/{id} (customer: own only; seller: all), POST /returns/{id}/cancel (customer, only before approval).
4. POST /returns/{id}/transition (body: to, reason) driven by ONE state table in code that matches the Return row of spec section 5. A seller token may trigger any allowed edge (this also lets tests and the Returns queue drive the pickup and transit edges until the carrier simulator automates them in Stage 11). The agent-executor may only do requested to approved or rejected, and only when the return value is within the autonomy cap read from store_settings. Check and change state in ONE BEGIN IMMEDIATE transaction and write an audit row. Add POST /admin/returns/{id}/receive and /inspect for sellers.
5. Tests: SC-04, SC-09 (duplicate blocked), SC-14 (two parallel confirmations of the same return create exactly one return), EVERY illegal edge rejected (one parametrized test over the whole table), idempotency replay and mismatch, executor above the cap rejected.
```

**Verify** (use the curl examples from the assistant’s report; they must be in it)

- Aarav creates a return on ORD-1042 (cookware, defective) → 201, status `requested`, an id like RET-####.
- Send the **same** request again with the **same** Idempotency-Key → the same response and the same RET id. `GET /returns` lists exactly one return.
- Same key but a changed `reason_text` → error `idempotency_mismatch`.
- New key, same item → error `duplicate`.
- Priya (seller owner) moves it `requested` to `approved` → OK. Then try `approved` to `completed` → `invalid_state`.
- Diya tries to create a return on ORD-1042 → the uniform 404.
- `just test` passes. Run `just test -k double` five times in a row (the SC-14 race test): it passes every time.
- `grep -rnE 'datetime.now|utcnow' store-api --include=*.py` still hits only the Clock.

**Commit:** `git add -A` then `git commit -m 'feat(store): stage 7 returns and idempotency'`.

### Stage 8 — Refunds, SimPay and the store’s money limits

**Goal:** reserve, authorize, release and complete refunds, with the store itself refusing over-refunds and large unauthorized releases.

**Prompt**

```
Read AGENTS.md and docs/PROJECT_MEMORY.md first, then docs/01-playground-spec.md sections 4 (matrix), 5 (invariants 1 to 10), 6 (Refunds rows), 7.2 and 16 (amendments 1, 2, 3; findings 1 and 2).

STAGE 8 - refunds and money safety. Build ONLY this:
1. GET and PUT /admin/settings for store_settings (seller_owner only; record who changed it and when).
2. POST /orders/{id}/refund-reservations (executor or seller; amount_paise, return_id, method original, store_credit or upi_payout): creates a 'reserved' hold atomically. The amount must not exceed the store's OWN max_refundable calculation for the items (per item, net of active refunds). Cash-on-delivery orders need store_credit or upi_payout (SC-16).
3. POST /refunds/{id}/authorize (seller token only; amount_paise at most the reserved amount; staff up to Rs 2,000, owner above; stores authorized_by, authorized_amount_paise, authorized_at; idempotent).
4. POST /refunds/{id}/release (executor or seller). A service-token release is accepted ONLY if its total is at most the autonomy cap OR a stored authorization of sufficient role exists, AND the simulated-IST-day total of service-token releases stays at most the daily cap; otherwise 409 limit_exceeded. Release moves the refund to 'processing'; SimPay completes it after about 3 seconds of real time in a background asyncio task, with gateway_ref SIMPAY-xxxxxx and simulated=true in every response. Release requires payment_status paid (or cod_collected).
5. POST /refunds/{id}/cancel-reservation, GET /refunds/{id}, GET /customers/{id}/refund-summary?days=30.
6. Every money path runs in BEGIN IMMEDIATE. Never hold a write transaction across an await or an HTTP call. Amounts are integers.
7. Payment fault switches in code (no UI yet): payment.fail_once, payment.timeout_after_commit, payment.down.
8. scripts/smoke_money.py ('just smoke-money'): real HTTP calls for the happy path (return, approve, pickup, transit, receive, inspect ok, reserve, authorize, release, completed) printing PASS or FAIL per step, PLUS negative checks printed as 'BLOCKED as expected': over-reservation, release above the cap without authorization (409 limit_exceeded), staff authorizing above Rs 2,000, idempotency key reused with a different payload.
9. Tests: SC-10 (capped at the remaining Rs 500), over-reservation, SC-16 COD rule, two parallel reservations (exactly one wins; invariant 2 holds), cap with and without authorization, role limits on authorize, daily cap, fail_once retry with the same key succeeds, timeout_after_commit leaves a state that GET /refunds/{id} reports truthfully.
```

**Verify**

```
just reset
just dev-api
just smoke-money
```

- Every happy-path step prints PASS. The release step shows `processing`; about 3 seconds later the refund is `completed` with a `SIMPAY-` reference and `simulated` = true.
- The negative checks print **BLOCKED as expected** for each of the four attacks. Zero FAIL lines.
- Priya’s `GET /admin/settings` shows `autonomy_cap_paise` 50000 and `autonomy_daily_cap_paise` 500000. Kiran (staff) trying `PUT /admin/settings` → `forbidden`.
- `just test` passes. Run `just test -k race` five times: always passes.
- `just inspect`: the completed refund row has `authorized_by` filled in.
- `grep -rn 'float' store-api/app`: no float is used for money.
- Mutation check (recommended here): temporarily make the autonomy-cap check always pass, run `just test`; some tests must fail. Then `git restore .`.

**Commit:** `git add -A` then `git commit -m 'feat(store): stage 8 refunds and money limits'`.

### Stage 9 — Evidence upload

**Goal:** customers can attach damage photos safely (SC-11).

**Prompt**

```
Read AGENTS.md and docs/PROJECT_MEMORY.md first, then docs/01-playground-spec.md section 6 (Orders rows) and section 16 (amendment 4, finding 8, security checklist item 6).

STAGE 9 - evidence upload. Build ONLY this: POST /orders/{id}/evidence (multipart, field name 'file'; jpg, png or webp; at most 2 MB; at most 3 per order; only the owning customer or a seller), GET /orders/{id}/evidence, GET /evidence/{id}. Validate the REAL file type (not just the extension or content-type), re-encode with Pillow to strip EXIF and hidden payloads, use random file names (never the user's), store under UPLOAD_DIR outside any web-served path, send Content-Disposition: attachment and X-Content-Type-Options: nosniff, answer a uniform 404 to non-owners, honour Idempotency-Key. Tests with fixture files: valid jpg, png and webp; an .exe renamed to .jpg; a 3 MB file; a 4th upload; the filename ../../x.jpg; another customer’s access.
```

**Verify** (any small `photo.jpg` on your computer will do)

```
TOKEN=$(just token aarav.mehta@example.test)
curl -X POST -H "Authorization: Bearer $TOKEN" -H 'Idempotency-Key: ev-1' -F 'file=@photo.jpg' http://localhost:8000/api/v1/orders/ORD-1061/evidence
echo 'not an image' > fake.jpg
curl -X POST -H "Authorization: Bearer $TOKEN" -H 'Idempotency-Key: ev-2' -F 'file=@fake.jpg' http://localhost:8000/api/v1/orders/ORD-1061/evidence
```

- The first upload → 201 with an evidence id. The fake file → rejected (`validation_error`).
- Upload valid files until you pass 3 → the 4th is rejected.
- `curl -i` the evidence URL as Aarav → headers include `content-disposition: attachment` and `x-content-type-options: nosniff`.
- The same URL as Diya → 404.
- Look in the upload folder: file names are random and none is `photo.jpg`. `git status` does not list it.
- `just test -k evidence` passes. Delete `fake.jpg`.

**Commit:** `git add -A` then `git commit -m 'feat(store): stage 9 evidence upload'`.

### Stage 10 — Returns and refunds screens, chat cards

**Goal:** the customer can start a return in the UI, see its progress, and the chat card components exist for the agent to use later.

**Prompt**

```
Read AGENTS.md and docs/PROJECT_MEMORY.md first, then docs/01-playground-spec.md sections 9.1 (J2, J3), 9.2, 9.3 (cards) and 16 (Web amendment).

STAGE 10 - returns and refunds screens and chat cards. Build ONLY this:
1. Order detail: enable the Return button. Form: choose items and quantities, reason code, reason text, resolution, and an evidence upload button with clear size and type errors. A confirm dialog creates the return with an Idempotency-Key generated ONCE per attempt (double-click safe), then shows the RET id and the chip 'Waiting for seller review'.
2. Returns and refunds page: active and past requests with a timeline (requested, approved, pickup, received, refunded), refund status with a SIMULATED badge, and a cancel button before approval.
3. Chat card components with no backend yet: order summary, shipment timeline, return preview, CONFIRMATION card (Confirm and Cancel buttons, expires in 10 minutes), case created, error banner. A page /dev/cards (VITE_DEMO_MODE only) shows all of them with sample data.
4. Component tests: confirmation card expiry and double-click protection.
```

**Verify** (browser)

- Aarav → ORD-1042 → Return → pick the cookware set, reason defective, confirm. The RET id appears with “Waiting for seller review”.
- Double-click Confirm quickly. The Returns page still shows exactly **one** return.
- Upload a `.txt` file as evidence → a clear type error. A file over 2 MB → a clear size error.
- As Priya, approve the return using the transition curl example from Stage 7. Reload Aarav’s Returns page → “Approved”.
- Open http://localhost:5173/dev/cards → six cards render; the confirmation card shows its countdown.
- In store-web: `npm run lint`, `npm test`, `npm run build` pass.

**Commit:** `git add -A` then `git commit -m 'feat(web): stage 10 returns screens and chat cards'`.

### Gate 2 — tag `phase-2-money-path`

All must pass: `just reset` then `just smoke-money` (all PASS and all BLOCKED as expected), `just test`, the browser return journey (J2), and the web checks. Update the PROJECT\_MEMORY snapshot and Bug log. Then:

```
gitleaks detect --source . --no-banner
git ls-files '*.env' '*.db'
git add -A
git commit -m 'feat: phase 2 money path'
git tag phase-2-money-path
```

`git ls-files '*.env' '*.db'` must print nothing.

## 10. Phase 3 — Simulators, webhooks and the Demo Control Center (Stages 11–13)

### Stage 11 — Carrier simulator, store tick, mailbox

**Goal:** shipments move on their own with the clock, delayed shipments raise an event exactly once, and a simulated mailbox exists.

**Prompt**

```
Read AGENTS.md and docs/PROJECT_MEMORY.md first, then docs/01-playground-spec.md sections 7.1, 7.3, 8, 6 (Carrier sim and Mail rows) and 16 (finding 19, amendment 5).

STAGE 11 - carrier simulator, store tick, mailbox. Build ONLY this:
1. Carrier scripts as lists of (hours after shipping, status, location, note): normal_delivery, delayed_exception, lost_in_transit, rto. Tracking numbers are SS plus 10 digits. ETA changes are recorded as events. POST /sim/carrier/shipments/{id}/advance and POST /sim/carrier/scenarios/{id}/play (seller token; only when DEMO_MODE=true, otherwise 404). Time advances with the Clock.
2. A store tick every 10 seconds (asyncio background task started in the app lifespan): advances scripted shipments according to the Clock and writes ONE shipment.delayed row into events_outbox per ETA when eta is earlier than now and the shipment is not delivered. It must be idempotent.
3. Mailbox: GET /mail/inbox, GET /mail/threads/{id}, POST /mail/send, POST /mail/{id}/read. Channels email and whatsapp_sim. verified_sender is stamped from the logged-in user. Every outbound message is marked SIMULATED. An inbound message writes mail.inbound into events_outbox.
4. Fault switches in code (no UI yet): carrier.down (503 upstream_unavailable), carrier.stale, carrier.slow (8 s latency), mail.fail_once, mail.down.
5. Tests with a frozen Clock: delayed event emitted exactly once; scripts progress; mail thread ownership; each fault behaves as documented.
```

**Verify**

```
just reset
just dev-api
PRIYA=$(just token priya.sharma@nestkart.test)
```

- Copy ORD-1048’s `shipment_id` from its shipment response. Use the report’s curl example to advance it as Priya → a new event appears. Aarav’s `GET /orders/ORD-1048/shipment` shows it.
- Wait 30 seconds, then `just inspect`: `events_outbox` has **exactly one** `shipment.delayed` row for ORD-2037. Wait another 30 seconds and look again: still one.
- Aarav sends a message with the report’s curl example. Priya’s `/mail/inbox` shows it with the SIMULATED marker and `verified_sender` true.
- Put `DEMO_MODE=false` in `.env`, restart the API, repeat the advance call → 404. Put it back to `true`.
- `just test` passes (including `just test -k fault`).

**Commit:** `git add -A` then `git commit -m 'feat(store): stage 11 carrier sim and mailbox'`.

### Stage 12 — Webhook outbox and Demo endpoints

**Goal:** signed events reach the agent reliably, and you can reset, time-travel and break things on demand.

**Prompt**

```
Read AGENTS.md and docs/PROJECT_MEMORY.md first, then docs/01-playground-spec.md sections 7.4, 8, 6 (Webhook events and Demo row), 12 and 16 (finding 14, amendment 5, security checklist items 12 and 13).

STAGE 12 - webhooks and Demo Control endpoints. Build ONLY this:
1. Transactional outbox delivery worker: sends events from events_outbox to AGENT_WEBHOOK_URL with headers X-Store-Signature (HMAC-SHA256 of 'timestamp.body' using WEBHOOK_SECRET), X-Store-Timestamp and X-Event-Id; every payload carries resource_version. Events: order.created, order.updated, shipment.updated, shipment.delayed, return.updated, refund.updated, mail.inbound. Each event is written in the SAME transaction as the business change. Retry delays 1 s, 5 s, 30 s, 2 min, 10 min; after 5 failures mark the event exhausted. At-least-once delivery. If the agent is down, nothing else in the store may break.
2. /demo/* routes (seller_owner only, DEMO_MODE only, otherwise 404): POST /demo/reset (rebuild the seed in under 5 seconds), GET and POST /demo/clock (advance hours or days, set an exact time, freeze, resume), POST /demo/faults (every fault from 7.1 to 7.3 and the simulator switches), GET /demo/state (row counts, last 20 events, outbox status), POST /demo/scenarios/{id}/load, snapshot save and restore (SQLite file copy).
3. scripts/webhook_listener.py ('just webhook-listener'): a tiny receiver on port 9000 that verifies the signature and the 5-minute timestamp window, rejects duplicate event ids, and prints OK or REJECTED.
4. Tests: correct signature, retry schedule with a fake clock, exhausted state, reset time under 5 seconds, /demo returns 404 when DEMO_MODE is false, faults trigger their documented failures.
```

**Verify**

- Terminal A: `just webhook-listener`. In `.env` set `AGENT_WEBHOOK_URL=http://localhost:9000/v1/webhooks/store`, then restart `just dev-api` in terminal B.
- Advance a shipment as Priya → the listener prints a line with **signature OK** and the event name.
- Stop the listener, trigger another event, wait about 10 seconds, run `just inspect`: the `attempts` count for that event has grown (1 s, 5 s retries). Start the listener again → the event is delivered.
- `just test -k webhook` passes (this covers the replay-window and duplicate-id rejection).
- With the report’s curl examples: Priya calls `/demo/reset` → finishes in under 5 seconds. Aarav calling `/demo/reset` → refused.
- Advance the demo clock by 2 days. `GET /api/v1/clock` moves forward 2 days. After the next tick ORD-1048’s shipment is `delayed` and a `shipment.delayed` event exists.
- Turn on fault `carrier.down` → a shipment request answers 503 `upstream_unavailable`. Turn it off.
- Set `DEMO_MODE=false`, restart → `/demo/state` is 404. Then restore `.env` (`DEMO_MODE=true` and the original `AGENT_WEBHOOK_URL`).

**Commit:** `git add -A` then `git commit -m 'feat(store): stage 12 webhooks and demo control'`.

### Stage 13 — Seller console, Inbox and Demo Control Center

**Goal:** the seller can run the store from the browser, and you can drive the whole demo from one screen.

**Prompt**

```
Read AGENTS.md and docs/PROJECT_MEMORY.md first, then docs/01-playground-spec.md sections 9.4, 9.6, 8 (Control Center sections) and 16 (Web amendment).

STAGE 13 - seller console and Demo Control Center. Build ONLY this:
1. Seller layout under /seller (dark navy with teal; amber for pending; red for denial) with a role guard for seller_owner and seller_staff. Customer tokens are redirected.
2. Pages: Dashboard (orders today, in transit, delayed), Orders (filters; detail with shipment and refund ledger), Returns queue (Approve and Reject with a required reason, Receive, Inspect, all through the real endpoints), Customers (returns_30d, 90-day refund ratio, account age), Carrier console (advance and play), Mailbox (sent and inbound, SIMULATED badge), Settings (autonomy caps, owner only).
3. Customer Inbox page (SIMULATED badge, unread count).
4. Demo Control Center at /seller/demo (owner only; hidden when VITE_DEMO_MODE is false): scenario loader and reset, clock controls (+1 h, +1 d, +7 d, freeze, set), fault toggles, carrier console shortcut, state inspector, snapshot save and restore, Judge mode (large text, hides developer panels).
5. Placeholder routes /seller/shield/* that say 'Available after the agent is built (Document 2)'.
6. Every list has a skeleton, an empty state and an error state with retry.
```

**Verify** (browser)

- Log in as Priya → /seller. Dashboard tiles show numbers; Orders can be filtered by status.
- Create a return as Aarav (Stage 10). In Returns queue it appears. Approve with a reason → Aarav’s Returns page shows Approved. Click Receive, then Inspect OK.
- Customers → Rohan Das (C003) shows 4 returns in the last 30 days.
- Log in as Kiran (staff): no Settings and no Demo Control Center, and typing their URLs is refused.
- Aarav visiting /seller is redirected away.
- Demo Control Center as Priya: Reset finishes in under 5 seconds and the data is back to seed. +1 day moves the clock. Toggle `carrier.down` → Aarav’s order detail shows a friendly error; toggle it off. Judge mode makes text large and hides developer panels.
- In store-web: `npm run lint`, `npm test`, `npm run build` pass.

**Commit:** `git add -A` then `git commit -m 'feat(web): stage 13 seller console and demo control'`.

### Gate 3 — tag `phase-3-escalation-autonomy`

The demo flow must work **twice from a clean reset**:

```
just reset
just smoke-money
just reset
just smoke-money
just test
```

Both smoke runs pass and `just test` is green. Update PROJECT\_MEMORY (snapshot, Bug log, Gotchas). Then:

```
gitleaks detect --source . --no-banner
git ls-files '*.env' '*.db'
git add -A
git commit -m 'feat: phase 3 simulators and demo control'
git tag phase-3-escalation-autonomy
git bundle create ../sellershield-backup.bundle --all
```

The last line is a full backup of the repository in one file (it is git-ignored if kept inside the repo; store it outside).

## 11. Phase 4 — Hardening and release preparation (Stages 14–16)

Per your spec this phase happens **inside the build window** (from Wed 11 Nov 10:00 IST). First do Section 12 steps 1 to 4 (create the GitHub repository and push phases 0–3). Then continue here. **No new features in Phase 4**: only tests, security, polish and documents.

### Stage 14 — Tests and security hardening

**Prompt**

```
Read AGENTS.md and docs/PROJECT_MEMORY.md first, then docs/01-playground-spec.md sections 11 (targets), 12, 13 and 16 (security checklist and SQLite recipe).

STAGE 14 - hardening. Do NOT add features. Build ONLY this:
1. Contract tests: every endpoint validated against contracts/openapi-store.json; a check in 'just openapi' that fails on a breaking change.
2. Invariant tests for invariants 1 to 14 (spec 5 and 16 amendment 3), including parallel race tests.
3. One security test per item of the 14-item checklist in spec section 16, named sec_01 to sec_14, and 'just security-check' which runs them plus pip-audit, npm audit and gitleaks and prints a PASS or FAIL table.
4. 'just perf': 200 sequential GET /orders calls with p95 under 100 ms; reset plus seed under 5 s; webhook delivery under 2 s.
5. Seed verification and fault tests (every toggle produces its documented failure).
6. Fix any REAL bug you find, add a regression test, and log it in docs/PROJECT_MEMORY.md (Bug log). Report anything you could not fix.
```

**Verify**

- `just test` is green; note the test count.
- `just security-check` shows 14 PASS. Read the audit results: any high or critical finding must be fixed or written into the Known issues list.
- `just perf` shows p95 under 100 ms, reset plus seed under 5 seconds.
- `curl -i http://localhost:8000/healthz` shows `content-security-policy` and `x-content-type-options`. The CSP includes `frame-ancestors 'none'`.
- Run the app, log in, use it, then scroll the terminal output: no tokens, passwords or full e-mail addresses are logged.
- Mutation check: remove the customer filter from the order lookup, run `just test`, many tests must fail, then `git restore .`.
- `git ls-files '*.env' '*.db'` prints nothing. `gitleaks detect --source . --no-banner` is clean.

**Commit:** `git add -A` then `git commit -m 'test(store): stage 14 hardening'`.

### Stage 15 — Web polish and smoke tests

**Prompt**

```
Read AGENTS.md and docs/PROJECT_MEMORY.md first, then docs/01-playground-spec.md sections 9.3 (accessibility), 9.6, 9.7, 13 and 16 (Web amendment).

STAGE 15 - web polish and smoke tests. Do NOT add features. Build ONLY this: responsive layouts (customer portal mobile-first from 360 px), loading, empty and error states everywhere, keyboard navigation with visible focus, AA colour contrast, aria-live in the chat, an error boundary per route, no console errors, and 3 Playwright smoke tests: (1) log in and see orders; (2) open the chat and see Guided mode; (3) a seller opens the Returns queue. 'npm run test:e2e' must work with documented steps.
```

**Verify**

- `cd store-web && npm run test:e2e` → 3 passed.
- DevTools device toolbar at 360 px width: no sideways scrolling on My Orders and Order detail.
- Keyboard only: Tab through the login page and see a clear focus ring; Esc closes the chat.
- DevTools Console shows no red errors on the main pages.
- Optional: DevTools → Lighthouse → Accessibility on My Orders; aim for 90 or more.
- `npm run lint`, `npm test`, `npm run build` pass.

**Commit:** `git add -A` then `git commit -m 'feat(web): stage 15 polish and e2e smoke tests'`.

### Stage 16 — Docs and one-command demo

**Prompt**

```
Read AGENTS.md and docs/PROJECT_MEMORY.md first, then docs/01-playground-spec.md sections 0A (Local run), 0C (README disclosure), the Hackathon necessities checklist and section 2.

STAGE 16 - docs and demo tooling. Build ONLY this:
1. Make 'just setup' install both stacks, run 'just keys' (never overwriting existing keys) and create .env from .env.example when it is missing, so a fresh clone runs with: just setup, just seed, just dev. Also 'just demo': reset plus seed, start all apps, print the URLs and the demo accounts. scripts/demo_check.py ('just demo-check'): replays the store-side demo beats through the API (track an order, return on ORD-1042, approve and refund, delayed shipment through the clock) and asserts the resulting state.
2. README.md: problem, architecture diagram (from spec section 2), the THREE-command run (just setup, just seed, just dev), demo accounts, scenario list SC-01 to SC-17, what is simulated, REAL test results (paste actual numbers from just test, never invent), limitations, roadmap, the build-timeline disclosure (spec 0C template; leave the ____ blanks for me), team.
3. LICENSE (MIT), THIRD_PARTY_NOTICES.md (from the lockfiles), AI_DISCLOSURE.md, RESPONSIBLE_AI.md (guardrails, human oversight, synthetic data only), and a final check of .env.example.
4. docker-compose.yml ONLY if it works the first time; otherwise skip it and say so.
```

**Verify**

- `just demo-check` passes; run it twice.
- Open README.md in the VS Code preview. Copy each command from it into a terminal; each one works.
- Compare the test numbers in the README with your own `just test` output. They must match.
- Fill the blanks in the timeline disclosure yourself (message date and channel).

**Commit:** `git add -A` then `git commit -m 'docs: stage 16 readme and demo tooling'`.

### Gate 4 — tag `phase-4-hardened`

`just test`, `just security-check`, `just perf`, `just demo-check` and the 3 e2e tests all pass. Then:

```
gitleaks detect --source . --no-banner
git ls-files '*.env' '*.db'
git add -A
git commit -m 'feat: phase 4 hardened'
git tag phase-4-hardened
git push origin main
git push origin phase-4-hardened
```

## 12. GitHub: create the remote, push, release (Phase 5)

**Rules (from your spec).** (1) Keep real commit dates. Never use `--date`, `GIT_AUTHOR_DATE`, `GIT_COMMITTER_DATE`, rebase or filter-repo to change dates or hide work. The only allowed history rewrite is removing a leaked secret before the first push, after rotating that key. (2) Keep the organizers’ permission message (screenshot with date and exact wording) and mention it in the README. (3) No secrets in any commit; scan before every push. (4) One monorepo.

**Step 1 — Now (local only).** You have been committing and tagging locally. Check:

```
git log --oneline --decorate
```

You should see the tags `phase-0-foundations`, `phase-1-walking-skeleton`, `phase-2-money-path` and `phase-3-escalation-autonomy` on their commits.

**Step 2 — Before EVERY push** (three commands):

```
gitleaks detect --source . --no-banner
git ls-files '*.env' '*.db'
git status
```

`gitleaks` must report no leaks, and `git ls-files '*.env' '*.db'` must print **nothing**.

**Step 3 — On 11 Nov after 10:00 IST: create the remote.** Make an **empty** repository (no README, license or .gitignore) so histories do not collide.

```
gh auth login
gh repo create YOUR-ORG/sellershield-ai --private --source=. --remote=origin
```

Without the CLI: create the empty repository on github.com, then:

```
git remote add origin git@github.com:YOUR-ORG/sellershield-ai.git
git remote -v
```

SSH key setup if needed:

```
ssh-keygen -t ed25519 -C 'you@example.com'
ssh -T git@github.com
```

Add the **public** key (the `.pub` file) under GitHub → Settings → SSH and GPG keys before running the `ssh -T` test. Never share the private key.

**Step 4 — Push phase by phase** (so the history appears in phase order):

```
git push origin $(git rev-list -n 1 phase-0-foundations):refs/heads/main
git push origin $(git rev-list -n 1 phase-1-walking-skeleton):refs/heads/main
git push origin $(git rev-list -n 1 phase-2-money-path):refs/heads/main
git push origin $(git rev-list -n 1 phase-3-escalation-autonomy):refs/heads/main
git push -u origin main
git push origin --tags
```

Run Step 2 before the first one. **Verify after each push:** open the repository page; the newest commit is that phase’s commit; the commit dates are the original dates; no `.env`, `.db` or key files are visible. If a push is rejected as non-fast-forward, **stop**, run `git fetch`, then `git log --oneline --graph --all` and understand it. Never force-push.

**Step 5 — Daily routine during the window**

```
git pull --rebase origin main
gitleaks detect --source . --no-banner
git push origin main
git tag m3-order-status-chat
git push origin m3-order-status-chat
```

The `pull --rebase` line is only needed if someone else pushed; rebase only your own unpushed commits. The tag lines are optional milestone tags (name them after your own milestones).

**Step 6 — Release and the fresh-clone test**

```
git tag v1.0-submission
git push origin main --tags
git clone https://github.com/YOUR-ORG/sellershield-ai.git verify-clone
cd verify-clone
cp .env.example .env
just setup
just seed
just dev
```

If the clone fails because key files are missing, `just setup` must also run `just keys` (it refuses to overwrite existing keys); ask your AI to fix that and log it in the Bug log. In the clone: open http://localhost:5173, quick-login as Aarav, see orders; run `just test`. Then scan the whole history:

```
gitleaks detect --source . --log-opts='--all'
```

Finally delete the `verify-clone` folder. Make the repository public if the hackathon rules require it, confirm LICENSE (MIT), add topics and an About line, and check that the README renders.

**Step 7 — Submission checklist (from your spec)**

- Demo video of at most 3 minutes, public or unlisted, opened once in a private window to confirm it plays.
- Six-slide deck rebuilt with real screenshots and measured results.
- Submission form fields checked in advance on the Hack4Hack page (repo, video host and access, deck link, live URL).
- Fallbacks ready: tunnel or hosted link, recorded segments, a second laptop with the project cloned.
- Everything submitted with at least 60 minutes to spare before 12 Nov 10:00 IST.

**Git problems and fixes**

| Problem | Fix |
| --- | --- |
| Push rejected as non-fast-forward | `git fetch`, then `git log --oneline --graph --all`. Understand it before doing anything else. |
| File over 100 MB rejected | `git rm --cached <file>`, add it to `.gitignore`, make a new commit (amending your own unpushed commit is fine). |
| Secret committed | Rotate the key **now**. Remove it with `git filter-repo` before the first push (the one allowed exception). Never push it. |
| CRLF warnings on Windows | Keep the `.gitattributes` file (`* text=auto`). |
| Wrong author name or e-mail | Fix `git config` for future commits. Do not rewrite old dates. |

**README disclosure (fill in):** Build timeline: the team began development before 11 Nov 2026 with the organizers’ permission (message dated \_\_\_\_ via \_\_\_\_). The repository was created and pushed on 11 Nov 2026. Commit timestamps are unaltered.

## 13. Reference

**Demo accounts.** Password for all: `Demo@12345` (demo only).

| Who | E-mail | Used for |
| --- | --- | --- |
| C001 Aarav Mehta (customer) | aarav.mehta@example.test | Main demo customer |
| C002 Diya Nair (customer) | diya.nair@example.test | “Customer B”, partial returns, cumulative cap |
| C003 Rohan Das (customer) | rohan.das@example.test | Risk flag (4 returns in 30 days) |
| C004 Meera Iyer (customer) | meera.iyer@example.test | Cash on delivery, cancellation |
| C005 Kabir Singh (customer) | kabir.singh@example.test | Attack tests |
| S001 Priya Sharma (seller owner) | priya.sharma@nestkart.test | Full seller access, demo controls |
| S002 Kiran Rao (seller staff) | kiran.rao@nestkart.test | Limited seller access |

**Ports.** 8000 store-api (docs at /docs) · 8001 agent placeholder · 5173 store-web · 9000 webhook test listener.

**`just` commands** (all defined in Stage 1, built stage by stage): `setup`, `keys`, `seed`, `reset`, `dev`, `dev-api`, `test`, `lint`, `inspect`, `verify-seed`, `openapi`, `token`, `smoke-money`, `webhook-listener`, `security-check`, `perf`, `demo`, `demo-check`.

**Common problems**

| Symptom | Fix |
| --- | --- |
| `just: command not found` | Close and reopen the terminal. Reinstall just (Section 2). |
| Port already in use | Close the old terminal running the server. Windows: `netstat -ano`, find :8000, then `taskkill /PID <number> /F`. Mac and Linux: `lsof -i :8000`, then `kill <number>`. |
| `database is locked` | Only one API process should run. Stop duplicates. Make sure the repo is not inside OneDrive, Dropbox or iCloud. |
| tzdata or zoneinfo error on Windows | Ask the AI to add the `tzdata` package to store-api. |
| uv cannot find Python 3.12 | `uv python install 3.12` |
| CORS error, or cookies not set | Use http://localhost:5173 (the proxy), not port 8000, in the browser. |
| Login works, then 401 after a reload | Silent refresh is failing. Check the refresh cookie (`HttpOnly`, `SameSite=Lax`) and that you use the 5173 address. |
| `npm run gen:api` fails | Run `just openapi` first. |
| Tests fail only after `just reset` | Some test depends on real time. Tests must use the frozen Clock. Add a Bug-log row. |
| The AI says everything passes but you see errors | Believe the terminal, not the chat. Run the commands yourself. |

**When the agent (Document 2) arrives.** Give its builder: the OpenAPI file `contracts/openapi-store.json`; the JWKS address `/api/v1/.well-known/jwks.json`; the service client ids and demo secrets from `.env.example`; the webhook address and secret; the demo accounts above; and `GET /api/v1/clock`. The first integration milestone (M1) is: the agent reads an order from the store with a customer token. Point `AGENT_WEBHOOK_URL` at the agent’s `/v1/webhooks/store`.
