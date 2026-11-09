import mongoose from 'mongoose';

// Paisa hamesha integer paise mein (Rs 1 = 100 paise). Kabhi float nahi.
const userSchema = new mongoose.Schema({
    email: { type: String, unique: true, required: true },
    passwordHash: { type: String, required: true },
    role: { type: String, enum: ['customer', 'seller_owner', 'seller_staff'], required: true },
    customerId: String,
    name: String,
});

const itemSchema = new mongoose.Schema({
    itemId: String,
    name: String,
    qty: Number,
    linePaidPaise: Number,
});

// Shipment ka ek event (jaise "Shipped", "In transit")
const eventSchema = new mongoose.Schema({
    status: String,
    location: String,
    note: String,
    at: Date,
}, { _id: false });

const shipmentSchema = new mongoose.Schema({
    carrier: String,
    trackingNumber: String,
    eta: Date,
    events: [eventSchema],
}, { _id: false });

const orderSchema = new mongoose.Schema({
    orderId: { type: String, unique: true, required: true },
    customerId: { type: String, required: true, index: true },
    status: { type: String, required: true },
    totalPaise: { type: Number, required: true },
    items: [itemSchema],
    shipment: shipmentSchema,
    createdAt: { type: Date, default: Date.now },
});

// ---------- RETURNS ----------
// In statuses mein return us item ko "block" karta hai (dobara return nahi ban sakta).
// rejected aur cancelled ke baad item dobara return ho sakta hai.
export const BLOCKING_STATUSES = ['requested', 'approved', 'received', 'completed'];

const returnSchema = new mongoose.Schema({
    returnId: { type: String, unique: true, required: true },
    orderId: { type: String, required: true, index: true },
    customerId: { type: String, required: true, index: true },
    itemId: { type: String, required: true },
    qty: { type: Number, required: true },
    reasonCode: { type: String, required: true },
    reasonText: { type: String, default: '' },
    resolution: { type: String, enum: ['refund', 'store_credit'], default: 'refund' },
    status: {
        type: String,
        enum: ['requested', 'approved', 'rejected', 'cancelled', 'received', 'completed'],
        default: 'requested',
    },
    idempotencyKey: { type: String, required: true },
    payloadHash: { type: String, required: true },
    version: { type: Number, default: 1 },
    createdAt: { type: Date, default: Date.now },
});

// Ek customer ki ek key sirf ek baar
returnSchema.index({ customerId: 1, idempotencyKey: 1 }, { unique: true });
// Ek order item par sirf EK blocking return (database khud rokta hai)
returnSchema.index(
    { orderId: 1, itemId: 1 },
    { unique: true, partialFilterExpression: { status: { $in: BLOCKING_STATUSES } } }
);

// RET-1001, RET-1002... ke liye counter
const counterSchema = new mongoose.Schema({ _id: String, seq: Number });

export const User = mongoose.model('User', userSchema);
export const Order = mongoose.model('Order', orderSchema);
export const Return = mongoose.model('Return', returnSchema);
export const Counter = mongoose.model('Counter', counterSchema);