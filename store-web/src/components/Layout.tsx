import { Component, type ErrorInfo, type ReactNode } from "react";
import { Link, Navigate, useLocation, useNavigate } from "react-router-dom";
import {
  AlertTriangle,
  LogOut,
  Package,
  RefreshCw,
  ShoppingBag,
  Store,
  User as UserIcon,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { ChatWidget } from "./ChatWidget";

// ---------------------------------------------------------------------------
// Error Boundary
// ---------------------------------------------------------------------------

interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

export class RouteErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  public override state: ErrorBoundaryState = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  public override componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught route error:", error, errorInfo);
  }

  public override render() {
    if (this.state.hasError) {
      return (
        <div className="max-w-md mx-auto py-16 px-4 text-center">
          <div className="bg-white rounded-2xl border border-slate-200 p-8 shadow-sm space-y-4">
            <AlertTriangle className="h-12 w-12 text-red-500 mx-auto" />
            <h2 className="text-lg font-bold text-navy-900">Something went wrong</h2>
            <p className="text-xs text-slate-500">
              {this.state.error?.message || "An unexpected error occurred."}
            </p>
            <button
              onClick={() => this.setState({ hasError: false, error: null })}
              className="inline-flex items-center space-x-2 px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-semibold shadow-sm transition-colors"
            >
              <RefreshCw className="h-3.5 w-3.5" />
              <span>Try again</span>
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

// ---------------------------------------------------------------------------
// Protected Route / Role Guard
// ---------------------------------------------------------------------------

export function ProtectedRoute({
  children,
  allowedRoles,
}: {
  children: ReactNode;
  allowedRoles?: string[];
}) {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-[50vh] flex items-center justify-center">
        <div className="h-8 w-8 rounded-full border-2 border-teal-600 border-t-transparent animate-spin"></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return (
      <div className="max-w-md mx-auto py-16 px-4 text-center">
        <div className="bg-white rounded-2xl border border-slate-200 p-8 shadow-sm space-y-4">
          <AlertTriangle className="h-12 w-12 text-amber-500 mx-auto" />
          <h2 className="text-lg font-bold text-navy-900">Access Denied</h2>
          <p className="text-xs text-slate-500">
            Your account ({user.role}) does not have permission to access this page.
          </p>
          <Link
            to={user.role.startsWith("seller") ? "/seller" : "/orders"}
            className="inline-block text-xs text-teal-600 font-semibold"
          >
            Go to your dashboard &rarr;
          </Link>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}

// ---------------------------------------------------------------------------
// 404 Page
// ---------------------------------------------------------------------------

export function NotFoundPage() {
  return (
    <div className="max-w-md mx-auto py-16 px-4 text-center">
      <div className="bg-white rounded-2xl border border-slate-200 p-8 shadow-sm space-y-4">
        <div className="h-16 w-16 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
          <Package className="h-8 w-8" />
        </div>
        <h1 className="text-2xl font-bold text-navy-900">404</h1>
        <p className="text-sm text-slate-500">The page you were looking for does not exist.</p>
        <Link
          to="/orders"
          className="inline-block text-xs font-semibold text-teal-600 hover:underline"
        >
          &larr; Back to My Orders
        </Link>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main Layout
// ---------------------------------------------------------------------------

export function Layout({ children }: { children: ReactNode }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-20">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link to="/orders" className="flex items-center space-x-2 font-bold text-navy-900 text-lg">
            <div className="h-8 w-8 rounded-lg bg-teal-600 flex items-center justify-center text-white">
              <ShoppingBag className="h-5 w-5" />
            </div>
            <span>NestKart</span>
          </Link>

          <nav className="flex items-center space-x-4 sm:space-x-6 text-xs sm:text-sm font-medium">
            {user ? (
              <>
                {user.role === "customer" && (
                  <Link
                    to="/orders"
                    className="text-slate-600 hover:text-navy-900 transition-colors"
                  >
                    My Orders
                  </Link>
                )}

                {user.role.startsWith("seller") && (
                  <Link
                    to="/seller"
                    className="text-slate-600 hover:text-navy-900 transition-colors flex items-center space-x-1"
                  >
                    <Store className="h-4 w-4 text-teal-600" />
                    <span>Seller Console</span>
                  </Link>
                )}

                <Link
                  to="/profile"
                  className="text-slate-600 hover:text-navy-900 transition-colors flex items-center space-x-1"
                >
                  <UserIcon className="h-4 w-4" />
                  <span className="hidden sm:inline">{user.display_name}</span>
                </Link>

                <button
                  onClick={handleLogout}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                  title="Sign out"
                  aria-label="Sign out"
                >
                  <LogOut className="h-4 w-4" />
                </button>
              </>
            ) : (
              <Link
                to="/login"
                className="px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-semibold transition-colors shadow-sm"
              >
                Sign In
              </Link>
            )}
          </nav>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1">
        <RouteErrorBoundary>{children}</RouteErrorBoundary>
      </main>

      {/* Floating Chat Widget on all customer views */}
      <ChatWidget />

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 py-6 text-center text-xs text-slate-400">
        NestKart Playground &bull; Simulated Environment &bull; Stage 6
      </footer>
    </div>
  );
}