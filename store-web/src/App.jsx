import { useState } from 'react';
import { Package, LogOut, Truck, CheckCircle2, Sparkles } from 'lucide-react';

const rupees = (paise) =>
  (paise / 100).toLocaleString('en-IN', { style: 'currency', currency: 'INR' });

const STATUS = {
  in_transit: { label: 'In transit', cls: 'bg-amber-400/15 text-amber-300', Icon: Truck },
  delivered: { label: 'Delivered', cls: 'bg-teal-400/15 text-teal-300', Icon: CheckCircle2 },
};

export default function App() {
  // Token sirf memory (state) mein. localStorage mein kabhi nahi.
  const [token, setToken] = useState(null);
  const [name, setName] = useState('');
  const [orders, setOrders] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

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
      const o = await fetch('/api/v1/orders', {
        headers: { Authorization: `Bearer ${data.access_token}` },
      });
      setOrders((await o.json()).items);
    } catch (e) { setError(e.message); }
    setLoading(false);
  }

  if (!token) {
    return (
      <div className="min-h-screen grid place-items-center px-4
        bg-[radial-gradient(ellipse_at_top,#12324a,#0b1220_60%)]">
        <div className="w-full max-w-md rounded-3xl border border-white/10
          bg-white/5 backdrop-blur-xl p-8 shadow-2xl">
          <div className="flex items-center gap-2 text-teal-300 mb-2">
            <Sparkles size={20} /> <span className="font-semibold tracking-wide">NestKart</span>
          </div>
          <h1 className="text-3xl font-bold text-white">Welcome back</h1>
          <p className="text-slate-400 mt-1 mb-6">Demo login (SIMULATED store)</p>
          {error && <p className="mb-4 text-red-300 text-sm">{error}</p>}
          <button disabled={loading}
            onClick={() => login('aarav.mehta@example.test')}
            className="w-full rounded-xl bg-teal-400 hover:bg-teal-300 transition
              text-slate-900 font-semibold py-3 mb-3 disabled:opacity-50">
            {loading ? 'Logging in...' : 'Login as Aarav'}
          </button>
          <button disabled={loading}
            onClick={() => login('diya.nair@example.test')}
            className="w-full rounded-xl border border-white/15 text-white
              hover:bg-white/10 transition py-3 disabled:opacity-50">
            Login as Diya
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen text-white
      bg-[radial-gradient(ellipse_at_top,#12324a,#0b1220_60%)]">
      <header className="max-w-3xl mx-auto flex items-center justify-between px-4 py-6">
        <div>
          <p className="text-slate-400 text-sm">Hello,</p>
          <h1 className="text-2xl font-bold">{name}</h1>
        </div>
        <button onClick={() => { setToken(null); setOrders([]); }}
          className="flex items-center gap-2 text-slate-300 hover:text-white">
          <LogOut size={18} /> Logout
        </button>
      </header>

      <main className="max-w-3xl mx-auto px-4 pb-16 space-y-4">
        <h2 className="flex items-center gap-2 text-lg font-semibold">
          <Package size={20} className="text-teal-300" /> My Orders
        </h2>
        {orders.length === 0 && <p className="text-slate-400">No orders yet.</p>}
        {orders.map((o) => {
          const s = STATUS[o.status] || STATUS.delivered;
          return (
            <div key={o.orderId}
              className="rounded-2xl border border-white/10 bg-white/5 p-5
                hover:border-teal-300/40 hover:-translate-y-0.5 transition">
              <div className="flex items-center justify-between">
                <span className="font-semibold">{o.orderId}</span>
                <span className={`flex items-center gap-1 text-xs px-3 py-1 rounded-full ${s.cls}`}>
                  <s.Icon size={14} /> {s.label}
                </span>
              </div>
              <p className="text-slate-400 text-sm mt-2">
                {o.items.map((i) => `${i.name} x${i.qty}`).join(', ')}
              </p>
              <p className="text-xl font-bold mt-3">{rupees(o.totalPaise)}</p>
            </div>
          );
        })}
      </main>
    </div>
  );
}
