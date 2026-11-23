require('dotenv').config();
const express = require('express');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;
const API_KEY = process.env.GEOAPIFY_KEY;

app.use(express.static(path.join(__dirname, 'public')));


app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});



app.listen(PORT, () => {
  console.log(`Nearby Essentials running on http://localhost:${PORT}`);
});
