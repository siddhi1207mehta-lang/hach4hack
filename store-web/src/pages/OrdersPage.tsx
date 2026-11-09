import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  AlertTriangle,
  ChevronRight,
  Package,
  RefreshCw,
  Search,
  Truck,
} from "lucide-react";
import { apiClient } from "../api/client";
import type { paths } from "../api/schema";
import { formatISTWithRelative } from "../utils/date";
import { formatMoney } from "../utils/money";

type OrderItem = paths["/api/v1/orders"]["get"]["responses"][200]["content"]["application/json"]["items"][0];

const STATUS_FILTERS = [
  { label: "All Orders", value: "" },
  { label: "In Transit", value: "shipped" },
  { label: "Delivered", value: "delivered" },
  { label: "Placed", value: "placed" },
  { label: "Cancelled", value: "cancelled" },
];

export function OrdersPage() {
  const [orders, setOrders] = useState<OrderItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedStatus, setSelectedStatus] = useState("");
  const [searchTerm, setSearchTerm] = useState("");

  const fetchOrders = async (status = selectedStatus, search = searchTerm) => {
    setLoading(true);
    setError(null);

    try {
      const queryParams: Record<string, string | number> = { limit: 50 };
      if (status) queryParams.status = status;
      if (search) queryParams.search = search;

      const { data, error: apiError } = await apiClient.GET("/api/v1/orders", {
        params: {
          query: queryParams,
        },
      });

      if (apiError) {
        setError("Failed to load your orders. Please try again.");
      } else if (data) {
        setOrders(data.items);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load orders");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders(selectedStatus, searchTerm);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedStatus]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchOrders(selectedStatus, searchTerm);
  };

  const getStatusChip = (status: string) => {
    switch (status.toLowerCase()) {
      case "delivered":
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800">
            Delivered
          </span>
        );
      case "shipped":
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-100 text-blue-800">
            In Transit
          </span>
        );
      case "placed":
      case "packed":
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-800">
            Processing
          </span>
        );
      case "cancelled":
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-700">
            Cancelled
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-700">
            {status}
          </span>
        );
    }
  };

  return (
    <div className="max-w-5xl mx-auto py-8 px-4 sm:px-6 space-y-6">
      {/* Page Title & Search */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-navy-900 tracking-tight">My Orders</h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Track shipments, review past purchases and manage returns
          </p>
        </div>

        <form onSubmit={handleSearchSubmit} className="relative w-full sm:w-72">
          <Search className="h-4 w-4 text-slate-400 absolute left-3 top-3" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by order ID or item..."
            className="w-full text-xs sm:text-sm pl-9 pr-4 py-2 rounded-xl border border-slate-300 focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500 transition-colors"
          />
        </form>
      </div>

      {/* Filter Chips */}
      <div className="flex items-center space-x-2 overflow-x-auto pb-1 scrollbar-none">
        {STATUS_FILTERS.map((f) => (
          <button
            key={f.value}
            onClick={() => setSelectedStatus(f.value)}
            className={`px-3.5 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors ${
              selectedStatus === f.value
                ? "bg-teal-600 text-white shadow-sm"
                : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200"
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Loading Skeleton State */}
      {loading && (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="bg-white rounded-2xl border border-slate-200 p-5 space-y-4 animate-pulse"
            >
              <div className="flex justify-between items-center">
                <div className="h-4 w-28 bg-slate-200 rounded"></div>
                <div className="h-6 w-20 bg-slate-200 rounded-full"></div>
              </div>
              <div className="space-y-2">
                <div className="h-4 w-48 bg-slate-100 rounded"></div>
                <div className="h-3 w-36 bg-slate-100 rounded"></div>
              </div>
              <div className="h-8 w-24 bg-slate-200 rounded"></div>
            </div>
          ))}
        </div>
      )}

      {/* Error State with Retry Button */}
      {error && !loading && (
        <div className="bg-red-50 border border-red-200 rounded-2xl p-6 text-center space-y-3">
          <AlertTriangle className="h-8 w-8 text-red-500 mx-auto" />
          <p className="text-sm font-semibold text-red-900">{error}</p>
          <button
            onClick={() => fetchOrders()}
            className="inline-flex items-center space-x-2 px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-semibold shadow-sm transition-colors"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            <span>Retry</span>
          </button>
        </div>
      )}

      {/* Empty State */}
      {!loading && !error && orders.length === 0 && (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center space-y-4">
          <div className="h-16 w-16 rounded-full bg-slate-50 text-slate-400 flex items-center justify-center mx-auto">
            <Package className="h-8 w-8" />
          </div>
          <div>
            <h3 className="text-base font-bold text-navy-900">No orders found</h3>
            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
              {searchTerm || selectedStatus
                ? "Try clearing your filters or search keywords to view other orders."
                : "You have not placed any orders yet."}
            </p>
          </div>
          {(searchTerm || selectedStatus) && (
            <button
              onClick={() => {
                setSelectedStatus("");
                setSearchTerm("");
                fetchOrders("", "");
              }}
              className="text-xs text-teal-600 hover:text-teal-700 font-semibold"
            >
              Clear filters
            </button>
          )}
        </div>
      )}

      {/* Orders List Cards */}
      {!loading && !error && orders.length > 0 && (
        <div className="space-y-4">
          {orders.map((order) => (
            <Link
              key={order.order_id}
              to={`/orders/${order.order_id}`}
              className="block bg-white rounded-2xl border border-slate-200 hover:border-teal-400 hover:shadow-md transition-all p-5 sm:p-6"
            >
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b border-slate-100 pb-4 gap-2">
                <div className="flex items-center space-x-3">
                  <span className="font-mono font-bold text-sm sm:text-base text-navy-900">
                    {order.order_id}
                  </span>
                  {getStatusChip(order.status)}
                </div>

                <div className="text-xs text-slate-500">
                  Placed {formatISTWithRelative(order.placed_at)}
                </div>
              </div>

              <div className="py-4 grid grid-cols-1 sm:grid-cols-3 gap-4 items-center">
                <div className="sm:col-span-2 space-y-1">
                  <p className="text-xs text-slate-400 uppercase tracking-wider font-semibold">
                    Items ({order.items.length})
                  </p>
                  <div className="text-xs sm:text-sm text-slate-700 font-medium line-clamp-2">
                    {order.items.map((it) => `${it.name_snapshot} (×${it.qty})`).join(", ")}
                  </div>
                </div>

                <div className="sm:text-right">
                  <span className="text-xs text-slate-400 block font-semibold uppercase tracking-wider">
                    Total Amount
                  </span>
                  <span className="text-base sm:text-lg font-bold text-navy-900">
                    {formatMoney(order.total_paise)}
                  </span>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-teal-600 font-semibold">
                <div className="flex items-center space-x-1.5 text-slate-600">
                  <Truck className="h-4 w-4 text-teal-600" />
                  <span>
                    {order.status === "shipped"
                      ? "In transit with SwiftShip"
                      : order.status === "delivered"
                      ? "Delivered successfully"
                      : "Order placed"}
                  </span>
                </div>

                <div className="flex items-center space-x-1">
                  <span>View Details</span>
                  <ChevronRight className="h-4 w-4" />
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

