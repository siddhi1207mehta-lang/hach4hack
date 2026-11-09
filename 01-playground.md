# SellerShield AI — Document 1: The Agent Playground (NestKart Mock Store)

Planning specification v1.0 · AgentX Hackathon 2026 · PS-04 · Companion: Document 2 (The Agent)

## 0. Context pack (read first)

**What this document is.** The build plan for the *playground*: a fictional online store called NestKart (customer website, seller admin, store API, simulated carrier, payment gateway and mailbox, plus a demo control center). The SellerShield agent connects to it through real API calls and is tested on its mock data. Document 2 specifies the agent. Both documents start with this same context pack so either one can be pasted alone into a new chat.

**The project.** SellerShield AI is an action-taking customer-support agent for small online sellers (hackathon problem PS-04). Customers chat about orders, shipping, returns and refunds. The agent calls tools against the store API, a deterministic policy engine decides what is allowed, risky actions go to the seller for approval, complex cases are escalated to a human with a summary, and every action is audited. Core rule: **the AI proposes, the backend decides.**

**Mandatory hackathon requirements.** Real tool or API calls on mock data · refund-limit guardrails · a log of every action · human escalation with a useful summary.

**Hackathon facts.** AgentX Hackathon 2026 (Hack4Hack). Our team is in the top 100. Build window: 11 Nov 2026 10:00 IST to 12 Nov 2026 10:00 IST. Final submission: GitHub repo with README, demo video up to 3 minutes, six-slide deck. Judging: problem fit and impact 25% · agent design (planning, tool use, memory) 25% · working demo and reliability 20% · innovation 15% · presentation 15%. Rules: mock data only; open-source libraries, public APIs, templates and AI coding assistants are allowed; all building happens inside the 24-hour window.

**Build-window status (permission received).** The organizers have given the team permission to start building before 11 Nov and to push the work to GitHub step by step on 11 Nov (as reported by the team). Keep their written message with its date, channel and exact wording as proof. So: build locally from now, create the GitHub repository on 11 Nov, push phase by phase using the runbook in section 0C, never alter commit dates or rewrite history to look newer, and disclose the timeline in the README.

**Team and roles.** W1 = store backend and mock services. W2 = store frontend (customer portal, seller admin, SellerShield dashboard UI, chat widget). A = agent builder (agent service, policy engine, tools, audit, evaluation) and owner of the integration contract.

**Decisions already made.** Single seller · seeded demo accounts (no real e-mail, no real money) · money in integer paise · demo refund auto-limit ₹500 · policy v3 active in the demo · six-slide idea deck finished (navy, teal, amber, red style) · eight earlier review fixes accepted (split-refund guard, backend-calculated refunds, confirmation tokens, decision matrix, policy-change binding, structured memory, demo clock and monitor, serialized audit chain).

**What changed in this planning round.** The earlier single-backend design is now two services: Store (this document) and Agent (Document 2). Reasons: it mirrors real life (an AI helpdesk integrates with a store platform), matches the team split, forces a clean contract, and shows true API integration.

**ID formats.** Orders ORD-####, returns RET-####, refunds RFD-####, cases CASE-####, approvals APR-####, proposals PRP-xxxxxxxx, customers C###, sellers S###. Money is integer paise (₹1 = 100 paise). Times are UTC in storage and IST in the UI.

## 0A. Requirements, accounts and setup (start here)

Everything below is free except the ₹499 hackathon fee. Nothing in this project needs Supabase, Firebase or any cloud database.

**Accounts and services**

| Item | Needed | Used for | Cost | Notes |
| --- | --- | --- | --- | --- |
| GitHub account for each member | Yes | Code, README, submission | Free | Turn on 2FA; add teammates as collaborators on 11 Nov |
| Hack4Hack confirmation fee | Yes | Participation | ₹499 | Pay before 11 Nov 10:00 IST |
| Google AI Studio API key | Yes | Primary LLM (Gemini Flash-class) | Free tier, limits vary | One key per person for development and one separate key kept only for the demo |
| Groq API key | Yes | Secondary LLM and bulk evaluation | Free tier | console.groq.com |
| OpenRouter key, Ollama | Optional | Third fallback, offline fallback | Free | Skip if short of time |
| Supabase, Firebase, Redis | No | Nothing | None | See the database decision below |
| E-mail, SMS, WhatsApp, payment and courier APIs | No | Simulated by the playground | None | Mailbox, SimPay and SwiftShip are built in |
| Object storage | No | Evidence images | None | Local folder, 2 MB limit |
| Docker Desktop | Optional | One-command run | Free | The fallback is the just scripts |
| Cloudflare Tunnel (cloudflared) | Optional | Let judges reach the local demo | Free |  |
| Free hosting (Render, Railway, Fly) | Optional, P1 | Hosted demo | Free tier | Disks are ephemeral; the app reseeds on start |
| gitleaks | Recommended | Secret scan before every push | Free |  |

**Database decision.** Two SQLite files: store-api/data/store.db and agent/data/agent.db. The seed script and the agent create them automatically on first run, so there is nothing to create by hand and no account to open. Why not Supabase or Firebase: (1) money safety and the audit chain need real transactions and constraints, which SQLite provides with partial unique indexes and BEGIN IMMEDIATE, while Firebase’s document model is a poor fit for ledger-style invariants; (2) no network latency, quota or keys, and it works offline during the demo; (3) a reset is a file copy in under 5 seconds; (4) fewer things can break. Supabase (Postgres) is the production path: the SQLAlchemy models port with a connection-string change plus SELECT ... FOR UPDATE on the money paths. Consider it after the hackathon, or if a hosted demo needs persistent data.

**Software.** Python 3.12 with uv (fast virtual environments); Node.js 20 LTS or newer with npm; Git 2.40 or newer; VS Code (or similar) with an AI coding assistant; just (a task runner that also works on Windows; avoid make on Windows); optional Docker Desktop, cloudflared, gitleaks and the GitHub CLI (gh). On Windows use PowerShell or Git Bash and install the tzdata Python package (zoneinfo needs it). Keep the repository outside OneDrive or Dropbox folders because they can corrupt SQLite files.

**Dependencies for this document (store-api and store-web).**

- store-api (Python): fastapi, uvicorn\[standard\], sqlalchemy 2.x, pydantic 2.x, pydantic-settings, pyjwt\[crypto\], cryptography, argon2-cffi, python-multipart, pillow (re-encode uploads), httpx, slowapi (rate limits), tzdata, python-dotenv. Dev: pytest, pytest-asyncio, hypothesis, ruff, mypy, pip-audit.
- store-web (Node): react, react-dom, react-router-dom, @tanstack/react-query, openapi-fetch, openapi-typescript (dev), @microsoft/fetch-event-source, tailwindcss, shadcn/ui (components copied in, built on Radix), lucide-react, recharts, dompurify, react-markdown, date-fns, date-fns-tz, clsx, tailwind-merge. Dev: vite, typescript, eslint, vitest, @playwright/test (P1).
- Pin exact versions and commit the lockfiles (uv.lock and package-lock.json). The agent’s dependencies are listed in Document 2.

**Environment variables** (names only; values live in .env and never in Git). Store: DEMO\_MODE, DATABASE\_URL, JWT\_PRIVATE\_KEY\_PATH, JWT\_PUBLIC\_KEY\_PATH, JWT\_ISSUER, WEBHOOK\_SECRET, AGENT\_WEBHOOK\_URL, CORS\_ORIGINS, SERVICE\_CLIENT\_SECRETS, UPLOAD\_DIR, MAX\_UPLOAD\_BYTES. Web: VITE\_DEMO\_MODE, VITE\_ENABLE\_STOREFRONT.

**Local run.** just setup (installs both stacks), just keys (creates the JWT key pair), just seed (creates and seeds the database), just dev (store-api on 8000, agent on 8001, web on 5173). The Vite dev server proxies /api to port 8000 and /agent to port 8001, so the browser sees one origin and there is no CORS or cookie trouble.

