const form = document.getElementById('search-form');
const searchBtn = document.getElementById('search-btn');

form.addEventListener('submit', async (event) => {
    event.preventDefault();
    await searchPlaces();
});

