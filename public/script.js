const form = document.getElementById('search-form');
const searchBtn = document.getElementById('search-btn');

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