## 0B. Phase plan (what is built when)

Today is Saturday 7 Nov 2026 (check your calendar). If you start Phase 0 today, shift every phase date below one day later and move Phase 3 into the first hours of the window. The window opens Wednesday 11 Nov at 10:00 IST and closes Thursday 12 Nov at 10:00 IST. Each phase ends with a gate: a short list of tests and demo steps that must pass before the next phase starts and before that phase’s git tag is created. Effort is per person with AI coding assistants and is an estimate, not a promise. The P0 items across all phases come to about 24 focused hours per person, so the project still fits the 24-hour window if pre-build time is lost; section 14 holds that compressed schedule.

### Phase 0: Foundations and contracts (Fri 6 Nov, about 4 h)

- Store (W1): repo skeleton, config, Clock, error format, key script, OpenAPI export script, seed data as JSON files.
- Web (W2): Vite app, Tailwind and shadcn, router, typed client generation from OpenAPI, dev proxy, design tokens.
- Agent (A): service skeleton, config, JWKS fetch with retry, request-id middleware, health, prompts folder, one successful LLM call, OpenAPI stubs.
- All: accounts and keys, just tasks, gitleaks, .gitignore, local git init, decision log.
- Gate G0: just dev starts three empty apps; both /healthz answer; both OpenAPI files export; a test LLM call succeeds. Tag: phase-0-foundations.

### Phase 1: Walking skeleton, read-only slice (Sat 7 Nov, about 7 h)

- Store (W1): schema and seed for SC-01 to SC-17, login with JWKS and refresh, orders, shipment, refundable, public clock, uniform 404, rate limits (T2 to T4).
- Web (W2): login, auth guard, My Orders, Order detail, chat widget shell with fetch-event-source and chips (F2 to F4).
- Agent (A): store client with token passthrough, policy engine and refund calculator with table tests, Understanding schema, read tools, FactSheet and verifier, orchestrator, SSE, guided mode (A2 to A6).
- Gate G1: SC-01, SC-02, SC-03; T01 to T04; policy tests pass for all 17 scenarios; the chat answers an order-status question with the LLM on and with the LLM off. Tag: phase-1-walking-skeleton.

### Phase 2: Core money path (Sun 8 to Mon 9 Nov, about 10 h)

- Store (W1): returns and the transition engine, reservations, authorize, release, SimPay, idempotency, invariants, evidence upload, concurrency tests (T5, T6, T9).
- Web (W2): returns and refunds pages, confirmation card, push-event stream, dashboard Overview and Approvals card with Approve and Reject, Inbox (F5, F6).
- Agent (A): propose tools, proposals and confirm handler, executor saga, approvals with seller-token passthrough, audit chain and trace API, minimal cases (A7 to A9).
- Gate G2: SC-04 to SC-11 and SC-14; T05 to T12, T14, T19, T20; approval works end to end; the audit chain verifies. Tag: phase-2-money-path.

### Phase 3: Escalation and autonomy (Tue 10 Nov, about 6 h)

- Store (W1): carrier scripts, mailbox, webhook outbox, store tick for delayed events, demo control and fault toggles (T7, T8).
- Web (W2): Cases, Agent Activity with Decision Trace, Audit page, Demo Control Center (F7, F8).
- Agent (A): cases and briefs, handler model, memory, outbox worker, monitor, fault toggles, push stream (A10 to A12, A14).
- Gate G3: SC-12, SC-13, SC-15, SC-16, SC-17; T13, T15, T16, T17, T18; the demo script runs twice from a reset. Tag: phase-3-escalation-autonomy.

### Phase 4: Hardening and evaluation (Wed 11 Nov, window hours 0 to 12)

- Store (W1): invariant and contract tests, security checklist, dependency audit, performance, seed verification, tunnel or hosting preparation.
- Web (W2): Policy Studio and Analytics (P1), responsive and accessibility polish, empty and error states, Playwright smoke test.
- Agent (A): evaluation harness, golden set, replay cache, error analysis, latency tuning, policy simulation (P1), all strict-review items closed.
- Gate G4: the 20 core tests are green or documented; evaluation results are measured and recorded; the security checklist is ticked; feature freeze at window hour 14. Tag: phase-4-hardened.

### Phase 5: Release (Wed 11 to Thu 12 Nov, window hours 12 to 23)

- Fresh-clone test, fixes only, README with real results, screenshots, deck, demo recording, submission.
- Gate G5: a fresh clone runs from the README in three commands; the repository is public with no secrets; video, deck and form are submitted with 60 minutes to spare. Tag: v1.0-submission.

**Cut order if a phase overruns:** Policy Studio, Analytics, monitor, memory chips, e-mail channel, storefront, sign-up. **Never cut:** confirmation by button, backend refund calculation, store invariants and caps, audit, escalation case, guided mode.

## 0C. GitHub runbook (all commands in one place)

**Rules.** (1) Keep real commit dates. Never use --date, GIT\_AUTHOR\_DATE, GIT\_COMMITTER\_DATE, rebase or filter-repo to change dates or hide work. The only allowed history rewrite is removing a leaked secret before the first push, after rotating that key. (2) Keep the organizers’ permission message (a screenshot showing date and wording) and mention it in the README. (3) No secrets in any commit; scan before every push. (4) One monorepo. On Windows use PowerShell or Git Bash.

**A. Now (local only).** Create .gitignore first, containing these lines:

```
.env
*.db
*.db-wal
*.db-shm
data/
uploads/
.venv/
node_modules/
dist/
__pycache__/
.DS_Store
*.bundle
```

```
git init -b main
git config user.name 'Your Name'
git config user.email 'you@example.com'
git config core.autocrlf input
git add -A
git commit -m 'chore: repo skeleton, docs and tooling'
```

On Windows set core.autocrlf to true instead of input. Commit often with conventional messages such as feat(store): ..., feat(agent): ..., feat(web): ..., fix, test, docs, chore.

**B. At every phase gate.** Commit, then create a lightweight tag (no -a).

```
git add -A
git commit -m 'feat: phase 1 walking skeleton'
git tag phase-1-walking-skeleton
```

Tags created before 11 Nov: phase-0-foundations, phase-1-walking-skeleton, phase-2-money-path, phase-3-escalation-autonomy. Created in the window: phase-4-hardened and v1.0-submission.

**C. Before every push.**

```
gitleaks detect --source . --no-banner
git ls-files '*.env' '*.db'
git status
```

The ls-files command must print nothing.

**D. On 11 Nov after 10:00 IST: create the remote.** Make an empty repository (no README, license or .gitignore) so the histories do not diverge. SSH setup if needed: ssh-keygen -t ed25519 -C 'you@example.com', add the public key under GitHub Settings, then test with ssh -T git@github.com.

```
gh auth login
gh repo create YOUR-ORG/sellershield-ai --private --source=. --remote=origin
```

Without the CLI, create the repository on github.com and run: git remote add origin git@github.com:YOUR-ORG/sellershield-ai.git, then git remote -v.

**E. Push step by step, one phase at a time.**

```
git log --oneline --decorate
git push origin $(git rev-list -n 1 phase-0-foundations):refs/heads/main
git push origin $(git rev-list -n 1 phase-1-walking-skeleton):refs/heads/main
git push origin $(git rev-list -n 1 phase-2-money-path):refs/heads/main
git push origin $(git rev-list -n 1 phase-3-escalation-autonomy):refs/heads/main
git push -u origin main
git push origin --tags
```

Each push moves remote main forward to that phase’s commit, so the history appears in phase order. Wait for each push to finish and look at the repository page. If a push is rejected as non-fast-forward, stop, run git fetch and inspect; never force-push. The $( ) form works in Git Bash and PowerShell.

**F. During the window.**

