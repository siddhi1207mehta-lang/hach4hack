import 'dotenv/config';
import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { randomUUID, createHash } from 'crypto';
import { User, Order, Return, Counter } from './models.js';

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

const clean = ({ _id, __v, idempotencyKey, payloadHash, ...rest }) => rest;

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

// Role check: sirf allowed roles ko andar aane do, baaki ko 403
const requireRole = (...roles) => (req, res, next) => {
    if (!roles.includes(req.user.role)) {
        return fail(req, res, 403, 'forbidden', 'You do not have access to this');
    }
    next();
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
    const order = await Order.findOne({
        orderId: req.params.id,
        customerId: req.user.customer_id,
    }).lean();
    if (!order || !order.shipment) return fail(req, res, 404, 'not_found', 'Order not found');

    const s = order.shipment;
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

// ---------- RETURNS (customer) ----------
const REASON_CODES = ['defective', 'wrong_item', 'not_as_described', 'damaged_in_transit', 'changed_mind'];

const nextReturnId = async () => {
    const c = await Counter.findOneAndUpdate(
        { _id: 'return' },
        { $inc: { seq: 1 } },
        { upsert: true, new: true }
    );
    return `RET-${1000 + c.seq}`;
};

app.post('/api/v1/orders/:id/returns', requireAuth, requireRole('customer'), async (req, res) => {
    // 1. Idempotency-Key zaroori hai
    const key = req.get('Idempotency-Key');
    if (!key || key.length > 100) {
        return fail(req, res, 400, 'validation_error', 'Idempotency-Key header is required');
    }

    // 2. Ownership: doosre ka order = same 404
    const order = await Order.findOne({
        orderId: req.params.id,
        customerId: req.user.customer_id,
    }).lean();
    if (!order) return fail(req, res, 404, 'not_found', 'Order not found');

    // 3. Input check (reasonText sirf data hai, kabhi execute nahi hota)
    const { itemId, qty, reasonCode, reasonText = '', resolution = 'refund' } = req.body || {};
    if (!REASON_CODES.includes(reasonCode)) {
        return fail(req, res, 400, 'validation_error', 'Invalid reasonCode', { allowed: REASON_CODES });
    }
    if (!['refund', 'store_credit'].includes(resolution)) {
        return fail(req, res, 400, 'validation_error', 'Invalid resolution');
    }
    if (typeof reasonText !== 'string' || reasonText.length > 500) {
        return fail(req, res, 400, 'validation_error', 'reasonText must be text up to 500 characters');
    }
    const item = order.items.find((i) => i.itemId === itemId);
    if (!item) return fail(req, res, 400, 'validation_error', 'Item not in this order');
    if (!Number.isInteger(qty) || qty < 1 || qty > item.qty) {
        return fail(req, res, 400, 'validation_error', `qty must be a whole number from 1 to ${item.qty}`);
    }

    // 4. Idempotency: same key + same data = purana jawab, alag data = error
    const payloadHash = createHash('sha256')
        .update(JSON.stringify({ o: order.orderId, itemId, qty, reasonCode, reasonText, resolution }))
        .digest('hex');
    const existing = await Return.findOne({ customerId: req.user.customer_id, idempotencyKey: key }).lean();
    if (existing) {
        if (existing.payloadHash !== payloadHash) {
            return fail(req, res, 409, 'idempotency_mismatch', 'This key was already used with different data');
        }
        return res.status(200).json(clean(existing));
    }

    // 5. Sirf delivered order ka return ho sakta hai
    if (order.status !== 'delivered') {
        return fail(req, res, 409, 'invalid_state', 'Only delivered orders can be returned');
    }

    // 6. Banao. Duplicate ko database ka unique index rokta hai.
    try {
        const doc = await Return.create({
            returnId: await nextReturnId(),
            orderId: order.orderId,
            customerId: req.user.customer_id,
            itemId, qty, reasonCode, reasonText, resolution,
            idempotencyKey: key,
            payloadHash,
        });
        res.status(201).json(clean(doc.toObject()));
    } catch (e) {
        if (e.code === 11000) {
            // Kisi aur ne usi key se ya usi item par abhi return bana diya
            if (e.keyPattern && e.keyPattern.idempotencyKey) {
                const again = await Return.findOne({ customerId: req.user.customer_id, idempotencyKey: key }).lean();
                if (again && again.payloadHash === payloadHash) return res.status(200).json(clean(again));
                return fail(req, res, 409, 'idempotency_mismatch', 'This key was already used with different data');
            }
            return fail(req, res, 409, 'duplicate', 'This item already has an active return');
        }
        throw e;
    }
});

app.get('/api/v1/returns', requireAuth, requireRole('customer'), async (req, res) => {
    const list = await Return.find({ customerId: req.user.customer_id }).sort({ createdAt: -1 }).limit(50).lean();
    res.json({ items: list.map(clean) });
});

app.get('/api/v1/returns/:id', requireAuth, requireRole('customer'), async (req, res) => {
    // Doosre ka return = same 404
    const r = await Return.findOne({ returnId: req.params.id, customerId: req.user.customer_id }).lean();
    if (!r) return fail(req, res, 404, 'not_found', 'Return not found');
    res.json(clean(r));
});

// Customer sirf tab cancel kar sakta hai jab seller ne abhi approve nahi kiya
app.post('/api/v1/returns/:id/cancel', requireAuth, requireRole('customer'), async (req, res) => {
    // Status check aur badlav EK hi operation mein (race se bachne ke liye)
    const r = await Return.findOneAndUpdate(
        { returnId: req.params.id, customerId: req.user.customer_id, status: 'requested' },
        { $set: { status: 'cancelled' }, $inc: { version: 1 } },
        { new: true }
    ).lean();
    if (r) return res.json(clean(r));
    const exists = await Return.exists({ returnId: req.params.id, customerId: req.user.customer_id });
    if (!exists) return fail(req, res, 404, 'not_found', 'Return not found');
    return fail(req, res, 409, 'invalid_state', 'Only a requested return can be cancelled');
});

// ---------- SELLER (admin) ROUTES ----------
app.get('/api/v1/admin/orders', requireAuth, requireRole('seller_owner', 'seller_staff'), async (req, res) => {
    const filter = {};
    if (req.query.status) filter.status = String(req.query.status);
    const orders = await Order.find(filter).sort({ createdAt: -1 }).limit(100).lean();
    res.json({ items: orders.map(({ _id, __v, ...o }) => o) });
});

app.get('/api/v1/admin/orders/:id', requireAuth, requireRole('seller_owner', 'seller_staff'), async (req, res) => {
    const order = await Order.findOne({ orderId: req.params.id }).lean();
    if (!order) return fail(req, res, 404, 'not_found', 'Order not found');
    const { _id, __v, ...o } = order;
    res.json(o);
});

app.get('/api/v1/admin/returns', requireAuth, requireRole('seller_owner', 'seller_staff'), async (req, res) => {
    const filter = {};
    if (req.query.status) filter.status = String(req.query.status);
    const list = await Return.find(filter).sort({ createdAt: -1 }).limit(100).lean();
    res.json({ items: list.map(clean) });
});

// Ye catch-all HAMESHA sabse last mein (saare routes ke neeche)
app.use((req, res) => fail(req, res, 404, 'not_found', 'Route not found'));

await mongoose.connect(process.env.MONGO_URI);
// Unique indexes pehle ban jayein, tabhi duplicate-rule pakka lagta hai
await Promise.all([Return.init(), Counter.init()]);
console.log('MongoDB connected');
app.listen(process.env.PORT, () =>
    console.log(`store-api running on http://localhost:${process.env.PORT}`)
);