import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Globe, LogOut, ShieldCheck } from "lucide-react";
import { useAuth } from "../context/AuthContext";

export function ProfilePage() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [language, setLanguage] = useState("English");

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  if (!user) return null;

  return (
    <div className="max-w-2xl mx-auto py-10 px-4 sm:px-6 space-y-6">
      <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 space-y-6 shadow-sm">
        <div className="flex items-center space-x-4 border-b border-slate-100 pb-6">
          <div className="h-16 w-16 rounded-2xl bg-teal-50 text-teal-700 flex items-center justify-center border border-teal-100 text-xl font-bold">
            {user.display_name?.charAt(0) || "U"}
          </div>
          <div>
            <h1 className="text-xl font-bold text-navy-900">{user.display_name}</h1>
            <p className="text-xs text-slate-500">{user.email}</p>
            <div className="flex items-center space-x-2 mt-1">
              <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-slate-100 text-slate-700 uppercase">
                {user.role}
              </span>
              {user.customer_id && (
                <span className="font-mono text-xs text-slate-400">
                  ID: {user.customer_id}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Preferences */}
        <div className="space-y-4">
          <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
            Account Preferences
          </h2>

          <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-200">
            <div className="flex items-center space-x-3">
              <Globe className="h-5 w-5 text-slate-400" />
              <div>
                <div className="text-sm font-semibold text-navy-900">Language Preference</div>
                <div className="text-xs text-slate-500">Choose your preferred support language</div>
              </div>
            </div>

            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
              className="text-xs font-medium bg-white border border-slate-300 rounded-lg px-3 py-1.5 focus:outline-none focus:border-teal-500"
            >
              <option value="English">English</option>
              <option value="Hindi">हिंदी (Hindi)</option>
              <option value="Tamil">தமிழ் (Tamil)</option>
            </select>
          </div>
        </div>

        {/* Session Security Details */}
        <div className="space-y-4">
          <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
            Security & Session
          </h2>

          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2 text-xs text-slate-600">
            <div className="flex items-center space-x-2 text-emerald-700 font-semibold">
              <ShieldCheck className="h-4 w-4" />
              <span>In-Memory Token Protected (Zero LocalStorage)</span>
            </div>
            <p className="text-slate-500 text-[11px] leading-relaxed">
              Your session access token is strictly held in volatile application memory. Refresh credentials rotate every session via an httpOnly SameSite=Lax cookie.
            </p>
          </div>
        </div>

        {/* Sign Out Action */}
        <div className="border-t border-slate-100 pt-6">
          <button
            onClick={handleLogout}
            className="w-full sm:w-auto inline-flex items-center justify-center space-x-2 px-5 py-2.5 rounded-xl bg-red-50 hover:bg-red-100 text-red-700 text-xs font-semibold border border-red-200 transition-colors"
          >
            <LogOut className="h-4 w-4" />
            <span>Sign Out</span>
          </button>
        </div>
      </div>
    </div>
  );
}

