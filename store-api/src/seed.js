import 'dotenv/config';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import { User, Order, Return, Counter } from './models.js';

await mongoose.connect(process.env.MONGO_URI);
await User.deleteMany({});
await Order.deleteMany({});
await Return.deleteMany({});
await Counter.deleteMany({});

const hash = await bcrypt.hash('Demo@12345', 12);
await User.insertMany([
    { email: 'aarav.mehta@example.test', passwordHash: hash, role: 'customer', customerId: 'C001', name: 'Aarav Mehta' },
    { email: 'diya.nair@example.test', passwordHash: hash, role: 'customer', customerId: 'C002', name: 'Diya Nair' },
    { email: 'priya.sharma@nestkart.test', passwordHash: hash, role: 'seller_owner', name: 'Priya Sharma' },
]);

const hoursAgo = (h) => new Date(Date.now() - h * 3600 * 1000);
const hoursFromNow = (h) => new Date(Date.now() + h * 3600 * 1000);

await Order.insertMany([
    {
        orderId: 'ORD-1048', customerId: 'C001', status: 'in_transit', totalPaise: 89900,
        items: [{ itemId: 'I1', name: 'Wireless Earbuds', qty: 1, linePaidPaise: 89900 }],
        shipment: {
            carrier: 'SwiftShip', trackingNumber: 'SS1000000048', eta: hoursFromNow(24),
            events: [
                { status: 'Order placed', location: 'NestKart', note: 'Seller ne order accept kiya', at: hoursAgo(48) },
                { status: 'Shipped', location: 'Mumbai Hub', note: 'Courier ko diya gaya', at: hoursAgo(30) },
                { status: 'In transit', location: 'Nagpur Hub', note: 'Raste mein hai', at: hoursAgo(8) },
            ],
        },
    },
    {
        orderId: 'ORD-1042', customerId: 'C001', status: 'delivered', totalPaise: 249900,
        items: [{ itemId: 'I2', name: 'Cookware Set', qty: 1, linePaidPaise: 249900 }],
        shipment: {
            carrier: 'SwiftShip', trackingNumber: 'SS1000000042', eta: hoursAgo(24),
            events: [
                { status: 'Order placed', location: 'NestKart', note: 'Seller ne order accept kiya', at: hoursAgo(120) },
                { status: 'Shipped', location: 'Pune Hub', note: 'Courier ko diya gaya', at: hoursAgo(100) },
                { status: 'Delivered', location: 'Amravati', note: 'Customer ko mil gaya', at: hoursAgo(26) },
            ],
        },
    },
    {
        orderId: 'ORD-2040', customerId: 'C002', status: 'delivered', totalPaise: 100000,
        items: [{ itemId: 'I3', name: 'Steel Bottle', qty: 2, linePaidPaise: 100000 }],
        shipment: {
            carrier: 'SwiftShip', trackingNumber: 'SS1000000040', eta: hoursAgo(48),
            events: [
                { status: 'Order placed', location: 'NestKart', note: 'Seller ne order accept kiya', at: hoursAgo(144) },
                { status: 'Delivered', location: 'Nagpur', note: 'Customer ko mil gaya', at: hoursAgo(50) },
            ],
        },
    },
]);

console.log('Seed done');
await mongoose.disconnect();