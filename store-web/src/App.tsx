import { useEffect, useState } from "react";
import { BrowserRouter, Link, Route, Routes } from "react-router-dom";
import { Clock as ClockIcon, ShieldCheck, ShoppingBag, Store, User } from "lucide-react";
import { apiClient } from "./api/client";
import type { paths } from "./api/schema";

type ClockResponse = paths["/api/v1/clock"]["get"]["responses"][200]["content"]["application/json"];

export function ClockPage() {
  const [clockData, setClockData] = useState<ClockResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchClock() {
      try {
        const { data, error: apiError } = await apiClient.GET("/api/v1/clock");
        if (apiError) {
          setError(typeof apiError === "string" ? apiError : "Failed to fetch clock data");
        } else if (data) {
          setClockData(data);
        }
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : "Network error");
      } finally {
        setLoading(false);
      }
    }

    fetchClock();
  }, []);

  return (
    <div className="max-w-3xl mx-auto py-12 px-4 sm:px-6">
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="bg-navy-900 text-white p-6 sm:p-8 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">NestKart Playground</h1>
            <p className="text-teal-100 text-sm mt-1">Stage 2 — Web Skeleton & Typed Contract</p>
          </div>
          <div className="h-12 w-12 rounded-lg bg-teal-600/30 flex items-center justify-center border border-teal-500/40">
            <ClockIcon className="h-6 w-6 text-teal-100" />
          </div>
        </div>

        <div className="p-6 sm:p-8 space-y-6">
          <div className="border border-slate-100 rounded-lg p-5 bg-slate-50">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-500 mb-4">
              Live Store Clock (via /api/v1/clock)
            </h2>

            {loading && (
              <div className="flex items-center space-x-3 text-slate-600 animate-pulse py-4">
                <div className="h-4 w-4 rounded-full bg-teal-500"></div>
                <span className="text-sm">Connecting to Store API...</span>
              </div>
            )}

            {error && (
              <div className="rounded-lg bg-red-50 border border-red-200 p-4 text-sm text-red-700">
                <p className="font-medium">Error loading clock</p>
                <p className="mt-1 text-xs text-red-600">{error}</p>
              </div>
            )}

            {clockData && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="bg-white p-4 rounded-lg border border-slate-200">
                  <span className="text-xs font-medium text-slate-400">Current UTC Time</span>
                  <p className="text-lg font-mono font-semibold text-navy-900 mt-1" data-testid="now-utc">
                    {clockData.now_utc}
                  </p>
                </div>
                <div className="bg-white p-4 rounded-lg border border-slate-200">
                  <span className="text-xs font-medium text-slate-400">Clock Mode</span>
                  <div className="mt-1 flex items-center space-x-2">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-teal-100 text-teal-800" data-testid="clock-mode">
                      {clockData.mode}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-center">
            <div className="p-4 rounded-lg bg-slate-50 border border-slate-200">
              <span className="text-xs text-slate-500">API Port</span>
              <p className="font-semibold text-slate-800 mt-1">8000</p>
            </div>
            <div className="p-4 rounded-lg bg-slate-50 border border-slate-200">
              <span className="text-xs text-slate-500">Agent Port</span>
              <p className="font-semibold text-slate-800 mt-1">8001</p>
            </div>
            <div className="p-4 rounded-lg bg-slate-50 border border-slate-200">
              <span className="text-xs text-slate-500">Web Port</span>
              <p className="font-semibold text-slate-800 mt-1">5173</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export function LoginPage() {
  return (
    <div className="max-w-md mx-auto py-16 px-4">
      <div className="bg-white p-8 rounded-xl border border-slate-200 shadow-sm text-center">
        <div className="h-12 w-12 rounded-full bg-navy-100 text-navy-800 flex items-center justify-center mx-auto mb-4">
          <User className="h-6 w-6" />
        </div>
        <h1 className="text-xl font-bold text-navy-900">Login Placeholder</h1>
        <p className="text-sm text-slate-500 mt-2">Authentication flows will be built in Stage 3.</p>
        <Link to="/" className="inline-block mt-6 text-sm text-teal-600 hover:text-teal-700 font-medium">
          &larr; Back to Home
        </Link>
      </div>
    </div>
  );
}

export function SellerPage() {
  return (
    <div className="max-w-2xl mx-auto py-16 px-4">
      <div className="bg-navy-950 text-white p-8 rounded-xl border border-navy-800 shadow-sm text-center">
        <div className="h-12 w-12 rounded-full bg-teal-500/20 text-teal-400 flex items-center justify-center mx-auto mb-4">
          <Store className="h-6 w-6" />
        </div>
        <h1 className="text-xl font-bold">Seller Console Placeholder</h1>
        <p className="text-sm text-slate-400 mt-2">Seller management dashboards will be built in Stage 13.</p>
        <Link to="/" className="inline-block mt-6 text-sm text-teal-400 hover:text-teal-300 font-medium">
          &larr; Back to Home
        </Link>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <div className="min-h-screen flex flex-col bg-slate-50">
        <header className="bg-white border-b border-slate-200 sticky top-0 z-10">
          <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
            <Link to="/" className="flex items-center space-x-2 font-bold text-navy-900 text-lg">
              <ShoppingBag className="h-5 w-5 text-teal-600" />
              <span>NestKart</span>
            </Link>

            <nav className="flex items-center space-x-6 text-sm font-medium">
              <Link to="/" className="text-slate-600 hover:text-navy-900 transition-colors">
                Customer Home
              </Link>
              <Link to="/login" className="text-slate-600 hover:text-navy-900 transition-colors">
                Login
              </Link>
              <Link to="/seller" className="text-slate-600 hover:text-navy-900 transition-colors flex items-center space-x-1">
                <ShieldCheck className="h-4 w-4 text-teal-600" />
                <span>Seller Console</span>
              </Link>
            </nav>
          </div>
        </header>

        <main className="flex-1">
          <Routes>
            <Route path="/" element={<ClockPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/seller" element={<SellerPage />} />
          </Routes>
        </main>

        <footer className="bg-white border-t border-slate-200 py-6 text-center text-xs text-slate-400">
          NestKart Playground &bull; Simulated Environment &bull; Stage 2
        </footer>
      </div>
    </BrowserRouter>
  );
}

