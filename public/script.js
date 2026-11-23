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

    statusDiv.textContent = 'Searching...';
    statusDiv.classList.remove('error');
    searchBtn.disabled = true;
    currentPlaces = [];
    showPlaces();

    try {
        const response = await fetch(`/api/places?${params}`);
        const data = await response.json();

        if (!response.ok){
            throw new Error(data.error || 'Something went wrong');
        }

        currentPlaces = data.places;

        statusDiv.textContent = currentPlaces.length
          ? `${currentPlaces.length} places found near ${data.label}`
          : 'Nothing found, try a bigger radius';


        showPlaces();
    } catch (err) {
        statusDiv.textContent = err instanceof TypeError
        ? 'Could not reach the server, please try again'
        : err.message;
        statusDiv.classList.add('error');
  } finally {
    searchBtn.disabled = false;
  }
}


function showPlaces(){
    return
}