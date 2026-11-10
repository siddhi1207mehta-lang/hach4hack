"""
SimPay Payment Simulator (spec section 7.2)

- Releasing a refund moves it to 'processing' and completes it after about 3s
  of real time in a background asyncio task.
- gateway_ref format: SIMPAY-xxxxxx.
- Every UI and API response carries simulated=true.
- Faults:
  - payment.fail_once (first attempt fails; retry with same key succeeds)
  - payment.timeout_after_commit (refund applied in DB but response is lost/timed out)
  - payment.down (SimPay 503 upstream unavailable)
"""

import asyncio
import logging
import secrets
from typing import Optional

from sqlalchemy import select
from sqlalchemy.orm import Session

import db
from app.clock import Clock
from app.models import Refund, Return, SimFault

logger = logging.getLogger(__name__)

# In-memory fault flags as fast path / test override
_MEMORY_FAULTS: dict[str, bool] = {}


def set_fault(name: str, enabled: bool, session: Optional[Session] = None) -> None:
    """Enable or disable a simulator fault in memory and database."""
    _MEMORY_FAULTS[name] = enabled
    try:
        if session is not None:
            fault = session.get(SimFault, name)
            if fault:
                fault.enabled = enabled
            else:
                fault = SimFault(
                    name=name,
                    mode="boolean",
                    params_json="{}",
                    enabled=enabled,
                )
                session.add(fault)
        else:
            with Session(db.engine) as s:
                fault = s.get(SimFault, name)
                if fault:
                    fault.enabled = enabled
                else:
                    fault = SimFault(
                        name=name,
                        mode="boolean",
                        params_json="{}",
                        enabled=enabled,
                    )
                    s.add(fault)
                s.commit()
    except Exception as exc:
        logger.warning(f"Could not persist sim fault {name} to DB: {exc}")


def clear_faults() -> None:
    """Clear all fault switches."""
    _MEMORY_FAULTS.clear()
    try:
        with Session(db.engine) as session:
            faults = session.scalars(select(SimFault)).all()
            for f in faults:
                f.enabled = False
            session.commit()
    except Exception as exc:
        logger.warning(f"Could not clear sim faults in DB: {exc}")


def is_fault_enabled(name: str, session: Optional[Session] = None) -> bool:
    """Check if a simulator fault is enabled in memory or database."""
    if _MEMORY_FAULTS.get(name, False):
        return True
    try:
        if session is not None:
            fault = session.get(SimFault, name)
            return bool(fault and fault.enabled)
        else:
            with Session(db.engine) as s:
                fault = s.get(SimFault, name)
                return bool(fault and fault.enabled)
    except Exception:
        return False


def generate_gateway_ref() -> str:
    """Generate SIMPAY-xxxxxx reference."""
    token = secrets.token_hex(3).upper()  # 6 hex chars
    return f"SIMPAY-{token}"


async def complete_simpay_refund(refund_id: str, delay_seconds: float = 3.0) -> None:
    """
    Background asyncio task to complete refund after real-time delay.
    Never holds a write transaction across await asyncio.sleep.
    """
    if delay_seconds > 0:
        await asyncio.sleep(delay_seconds)

    with Session(db.engine) as session:
        refund = session.get(Refund, refund_id)
        if refund is None or refund.status != "processing":
            return

        now = Clock.now()
        refund.status = "completed"
        if not refund.gateway_ref:
            refund.gateway_ref = generate_gateway_ref()
        refund.updated_at = now
        refund.version += 1

        # If linked to a return that was inspected_ok, advance to completed
        if refund.return_id:
            ret = session.get(Return, refund.return_id)
            if ret and ret.status == "inspected_ok":
                ret.status = "completed"
                ret.updated_at = now
                ret.version += 1
                for item in ret.items:
                    item.status = "completed"

        session.commit()
        logger.info(
            f"SimPay completed refund {refund_id} with gateway_ref {refund.gateway_ref}"
        )

