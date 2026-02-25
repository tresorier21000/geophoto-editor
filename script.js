/* === GeoPhoto Editor - Main Script === */

let originalImageDataUrl;
let originalFileName = "image";
let map;
let marker;

// DOM Elements
const latInput = document.getElementById("lat");
const lngInput = document.getElementById("lng");
const errorMsg = document.getElementById("error-message");
const errorText = document.getElementById("error-text");
const imageInput = document.getElementById("imageInput");
const dropZone = document.getElementById("dropZone");
const contentSection = document.getElementById("contentSection");
const preview = document.getElementById("preview");
const filenameInput = document.getElementById("filenameInput");

// New DOM Elements for EXIF Info
const exifSection = document.getElementById("exifSection");
const exifDataGrid = document.getElementById("exifDataGrid");
const datetimeInput = document.getElementById("datetimeInput");

// --- Event Listeners ---

// Click upload
dropZone.addEventListener("click", () => imageInput.click());

// Search on Enter key
const searchInput = document.getElementById('searchLocation');
if (searchInput) {
  searchInput.addEventListener('keypress', function (e) {
    if (e.key === 'Enter') {
      e.preventDefault();
      searchCity();
    }
  });
}

// Drag & Drop
dropZone.addEventListener("dragover", e => {
  e.preventDefault();
  dropZone.classList.add("dragover");
});

dropZone.addEventListener("dragleave", () => dropZone.classList.remove("dragover"));

dropZone.addEventListener("drop", e => {
  e.preventDefault();
  dropZone.classList.remove("dragover");
  const file = e.dataTransfer.files[0];
  if (file && file.type === "image/jpeg") {
    handleFile(file);
  } else {
    alert("Veuillez sélectionner une image au format JPEG. D'autres formats ne supportent pas cette modification EXIF spécifique.");
  }
});

// File input selection
imageInput.addEventListener("change", e => {
  const file = e.target.files[0];
  if (file) handleFile(file);
});

// --- Core Functions ---

/**
 * Handles the selected/dropped file
 * @param {File} file - The image file object
 */
function handleFile(file) {
  // Store filename without extension
  originalFileName = file.name.replace(/\.[^/.]+$/, "");
  filenameInput.value = originalFileName;

  const reader = new FileReader();

  reader.onload = function (event) {
    originalImageDataUrl = event.target.result;

    // Set preview source
    preview.src = originalImageDataUrl;

    // Smooth reveal of preview image
    preview.onload = () => {
      preview.style.opacity = "1";
    };

    // Show main content grid
    contentSection.style.display = "grid";

    // Re-render map to fix Leaflet visibility bug inside hidden container
    setTimeout(() => {
      if (map) map.invalidateSize();
    }, 400);

    processEXIF();
  };

  reader.readAsDataURL(file);
}

/**
 * Extracts and processes EXIF data (GPS and general) using piexifjs
 */
function processEXIF() {
  try {
    const exifObj = piexif.load(originalImageDataUrl);

    // Process General EXIF Data
    renderExifData(exifObj);

    // Process GPS Data
    const gps = exifObj["GPS"];
    if (gps && gps[piexif.GPSIFD.GPSLatitude] && gps[piexif.GPSIFD.GPSLongitude]) {
      // Image has GPS data
      const lat = dmsToDecimal(gps[piexif.GPSIFD.GPSLatitude], gps[piexif.GPSIFD.GPSLatitudeRef]);
      const lng = dmsToDecimal(gps[piexif.GPSIFD.GPSLongitude], gps[piexif.GPSIFD.GPSLongitudeRef]);

      latInput.value = lat;
      lngInput.value = lng;
      updateMap(lat, lng);

      errorMsg.style.display = "none";
      errorMsg.style.animation = "none";
    } else {
      resetToDefaultMap();
      showError("L'image ne contient pas de coordonnées GPS existantes. Cliquez sur la carte pour en définir de nouvelles.");
    }
  } catch (err) {
    console.error("Erreur de lecture EXIF:", err);
    resetToDefaultMap();
    exifSection.style.display = "none";
    showError("Erreur lors de la lecture des métadonnées EXIF de cette image.");
  }
}

