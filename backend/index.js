const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

app.get('/', (req, res) => {
  res.json({ success: true, data: { message: 'DealFlow360 backend running' } });
});

const pool = require('./config/db');

app.get('/api/health', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT 1 + 1 AS result');
    res.json({ success: true, data: { db: 'connected', result: rows[0].result } });
  } catch (err) {
    res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: err.message } });
  }
});

const { DealStatus } = require('./config/enums');

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));