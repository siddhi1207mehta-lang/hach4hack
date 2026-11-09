import base64
from datetime import datetime, timedelta, timezone
from typing import Any, Optional

from fastapi import APIRouter, Depends, Query
from sqlalchemy import func, or_, select
from sqlalchemy.orm import Session, joinedload

import db
from app.clock import Clock
from app.deps import require_seller_or_monitor
from app.errors import AppException, NotFoundException
from app.models import Customer, Order, OrderItem, Refund, Return
from app.schemas import (
    CustomerAdminSummaryResponse,
    OrderItemResponse,
    OrderListResponse,
    OrderResponse,
)

router = APIRouter(prefix="/api/v1/admin", tags=["Admin"])


@router.get(
    "/orders",
    response_model=OrderListResponse,
    summary="List all store orders (seller view)",
)
def admin_list_orders(
    limit: int = Query(default=20, ge=1, le=100),
    cursor: Optional[str] = None,
    status: Optional[str] = None,
    customer_id: Optional[str] = None,
    search: Optional[str] = None,
    _: dict[str, Any] = Depends(require_seller_or_monitor),
) -> OrderListResponse:
    with Session(db.engine) as session:
        query = select(Order).options(joinedload(Order.items))

        if status:
            query = query.where(Order.status == status)

        if customer_id:
            query = query.where(Order.customer_id == customer_id)

        if search:
            search_pattern = f"%{search.strip()}%"
            query = query.where(
                or_(
                    Order.order_id.ilike(search_pattern),
                    Order.customer_id.ilike(search_pattern),
                    Order.items.any(OrderItem.name_snapshot.ilike(search_pattern)),
                    Order.items.any(OrderItem.sku.ilike(search_pattern)),
                )
            )

        if cursor:
            try:
                decoded = base64.urlsafe_b64decode(cursor.encode()).decode()
                cursor_dt_str, cursor_order_id = decoded.split("|", 1)
                cursor_dt = datetime.fromisoformat(cursor_dt_str)
                query = query.where(
                    or_(
                        Order.placed_at < cursor_dt,
                        (Order.placed_at == cursor_dt) & (Order.order_id < cursor_order_id),
                    )
                )
            except Exception:
                raise AppException(
                    code="validation_error",
                    message="Invalid pagination cursor",
                    status_code=400,
                )

        query = query.order_by(Order.placed_at.desc(), Order.order_id.desc()).limit(limit + 1)
        orders = session.scalars(query).unique().all()

        has_more = len(orders) > limit
        if has_more:
            visible_orders = orders[:limit]
            last_order = visible_orders[-1]
            next_cursor = base64.urlsafe_b64encode(
                f"{last_order.placed_at.isoformat()}|{last_order.order_id}".encode()
            ).decode()
        else:
            visible_orders = orders
            next_cursor = None

        items_resp = [
            OrderResponse(
                order_id=o.order_id,
                customer_id=o.customer_id,
                status=o.status,
                payment_method=o.payment_method,
                payment_status=o.payment_status,
                subtotal_paise=o.subtotal_paise,
                discount_paise=o.discount_paise,
                shipping_fee_paise=o.shipping_fee_paise,
                total_paise=o.total_paise,
                placed_at=o.placed_at,
                shipped_at=o.shipped_at,
                delivered_at=o.delivered_at,
                cancelled_at=o.cancelled_at,
                ship_to_json=o.ship_to_json,
                version=o.version,
                items=[OrderItemResponse.model_validate(it) for it in o.items],
            )
            for o in visible_orders
        ]

        return OrderListResponse(items=items_resp, next_cursor=next_cursor, has_more=has_more)


