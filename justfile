set windows-shell := ["powershell.exe", "-NoLogo", "-ExecutionPolicy", "Bypass", "-Command"]

export UV_CACHE_DIR := invocation_directory() + "/.uv_cache"
export UV_PYTHON_INSTALL_DIR := invocation_directory() + "/.uv_python"

default:
    @just --list

# Install dependencies and sync virtual environment
setup:
    uv sync --project store-api

# Start all services (store-api 8000, agent 8001, store-web 5173)
dev:
    uv run --project store-api python scripts/dev.py

# Start store-api development server on port 8000
dev-api:
    uv run --project store-api uvicorn --app-dir store-api app.main:app --host 0.0.0.0 --port 8000

# Run test suite, forwarding extra arguments (e.g. just test -k name)
test *args:
    uv run --project store-api pytest store-api/tests {{args}}

# Run linter
lint:
    uv run --project store-api ruff check store-api

# Generate RS256 JWT key pair
keys:
    uv run --project store-api python scripts/make_keys.py

# Export OpenAPI contracts
openapi:
    uv run --project store-api python scripts/export_openapi.py

# Seed store database
seed:
    python -c "print('not built yet')"

# Reset database to initial state
reset:
    python -c "print('not built yet')"

# Inspect database contents
inspect:
    python -c "print('not built yet')"

# Verify seeded scenario data
verify-seed:
    python -c "print('not built yet')"

# Generate auth token helper
token:
    python -c "print('not built yet')"

# Money-path smoke test
smoke-money:
    python -c "print('not built yet')"

# Webhook listener helper
webhook-listener:
    python -c "print('not built yet')"

# Run security checks
security-check:
    python -c "print('not built yet')"

# Run performance benchmarks
perf:
    python -c "print('not built yet')"

# Start complete demo setup
demo:
    python -c "print('not built yet')"

# Replay demo scenarios check
demo-check:
    python -c "print('not built yet')"
