const chatbotRoutes = require('./routes/chatbot');
const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());
app.use('/api/chatbot', chatbotRoutes);

const pool = require('./config/db');

const authRoutes = require('./routes/auth');
const dealRoutes = require('./routes/deals');
const customerRoutes = require('./routes/customers');
const productRoutes = require('./routes/products');
const approvalRoutes = require('./routes/approvals');

const warehouseRoutes = require('./routes/warehouses');
const billingRoutes = require('./routes/billing');
const negotiationRoutes = require('./routes/negotiations');
const reportRoutes = require('./routes/reports');
const evaluationRoutes = require('./routes/evaluation');
const customerPortalRoutes = require('./routes/customerPortal');
const dashboardRoutes = require('./routes/dashboard');


app.get('/', (req, res) => {
  res.json({
    success: true,
    data: {
      message: 'DealFlow360 backend running',
    },
  });
});

app.get('/api/health', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT 1 + 1 AS result');

    res.json({
      success: true,
      data: {
        db: 'connected',
        result: rows[0].result,
      },
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: err.message,
      },
    });
  }
});

app.use('/api/auth', authRoutes);
app.use('/api/deals', dealRoutes);
app.use('/api/customers', customerRoutes);
app.use('/api/products', productRoutes);
app.use('/api', approvalRoutes);
app.use('/api', warehouseRoutes);
app.use('/api', billingRoutes);
app.use('/api', negotiationRoutes);
app.use('/api/reports', reportRoutes);
app.use('/DealFlow360_Project_Report.pdf', reportRoutes);
app.use('/api/customer-portal', customerPortalRoutes);
app.use('/api/dashboard', dashboardRoutes);

// Intelligence evaluation route
// POST /api/deals/:id/evaluate
app.use('/api', evaluationRoutes);

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
