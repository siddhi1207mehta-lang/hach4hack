"""
Print ONLY the access token for a seeded user, for use in curl tests.

Usage: python scripts/token.py <email>
       just token <email>
"""

import sys
from pathlib import Path

# Add store-api to sys.path
REPO_ROOT = Path(__file__).resolve().parent.parent
STORE_API_DIR = REPO_ROOT / "store-api"
if str(STORE_API_DIR) not in sys.path:
    sys.path.insert(0, str(STORE_API_DIR))

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.auth import _mint_access_token
from app.models import User
from db import engine


def main() -> None:
    if len(sys.argv) < 2:
        print("Usage: python scripts/token.py <email>", file=sys.stderr)
        sys.exit(1)

    email = sys.argv[1].lower().strip()

    with Session(engine) as session:
        user = session.scalar(select(User).where(User.email == email))
        if user is None:
            print(f"User not found: {email}", file=sys.stderr)
            sys.exit(1)

        customer_id = None
        if user.role == "customer" and user.customer:
            customer_id = user.customer.customer_id

        token = _mint_access_token(user, customer_id)
        # Print ONLY the token (no newline issues for $(just token ...) capture)
        print(token, end="")


if __name__ == "__main__":
    main()

