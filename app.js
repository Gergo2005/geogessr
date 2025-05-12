// Magyar GeoGuessr - Fő JavaScript

let map;
let panorama;
let targetLocation;
let playerMarker;

function initMenu() {
    // Kattintásra beállítjuk a körszámot
    document.querySelectorAll('.round-choice').forEach(button => {
        button.addEventListener('click', function() {
            maxRounds = parseInt(this.getAttribute('data-rounds'));
            document.getElementById('start-game').disabled = false; // Engedélyezzük a játék indítást
            
            // Töröljük az összes gombon a 'selected' osztályt
            document.querySelectorAll('.round-choice').forEach(btn => {
                btn.classList.remove('selected');
            });

            // Hozzáadjuk a kiválasztott gombhoz a 'selected' osztályt
            this.classList.add('selected');
        });
    });

    // Budapest vagy Magyarország választás
    document.querySelectorAll('.location-choice').forEach(button => {
        button.addEventListener('click', function() {
            if (this.getAttribute('data-location') === 'budapest') {
                locationChoice = 'budapest'; // Budapest választás
            } else {
                locationChoice = 'magyarország'; // Magyarország választás
            }
            document.querySelectorAll('.location-choice').forEach(btn => {
                btn.classList.remove('selected');
            });
            this.classList.add('selected'); // Választott gomb stílusa
        });
    });
}

function initGame() {
    // Véletlenszerű helyszín Magyarországon
    targetLocation = getRandomLocation();

    // Street View beállítása
    const streetViewContainer = document.getElementById("street-view");
    panorama = new google.maps.StreetViewPanorama(streetViewContainer, {
        position: targetLocation,
        pov: { heading: 0, pitch: 0 },
        zoom: 1,
    });

    // Ellenőrizzük, hogy a Street View betöltődött-e
    google.maps.event.addListener(panorama, 'status_changed', function () {
        if (panorama.getStatus() !== 'OK') {
            console.warn("Nincs Street View ezen a helyen, új hely generálása...");
            targetLocation = getRandomLocation();
            panorama.setPosition(targetLocation);
        }
    });

    // Térkép beállítása és biztosítása, hogy betöltődik
    const mapContainer = document.getElementById("map");
    map = new google.maps.Map(mapContainer, {
        center: { lat: 47.1625, lng: 19.5033 }, // Magyarország középpontja
        zoom: 6,
        restriction: {
            latLngBounds: {
                north: 48.5,
                south: 45.7,
                west: 16.0,
                east: 22.9,
            },
            strictBounds: true,
        },
    });

    // Marker elhelyezése a játékos tippjéhez
    map.addListener("click", (event) => {
        placeMarker(event.latLng);
    });

    // Tipp gomb kezelése
    document.getElementById("submit-guess").addEventListener("click", checkGuess);

    // Következő kör gomb kezelése
    document.getElementById("next-round").addEventListener("click", nextRound);
}

function getRandomLocation() {
    const minLat = 45.74;
    const maxLat = 48.58;
    const minLng = 16.11;
    const maxLng = 22.90;
    
    const lat = Math.random() * (maxLat - minLat) + minLat;
    const lng = Math.random() * (maxLng - minLng) + minLng;
    
    return { lat, lng };
}

function placeMarker(location) {
    // Ellenőrzés, hogy a tipp Magyarország határain belül van-e
    if (
        location.lat() < 45.74 || location.lat() > 48.58 ||
        location.lng() < 16.11 || location.lng() > 22.90
    ) {
        alert("Csak Magyarországon belül tippelhetsz!");
        return;
    }

    if (playerMarker) playerMarker.setMap(null);
    playerMarker = new google.maps.Marker({
        position: location,
        map: map,
    });
}

function checkGuess() {
    if (!playerMarker) {
        alert("Kérlek, helyezz el egy tippet a térképen!");
        return;
    }

    const playerPos = playerMarker.getPosition();
    const distance = calculateDistance(playerPos, targetLocation);
    displayResults(distance);
}

function calculateDistance(pos1, pos2) {
    const R = 6371; // A Föld sugara kilométerben
    const dLat = deg2rad(pos2.lat - pos1.lat());
    const dLng = deg2rad(pos2.lng - pos1.lng());
    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(deg2rad(pos1.lat())) * Math.cos(deg2rad(pos2.lat)) *
        Math.sin(dLng / 2) * Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
}

function deg2rad(deg) {
    return deg * (Math.PI / 180);
}

function displayResults(distance) {
    const resultsSection = document.getElementById("results");
    resultsSection.style.display = "block";

    const score = Math.max(0, Math.round(5000 - distance * 10)); // Pontszámítás
    document.getElementById("score").textContent = `Távolság: ${distance.toFixed(2)} km. Pontszám: ${score}`;
}

function nextRound() {
    location.reload(); // Újratöltjük az oldalt a következő körhöz
}

window.onload = initGame;
