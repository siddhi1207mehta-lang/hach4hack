"""
FastAPI dependencies for authentication and authorization.

- get_current_principal: extracts the principal from the request (returns dict or None)
- require_auth: raises 401 if no principal
- require_role(*roles): raises 403 if principal role not in allowed roles
- require_scope(*scopes): raises 403 if service principal lacks required scopes
"""

from typing import Any

from fastapi import Depends, Request

from app.auth import get_current_principal
from app.errors import AppException


def require_auth(request: Request) -> dict[str, Any]:
    """Require a valid principal. Raises 401 if missing or invalid."""
    principal = get_current_principal(request)
    if principal is None:
        raise AppException(
            code="unauthorized",
            message="Authentication required",
            status_code=401,
        )
    return principal


class RoleChecker:
    """Dependency that checks the principal has one of the allowed roles."""

    def __init__(self, *allowed_roles: str) -> None:
        self.allowed_roles = set(allowed_roles)

    def __call__(self, principal: dict[str, Any] = Depends(require_auth)) -> dict[str, Any]:
        # Service tokens don't have a role
        if principal.get("type") == "service":
            raise AppException(
                code="forbidden",
                message="This endpoint requires a user token",
                status_code=403,
            )
        if principal.get("role") not in self.allowed_roles:
            raise AppException(
                code="forbidden",
                message="Insufficient role",
                status_code=403,
            )
        return principal


class ScopeChecker:
    """Dependency that checks the service principal has all required scopes."""

    def __init__(self, *required_scopes: str) -> None:
        self.required_scopes = set(required_scopes)

    def __call__(self, principal: dict[str, Any] = Depends(require_auth)) -> dict[str, Any]:
        if principal.get("type") != "service":
            raise AppException(
                code="forbidden",
                message="This endpoint requires a service token",
                status_code=403,
            )
        token_scopes = set(principal.get("scopes", []))
        if not self.required_scopes.issubset(token_scopes):
            missing = self.required_scopes - token_scopes
            raise AppException(
                code="forbidden",
                message=f"Missing required scopes: {', '.join(sorted(missing))}",
                status_code=403,
            )
        return principal


# Convenience factories
def require_role(*roles: str) -> RoleChecker:
    """Create a role-checking dependency."""
    return RoleChecker(*roles)


def require_scope(*scopes: str) -> ScopeChecker:
    """Create a scope-checking dependency."""
    return ScopeChecker(*scopes)

