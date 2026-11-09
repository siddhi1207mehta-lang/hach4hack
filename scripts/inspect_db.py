import sys
from pathlib import Path

# Add store-api to sys.path so we can import app modules and db
REPO_ROOT = Path(__file__).resolve().parent.parent
STORE_API_DIR = REPO_ROOT / "store-api"
if str(STORE_API_DIR) not in sys.path:
    sys.path.insert(0, str(STORE_API_DIR))

from db import engine
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.models import (
    Customer,
    Evidence,
    EventsOutbox,
    IdempotencyKey,
    MailMessage,
    Order,
    OrderItem,
    Product,
    Refund,
    Return,
    ReturnItem,
    ServiceClient,
    Shipment,
    ShipmentEvent,
    SimClock,
    SimFault,
    StoreAudit,
    StoreCreditLedger,
    StoreSettings,
    User,
)


def inspect_db() -> None:
    with Session(engine) as session:
        # Table counts
        tables = [
            ("users", User),
            ("customers", Customer),
            ("products", Product),
            ("orders", Order),
            ("order_items", OrderItem),
            ("shipments", Shipment),
            ("shipment_events", ShipmentEvent),
            ("returns", Return),
            ("return_items", ReturnItem),
            ("refunds", Refund),
            ("store_credit_ledger", StoreCreditLedger),
            ("mail_messages", MailMessage),
            ("events_outbox", EventsOutbox),
            ("idempotency_keys", IdempotencyKey),
            ("service_clients", ServiceClient),
            ("store_audit", StoreAudit),
            ("sim_clock", SimClock),
            ("sim_faults", SimFault),
            ("store_settings", StoreSettings),
            ("evidence", Evidence),
        ]

        print("=== Database Row Counts ===")
        for name, model in tables:
            count = session.scalar(select(func.count()).select_from(model))
            print(f"  {name:20}: {count} rows")

        # Users breakdown
        customer_count = session.scalar(select(func.count(Customer.customer_id)))
        seller_count = session.scalar(
            select(func.count(User.user_id)).where(User.role.in_(["seller_owner", "seller_staff"]))
        )
        product_count = session.scalar(select(func.count(Product.sku)))
        print(f"\nBreakdown: {customer_count} customers, {seller_count} sellers, {product_count} products.")

        # Scenario orders status
        scenario_map = [
            ("SC-01", "ORD-1048", "In transit status"),
            ("SC-02", "ORD-1042", "C002 access denial (owned by C001)"),
            ("SC-04", "ORD-1042", "Defective cookware delivered T0-3d (>₹500 approval)"),
            ("SC-05", "ORD-2032", "Running T-shirt delivered T0-2d (<₹500 auto-approved)"),
            ("SC-06", "ORD-1051", "Earbuds delivered T0-16d (outside 7d window)"),
            ("SC-07", "ORD-1060", "Face serum delivered T0-2d (hygiene-sensitive)"),
            ("SC-08", "ORD-2031", "Coupon discount largest-remainder allocation"),
            ("SC-09", "ORD-3050", "RET-9050 active return already requested"),
            ("SC-10", "ORD-2040", "₹400 already refunded (RFD-2040), remaining ₹500"),
            ("SC-11", "ORD-1061", "Damaged bottle delivery T0-1d (needs evidence)"),
            ("SC-12", "ORD-2037", "Carrier exception (delayed notice)"),
            ("SC-13", "ORD-5001", "Injection string in reason text test"),
            ("SC-14", "ORD-1042", "Double submission / idempotency test"),
            ("SC-15", "ORD-3010", "Risk-flag customer C003 order 1 (₹499)"),
            ("SC-15", "ORD-3011", "Risk-flag customer C003 order 2 (₹2,450)"),
            ("SC-16", "ORD-4020", "COD delivered ₹699"),
            ("SC-16", "ORD-4021", "Prepaid placed ₹899 (not yet shipped)"),
            ("SC-17", "ORD-1070", "Carrier status lost ₹998"),
        ]

        print("\n=== Scenario Orders Status ===")
        print(f"{'Scenario':<8} {'Order ID':<10} {'Customer':<10} {'Status':<12} {'Total (paise)':<14} {'Total (₹)':<10} {'Notes'}")
        print("-" * 85)

        for sc, order_id, notes in scenario_map:
            order = session.get(Order, order_id)
            if order:
                total_in_rupees = f"₹{order.total_paise / 100:,.2f}".rstrip("0").rstrip(".")
                print(
                    f"{sc:<8} {order.order_id:<10} {order.customer_id:<10} {order.status:<12} {order.total_paise:<14} {total_in_rupees:<10} {notes}"
                )
            else:
                print(f"{sc:<8} {order_id:<10} NOT FOUND")


if __name__ == "__main__":
    inspect_db()