@router.get(
    "/orders/{order_id}",
    response_model=OrderResponse,
    summary="Get any store order (seller view)",
)
def admin_get_order(
    order_id: str,
    _: dict[str, Any] = Depends(require_seller_or_monitor),
) -> OrderResponse:
    with Session(db.engine) as session:
        order = (
            session.query(Order)
            .options(joinedload(Order.items))
            .filter(Order.order_id == order_id)
            .one_or_none()
        )
        if not order:
            raise NotFoundException(message="Order not found")

        return OrderResponse(
            order_id=order.order_id,
            customer_id=order.customer_id,
            status=order.status,
            payment_method=order.payment_method,
            payment_status=order.payment_status,
            subtotal_paise=order.subtotal_paise,
            discount_paise=order.discount_paise,
            shipping_fee_paise=order.shipping_fee_paise,
            total_paise=order.total_paise,
            placed_at=order.placed_at,
            shipped_at=order.shipped_at,
            delivered_at=order.delivered_at,
            cancelled_at=order.cancelled_at,
            ship_to_json=order.ship_to_json,
            version=order.version,
            items=[OrderItemResponse.model_validate(it) for it in order.items],
        )


@router.get(
    "/customers/{customer_id}",
    response_model=CustomerAdminSummaryResponse,
    summary="Get customer summary (seller view)",
)
def admin_get_customer_summary(
    customer_id: str,
    _: dict[str, Any] = Depends(require_seller_or_monitor),
) -> CustomerAdminSummaryResponse:
    with Session(db.engine) as session:
        customer = session.get(Customer, customer_id)
        if not customer:
            raise NotFoundException(message="Customer not found")

        now = Clock.now()
        joined_utc = (
            customer.joined_at.replace(tzinfo=timezone.utc)
            if customer.joined_at.tzinfo is None
            else customer.joined_at.astimezone(timezone.utc)
        )
        account_age_days = (now - joined_utc).days
        account_age_str = f"{account_age_days} days"

        # SQLite stores naive UTC datetimes
        now_naive = now.replace(tzinfo=None)
        thirty_days_ago = now_naive - timedelta(days=30)
        returns_30d = (
            session.scalar(
                select(func.count(Return.return_id)).where(
                    Return.customer_id == customer_id,
                    Return.status == "completed",
                    Return.created_at >= thirty_days_ago,
                )
            )
            or 0
        )

        # refund ratio 90 days: refunded paise / ordered paise in last 90 days
        ninety_days_ago = now_naive - timedelta(days=90)
        refunds_90d_paise = (
            session.scalar(
                select(func.coalesce(func.sum(Refund.amount_paise), 0)).where(
                    Refund.customer_id == customer_id,
                    Refund.status == "completed",
                    Refund.created_at >= ninety_days_ago,
                )
            )
            or 0
        )
        orders_90d_paise = (
            session.scalar(
                select(func.coalesce(func.sum(Order.total_paise), 0)).where(
                    Order.customer_id == customer_id,
                    Order.placed_at >= ninety_days_ago,
                )
            )
            or 0
        )
        refund_ratio_90d = (
            round(float(refunds_90d_paise) / float(orders_90d_paise), 4)
            if orders_90d_paise > 0
            else 0.0
        )

        total_orders = (
            session.scalar(
                select(func.count(Order.order_id)).where(Order.customer_id == customer_id)
            )
            or 0
        )
        total_spend_paise = (
            session.scalar(
                select(func.coalesce(func.sum(Order.total_paise), 0)).where(
                    Order.customer_id == customer_id
                )
            )
            or 0
        )
        total_refunded_paise = (
            session.scalar(
                select(func.coalesce(func.sum(Refund.amount_paise), 0)).where(
                    Refund.customer_id == customer_id,
                    Refund.status == "completed",
                )
            )
            or 0
        )

        return CustomerAdminSummaryResponse(
            customer_id=customer.customer_id,
            full_name=customer.full_name,
            joined_at=customer.joined_at,
            account_age=account_age_str,
            account_age_days=account_age_days,
            returns_30d=returns_30d,
            refund_ratio_90d=refund_ratio_90d,
            total_orders=total_orders,
            total_spend_paise=total_spend_paise,
            total_refunded_paise=total_refunded_paise,
        )
