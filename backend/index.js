const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

const pool = require('./config/db');
const { DealStatus } = require('./config/enums');
const authRoutes = require('./routes/auth');
const dealRoutes = require('./routes/deals');
const customerRoutes = require('./routes/customers');
const productRoutes = require('./routes/products');
const approvalRoutes = require('./routes/approvals');
const warehouseRoutes = require('./routes/warehouses');
const billingRoutes = require('./routes/billing');

app.get('/', (req, res) => {
  res.json({ success: true, data: { message: 'DealFlow360 backend running' } });
});

app.get('/api/health', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT 1 + 1 AS result');
    res.json({ success: true, data: { db: 'connected', result: rows[0].result } });
  } catch (err) {
    res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: err.message } });
  }
});

app.use('/api/auth', authRoutes);
app.use('/api/deals', dealRoutes);
app.use('/api/customers', customerRoutes);
app.use('/api/products', productRoutes);
app.use('/api', approvalRoutes);
app.use('/api', warehouseRoutes);
app.use('/api', billingRoutes);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));