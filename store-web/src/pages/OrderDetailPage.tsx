import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import {
  AlertCircle,
  ArrowLeft,
  Calendar,
  Clock,
  HelpCircle,
  MapPin,
  Package,
  RotateCcw,
  ShieldAlert,
  Truck,
} from "lucide-react";
import { apiClient } from "../api/client";
import type { paths } from "../api/schema";
import { formatISTWithRelative } from "../utils/date";
import { formatMoney } from "../utils/money";

type OrderDetail = paths["/api/v1/orders/{order_id}"]["get"]["responses"][200]["content"]["application/json"];
type ShipmentDetail = paths["/api/v1/orders/{order_id}/shipment"]["get"]["responses"][200]["content"]["application/json"];

export function OrderDetailPage() {
  const { orderId } = useParams<{ orderId: string }>();

  const [order, setOrder] = useState<OrderDetail | null>(null);
  const [shipment, setShipment] = useState<ShipmentDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadOrder() {
      if (!orderId) return;
      setLoading(true);
      setError(null);
      setNotFound(false);

      try {
        const { data: ordData, error: ordError, response: ordRes } = await apiClient.GET(
          "/api/v1/orders/{order_id}",
          {
            params: {
              path: { order_id: orderId },
            },
          },
        );

        if (ordRes?.status === 404 || ordError) {
          setNotFound(true);
          return;
        }

        if (ordData) {
          setOrder(ordData);

          // Fetch shipment timeline
          try {
            const { data: shpData } = await apiClient.GET(
              "/api/v1/orders/{order_id}/shipment",
              {
                params: {
                  path: { order_id: orderId },
                },
              },
            );
            if (shpData) {
              setShipment(shpData);
            }
          } catch {
            // Shipment might not exist yet for placed orders
          }
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load order details");
      } finally {
        setLoading(false);
      }
    }

    loadOrder();
  }, [orderId]);

  // Loading skeleton
  if (loading) {
    return (
      <div className="max-w-4xl mx-auto py-10 px-4 sm:px-6 space-y-6 animate-pulse">
        <div className="h-6 w-32 bg-slate-200 rounded"></div>
        <div className="bg-white rounded-2xl border border-slate-200 p-8 space-y-4">
          <div className="h-8 w-48 bg-slate-200 rounded"></div>
          <div className="h-4 w-64 bg-slate-100 rounded"></div>
          <div className="h-40 bg-slate-50 rounded-xl"></div>
        </div>
      </div>
    );
  }

  // Uniform 404 Order Not Found Page
  if (notFound) {
    return (
      <div className="max-w-md mx-auto py-16 px-4 text-center">
        <div className="bg-white rounded-2xl border border-slate-200 p-8 shadow-sm space-y-4">
          <div className="h-16 w-16 rounded-full bg-red-50 text-red-500 flex items-center justify-center mx-auto">
            <Package className="h-8 w-8" />
          </div>
          <h1 className="text-xl font-bold text-navy-900">Order not found</h1>
          <p className="text-xs sm:text-sm text-slate-500">
            The order you requested (<span className="font-mono font-semibold">{orderId}</span>) does not exist or you do not have permission to view it.
          </p>
          <div className="pt-2">
            <Link
              to="/orders"
              className="inline-flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-semibold shadow-sm transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>Back to My Orders</span>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="max-w-md mx-auto py-16 px-4 text-center">
        <div className="bg-white rounded-2xl border border-slate-200 p-8 space-y-4">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto" />
          <h2 className="text-lg font-bold text-navy-900">Error Loading Order</h2>
          <p className="text-xs text-slate-500">{error || "Something went wrong"}</p>
          <Link
            to="/orders"
            className="inline-block text-xs text-teal-600 font-semibold hover:underline"
          >
            &larr; Return to orders list
          </Link>
        </div>
      </div>
    );
  }

  const scrollToShipment = () => {
    document.getElementById("shipment-section")?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <div className="max-w-4xl mx-auto py-8 px-4 sm:px-6 space-y-6">
      {/* Back button */}
      <div>
        <Link
          to="/orders"
          className="inline-flex items-center space-x-1.5 text-xs font-semibold text-slate-500 hover:text-navy-900 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Back to My Orders</span>
        </Link>
      </div>

      {/* Order Header Card */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 space-y-6 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b border-slate-100 pb-5 gap-4">
          <div>
            <div className="flex items-center space-x-3">
              <h1 className="text-xl sm:text-2xl font-bold font-mono text-navy-900">
                {order.order_id}
              </h1>
              <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-teal-50 text-teal-800 border border-teal-200">
                {order.status}
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-1 flex items-center space-x-1.5">
              <Calendar className="h-3.5 w-3.5 text-slate-400" />
              <span>Placed {formatISTWithRelative(order.placed_at, true)}</span>
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center space-x-2">
            <button
              onClick={scrollToShipment}
              className="inline-flex items-center space-x-1.5 px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition-colors"
            >
              <Truck className="h-4 w-4 text-teal-600" />
              <span>Track</span>
            </button>

            <button
              disabled
              title="Returns will be enabled in Stage 7"
              className="inline-flex items-center space-x-1.5 px-3.5 py-2 rounded-xl bg-slate-100 text-slate-400 text-xs font-semibold cursor-not-allowed opacity-60"
            >
              <RotateCcw className="h-4 w-4" />
              <span>Return (Disabled)</span>
            </button>

            <button
              onClick={() => {
                // Focus or open chat widget
                const btn = document.querySelector<HTMLButtonElement>("button[aria-label='Open SellerShield Assistant chat']");
                btn?.click();
              }}
              className="inline-flex items-center space-x-1.5 px-3.5 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-semibold shadow-sm transition-colors"
            >
              <HelpCircle className="h-4 w-4" />
              <span>Ask Support</span>
            </button>
          </div>
        </div>

        {/* Items Breakdown Table */}
        <div className="space-y-3">
          <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
            Order Items ({order.items.length})
          </h2>

          <div className="divide-y divide-slate-100 border border-slate-100 rounded-xl overflow-hidden bg-slate-50/50">
            {order.items.map((item) => (
              <div
                key={item.item_id}
                className="p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 text-xs sm:text-sm"
              >
                <div className="space-y-1">
                  <div className="font-semibold text-navy-900">{item.name_snapshot}</div>
                  <div className="text-[11px] text-slate-400 flex items-center space-x-2">
                    <span>SKU: {item.sku}</span>
                    <span>&bull;</span>
                    <span className="capitalize">{item.category_snapshot}</span>
                    <span>&bull;</span>
                    <span>Qty: {item.qty}</span>
                  </div>
                </div>

                <div className="sm:text-right space-y-0.5">
                  <div className="font-bold text-navy-900">
                    {formatMoney(item.line_paid_paise)}
                  </div>
                  {item.discount_alloc_paise > 0 && (
                    <div className="text-[11px] text-emerald-600">
                      Saved {formatMoney(item.discount_alloc_paise)}
                    </div>
                  )}
                  <div className="text-[11px] text-slate-400">
                    {formatMoney(item.unit_price_paise)} each
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Price Summary Breakdown */}
        <div className="border-t border-slate-100 pt-4 flex flex-col sm:items-end">
          <div className="w-full sm:w-72 space-y-2 text-xs sm:text-sm text-slate-600">
            <div className="flex justify-between">
              <span>Subtotal</span>
              <span className="font-medium text-slate-900">{formatMoney(order.subtotal_paise)}</span>
            </div>
            {order.discount_paise > 0 && (
              <div className="flex justify-between text-emerald-600">
                <span>Discount Allocated</span>
                <span>-{formatMoney(order.discount_paise)}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span>Shipping Fee</span>
              <span>{order.shipping_fee_paise === 0 ? "FREE" : formatMoney(order.shipping_fee_paise)}</span>
            </div>
            <div className="flex justify-between border-t border-slate-200 pt-2 text-base font-bold text-navy-900">
              <span>Total Paid</span>
              <span>{formatMoney(order.total_paise)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Shipment Timeline Section */}
      <div id="shipment-section" className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 space-y-6 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b border-slate-100 pb-4 gap-2">
          <div className="flex items-center space-x-2">
            <Truck className="h-5 w-5 text-teal-600" />
            <h2 className="text-lg font-bold text-navy-900">Shipment Timeline</h2>
          </div>

          {shipment?.delayed && (
            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-900 border border-amber-300">
              <ShieldAlert className="h-3.5 w-3.5 mr-1 text-amber-600" />
              Delayed Shipment Notice
            </span>
          )}
        </div>

        {shipment ? (
          <div className="space-y-6">
            {/* Shipment meta */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-200 text-xs">
              <div>
                <span className="text-slate-400 block font-semibold uppercase tracking-wider">
                  Carrier
                </span>
                <span className="font-bold text-navy-900 text-sm mt-0.5 block">
                  {shipment.carrier}
                </span>
              </div>

              <div>
                <span className="text-slate-400 block font-semibold uppercase tracking-wider">
                  Tracking Number
                </span>
                <span className="font-mono font-bold text-navy-900 text-sm mt-0.5 block">
                  {shipment.tracking_no}
                </span>
              </div>

              <div>
                <span className="text-slate-400 block font-semibold uppercase tracking-wider">
                  Estimated Delivery
                </span>
                <span className="font-bold text-navy-900 text-sm mt-0.5 block">
                  {shipment.eta_at ? formatISTWithRelative(shipment.eta_at, false) : "Pending"}
                </span>
              </div>
            </div>

            {/* Events Timeline */}
            <div className="relative pl-6 space-y-6 border-l-2 border-slate-200 ml-3">
              {shipment.events.map((ev, idx) => (
                <div key={ev.event_id} className="relative group">
                  {/* Timeline bullet icon */}
                  <div
                    className={`absolute -left-[31px] top-0.5 h-4 w-4 rounded-full border-2 bg-white flex items-center justify-center ${
                      idx === shipment.events.length - 1
                        ? "border-teal-600 text-teal-600"
                        : "border-slate-300"
                    }`}
                  >
                    {idx === shipment.events.length - 1 && (
                      <div className="h-1.5 w-1.5 rounded-full bg-teal-600"></div>
                    )}
                  </div>

                  <div className="space-y-1">
                    <div className="flex items-center space-x-2 text-xs text-slate-500">
                      <Clock className="h-3.5 w-3.5 text-slate-400" />
                      <span>{formatISTWithRelative(ev.ts, true)}</span>
                    </div>

                    <div className="text-sm font-semibold text-navy-900 flex items-center space-x-2">
                      <span>{ev.note}</span>
                      <span className="capitalize px-2 py-0.5 rounded bg-slate-100 text-slate-600 text-[10px]">
                        {ev.status.replace("_", " ")}
                      </span>
                    </div>

                    <div className="text-xs text-slate-500 flex items-center space-x-1">
                      <MapPin className="h-3.5 w-3.5 text-slate-400" />
                      <span>{ev.location}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="text-center py-8 text-xs text-slate-500">
            Shipment label has not yet been generated for this order.
          </div>
        )}
      </div>
    </div>
  );
}

