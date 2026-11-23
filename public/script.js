const form = document.getElementById('search-form');
const searchBtn = document.getElementById('search-btn');
const statusDiv = document.getElementById('status');
const table = document.getElementById('results-table');
const rows = document.getElementById('results');
const sortSelect = document.getElementById('sort');
const filterInput = document.getElementById('filter');
const phoneOnly = document.getElementById('phone-only');

let currentPlaces = [];

sortSelect.addEventListener('change', showPlaces);
filterInput.addEventListener('input', showPlaces);
phoneOnly.addEventListener('change', showPlaces);


form.addEventListener('submit', async (event) => {
    event.preventDefault();
    await searchPlaces();
});

async function searchPlaces(){
    const params = new URLSearchParams({
        area: document.getElementById('area').value.trim(),
        category: document.getElementById('category').value,
        radius: document.getElementById('radius').value,
    });

    try {
        const response = await fetch(`/api/places?${params}`);
        const data = await response.json();
        console.log(data);
    } catch (error) {
        console.error('Error fetching search results:', error);
    }
}