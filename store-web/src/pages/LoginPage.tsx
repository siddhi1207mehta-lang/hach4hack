import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { AlertCircle, Lock, Mail, ShieldAlert, Sparkles, User } from "lucide-react";
import { useAuth } from "../context/AuthContext";

const DEMO_CUSTOMERS = [
  { name: "Aarav Mehta", email: "aarav.mehta@example.test", role: "Customer (C001)" },
  { name: "Diya Nair", email: "diya.nair@example.test", role: "Customer (C002)" },
  { name: "Rohan Das", email: "rohan.das@example.test", role: "Customer (C003)" },
  { name: "Meera Iyer", email: "meera.iyer@example.test", role: "Customer (C004)" },
  { name: "Kabir Joshi", email: "kabir.joshi@example.test", role: "Customer (C005)" },
];

const DEMO_SELLERS = [
  { name: "Priya Sharma", email: "priya.sharma@nestkart.test", role: "Seller Owner (S001)" },
  { name: "Kiran Rao", email: "kiran.rao@nestkart.test", role: "Seller Staff (S002)" },
];

export function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Read demo mode feature flag from env
  const isDemoMode = import.meta.env.VITE_DEMO_MODE === "true" || import.meta.env.DEV;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    try {
      const res = await login(email, password);
      if (res.success) {
        navigate("/orders");
      } else {
        setError(res.error || "Login failed");
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleQuickLogin = async (demoEmail: string) => {
    setError(null);
    setEmail(demoEmail);
    setPassword("Demo@12345");
    setSubmitting(true);

    try {
      const res = await login(demoEmail, "Demo@12345");
      if (res.success) {
        if (demoEmail.endsWith("@nestkart.test")) {
          navigate("/seller");
        } else {
          navigate("/orders");
        }
      } else {
        setError(res.error || "Login failed");
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-md mx-auto py-12 px-4 sm:px-6">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 sm:p-8 space-y-6">
        <div className="text-center space-y-2">
          <div className="h-12 w-12 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center mx-auto mb-2 border border-teal-100">
            <User className="h-6 w-6" />
          </div>
          <h1 className="text-2xl font-bold text-navy-900 tracking-tight">Welcome Back</h1>
          <p className="text-xs sm:text-sm text-slate-500">Sign in to your NestKart account</p>
        </div>

        {error && (
          <div className="rounded-xl bg-red-50 border border-red-200 p-4 flex items-start space-x-3 text-red-800 text-xs sm:text-sm">
            <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="font-semibold">{error}</p>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Email Address
            </label>
            <div className="relative">
              <Mail className="h-4 w-4 text-slate-400 absolute left-3 top-3.5" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.test"
                className="w-full text-sm pl-10 pr-4 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500 transition-colors"
                disabled={submitting}
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Password
            </label>
            <div className="relative">
              <Lock className="h-4 w-4 text-slate-400 absolute left-3 top-3.5" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full text-sm pl-10 pr-4 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500 transition-colors"
                disabled={submitting}
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full py-2.5 px-4 rounded-xl bg-teal-600 hover:bg-teal-700 disabled:bg-slate-300 text-white text-sm font-semibold shadow-sm transition-colors flex items-center justify-center space-x-2"
          >
            {submitting ? (
              <span>Signing in...</span>
            ) : (
              <span>Sign In</span>
            )}
          </button>
        </form>

        {/* DEMO MODE Quick-Login Buttons */}
        {isDemoMode && (
          <div className="pt-4 border-t border-slate-100 space-y-4">
            <div className="flex items-center space-x-1.5 text-xs font-bold uppercase tracking-wider text-teal-700">
              <Sparkles className="h-3.5 w-3.5 text-teal-600" />
              <span>Demo Quick-Login</span>
            </div>

            <div className="space-y-2">
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                Customers
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                {DEMO_CUSTOMERS.map((cust) => (
                  <button
                    key={cust.email}
                    onClick={() => handleQuickLogin(cust.email)}
                    disabled={submitting}
                    className="text-left px-3 py-2 rounded-lg bg-slate-50 hover:bg-teal-50 border border-slate-200 hover:border-teal-300 text-xs text-slate-700 transition-colors disabled:opacity-50"
                  >
                    <div className="font-semibold text-navy-900">{cust.name}</div>
                    <div className="text-[10px] text-slate-400">{cust.role}</div>
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                Sellers
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                {DEMO_SELLERS.map((seller) => (
                  <button
                    key={seller.email}
                    onClick={() => handleQuickLogin(seller.email)}
                    disabled={submitting}
                    className="text-left px-3 py-2 rounded-lg bg-slate-50 hover:bg-navy-50 border border-slate-200 hover:border-navy-300 text-xs text-slate-700 transition-colors disabled:opacity-50"
                  >
                    <div className="font-semibold text-navy-900">{seller.name}</div>
                    <div className="text-[10px] text-slate-400">{seller.role}</div>
                  </button>
                ))}
              </div>
            </div>

            <div className="rounded-lg bg-slate-100 p-2.5 text-[11px] text-slate-500 flex items-center space-x-2">
              <ShieldAlert className="h-4 w-4 text-slate-400 flex-shrink-0" />
              <span>Password for all demo users is: <code className="font-mono text-slate-800">Demo@12345</code></span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