```
git pull --rebase origin main
gitleaks detect --source . --no-banner
git push origin main
git tag m3-order-status-chat
git push origin m3-order-status-chat
```

Short feature branches are optional (git switch -c feat/policy-studio). Rebase only your own unpushed commits. Never force-push main.

**G. Release.**

```
git tag v1.0-submission
git push origin main --tags
git clone https://github.com/YOUR-ORG/sellershield-ai.git verify-clone
cd verify-clone
cp .env.example .env
just setup
just seed
just dev
gitleaks detect --source . --log-opts='--all'
```

The fresh clone must run from the README with demo keys placed in .env. Make the repository public if the rules require it, add a LICENSE (MIT), topics and an About line, and check that the README renders.

**H. Backup and troubleshooting.** Back up before each push day: git bundle create ../sellershield-backup.bundle --all

| Problem | Fix |
| --- | --- |
| Push rejected as non-fast-forward | git fetch, then git log --oneline --graph --all; understand it before doing anything else |
| File over 100 MB rejected | git rm --cached the file, add it to .gitignore, make a new commit (amending your own unpushed commit is fine; it keeps the dates honest) |
| Secret committed | Rotate the key now; remove it with git filter-repo before the first push (the allowed exception); never push it |
| CRLF warnings on Windows | Add a .gitattributes file containing: \* text=auto |
| Wrong author identity | Fix git config for future commits; do not rewrite old dates |

**README disclosure (copy and fill in).** Build timeline: the team began development before 11 Nov 2026 with the organizers’ permission (message dated \_\_\_\_ via \_\_\_\_). The repository was created and pushed on 11 Nov 2026. Commit timestamps are unaltered.

## 1. Purpose and design principles

The playground is the agent’s world and the judges’ stage. It must feel like a real store, be deterministic enough to test against, and be small enough for two developers.

1. **The system of record owns facts and money.** The store enforces ownership, state transitions and refund balances itself and never trusts the agent blindly.
2. **Contract first.** The OpenAPI files are written and frozen in hours 0 to 1; both sides generate types from them.
3. **One clock.** All time logic (return windows, delays, SLAs) uses a simulated clock that can be fast-forwarded.
4. **Everything injectable.** Carrier outage, payment failure and mail failure can be switched on live.
5. **Seed data is test data.** Every seeded order exists to exercise one scenario.
6. **Honest simulation.** Every simulated payment, carrier event and e-mail is labelled SIMULATED in the UI.

**Non-goals:** real payments, real couriers, real e-mail, multi-seller, a full storefront (browse, cart and checkout are P1).

## 2. System overview

```
 Customer browser            Seller browser
        \                        /
         +---- store-web (React SPA) ----+
                |  JWT        |  JWT
                v             v
   +------------- store-api (FastAPI) ---------------+
   | Auth/IdP | Orders | Shipments | Returns | Refunds |
   | Mailbox | Carrier-sim | Pay-sim | Clock | Demo ctl |
   +--------+----------------------------+----------+
            | store.db (SQLite)          | signed webhooks
            ^ REST (customer or          v
            | service tokens)    +---- agent-service (FastAPI) ----+
            +--------------------+  agent.db (SQLite), Document 2  |
                                 +------------+-------------------+
                                              | HTTPS
                                         LLM provider chain
```

Ports in development: store-api 8000, agent-service 8001, store-web 5173. Start with `docker compose up` or `make dev`.

| Trust boundary | Rule |
| --- | --- |
| Browser to store-api | JWT bearer, CORS allowlist, refresh token in httpOnly cookie |
| Agent to store-api (customer scope) | Agent forwards the customer’s own access token; the store enforces ownership |
| Agent to store-api (privileged) | OAuth client-credentials token with narrow scopes; separate clients for monitor and executor |
| Store to agent (webhooks) | HMAC-SHA256 signature, timestamp, event id (replay-safe) |
| Agent to LLM provider | Outbound only; no secrets; no address, phone or e-mail in prompts |

**Why two services.** Real helpdesk AIs (Gorgias, Zendesk) sit beside the store platform and call its API. Two services make the integration honest, let the team work in parallel, and let judges see a connector boundary. The cost is integration risk, reduced by contract-first development, an early handshake (milestone M1) and mock responses.

**Repository layout (single monorepo).**

```
sellershield/
  store-api/   FastAPI store and simulators
  store-web/   React app: portal, admin, dashboard, widget
  agent/       agent service (Document 2)
  contracts/   openapi-store.json, openapi-agent.json (frozen hour 1)
  scenarios/   seed packs, golden conversations
  docs/        these documents, README assets
  docker-compose.yml  Makefile  .env.example
```

## 3. Technology stack and reasons

| Component | Choice | Why | Rejected |
| --- | --- | --- | --- |
| Store API | Python 3.12, FastAPI, Pydantic v2 | Typed contracts, automatic OpenAPI, async, same language as the agent so skills and helpers are shared | Express/Nest (second language) |
| ORM and DB | SQLAlchemy 2.0 with SQLite (WAL, foreign keys on, busy\_timeout 5 s) | Explicit transactions and partial unique indexes for money safety; zero ops; reset equals a file copy | Postgres (setup cost; stated as production path) |
| Money and time | Integer paise, UTC storage, Clock service | No float drift; deterministic time travel | Floats, system time |
| Auth | JWT RS256 with JWKS (PyJWT), argon2-cffi | The agent can verify tokens but cannot mint them; modern password hashing | HS256 shared secret (agent could forge tokens); fallback only if short of time |
| Web | React 18, Vite, TypeScript | Fastest build loop, static output, strict types | Next.js (SSR not needed) |
| UI kit | Tailwind CSS, shadcn/ui (Radix), lucide icons | Polished, accessible components in minutes | Hand-written CSS |
| Data layer | TanStack Query, openapi-typescript, openapi-fetch | Typed clients generated from OpenAPI; contract drift fails at compile time | Hand-written fetch |
| Realtime | Server-Sent Events | One-way streaming for chat tokens, live feeds and push events; use @microsoft/fetch-event-source because native EventSource cannot send an Authorization header; simple and proxy-friendly | WebSockets |
| Background work | asyncio tasks in-process | No Redis or Celery to run | Celery |
| Charts | Recharts | Quick analytics tiles | D3 |
| Quality | pytest, httpx, ruff, Playwright (3 smoke tests, P1) | Fast feedback | — |
| Packaging | docker compose plus Makefile fallback | One-command start; fallback if Docker misbehaves on a laptop | — |

## 4. Identity, authentication and authorization

**Principals.** customer, seller\_owner, seller\_staff, and service clients (agent-executor, agent-monitor). The store is the identity provider; the agent only verifies tokens.

| Token | Lifetime | Claims | Stored |
| --- | --- | --- | --- |
| Access JWT | 15 min | sub (user id), role, customer\_id, aud=\[nestkart-api, sellershield-agent\], iss, exp, jti, auth\_time | In memory only, never localStorage |
| Refresh token | 7 days, rotating | opaque id | httpOnly, SameSite=Lax cookie; hash kept server-side |
| Service JWT | 10 min | client\_id, scopes, aud=nestkart | Agent memory |

**Flows.**

- Login: POST /auth/login with e-mail and password. Generic error text; 5 attempts per minute per IP and e-mail; lock for 15 minutes after 10 failures.
- Sign-up (P1): creates a customer with no orders; a simulated verification e-mail lands in the mock inbox and the account becomes active when the link is clicked. Shows identity verification without real e-mail.
- Quick login (DEMO\_MODE only): buttons that fill seeded credentials for judges.
- Refresh and logout rotate and revoke refresh tokens. CSRF: double-submit header on cookie endpoints.
- Agent-executor and agent-monitor are different clients so a monitor token can never release money.

**Authorization matrix.**