/**
 * Extracts, formats, and displays EXIF metadata
 */
function renderExifData(exifObj) {
  let hasData = false;
  exifDataGrid.innerHTML = ''; // Clear previous data
  datetimeInput.value = '';

  const ifd0 = exifObj["0th"] || {};
  const exif = exifObj["Exif"] || {};

  // Helper to format piexif rational arrays [num, den]
  const formatRational = (arr) => arr && arr[1] ? arr[0] / arr[1] : null;

  const metadata = [];

  // Marque et Modèle
  if (ifd0[piexif.ImageIFD.Make]) {
    metadata.push({ label: "Marque", value: ifd0[piexif.ImageIFD.Make].trim() });
    hasData = true;
  }
  if (ifd0[piexif.ImageIFD.Model]) {
    metadata.push({ label: "Modèle", value: ifd0[piexif.ImageIFD.Model].trim() });
  }

  // Ouverture (F-Number)
  if (exif[piexif.ExifIFD.FNumber]) {
    const fNum = formatRational(exif[piexif.ExifIFD.FNumber]);
    if (fNum) metadata.push({ label: "Ouverture", value: `f/${fNum}` });
  }

  // Temps de pose (Exposure Time)
  if (exif[piexif.ExifIFD.ExposureTime]) {
    const exp = exif[piexif.ExifIFD.ExposureTime];
    if (exp && exp[1]) {
      const val = exp[0] / exp[1];
      const displayVal = val < 1 ? `1/${Math.round(1 / val)}s` : `${val}s`;
      metadata.push({ label: "Vitesse", value: displayVal });
    }
  }

  // ISO
  if (exif[piexif.ExifIFD.ISOSpeedRatings]) {
    metadata.push({ label: "ISO", value: exif[piexif.ExifIFD.ISOSpeedRatings] });
    hasData = true;
  }

  // Focale (Focal Length)
  if (exif[piexif.ExifIFD.FocalLength]) {
    const focal = formatRational(exif[piexif.ExifIFD.FocalLength]);
    if (focal) metadata.push({ label: "Focale", value: `${focal}mm` });
  }

  // Dimensions
  const width = exif[piexif.ExifIFD.PixelXDimension] || ifd0[piexif.ImageIFD.ImageWidth];
  const height = exif[piexif.ExifIFD.PixelYDimension] || ifd0[piexif.ImageIFD.ImageLength];
  if (width && height) {
    metadata.push({ label: "Dimensions", value: `${width} x ${height} px` });
  }

  // Date et Heure
  let dateTimeStr = exif[piexif.ExifIFD.DateTimeOriginal] || ifd0[piexif.ImageIFD.DateTime];
  if (dateTimeStr) {
    // EXIF format: "YYYY:MM:DD HH:MM:SS" -> needs "YYYY-MM-DDTHH:MM:SS" for input field
    const dStr = dateTimeStr.replace(/:/, '-').replace(/:/, '-').replace(' ', 'T');
    datetimeInput.value = dStr;
    hasData = true;
  }

  if (hasData) {
    exifSection.style.display = "flex";
    metadata.forEach(item => {
      exifDataGrid.innerHTML += `
        <div class="exif-item">
          <span class="exif-label">${item.label}</span>
          <span class="exif-value">${item.value}</span>
        </div>
      `;
    });
  } else {
    exifSection.style.display = "none";
  }
}

/**
 * Shows an error or warning message
 * @param {string} msg - The message to display
 */
function showError(msg) {
  errorText.textContent = msg;
  errorMsg.style.display = "flex";
  // Trigger reflow to restart animation
  void errorMsg.offsetWidth;
  errorMsg.style.animation = "fadeIn 0.4s ease-out";
}

/**
 * Initializes or updates the Map to default values when no GPS is found
 */
