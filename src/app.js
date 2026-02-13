const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const productRoutes = require('./routes/product.routes');
const comboRoutes = require('./routes/combo.routes');
const emailRoutes = require('./routes/email.routes');
const authRoutes = require('./routes/auth.routes');
const discountRoutes = require('./routes/discount.routes');
const orderRoutes = require('./routes/order.routes');
const settingsRoutes = require('./routes/settings.routes');
const supplierRoutes = require('./routes/supplier.routes');
const reportRoutes = require('./routes/report.routes');
const errorHandler = require('./middlewares/errorHandler');
const connectDB = require('./config/db');

dotenv.config();
// Conectar a la base de datos inmediatamente
connectDB();
Burbank

const app = express();

// Middlewares
app.use(cors({
    origin: process.env.CORS_ORIGIN || '*'
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health Check
app.get('/health', (req, res) => {
    res.json({ status: 'UP', timestamp: new Date() });
});

// Routes
app.use('/api/products', productRoutes);
app.use('/api/combos', comboRoutes);
app.use('/api/emails', emailRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/discounts', discountRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/suppliers', supplierRoutes);
app.use('/api/reports', reportRoutes);

// Error Handling Middleware
app.use(errorHandler);

module.exports = app;