| Capability | customer | seller\_staff | seller\_owner | agent-executor | agent-monitor |
| --- | --- | --- | --- | --- | --- |
| Read own orders and returns | yes | – | – | – | – |
| Read any order | – | yes | yes | – | yes (orders:read\_all) |
| Create return on own order | yes (customer token) | – | – | – | – |
| Approve or reject return | – | yes | yes | only within the autonomy cap | – |
| Reserve refund hold | – | yes | yes | yes (refunds:reserve) | – |
| Authorize refund up to ₹2,000 (the executor may release above the autonomy cap only after this authorization) | – | yes | yes | yes | – |
| Authorize refund above ₹2,000 (owner only) | – | – | yes | release only after an owner authorization stored in the store | – |
| Send mail | own thread | yes | yes | yes | yes |
| Demo control | – | – | yes (DEMO\_MODE) | – | – |

**Hardening checklist.** argon2id hashes · uniform 404 for any order not owned by the caller (never 403, so order ids cannot be probed) · JWT audience and issuer checks · CORS allowlist · security headers including CSP · 1 MB body limit · no stack traces in errors · secrets only in .env · seeded passwords are demo-only and stored hashed.

**E-mail channel identity (P1).** The mock mail server stamps each inbound message with verified\_sender (the logged-in portal user), like a DKIM-verified sender. A guest form sends verified\_sender=false; the agent may then answer only general policy questions and sends a login link. Typing someone else’s e-mail address never grants access.

## 5. Data model

Money columns end in \_paise. Times are UTC. Every mutable table has a version column for optimistic locking.

**Tables.**

- users: user\_id PK · email unique · password\_hash · role · display\_name · status
- customers: customer\_id PK · user\_id FK · full\_name · joined\_at · default\_address\_json
- products: sku PK · name · category · price\_paise · hygiene\_sensitive · final\_sale
- orders: order\_id PK · customer\_id FK · status · payment\_method (prepaid/cod) · payment\_status · subtotal\_paise · discount\_paise · shipping\_fee\_paise · total\_paise · placed\_at · shipped\_at · delivered\_at · cancelled\_at · ship\_to\_json · version
- order\_items: item\_id PK · order\_id FK · sku · name\_snapshot · category\_snapshot · qty · unit\_price\_paise · discount\_alloc\_paise · line\_paid\_paise · flags\_json
- shipments: shipment\_id PK · order\_id FK · carrier · tracking\_no · status · eta\_at · last\_event\_at · script\_id
- shipment\_events: event\_id · shipment\_id · ts · status · location · note
- returns: return\_id PK · order\_id · customer\_id · status · reason\_code · reason\_text · resolution (refund/store\_credit) · requested\_via · approved\_by · created\_at · updated\_at · version
- return\_items: return\_id · item\_id · qty · condition\_note (unique active return per item, see invariants)
- refunds: refund\_id PK · order\_id · return\_id nullable · customer\_id · amount\_paise · method (original/store\_credit/upi\_payout) · status · gateway\_ref · idempotency\_key unique · authorized\_by · authorized\_amount\_paise · authorized\_at · failure\_reason · timestamps
- store\_credit\_ledger (P1): entry\_id · customer\_id · delta\_paise · ref · ts
- mail\_messages: message\_id · thread\_id · direction · channel (email/whatsapp\_sim) · from\_addr · to\_addr · user\_id · subject · body\_text · verified\_sender · status · created\_at · read\_at
- events\_outbox: event\_id · type · payload\_json · created\_at · delivered\_at · attempts
- idempotency\_keys: key · client\_id · request\_hash · response\_json · status\_code · created\_at
- service\_clients: client\_id · secret\_hash · scopes
- store\_audit: id · ts · request\_id · actor · action · resource · outcome
- sim\_clock: single row (mode, offset\_seconds, frozen\_at) · sim\_faults: name · mode · params · enabled

Seller support policy lives in the agent (Document 2), not here. The store only holds product classes and hard safety limits.

**State machines.**

| Entity | Allowed transitions (who may trigger) |
| --- | --- |
| Order | placed to packed to shipped to out\_for\_delivery to delivered (system); placed/packed to cancelled (customer via agent, or seller; never after shipped) |
| Shipment | label\_created, picked\_up, in\_transit, out\_for\_delivery, delivered; side states exception, lost, rto. Delayed is derived: eta\_at earlier than now and not delivered |
| Return | requested to approved or rejected (seller token; the executor only within the autonomy cap) · requested to cancelled (customer) · approved to pickup\_scheduled to in\_transit\_back (system) · in\_transit\_back to received (seller or carrier sim) · received to inspected\_ok or inspection\_failed (seller) · inspected\_ok to completed (after refund release) |
| Refund | reserved to authorized (seller token, required above the autonomy cap) to processing (release) to completed or failed · failed to processing (retry, same idempotency key) · reserved to released (hold cancelled) |

**Invariants enforced by the store itself.**

1. Ownership: an order is visible to its customer only; anything else is a uniform 404.
2. Sum of active refunds (reserved, processing, completed) never exceeds the amount paid; per item, refunded never exceeds line\_paid.
3. Returned quantity (active and completed) never exceeds delivered quantity.
4. At most one active return per order item (partial unique index).
5. Refund release requires payment\_status paid, or cod\_collected for cash on delivery.
6. State changes only along allowed edges, checked in the same transaction.
7. Reservation amount must not exceed the store’s own max\_refundable calculation for the chosen items, so a faulty or manipulated caller still cannot over-refund.
8. Every mutation needs an Idempotency-Key; same key with a different payload is rejected.
9. delivered\_at is immutable once set; all timestamps come from the Clock.
10. Money-moving paths run in BEGIN IMMEDIATE transactions.

## 6. Store API contract (frozen in hour 1)

**Conventions.** Base path /api/v1 · JSON · errors as {error: {code, message, request\_id, details}} · codes: not\_found, forbidden, invalid\_state, limit\_exceeded, duplicate, validation\_error, upstream\_unavailable, idempotency\_mismatch · headers: Authorization, X-Request-ID (propagated end to end), Idempotency-Key on every POST that mutates, If-Match with version for updates · cursor pagination (limit, cursor) · money in \_paise · /openapi.json published for type generation.

| Group | Endpoint | Who | Notes |
| --- | --- | --- | --- |
| Auth | POST /auth/register, /auth/login, /auth/refresh, /auth/logout | public | Register is P1 |
| Auth | GET /auth/me · GET /.well-known/jwks.json · POST /auth/token · GET /clock (always on, read-only) | user / public / service | Client-credentials for the agent |
| Orders | GET /orders, GET /orders/{id} | customer | Own only, uniform 404 |
| Orders | GET /orders/{id}/shipment · POST /orders/{id}/evidence (jpg, png, webp; 2 MB) · GET /evidence/{id} | customer | Status, ETA, events, delayed flag |
| Orders | GET /orders/{id}/refundable?items=… | customer, agent | Per-item remaining quantity and max\_refundable\_paise |
| Returns | POST /orders/{id}/returns | customer token | Creates status requested; items, reason\_code, reason\_text, resolution |
| Returns | GET /returns, GET /returns/{id} | customer, seller | Own or all |
| Returns | POST /returns/{id}/transition | seller or executor | Body: to, reason; seller token, or executor within the autonomy cap; checked against the state table |
| Returns | POST /returns/{id}/cancel | customer | Only before approval |
| Refunds | POST /orders/{id}/refund-reservations | executor, seller | Amount, return\_id, method; creates reserved hold atomically |
| Refunds | POST /refunds/{id}/authorize (seller token) · POST /refunds/{id}/release · POST /refunds/{id}/cancel-reservation | executor, seller | Release moves to processing, then SimPay completes |
| Refunds | GET /refunds/{id} · GET /orders/{id}/refunds | customer, seller | Status and gateway\_ref (SIMULATED) |
| Refunds | GET /customers/{id}/refund-summary?days=30 | executor, seller | For cumulative limits and risk facts |
| Admin | GET /admin/orders, /admin/orders/{id}, /admin/customers/{id} | seller | Customer summary: returns\_30d, refund ratio 90 d, account age |
| Admin | POST /admin/returns/{id}/receive, /inspect · POST /admin/orders/{id}/cancel | seller | Cancel only before shipped |
| Mail | GET /mail/inbox · GET /mail/threads/{id} · POST /mail/send · POST /mail/{id}/read | customer, seller, service | Verified-sender flag |
| Carrier sim | POST /sim/carrier/shipments/{id}/advance · POST /sim/carrier/scenarios/{id}/play | seller (demo) | Manual or clock-driven |
| Demo | POST /demo/reset · GET/POST /demo/clock · POST /demo/faults · GET /demo/state · POST /demo/scenarios/{id}/load | owner (DEMO\_MODE) | Disabled with 404 otherwise |

