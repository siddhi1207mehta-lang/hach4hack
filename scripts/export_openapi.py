import json
import sys
from pathlib import Path

# Ensure store-api is on sys.path
BASE_DIR = Path(__file__).resolve().parent.parent
STORE_API_DIR = BASE_DIR / "store-api"
if str(STORE_API_DIR) not in sys.path:
    sys.path.insert(0, str(STORE_API_DIR))

from app.main import app  # noqa: E402

def main() -> None:
    contracts_dir = BASE_DIR / "contracts"
    contracts_dir.mkdir(parents=True, exist_ok=True)
    schema_path = contracts_dir / "openapi-store.json"

    openapi_data = app.openapi()
    with open(schema_path, "w", encoding="utf-8") as f:
        json.dump(openapi_data, f, indent=2)

    print(f"Exported OpenAPI schema to {schema_path}")

if __name__ == "__main__":
    main()

