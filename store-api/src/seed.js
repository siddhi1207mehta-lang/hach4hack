import 'dotenv/config';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import { User, Order } from './models.js';

await mongoose.connect(process.env.MONGO_URI);
await User.deleteMany({});
await Order.deleteMany({});

const hash = await bcrypt.hash('Demo@12345', 12);
await User.insertMany([
    { email: 'aarav.mehta@example.test', passwordHash: hash, role: 'customer', customerId: 'C001', name: 'Aarav Mehta' },
    { email: 'diya.nair@example.test', passwordHash: hash, role: 'customer', customerId: 'C002', name: 'Diya Nair' },
    { email: 'priya.sharma@nestkart.test', passwordHash: hash, role: 'seller_owner', name: 'Priya Sharma' },
]);

await Order.insertMany([
    {
        orderId: 'ORD-1048', customerId: 'C001', status: 'in_transit', totalPaise: 89900,
        items: [{ itemId: 'I1', name: 'Wireless Earbuds', qty: 1, linePaidPaise: 89900 }]
    },
    {
        orderId: 'ORD-1042', customerId: 'C001', status: 'delivered', totalPaise: 249900,
        items: [{ itemId: 'I2', name: 'Cookware Set', qty: 1, linePaidPaise: 249900 }]
    },
    {
        orderId: 'ORD-2040', customerId: 'C002', status: 'delivered', totalPaise: 100000,
        items: [{ itemId: 'I3', name: 'Steel Bottle', qty: 2, linePaidPaise: 100000 }]
    },
]);

console.log('Seed done');
await mongoose.disconnect();