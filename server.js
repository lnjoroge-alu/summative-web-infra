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


app.get('/api/places', async (req,res) => {
    const {area, category, radius} = req.query;

    if (!area || !category || !radius){
        return res.status(400).json({errro: 'Please enter an area, category and radius'});  
    }

    const cacheKey = `${area.trim().toLowerCase()} | ${category} | ${radius}`;

    const cached = cache.get(cacheKey);
    if (cached && Date.now() - cached.time < CACHE_TIL){
        res.set('X-Cache', 'HIT');
        return res.json(cached.data);
    }
}
)



app.listen(PORT, () => {
  console.log(`Nearby Essentials running on http://localhost:${PORT}`);
});
