require('dotenv').config();
const express = require('express');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;
const API_KEY = process.env.GEOAPIFY_KEY;

const cache = new Map();
const CACHE_TTL = 60 * 60 * 1000; // 1 hour in milliseconds

app.use(express.static(path.join(__dirname, 'public')));


app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});



app.listen(PORT, () => {
  console.log(`Nearby Essentials running on http://localhost:${PORT}`);
});
