import 'dotenv/config';
import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { randomUUID } from 'crypto';
import { User, Order } from './models.js';

const app = express();
app.use(helmet());
app.use(cors({ origin: process.env.CORS_ORIGINS.split(','), credentials: true }));
app.use(express.json({ limit: '1mb' }));

// Har request ko ek id do (debugging ke liye)
app.use((req, res, next) => {
    req.id = req.get('X-Request-ID') || randomUUID();
    res.set('X-Request-ID', req.id);
    next();
});

// Standard error format: {error:{code,message,request_id,details}}
const fail = (req, res, status, code, message, details = null) =>
    res.status(status).json({ error: { code, message, request_id: req.id, details } });

app.get('/healthz', (req, res) => res.json({ status: 'ok' }));

// ---------- AUTH ----------
const loginLimiter = rateLimit({ windowMs: 60_000, limit: 5 });

app.post('/api/v1/auth/login', loginLimiter, async (req, res) => {
    const { email, password } = req.body || {};
    const user = await User.findOne({ email: String(email || '').toLowerCase() });
    const ok = user && (await bcrypt.compare(String(password || ''), user.passwordHash));
    // Galat email aur galat password dono ka SAME message
    if (!ok) return fail(req, res, 401, 'invalid_credentials', 'Email or password is wrong');
    const token = jwt.sign(
        { sub: String(user._id), role: user.role, customer_id: user.customerId },
        process.env.JWT_SECRET,
        { expiresIn: '15m' }
    );
    res.json({ access_token: token, role: user.role, name: user.name });
});

const requireAuth = (req, res, next) => {
    const h = req.get('Authorization') || '';
    try {
        req.user = jwt.verify(h.replace('Bearer ', ''), process.env.JWT_SECRET);
        next();
    } catch {
        fail(req, res, 401, 'unauthorized', 'Please log in');
    }
};

app.get('/api/v1/auth/me', requireAuth, (req, res) =>
    res.json({ role: req.user.role, customer_id: req.user.customer_id })
);

// ---------- ORDERS (sirf apne orders) ----------
app.get('/api/v1/orders', requireAuth, async (req, res) => {
    const orders = await Order.find({ customerId: req.user.customer_id })
        .sort({ createdAt: -1 }).limit(50).lean();
    res.json({ items: orders.map(({ _id, __v, ...o }) => o) });
});

app.get('/api/v1/orders/:id', requireAuth, async (req, res) => {
    // Doosre ka order aur na-maujood order: DONO ka same 404 (kabhi 403 nahi)
    const order = await Order.findOne({
        orderId: req.params.id,
        customerId: req.user.customer_id,
    }).lean();
    if (!order) return fail(req, res, 404, 'not_found', 'Order not found');
    const { _id, __v, ...o } = order;
    res.json(o);
});

// ---------- SHIPMENT (sirf apne order ka) ----------
app.get('/api/v1/orders/:id/shipment', requireAuth, async (req, res) => {
    // Ownership wahi rule: doosre ka order ya na-maujood = same 404
    const order = await Order.findOne({
        orderId: req.params.id,
        customerId: req.user.customer_id,
    }).lean();
    if (!order || !order.shipment) return fail(req, res, 404, 'not_found', 'Order not found');

    const s = order.shipment;
    // delayed = ETA nikal gaya aur abhi delivered nahi hua
    const delayed = order.status !== 'delivered' && s.eta && new Date(s.eta) < new Date();
    res.json({
        orderId: order.orderId,
        status: order.status,
        carrier: s.carrier,
        trackingNumber: s.trackingNumber,
        eta: s.eta,
        delayed: Boolean(delayed),
        events: s.events,
        simulated: true,
    });
});

// Ye catch-all HAMESHA sabse last mein (saare routes ke neeche)
app.use((req, res) => fail(req, res, 404, 'not_found', 'Route not found'));

await mongoose.connect(process.env.MONGO_URI);
console.log('MongoDB connected');
app.listen(process.env.PORT, () =>
    console.log(`store-api running on http://localhost:${process.env.PORT}`)
);