**Webhook events (store to agent, POST /v1/webhooks/store).** order.created, order.updated, shipment.updated, shipment.delayed, return.updated, refund.updated, mail.inbound. Headers: X-Store-Signature (HMAC-SHA256 of timestamp.body), X-Store-Timestamp, X-Event-Id. The agent rejects timestamps older than 5 minutes and duplicate event ids.

## 7. Simulated services

**7.1 Carrier simulator (SwiftShip).** Each shipment follows a script: a list of (hours after shipping, status, location, note). Scripts: normal\_delivery, delayed\_exception (stuck at ‘address verification pending’), lost\_in\_transit (no scan for 6 days, then lost), rto (returned to origin). Time advances with the Clock or manually from the Carrier console. Faults: carrier.down (503), carrier.stale (no new events), carrier.slow (8 s latency). Tracking numbers look like SS plus 10 digits. ETA changes are recorded as events.

**7.2 Payment simulator (SimPay).** Releasing a refund moves it to processing and completes it after about 3 s of real time, so the demo shows the processing state. gateway\_ref format SIMPAY-xxxxxx. Every UI and API response carries simulated=true. Faults: payment.fail\_once (first attempt fails; retry with the same idempotency key succeeds), payment.timeout\_after\_commit (the refund is applied but the response is lost; this tests reconciliation), payment.down.

**7.3 Mailbox simulator.** Two channels share one table: email and whatsapp\_sim (chat-bubble styling). Outbound messages from the agent or seller appear in the customer Inbox and the seller Sent view with a SIMULATED badge. Inbound messages raise the mail.inbound webhook. Faults: mail.fail\_once, mail.down (used to show outbox retry).

**7.4 Webhook emitter.** Transactional outbox: events are written in the same transaction as the business change and delivered by a background task. Retry delays 1 s, 5 s, 30 s, 2 min, 10 min; after 5 failures the event is marked exhausted and shown in the Demo Control Center. Delivery is at-least-once, so the agent deduplicates by event id.

## 8. Simulated clock and Demo Control Center

- Single Clock service. Modes: realtime or frozen. Operations: advance by hours or days, set an exact time, freeze, resume. Every store and agent computation calls Clock.now (the agent reads GET /demo/clock). Return windows, delays, SLAs and cooldowns therefore fast-forward together.
- Seed times are stored as offsets from T0 (the moment of seeding), so a reset always rebuilds the same relative world.
- Control Center sections: Scenario loader (reset to default pack, load one scenario) · Clock (+1 h, +1 d, +7 d, freeze, set) · Fault toggles (carrier, payment, mail, and agent-side LLM down) · Carrier console · State inspector (row counts, last 20 events, webhook outbox) · Run Monitor button (calls the agent) · Snapshot save and restore (SQLite file copy) · Judge mode (large text, hides developer panels).
- Reset plus seed must take under 5 seconds. Everything under /demo exists only when DEMO\_MODE=true; otherwise it returns 404.

## 9. Web application specification

### 9.1 User journeys

**Customer**

1. J1 Track: log in, see My Orders, open ORD-1048, see the shipment timeline, ask the chat ‘Where is my order?’, and get an answer from live data.
2. J2 Return: open ORD-1042, say ‘My cookware set is defective, I want to return it’. The agent shows a return card (item, reason, refund amount, who pays shipping). The customer taps Confirm, receives a RET id and sees the chip ‘Waiting for seller review’.
3. J3 Refund status: later asks ‘What happened to my refund?’; the agent reads the live status and the Inbox shows the seller’s decision message.
4. J4 Needs a human: taps ‘Talk to a human’ or the agent escalates; the customer sees a case reference and the expected response time, and can add a message.
5. J5 Delay notice: receives a proactive message about a delayed order with options (wait, cancel, talk to support).

**Seller**

- J6 Morning review: Overview shows open approvals, cases, overdue SLAs and agent resolution counts.
- J7 Approve: opens an approval card, sees the evidence and the policy trace, approves or rejects with a reason; the customer is notified.
- J8 Handle a case: opens the escalation brief, replies to the customer, hands back to the agent or resolves.
- J9 Tune policy: edits the refund auto-limit in Policy Studio, simulates it against past cases, activates a new version.

### 9.2 Customer portal pages

| Page | Content | API |
| --- | --- | --- |
| Login, Sign-up | Form, demo quick-login, error states, lockout message | /auth/\* |
| My Orders | List with status chips, date, total, shipment badge, search | GET /orders |
| Order detail | Items with prices and discount allocation, shipment timeline, return and refund chips, buttons Track, Return, Ask support | /orders/{id}, /shipment, /refunds |
| Returns and refunds | Active and past requests with a timeline (requested, approved, pickup, received, refunded) | /returns, /refunds |
| Inbox | Messages from seller and agent, SIMULATED badge, unread count | /mail/\* |
| Profile | Name, language preference, sign out | /auth/me |
| Storefront (P1) | Product grid, cart, simulated checkout that creates an order live | /products, /orders |

### 9.3 Chat widget (global, bottom-right)

- Header with store name, agent name ‘SellerShield Assistant’, an AI disclosure label and a language toggle.
- Quick actions: Track order, Start a return, Refund status, Talk to a human.
- Cards: order summary, shipment timeline, return preview, **confirmation card** (Confirm and Cancel buttons, expires in 10 minutes), case created, error banner.
- Streaming text with tool-status lines (‘Checking your order…’). Order disambiguation uses tap-chips, not typing.
- States: loading, empty, offline, rate-limited, LLM unavailable (banner ‘Guided mode’ with the four quick actions still working).
- Safety: assistant text is rendered as plain text with a small markdown subset, sanitized (DOMPurify), no raw HTML, no links except an allowlist. Message limit 1,000 characters with a counter.
- Accessibility: aria-live for new messages, logical focus order, AA contrast, full-screen sheet on mobile.

### 9.4 Seller admin pages (store side)

Dashboard (orders today, in transit, delayed) · Orders (filters, detail with shipment and refund ledger) · Returns queue (receive and inspect buttons) · Customers (summary with risk facts) · Carrier console · Mailbox (sent and inbound) · Demo Control Center.

### 9.5 SellerShield dashboard pages (call the Agent API from Document 2)

| Page | Content |
| --- | --- |
| Overview | KPI tiles: auto-resolved, approvals pending, cases open, overdue, average first response; recent activity |
| Approvals | Queue with filters. Approval card: order, items, computed amount, policy version, rules passed or failed, risk indicators, customer claim (marked unverified), recommendation, Approve and Reject with a required reason |
| Cases | Escalation list; case detail with brief, thread, status controls, hand back to agent |
| Agent Activity | Live feed of conversations and tool calls; Decision Trace drawer for any request |
| Audit | Filterable log; chain verification button with a result banner |
| Policy Studio | Version list, editor, diff against active, what-if simulator, activate |
| Notifications | Outbox with statuses and retry |
| Analytics | Auto-resolution rate, intents by volume, approval turnaround, refund amounts approved and avoided |
| Monitor | Run Monitor button, last runs, flagged orders |

