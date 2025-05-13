let map;
let panorama;
let targetLocation;
let playerMarker;

let totalScore = 0;
let currentRound = 0;
let maxRounds = 0;

let locationChoice = 'magyarország'; // Alapértelmezett: Magyarország

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

    // Játék indítása
    document.getElementById('start-game').addEventListener('click', startGame);
    
    // Képesség a kilépéshez
    document.getElementById('exit-game').addEventListener('click', function() {
        window.close(); // Bezárja az ablakot
    });
}

function startGame() {
    document.getElementById('menu').style.display = 'none'; // Elrejti a menüt
    document.getElementById('game').style.display = 'block'; // Megjeleníti a játékot
    totalScore = 0;
    currentRound = 1;
    document.getElementById("score-summary").textContent = `Pontszám: ${totalScore}`;
    initGame();
}

function initGame() {
    // Véletlenszerű helyszín
    targetLocation = getRandomLocation();

    const streetViewContainer = document.getElementById("street-view");
    panorama = new google.maps.StreetViewPanorama(streetViewContainer, {
        position: targetLocation,
        pov: { heading: 0, pitch: 0 },
        zoom: 1,
        disableDefaultUI: true, // UI elrejtése
    });

    google.maps.event.addListener(panorama, 'status_changed', function () {
        if (panorama.getStatus() !== 'OK') {
            console.warn("Nincs Street View, új hely...");
            targetLocation = getRandomLocation();
            panorama.setPosition(targetLocation);
        }
    });

    const mapContainer = document.getElementById("map");
    map = new google.maps.Map(mapContainer, {
        center: { lat: 47.1625, lng: 19.5033 },
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

    map.addListener("click", (event) => {
        placeMarker(event.latLng);
    });

    document.getElementById("submit-guess").addEventListener("click", checkGuess);
    document.getElementById("next-round").addEventListener("click", nextRound);
}

function getRandomLocation() {
    let lat, lng;
    
    if (locationChoice === 'budapest') {
        // Budapest koordináták
        const minLat = 47.42;
        const maxLat = 47.57;
        const minLng = 18.96;
        const maxLng = 19.15;

        lat = Math.random() * (maxLat - minLat) + minLat;
        lng = Math.random() * (maxLng - minLng) + minLng;
    } else {
        // Magyarország koordináták
        const minLat = 45.74;
        const maxLat = 48.58;
        const minLng = 16.11;
        const maxLng = 22.90;

        lat = Math.random() * (maxLat - minLat) + minLat;
        lng = Math.random() * (maxLng - minLng) + minLng;
    }

    return { lat, lng };
}

function placeMarker(location) {
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
    const score = Math.max(0, Math.round(5000 - distance * 10));
    totalScore += score;

    displayResults(distance, score);
}

function calculateDistance(pos1, pos2) {
    const R = 6371;
    const dLat = deg2rad(pos2.lat - pos1.lat());
    const dLng = deg2rad(pos2.lng - pos1.lng());
    const a =
        Math.sin(dLat / 2) ** 2 +
        Math.cos(deg2rad(pos1.lat())) * Math.cos(deg2rad(pos2.lat)) *
        Math.sin(dLng / 2) ** 2;
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
}

function deg2rad(deg) {
    return deg * (Math.PI / 180);
}

function displayResults(distance, score) {
    const resultsSection = document.getElementById("results");
    resultsSection.style.display = "block";

    const scoreText = `Távolság: ${distance.toFixed(2)} km. Ezen kör pontszáma: ${score}`;
    document.getElementById("score").textContent = scoreText;

    document.getElementById("score-summary").textContent = 
        `Pontszám: ${totalScore}`;

    if (currentRound === maxRounds) {
        document.getElementById("next-round").textContent = "Játék vége";
    }
}

function nextRound() {
    if (currentRound >= maxRounds) {
        alert(`Játék vége! Összesített pontszámod: ${totalScore}`);
        document.getElementById("next-round").disabled = true;
        return;
    }

    currentRound++;
    document.getElementById("results").style.display = "none";
    playerMarker?.setMap(null);
    playerMarker = null;

    initGame();
}

initMenu();