function resetToDefaultMap() {
  latInput.value = "";
  lngInput.value = "";
  // Center map on Paris by default when empty
  updateMap(48.8566, 2.3522);
  // Optionally remote marker if you don't want to assume Paris
  if (marker) {
    map.removeLayer(marker);
    marker = null;
  }
}

/**
 * Initializes or updates the Leaflet Map
 * @param {number} lat - Latitude
 * @param {number} lng - Longitude
 */
function updateMap(lat, lng) {
  if (!map) {
    // Initialize map
    map = L.map('map', {
      zoomControl: false // Move zoom control for custom styling
    }).setView([lat, lng], 13);

    // Add custom styled zoom control to bottom right
    L.control.zoom({ position: 'bottomright' }).addTo(map);

    // Original OpenStreetMap tile layer for clearer details
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      maxZoom: 19
    }).addTo(map);

    // Handle map clicks
    map.on('click', function (e) {
      const clickedLat = e.latlng.lat;
      const clickedLng = e.latlng.lng;

      latInput.value = clickedLat.toFixed(6);
      lngInput.value = clickedLng.toFixed(6);

      updateMarker(clickedLat, clickedLng);
      errorMsg.style.display = "none";
    });
  } else {
    // Update existing map view
    map.setView([lat, lng], 13);
  }

  updateMarker(lat, lng);
}

/**
 * Updates or creates the map marker
 */
function updateMarker(lat, lng) {
  if (!marker && map) {
    marker = L.marker([lat, lng], { draggable: false }).addTo(map);
  } else if (marker) {
    marker.setLatLng([lat, lng]);
  }
}

// --- GPS Math Utilities ---

/**
 * Converts Degrees Minutes Seconds format to Decimal Degrees
 */
function dmsToDecimal(dms, ref) {
  if (!dms || dms.length < 3) return 0;

  const [deg, min, sec] = dms.map(([num, den]) => (den !== 0 ? num / den : 0));
  let dec = deg + min / 60 + sec / 3600;

  // South and West are negative coordinates
  if (ref === "S" || ref === "W") dec = -dec;

  return dec.toFixed(6);
}

/**
 * Converts Decimal Degrees to Degrees Minutes Seconds array for piexif
 */
function toDMS(dec) {
  const abs = Math.abs(dec);
  const deg = Math.floor(abs);
  const min = Math.floor((abs - deg) * 60);
  const sec = ((abs - deg - min / 60) * 3600).toFixed(2);

  // piexif requires rational format [numerator, denominator]
  return [
    [deg, 1],
    [min, 1],
    [Math.round(sec * 100), 100]
  ];
}

// --- Action Button Handlers ---

/**
 * Injects new GPS coordinates into image EXIF and triggers download
 */