### 9.6 Visual design

Customer portal: light, friendly e-commerce look, mobile-first. Seller console: dark navy with teal, amber for pending approvals, red for denials (matches the slides). Font Inter; 4/8 px spacing grid; rounded cards; lucide icons. Every list has a loading skeleton, an empty state and an error state with retry. Dates show IST with relative text (‘3 days ago’).

### 9.7 Frontend engineering rules

Types generated from OpenAPI (npm run gen:api) · one API client wrapper that adds Authorization and X-Request-ID and refreshes the token once on 401 · auth guard by role · error boundary per route · SSE hook with reconnect and abort · no secrets in the bundle · feature flags through env (VITE\_ENABLE\_STOREFRONT, VITE\_DEMO\_MODE).

## 10. Seed data specification

Default password for all seeded users: Demo@12345 (demo-only, stored hashed). Free shipping on all seeded orders. T0 = seed time. Sellers: S001 Priya Sharma (seller\_owner, priya.sharma@nestkart.test) and S002 Kiran Rao (seller\_staff, kiran.rao@nestkart.test).

| Customer | E-mail (synthetic) | Purpose |
| --- | --- | --- |
| C001 Aarav Mehta | aarav.mehta@example.test | Main demo customer |
| C002 Diya Nair | diya.nair@example.test | Customer B, partial returns, cumulative cap |
| C003 Rohan Das | rohan.das@example.test | Risk-flag customer (4 returns in 30 days) |
| C004 Meera Iyer | meera.iyer@example.test | Cash on delivery and cancellation |
| C005 Kabir Singh | kabir.singh@example.test | Red-team account for attack tests |

Products: P-101 Non-stick Cookware Set ₹1,200 (home\_kitchen) · P-102 Copper Water Bottle ₹450 (home\_kitchen) · P-103 Cotton Bedsheet Set ₹899 (home\_kitchen) · P-104 Wireless Earbuds Lite ₹799 (electronics) · P-105 Smart LED Desk Lamp ₹2,000 (electronics) · P-201 Cotton Kurta ₹699 (apparel) · P-202 Silk Dupatta ₹349 (apparel) · P-203 Running T-shirt ₹499 (apparel) · P-301 Vitamin C Face Serum ₹550 (beauty, hygiene-sensitive) · P-302 Custom Name Mug ₹399 (custom, final sale).

| ID | Order and state at T0 | Scenario and expected agent behaviour |
| --- | --- | --- |
| SC-01 | ORD-1048, C001, in transit, ETA T0+2d, ₹899 | Order status from live data |
| SC-02 | ORD-1042 requested by C002 | Uniform ‘not found’, denial logged |
| SC-03 | C005 types another customer id or e-mail in chat | Ignored; identity comes from the token only |
| SC-04 | ORD-1042, C001, delivered T0−3d, ₹1,200 | Eligible (7-day window); defective means free return shipping; refund ₹1,200 is above the ₹500 limit, so seller approval |
| SC-05 | ORD-2032, C002, delivered T0−2d, ₹499 | Changed mind; refund 499 − 60 = ₹439, within limit, auto-approved |
| SC-06 | ORD-1051, C001, delivered T0−16d, ₹799 | Outside window; deny with reason; offer human review |
| SC-07 | ORD-1060, C001, delivered T0−2d, face serum ₹550 | Non-returnable (hygiene); deny with rule id |
| SC-08 | ORD-2031, C002, delivered T0−1d, 2 kurtas and 1 dupatta, coupon ₹100 off, total ₹1,647 | Partial return of one kurta; refund computed from allocated discount |
| SC-09 | ORD-3050, C003, return RET-9050 already requested | Duplicate blocked; existing request status shown |
| SC-10 | ORD-2040, C002, 2 bottles ₹900, ₹400 already refunded | Cap at remaining ₹500; split-refund guard |
| SC-11 | ORD-1061, C001, delivered T0−1d, bottle ₹450, ‘arrived damaged’ | Needs evidence; case created for the seller |
| SC-12 | ORD-2037, C002, shipped T0−9d, ETA T0−4d, carrier exception | Delayed; proactive notice once; case if the customer asks for help |
| SC-13 | ORD-5001, C005, delivered T0−2d, ₹499 | Reason text contains an injection string; rules still apply |
| SC-14 | ORD-1042 confirmed twice at once | Exactly one return and one reservation |
| SC-15 | ORD-3010 (₹499) and ORD-3011 (₹2,450), C003 | Risk flag forces seller review but never auto-denies; 3011 is also high value |
| SC-16 | ORD-4020, C004, COD delivered, ₹699; ORD-4021 not yet shipped, ₹899 prepaid | COD refund needs a store-credit or UPI-payout choice; cancellation before dispatch is auto-processed |
| SC-17 | ORD-1070, C001, carrier status lost, ₹998 | Lost shipment; escalate with refund-or-reship recommendation |

Also seed: historic completed returns for C003 (ORD-3001 to ORD-3004), policy versions v1 to v3 (in the agent database), six mailbox messages, and a 60-utterance intent test set in /scenarios.

## 11. Configuration, observability and deployment

- Environment variables: DEMO\_MODE, DATABASE\_URL, JWT\_PRIVATE\_KEY\_PATH, JWT\_ISSUER, WEBHOOK\_SECRET, AGENT\_WEBHOOK\_URL, CORS\_ORIGINS, SERVICE\_CLIENT\_SECRETS. Ship .env.example with fake values.
- Logs: structured JSON with request\_id, actor, route, status, latency; never passwords, tokens or full e-mail addresses.
- Health: GET /healthz and GET /readyz (database and clock checks).
- Targets: store API p95 under 100 ms locally; reset plus seed under 5 s; webhook delivery under 2 s.
- Run locally first. A hosted demo (Render, Railway or Fly free tiers) is P1; free disks are ephemeral, so the app reseeds on startup.

## 12. Store-side security and integrity

| Threat | Control |
| --- | --- |
| Reading another customer’s order | Ownership in every query, uniform 404, test SC-02 |
| Token forgery by the agent | RS256; the agent holds only the public key |
| Over-refund by a faulty or manipulated caller | Store computes max\_refundable itself; reservation capped; balance checked in BEGIN IMMEDIATE |
| Replay of webhooks or API calls | Timestamp window, event-id dedupe, Idempotency-Key |
| Double submission | Partial unique index on active return per item; idempotency table |
| Login brute force | Throttle and lockout |
| XSS through order notes or reasons | Escape on render; CSP; DOMPurify for rich text |
| Cross-site request forgery | SameSite=Lax cookie plus CSRF header |
| Secrets in the repository | .env ignored, .env.example only, secret scan before push |
| Dirty demo state | Reset and snapshot restore |

## 13. Testing the playground

- Contract tests: every endpoint validated against openapi-store.json; a schema diff blocks breaking changes after hour 1.
- Invariant tests (pytest): ownership, refund cap, double-reservation race (two parallel requests, one wins), partial-unique return index, illegal state transitions, idempotency mismatch.
- Seed verification: a script checks that each SC row exists in the stated state.
- Fault tests: each toggle produces the documented failure.
- E2E smoke (P1, Playwright): login and see orders; open chat; seller approval screen loads.

## 14. Task plan for W1 and W2

Estimates assume AI coding assistants. This is the compressed fallback schedule, to be used if pre-build time is lost; the main plan is the phase plan in section 0B.

**W1: Store backend and mock services**

