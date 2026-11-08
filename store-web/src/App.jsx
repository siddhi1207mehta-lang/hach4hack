import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Package, LogOut, Truck, CheckCircle2, Sparkles, Sun, Moon, ShoppingBag,
} from 'lucide-react';

const rupees = (paise) =>
  (paise / 100).toLocaleString('en-IN', { style: 'currency', currency: 'INR' });

const STATUS = {
  in_transit: { label: 'In transit', cls: 'bg-amber-400/15 text-amber-500', Icon: Truck },
  delivered: { label: 'Delivered', cls: 'bg-teal-400/15 text-teal-500', Icon: CheckCircle2 },
};

// Loading ke time dikhne wala skeleton card
function SkeletonCard() {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-5 animate-pulse">
      <div className="h-4 w-24 rounded bg-slate-500/30" />
      <div className="h-3 w-48 rounded bg-slate-500/20 mt-4" />
      <div className="h-6 w-28 rounded bg-slate-500/30 mt-4" />
    </div>
  );
}

export default function App() {
  // Token sirf memory (state) mein. localStorage mein kabhi nahi.
  const [token, setToken] = useState(null);
  const [name, setName] = useState('');
  const [orders, setOrders] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [dark, setDark] = useState(true);

  async function login(email) {
    setLoading(true); setError('');
    try {
      const r = await fetch('/api/v1/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password: 'Demo@12345' }),
      });
      const data = await r.json();
      if (!r.ok) throw new Error(data.error?.message || 'Login failed');
      setToken(data.access_token); setName(data.name);
      setOrdersLoading(true);
      const o = await fetch('/api/v1/orders', {
        headers: { Authorization: `Bearer ${data.access_token}` },
      });
      setOrders((await o.json()).items);
      setOrdersLoading(false);
    } catch (e) { setError(e.message); setOrdersLoading(false); }
    setLoading(false);
  }

  const bg = dark
    ? 'bg-[radial-gradient(ellipse_at_top,#12324a,#0b1220_60%)] text-white'
    : 'bg-[radial-gradient(ellipse_at_top,#d9f3f0,#f4f7fb_60%)] text-slate-900';
  const card = dark
    ? 'border-white/10 bg-white/5'
    : 'border-slate-200 bg-white shadow-sm';
  const muted = dark ? 'text-slate-400' : 'text-slate-500';

  const ThemeBtn = (
    <button onClick={() => setDark(!dark)} aria-label="Toggle theme"
      className={`rounded-full p-2 border ${dark ? 'border-white/15 hover:bg-white/10' : 'border-slate-300 hover:bg-slate-100'} transition`}>
      {dark ? <Sun size={18} /> : <Moon size={18} />}
    </button>
  );

  if (!token) {
    return (
      <div className={`min-h-screen grid place-items-center px-4 ${bg}`}>
        <div className="absolute top-4 right-4">{ThemeBtn}</div>
        <motion.div
          initial={{ opacity: 0, y: 24, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.5 }}
          className={`w-full max-w-md rounded-3xl border backdrop-blur-xl p-8 shadow-2xl ${card}`}>
          <div className="flex items-center gap-2 text-teal-400 mb-2">
            <Sparkles size={20} /> <span className="font-semibold tracking-wide">NestKart</span>
          </div>
          <h1 className="text-3xl font-bold">Welcome back</h1>
          <p className={`${muted} mt-1 mb-6`}>Demo login (SIMULATED store)</p>
          {error && <p className="mb-4 text-red-400 text-sm">{error}</p>}
          <motion.button whileTap={{ scale: 0.97 }} disabled={loading}
            onClick={() => login('aarav.mehta@example.test')}
            className="w-full rounded-xl bg-teal-400 hover:bg-teal-300 transition
              text-slate-900 font-semibold py-3 mb-3 disabled:opacity-50">
            {loading ? 'Logging in...' : 'Login as Aarav'}
          </motion.button>
          <motion.button whileTap={{ scale: 0.97 }} disabled={loading}
            onClick={() => login('diya.nair@example.test')}
            className={`w-full rounded-xl border transition py-3 disabled:opacity-50
              ${dark ? 'border-white/15 hover:bg-white/10' : 'border-slate-300 hover:bg-slate-100'}`}>
            Login as Diya
          </motion.button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen ${bg}`}>
      <header className="max-w-3xl mx-auto flex items-center justify-between px-4 py-6">
        <div className="flex items-center gap-3">
          <div className="rounded-2xl bg-teal-400/15 p-3 text-teal-400"><ShoppingBag size={22} /></div>
          <div>
            <p className={`${muted} text-sm`}>Hello,</p>
            <h1 className="text-2xl font-bold">{name}</h1>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {ThemeBtn}
          <button onClick={() => { setToken(null); setOrders([]); }}
            className={`flex items-center gap-2 ${muted} hover:opacity-80`}>
            <LogOut size={18} /> Logout
          </button>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 pb-16 space-y-4">
        <h2 className="flex items-center gap-2 text-lg font-semibold">
          <Package size={20} className="text-teal-400" /> My Orders
        </h2>

        {ordersLoading && [1, 2].map((n) => <SkeletonCard key={n} />)}
        {!ordersLoading && orders.length === 0 && <p className={muted}>No orders yet.</p>}

        <AnimatePresence>
          {!ordersLoading && orders.map((o, i) => {
            const s = STATUS[o.status] || STATUS.delivered;
            return (
              <motion.div key={o.orderId}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                whileHover={{ y: -4 }}
                className={`rounded-2xl border p-5 transition hover:border-teal-400/50 ${card}`}>
                <div className="flex items-center justify-between">
                  <span className="font-semibold">{o.orderId}</span>
                  <span className={`flex items-center gap-1 text-xs px-3 py-1 rounded-full ${s.cls}`}>
                    <s.Icon size={14} /> {s.label}
                  </span>
                </div>
                <p className={`${muted} text-sm mt-2`}>
                  {o.items.map((it) => `${it.name} x${it.qty}`).join(', ')}
                </p>
                <p className="text-xl font-bold mt-3">{rupees(o.totalPaise)}</p>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </main>
    </div>
  );
}