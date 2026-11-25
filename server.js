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
        return res.status(400).json({error: 'Please enter an area, category and radius'});  
    }

    const cacheKey = `${area.trim().toLowerCase()} | ${category} | ${radius}`;

    const cached = cache.get(cacheKey);
    if (cached && Date.now() - cached.time < CACHE_TTL){
        res.set('X-Cache', 'HIT');
        return res.json(cached.data);
    }

    try {
        // fetch data from API
        const geoParams = new URLSearchParams({text:area, limit: 1, format: 'json', apiKey: API_KEY});
        const geoResponse = await fetch(`https://api.geoapify.com/v1/geocode/search?${geoParams}`);

        if (!geoResponse.ok){
            return res.status(502).json({error: `Map service returned status ${geoResponse.status}`});
        }

        const geoData = await geoResponse.json();
        const location = geoData.results?.[0];
        if (!location){
            return res.status(404).json({error: "We couldn't find that area, try a nearby landmark or city"});
        }

        const placesParams = new URLSearchParams({
            categories: category,
            filter: `circle:${location.lon},${location.lat},${radius}`,
            bias: `proximity:${location.lon},${location.lat}`,
            limit: 20,
            apiKey: API_KEY
        })
        const placesResponse = await fetch(`https://api.geoapify.com/v2/places?${placesParams}`);
        if (!placesResponse.ok){
            return res.status(502).json({error: `Map service returned status ${placesResponse.status}`});
        }

        const placesData = await placesResponse.json();

        const places = placesData.features.map(({ properties: prop }) => ({
            name: prop.name,
            address: prop.formatted,
            distance: prop.distance,
            lat: prop.lat,
            lon:prop.lon,
            phone: prop.contact?.phone || prop.datasource?.raw?.phone || null,
        }));

        const data = {label: location.formatted, places};
        cache.set(cacheKey, {data, time: Date.now() });
        res.set('X-Cache', 'MISS');
        res.json(data);
        
    } catch (err){
        console.error(err);
        res.status(500).json({error: 'Could not reach map service'});
    }
});



app.listen(PORT, () => {
  console.log(`Nearby Essentials running on http://localhost:${PORT}`);
});