| Task | Est. | Depends on | Done when |
| --- | --- | --- | --- |
| T1 Repo, FastAPI skeleton, config, Clock, error format | 1 h | contracts | /healthz and /demo/clock work |
| T2 Schema, models, seed loader for SC-01 to SC-17 | 2 h | T1 | Reset plus seed under 5 s |
| T3 Auth: login, JWT RS256, JWKS, refresh, service clients | 2 h | T1 | Agent can fetch JWKS and verify a token |
| T4 Order, shipment and refundable endpoints | 1.5 h | T2, T3 | **M1: the agent can read orders with a customer token** |
| T5 Returns and the transition engine with state table | 2 h | T4 | Illegal transitions rejected |
| T6 Refund reservations, release, SimPay, idempotency, invariants | 2.5 h | T5 | Race test passes |
| T7 Carrier sim scripts, mailbox, webhook outbox | 2.5 h | T4 | Signed events reach the agent |
| T8 Demo control endpoints and fault toggles | 1 h | T6, T7 | All toggles work |
| T9 Invariant and contract tests | 2 h | T6 | Green |
| After H12: help A with audit service, notification outbox, monitor | 4 h |  | Agreed hand-over |

**W2: Store frontend and dashboard**

| Task | Est. | Depends on | Done when |
| --- | --- | --- | --- |
| F1 Vite, Tailwind, shadcn, routing, API client from the OpenAPI stub | 1.5 h | contracts | Hello page with typed client |
| F2 Login, auth guard, token refresh | 1 h | T3 | Roles route correctly |
| F3 My Orders, Order detail, shipment timeline | 2.5 h | T4 | Journey J1 works |
| F4 Chat widget: SSE stream, cards, confirm card, guided mode | 3 h | Agent chat stub | **M3: order-status chat end to end** |
| F5 Returns and refunds page, Inbox | 1.5 h | T5, T7 | J2 and J3 visible |
| F6 Dashboard: Overview and Approvals with card | 3 h | Agent API stub | **M4/M5: approve in the UI** |
| F7 Cases, Agent Activity with Decision Trace, Audit | 2.5 h | Agent API | J7 and J8 work |
| F8 Seller admin pages and Demo Control Center | 2 h | T8 | Judge mode works |
| F9 Policy Studio, Analytics, polish, responsive checks | 2.5 h | Agent API | Only if on schedule |

**Shared milestones.** M0 contracts frozen (H1) · M1 agent reads an order from the store (H3) · M2 returns and reservations live (H6) · M3 chat answers an order-status question in the widget (H9) · M4 return proposal, confirm button and store write (H12) · M5 refund approval end to end with audit (H15) · M6 escalation brief, monitor, outbox, control center (H18) · M7 feature freeze and test run (H20) · M8 README, video, deck, submit (H22 to H23; deadline 12 Nov 10:00 IST).

## 15. Risks, assumptions and open questions

- **Pre-build permission:** keep the organizers’ written message (date, channel, exact wording) and confirm whether the permission covers all code or only the mock store; disclose the timeline in the README.
- **Critical path:** the agent cannot test against the store until T4 exists. W1 delivers M1 first; until then A develops against a stub generated from openapi-store.json.
- **Frontend load:** W2 has the largest surface. If late, drop in this order: Policy Studio, Analytics, Storefront, Sign-up.
- **Assumptions:** one seller, one carrier, INR only, prices tax-inclusive, free shipping on seeded orders.
- **Assumption:** the SellerShield dashboard lives inside the same React app under /seller/shield and talks to the Agent API with the seller’s store-issued token.
- **To confirm:** LLM provider and keys (Document 2, section 3) · whether judges will see a hosted URL or a screen share · whether the e-mail channel (P1) is worth the time.

## 16. Strict review: findings, fixes and amendments (these supersede earlier text)

**Verdict.** The design is sound, but a strict pass found 7 blockers or high-severity gaps and several medium ones. All are listed below with their fixes; where this section conflicts with earlier text, this section wins. Phases are in section 0B and the GitHub commands are in section 0C.

| # | Severity | Finding | Fix | Owner |
| --- | --- | --- | --- | --- |
| 1 | High | The store cannot verify an approval\_ref, so a faulty or compromised agent could release large refunds | Seller approvals pass through the seller’s own token; the store records authorized\_by and authorized\_amount; the store caps service-token releases with an autonomy cap and a daily cap unless an authorization exists | Store, Agent |
| 2 | High | Background steps (reconcile, release after receipt) cannot use an expired customer token | The customer token is used only inside the request that carries it; executor and monitor use service tokens, with read-only order scope for reads | Store, Agent |
| 3 | Blocker | No way to push server-initiated messages (approval decided, seller reply, delay notice) to an open chat | SSE stream GET /v1/chat/stream plus polling fallback GET /v1/me/events?since=; the widget subscribes | Agent, Web |
| 4 | Blocker | Native EventSource cannot send an Authorization header | Use @microsoft/fetch-event-source for every stream | Web |
| 5 | Blocker | Token audience mismatch between store and agent; start-order dependency | aud lists both services; JWKS fetched lazily with retry and cache | Store, Agent |
| 6 | Blocker | CORS, cookie and SSE trouble across ports | Vite dev proxy for /api and /agent; one reverse-proxy origin when hosted; disable buffering for SSE | Web |
| 7 | Blocker | SQLite pitfalls: BEGIN IMMEDIATE with SQLAlchemy, long transactions, synced folders, Windows tzdata | Shared db.py recipe (below), WAL, busy\_timeout, never hold a write transaction across an await or HTTP call, repository outside OneDrive, tzdata installed | Store, Agent |
| 8 | High | Evidence upload missing (damaged-item workflow, SC-11, T13) | Evidence API (below); agent accepts evidence\_ids | Store, Agent, Web |
| 9 | High | No policy\_decisions table, so Decision Trace and policy simulation lack their facts | Add policy\_decisions with facts\_json (no personal data) and decision\_json | Agent |
| 10 | High | The clock endpoint exists only in DEMO\_MODE, so the agent cannot read time otherwise | GET /api/v1/clock always on and read-only; controls only under /demo | Store |
| 11 | Medium | Three to five LLM calls per message hurt latency and quota | Chips and buttons use deterministic tool paths with no LLM; merge understand and resolve for simple high-confidence read intents; cache digests | Agent |
| 12 | Medium | Evaluation can exhaust free quota (about 900 calls for 25 conversations of 4 turns, 3 calls each, 3 repeats) | Replay cache; at most two live runs; separate demo key; no evaluation within an hour of the demo; Groq for bulk | Agent |
| 13 | Medium | OpenAI-compatible providers differ in JSON-schema strictness, tool\_choice and parallel calls | Flat schemas, enums, no unions; JSON mode plus Pydantic retry as fallback; capability flags per provider; bake-off | Agent |
| 14 | Medium | Webhooks are at-least-once and can arrive out of order | Events carry resource\_version; handlers ignore stale versions and are idempotent | Store, Agent |
| 15 | Medium | Multi-intent messages are undefined | Handle the primary intent first, then offer the secondary one explicitly | Agent |
| 16 | Medium | An LLM-written case brief delays escalation | Create the case at once with the deterministic brief; add the summary asynchronously | Agent |
| 17 | Medium | The customer-safe policy summary could reveal internal limits | Summary shows windows, shipping-fee rules and refund timing only; never limits, risk or approval thresholds | Agent |
| 18 | Medium | The refundable query format is ambiguous | items=ITEM\_ID:QTY,ITEM\_ID:QTY | Store |
| 19 | Medium | Nothing raises shipment.delayed | A store tick every 10 s compares ETA with the clock and emits once per ETA | Store |
| 20 | Medium | IDOR risk on agent routes for sessions, proposals, cases and approvals | Every fetch checks ownership or role; uniform 404; tests | Agent |
| 21 | Medium | Sensitive seller actions need stronger proof | Step-up (P1): policy activation and approvals above the staff limit require auth\_time within 15 minutes; frame-ancestors none | Agent, Web |
| 22 | Medium | Unlimited open streams | Two streams per user, heartbeat, idle timeout | Agent |
| 23 | Low | Supply chain | Pinned versions, lockfiles, pip-audit and npm audit once before release | All |
| 24 | Low | A hosted demo exposes demo logins | DEMO\_MODE gates quick-login; rate limits; reset button; demo-only data | Store, Web |
| 25 | Low | Analytics definitions could inflate claims | Define auto-resolved as a conversation that ended without a case and with the intent fulfilled; report measured counts only | Agent, Web |
| 26 | Hackathon | A flaky live demo costs the 20 percent reliability score | just demo starts everything; scripts/demo\_check replays the four demo beats through the API and asserts state; tunnel or hosted fallback; recorded backup | All |
| 27 | Hackathon | Submission requirements are unknown | Open the Hack4Hack submission page now and list the required fields and formats (repo, video host and access, deck link, live URL); prepare a LICENSE (MIT), third-party notices and an AI-assistant disclosure | All |
| 28 | Honesty | Timeline claims | README discloses that building began before 11 Nov with permission; never change commit dates or rewrite history to hide work (a rewrite is allowed only to remove a leaked secret, after rotating it) | All |