function updateGPS() {
  const lat = parseFloat(latInput.value);
  const lng = parseFloat(lngInput.value);

  if (isNaN(lat) || isNaN(lng)) {
    // Basic animation to shake inputs on error could be added here
    alert("Veuillez sélectionner des coordonnées valides en cliquant sur la carte.");
    return;
  }

  // Visual feedback on button
  const btn = document.querySelector('.btn-primary');
  const originalInnerHTML = btn.innerHTML;
  btn.innerHTML = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="animate-spin"><line x1="12" y1="2" x2="12" y2="6"></line><line x1="12" y1="18" x2="12" y2="22"></line><line x1="4.93" y1="4.93" x2="7.76" y2="7.76"></line><line x1="16.24" y1="16.24" x2="19.07" y2="19.07"></line><line x1="2" y1="12" x2="6" y2="12"></line><line x1="18" y1="12" x2="22" y2="12"></line><line x1="4.93" y1="19.07" x2="7.76" y2="16.24"></line><line x1="16.24" y1="7.76" x2="19.07" y2="4.93"></line></svg> Génération...`;

  setTimeout(() => { // Small timeout to allow UI update
    try {
      let exifObj = piexif.load(originalImageDataUrl);

      // Ensure GPS IFD directory exists
      if (!exifObj["GPS"]) {
        exifObj["GPS"] = {};
      }

      // Set References (N/S, E/W)
      exifObj["GPS"][piexif.GPSIFD.GPSLatitudeRef] = lat >= 0 ? "N" : "S";
      exifObj["GPS"][piexif.GPSIFD.GPSLongitudeRef] = lng >= 0 ? "E" : "W";

      // Set precise values converted to DMS
      exifObj["GPS"][piexif.GPSIFD.GPSLatitude] = toDMS(lat);
      exifObj["GPS"][piexif.GPSIFD.GPSLongitude] = toDMS(lng);

      // --- Update Date and Time ---
      const newDateTime = datetimeInput.value;
      if (newDateTime) {
        // Convert "YYYY-MM-DDTHH:MM:SS" back to EXIF "YYYY:MM:DD HH:MM:SS"
        const exifDateTime = newDateTime.replace(/-/, ':').replace(/-/, ':').replace('T', ' ');

        if (!exifObj["Exif"]) exifObj["Exif"] = {};
        if (!exifObj["0th"]) exifObj["0th"] = {};

        exifObj["Exif"][piexif.ExifIFD.DateTimeOriginal] = exifDateTime;
        // Also update the main image datetime for consistency
        exifObj["0th"][piexif.ImageIFD.DateTime] = exifDateTime;
      }

      // Rebuild EXIF and inject into base64 image string
      const exifBytes = piexif.dump(exifObj);
      const newDataUrl = piexif.insert(exifBytes, originalImageDataUrl);

      // Trigger automatic download
      const a = document.createElement("a");
      a.href = newDataUrl;
      const customName = filenameInput.value.trim() || originalFileName;
      a.download = `${customName}_geotagged.jpg`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);

    } catch (err) {
      console.error("Erreur lors de la modification EXIF:", err);
      alert("Une erreur inattendue est survenue lors de l'enregistrement. Vérifiez que votre image est bien un JPEG standard.");
    } finally {
      // Restore button text
      btn.innerHTML = originalInnerHTML;
    }
  }, 100);
}

/**
 * Requests browser Geolocation API to find user's current coordinates
 */
function getCurrentLocation() {
  if (!navigator.geolocation) {
    alert("La géolocalisation n'est pas supportée ou est bloquée par ce navigateur.");
    return;
  }

  const btn = document.querySelector('.btn-secondary');
  const originalHTML = btn.innerHTML;

  // Loading state
  btn.innerHTML = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="animate-spin"><line x1="12" y1="2" x2="12" y2="6"></line><line x1="12" y1="18" x2="12" y2="22"></line><line x1="4.93" y1="4.93" x2="7.76" y2="7.76"></line><line x1="16.24" y1="16.24" x2="19.07" y2="19.07"></line><line x1="2" y1="12" x2="6" y2="12"></line><line x1="18" y1="12" x2="22" y2="12"></line><line x1="4.93" y1="19.07" x2="7.76" y2="16.24"></line><line x1="16.24" y1="7.76" x2="19.07" y2="4.93"></line></svg> Recherche...`;

  navigator.geolocation.getCurrentPosition(
    pos => {
      const lat = pos.coords.latitude.toFixed(6);
      const lng = pos.coords.longitude.toFixed(6);

      latInput.value = lat;
      lngInput.value = lng;
      updateMap(lat, lng);

      errorMsg.style.display = "none";
      btn.innerHTML = originalHTML;
    },
    err => {
      console.warn(`ERREUR Géolocalisation(${err.code}): ${err.message}`);
      btn.innerHTML = originalHTML;
      let msg = "Impossible d'obtenir la position.";
      if (err.code === 1) msg = "Accès à la géolocalisation refusé. Veuillez l'activer dans votre navigateur.";
      else if (err.code === 2) msg = "Position indisponible actuellement.";

      alert(msg);
    },
    {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 0
    }
  );
}

/**
 * Removes GPS coordinates from image EXIF for security/privacy
 */
