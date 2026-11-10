from datetime import datetime
from typing import Optional

from pydantic import BaseModel, ConfigDict


class ProductResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    sku: str
    name: str
    category: str
    price_paise: int
    hygiene_sensitive: bool
    final_sale: bool


class OrderItemResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    item_id: str
    order_id: str
    sku: str
    name_snapshot: str
    category_snapshot: str
    qty: int
    unit_price_paise: int
    discount_alloc_paise: int
    line_paid_paise: int
    flags_json: str = "{}"


class OrderResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    order_id: str
    customer_id: str
    status: str
    payment_method: str
    payment_status: str
    subtotal_paise: int
    discount_paise: int
    shipping_fee_paise: int
    total_paise: int
    placed_at: datetime
    shipped_at: Optional[datetime] = None
    delivered_at: Optional[datetime] = None
    cancelled_at: Optional[datetime] = None
    ship_to_json: str = "{}"
    items: list[OrderItemResponse] = []
    version: int = 1


class OrderListResponse(BaseModel):
    items: list[OrderResponse]
    next_cursor: Optional[str] = None
    has_more: bool


class ShipmentEventResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    event_id: str
    shipment_id: str
    ts: datetime
    status: str
    location: str
    note: str


class ShipmentResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    shipment_id: str
    order_id: str
    carrier: str
    tracking_no: str
    status: str
    eta_at: Optional[datetime] = None
    last_event_at: Optional[datetime] = None
    script_id: str
    delayed: bool
    events: list[ShipmentEventResponse] = []


class RefundableItemResponse(BaseModel):
    item_id: str
    sku: str
    name: str
    requested_qty: int
    remaining_qty: int
    unit_price_paise: int
    line_paid_paise: int
    max_refundable_paise: int


class RefundableResponse(BaseModel):
    order_id: str
    items: list[RefundableItemResponse]
    max_refundable_paise: int


class RefundResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    refund_id: str
    order_id: str
    return_id: Optional[str] = None
    customer_id: str
    amount_paise: int
    method: str
    status: str
    gateway_ref: Optional[str] = None
    created_at: datetime
    updated_at: datetime


class CustomerAdminSummaryResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    customer_id: str
    full_name: str
    joined_at: datetime
    account_age: str
    account_age_days: int
    returns_30d: int
    refund_ratio_90d: float
    total_orders: int
    total_spend_paise: int
    total_refunded_paise: int


class ReturnItemCreate(BaseModel):
    item_id: str
    qty: int = 1
    condition_note: Optional[str] = None


class ReturnCreateRequest(BaseModel):
    items: list[ReturnItemCreate]
    reason_code: str
    reason_text: str
    resolution: str = "refund"  # refund or store_credit


class ReturnItemResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    return_id: str
    item_id: str
    qty: int
    condition_note: Optional[str] = None
    status: str


class ReturnResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    return_id: str
    order_id: str
    customer_id: str
    status: str
    reason_code: str
    reason_text: str
    resolution: str
    requested_via: str = "chat"
    approved_by: Optional[str] = None
    created_at: datetime
    updated_at: datetime
    version: int = 1
    items: list[ReturnItemResponse] = []


class ReturnTransitionRequest(BaseModel):
    to: str
    reason: Optional[str] = None


class ReturnInspectRequest(BaseModel):
    result: Optional[str] = None  # "ok" or "failed"
    to: Optional[str] = None  # "inspected_ok" or "inspection_failed"
    note: Optional[str] = None

