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

export const User = mongoose.model('User', userSchema);
export const Order = mongoose.model('Order', orderSchema);