**Store amendment 1: autonomy cap and daily cap.** A store\_settings table holds autonomy\_cap\_paise (default 50,000) and autonomy\_daily\_cap\_paise (default 500,000), readable and editable by seller\_owner through GET and PUT /admin/settings. Rules: (a) a service-token return approval or refund release is accepted only if its total value is at most the autonomy cap, or the refund carries a stored authorization from a seller of sufficient role (staff up to ₹2,000, owner above); (b) service-token releases per simulated IST day must not exceed the daily cap, otherwise 409 limit\_exceeded. The agent’s policy auto-limit and the store cap both start at ₹500. When the owner activates a policy that changes the auto-limit, the dashboard asks the owner to confirm updating the store cap with the owner’s own token; the store records who changed it. The store cap is a money backstop; finer rules (risk review, evidence) stay in the agent’s policy engine.

**Store amendment 2: POST /refunds/{id}/authorize.** Seller token. Body: amount\_paise (at most the reserved amount) and note. Checks: role and limit, refund in reserved status, idempotency. Stores authorized\_by, authorized\_amount\_paise and authorized\_at, then emits refund.updated.

**Store amendment 3: new invariants.** 11 service-token releases never exceed the autonomy cap without a stored authorization. 12 an authorization requires a seller token of sufficient role. 13 evidence uploads are validated for type, size and ownership. 14 the daily autonomous total is enforced.

**Store amendment 4: evidence API.** POST /orders/{id}/evidence (multipart; jpg, png or webp; up to 2 MB; at most 3 per order), GET /orders/{id}/evidence and GET /evidence/{id}. Validate the real file type, re-encode with Pillow to strip EXIF and hidden payloads, use random file names, store outside any web-served path, send Content-Disposition attachment and X-Content-Type-Options nosniff, allow only the owner or a seller, and answer 404 otherwise.

**Store amendment 5: other contract details.** GET /api/v1/clock returns now\_utc and mode. GET /orders/{id}/refundable?items=ITEM\_ID:QTY,ITEM\_ID:QTY returns per-item remaining quantity and max\_refundable\_paise net of holds. Every webhook payload carries resource\_version. The store tick runs every 10 seconds.

**Web amendment.** The chat widget refreshes the access token before each message, offers an evidence upload button with clear size and type errors, subscribes to the push stream, uses fetch-event-source everywhere, goes through the Vite proxy, ships a CSP with frame-ancestors none, sanitizes with DOMPurify and never keeps tokens in localStorage.

**SQLite recipe (put it in store-api/db.py and agent/db.py).** BEGIN IMMEDIATE on every transaction serializes access, which is fine at demo scale. Never hold a write transaction across an await or an HTTP call.

```
from sqlalchemy import create_engine, event

engine = create_engine('sqlite:///data/store.db', connect_args={'check_same_thread': False})

@event.listens_for(engine, 'connect')
def on_connect(dbapi_conn, record):
    dbapi_conn.isolation_level = None   # we control BEGIN ourselves
    cur = dbapi_conn.cursor()
    cur.execute('PRAGMA journal_mode=WAL')
    cur.execute('PRAGMA foreign_keys=ON')
    cur.execute('PRAGMA busy_timeout=5000')
    cur.close()

@event.listens_for(engine, 'begin')
def on_begin(conn):
    conn.exec_driver_sql('BEGIN IMMEDIATE')
```

**Security checklist before release (tick each).**

1. Customer A cannot read, list, cancel or return Customer B’s order through any store endpoint (test every endpoint).
2. Seller-only and demo routes reject customer tokens and unauthenticated calls.
3. A service-token release above the autonomy cap fails without an authorization; the daily cap works.
4. JWTs with the wrong audience, expired, with a bad signature or with the none algorithm are rejected.
5. Login throttle and lockout work; error text is generic.
6. Uploads with a wrong type, oversize files, disguised files and path-traversal names are rejected.
7. No SQL is built from strings; only the ORM or bound parameters.
8. Responses carry CSP, nosniff and frame-ancestors none; CORS is an allowlist.
9. No secrets or .db files in Git; gitleaks is clean on the full history.
10. Logs contain no tokens, passwords or full e-mail addresses.
11. Dependencies are pinned and pip-audit and npm audit are reviewed.
12. With DEMO\_MODE off, every /demo and /sim route returns 404.
13. Webhook signatures and the replay window are verified.
14. Replaying an idempotency key with a different payload is rejected.

**Hackathon necessities checklist.**

- One command to run (just demo) plus a demo\_check script that replays the four demo beats and asserts the results.
- README: problem, architecture diagram, three-command run, demo accounts, scenario list, what is simulated, actual test results, limitations, roadmap, build-timeline disclosure, team.
- LICENSE, third-party notices and an AI-assistant disclosure.
- A short responsible-AI note: guardrails, human oversight, synthetic data only.
- Demo video of at most 3 minutes on a public or unlisted link, checked in a private window.
- Final deck rebuilt with real screenshots and measured results.
- Submission form fields checked in advance on the Hack4Hack page.
- Fallbacks: tunnel or hosted link, recorded segments, a second laptop with the project cloned.

**Open questions for the team.** 1 What exactly did the organizers permit, in what words and through which channel? 2 Which LLM keys do you hold today? 3 Who is strongest in React and who in Python (to confirm the W1, W2 and A split)? 4 Will final judging use a hosted URL, a tunnel or a screen share? 5 What are the exact submission form fields? 6 Which operating systems do the laptops run?

## 17. Amendment: sharing code before 11 Nov, agent tooling and Windows (supersedes 0C where different)

- **Team sync.** With no GitHub repository until 11 Nov, three people need another way to share code. Preferred: a temporary private remote that is not GitHub (GitLab, Bitbucket or Codeberg), named sync. A human adds it (git remote add sync URL, then git push -u sync main); everyone pushes only to sync; .env files never go into any remote. Alternative: the integration owner (A) holds the only repository and W1 and W2 send zipped folders. Confirm with the organizers that a private temporary remote is acceptable. On 11 Nov the GitHub remote is added as origin and sections 0C step D and E are followed; the integration owner tags each phase gate on main after merging.
- **Coding-agent safety.** Build with Google Antigravity using AGENTS.md and the project memory files in Document 3 and the task prompts in Document 4. Agents never run git push or git remote, never read .env, and never commit unless a task says so. No GitHub remote exists before 11 Nov.
- **Specs in the repo.** Export Documents 1 and 2 as Markdown into docs/spec/01-playground.md and docs/spec/02-agent.md so coding agents can read cited sections.
- **Windows.** Keep the repository at C:/dev/sellershield (never in OneDrive); run Python through uv; the justfile sets its shell to PowerShell.
- **Effort note.** Phase 0 for the agent path is about 6 to 7 hours because the agent owner also writes and freezes both OpenAPI contracts (milestone M0). W1 and W2 build to those contracts.