function removeGPS() {
  const btn = document.querySelector('.btn-danger');
  if (!btn) return;

  const originalInnerHTML = btn.innerHTML;
  btn.innerHTML = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="animate-spin"><line x1="12" y1="2" x2="12" y2="6"></line><line x1="12" y1="18" x2="12" y2="22"></line><line x1="4.93" y1="4.93" x2="7.76" y2="7.76"></line><line x1="16.24" y1="16.24" x2="19.07" y2="19.07"></line><line x1="2" y1="12" x2="6" y2="12"></line><line x1="18" y1="12" x2="22" y2="12"></line><line x1="4.93" y1="19.07" x2="7.76" y2="16.24"></line><line x1="16.24" y1="7.76" x2="19.07" y2="4.93"></line></svg> Sécurisation...`;

  setTimeout(() => {
    try {
      let exifObj = piexif.load(originalImageDataUrl);

      // Remove GPS data entirely from the EXIF object
      if (exifObj["GPS"]) {
        exifObj["GPS"] = {};
      }

      // Rebuild EXIF and inject into base64 image string
      const exifBytes = piexif.dump(exifObj);
      const newDataUrl = piexif.insert(exifBytes, originalImageDataUrl);

      // Trigger automatic download
      const a = document.createElement("a");
      a.href = newDataUrl;
      const customName = filenameInput.value.trim() || originalFileName;
      a.download = `${customName}_sans_gps.jpg`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);

    } catch (err) {
      console.error("Erreur lors de la suppression EXIF:", err);
      alert("Une erreur est survenue lors de la sécurisation de l'image.");
    } finally {
      btn.innerHTML = originalInnerHTML;
    }
  }, 100);
}

/**
 * Searches for a city or postal code using OpenStreetMap Nominatim API
 */
async function searchCity() {
  const searchInput = document.getElementById('searchLocation');
  const query = searchInput.value.trim();

  if (!query) {
    alert("Veuillez entrer une ville ou un code postal.");
    return;
  }

  const btn = searchInput.nextElementSibling;
  const originalHTML = btn.innerHTML;
  btn.innerHTML = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="animate-spin"><line x1="12" y1="2" x2="12" y2="6"></line><line x1="12" y1="18" x2="12" y2="22"></line><line x1="4.93" y1="4.93" x2="7.76" y2="7.76"></line><line x1="16.24" y1="16.24" x2="19.07" y2="19.07"></line><line x1="2" y1="12" x2="6" y2="12"></line><line x1="18" y1="12" x2="22" y2="12"></line><line x1="4.93" y1="19.07" x2="7.76" y2="16.24"></line><line x1="16.24" y1="7.76" x2="19.07" y2="4.93"></line></svg>`;

  try {
    const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&countrycodes=FR&limit=1`);
    const data = await response.json();

    if (data && data.length > 0) {
      const lat = parseFloat(data[0].lat);
      const lng = parseFloat(data[0].lon);

      latInput.value = lat.toFixed(6);
      lngInput.value = lng.toFixed(6);

      updateMap(lat, lng);
      errorMsg.style.display = "none";
    } else {
      alert("Aucun lieu trouvé pour cette recherche. Vérifiez l'orthographe ou le code postal.");
    }
  } catch (error) {
    console.error("Erreur de recherche:", error);
    alert("Une erreur de réseau est survenue lors de la recherche du lieu.");
  } finally {
    btn.innerHTML = originalHTML;
  }
}

// --- Help Modal Logic ---

function openHelp() {
  const modal = document.getElementById('helpModal');
  if (modal) {
    modal.style.display = 'flex';
  }
}

function closeHelp() {
  const modal = document.getElementById('helpModal');
  if (modal) {
    modal.style.display = 'none';
  }
}

// Close modal when clicking outside of it
window.addEventListener('click', function (event) {
  const modal = document.getElementById('helpModal');
  if (event.target === modal) {
    closeHelp();
  }
});

// Close modal when pressing ESC key
window.addEventListener('keydown', function (event) {
  if (event.key === 'Escape') {
    closeHelp();
  }
});
