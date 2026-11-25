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


function formatDistance(metres){
    if (metres == null) return '-';
    return metres < 1000 ? `${Math.round(metres)} m` : `${(metres/1000).toFixed(1)} km`;
}

// sort search results
function showPlaces(){
    rows.replaceChildren();

    const text = filterInput.value.trim().toLowerCase();
    const places = currentPlaces.filter((prop) =>
        (prop.name || '').toLowerCase().includes(text) && (!phoneOnly.checked || prop.phone)
    );

    if (sortSelect.value == 'name'){
        places.sort((a,b) => (a.name || '').localeCompare(b.name || ''));
        } else {
            places.sort((a,b) => a.distance - b.distance);
    }

    table.hidden = places.length === 0;

    // add google location link
    for (const place of places){
        const mapLink = document.createElement('a');
        mapLink.href = `https://www.google.com/maps/dir/?api=1&destination=${place.lat},${place.lon}`;
        mapLink.target = '_blank';
        mapLink.rel = 'noopener';
        mapLink.textContent = "Open in Maps";
        mapLink.className = 'map-btn';
        
        const cells = [
            place.name || 'Unnamed place',
            place.address || '-',
            formatDistance(place.distance),
            place.phone || '-',
            mapLink,
        ];

        const row = document.createElement('tr');
        for (const content of cells){
            const cell = document.createElement('td');
            cell.append(content);
            row.append(cell);
        }
        rows.append(row);
    }
}