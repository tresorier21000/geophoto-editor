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

// ==========================================
// SYSTÈME DE NOTIFICATIONS ELEGANTES (TOAST)
// ==========================================
function showToast(message, type = 'warning') {
  const container = document.getElementById('toast-container');
  if (!container) return;

  const toast = document.createElement('div');
  toast.className = `toast ${type}`;

  let iconSvg = '';
  if (type === 'success') {
    iconSvg = '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>';
  } else if (type === 'error') {
    iconSvg = '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="15" y1="9" x2="9" y2="15"></line><line x1="9" y1="9" x2="15" y2="15"></line></svg>';
  } else {
    // Warning / Info
    iconSvg = '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>';
  }

  toast.innerHTML = `
    <div class="toast-icon">${iconSvg}</div>
    <div class="toast-message">${message}</div>
    <button class="toast-close" onclick="this.parentElement.remove()">&times;</button>
  `;

  container.appendChild(toast);

  // Auto-fermeture après 10 secondes (modifié pour laisser le temps de lire)
  setTimeout(() => {
    if (toast.parentElement) {
      toast.classList.add('hiding');
      toast.addEventListener('animationend', () => toast.remove());
    }
  }, 10000);
}

// ==========================================
// V2 : NAVIGATION ACCUEIL (Choix du mode)
// ==========================================
const modeChoiceSection = document.getElementById('modeChoiceSection');
const singleModeSection = document.getElementById('singleModeSection');
const visualModeSection = document.getElementById('visualModeSection');
const batchModeSection = document.getElementById('batchModeSection');

function selectMode(mode) {
  if (modeChoiceSection) modeChoiceSection.style.display = 'none';

  if (mode === 'single' && singleModeSection) {
    singleModeSection.style.display = 'block';
    if (map) {
      setTimeout(() => map.invalidateSize(), 100);
    }
  } else if (mode === 'visual' && visualModeSection) {
    visualModeSection.style.display = 'block';
    if (typeof visualMap !== 'undefined' && visualMap) {
      setTimeout(() => visualMap.invalidateSize(), 100);
    }
  } else if (mode === 'batch' && batchModeSection) {
    batchModeSection.style.display = 'block';
  }
}

function goBackToChoice() {
  if (singleModeSection) singleModeSection.style.display = 'none';
  if (visualModeSection) visualModeSection.style.display = 'none';
  if (batchModeSection) batchModeSection.style.display = 'none';
  if (modeChoiceSection) modeChoiceSection.style.display = 'block';
}
// ==========================================

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
    showToast("Veuillez sélectionner une image au format JPEG. D'autres formats ne supportent pas cette modification EXIF spécifique.");
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
    // Afficher la section avec le champ date accessible malgré l'erreur
    exifDataGrid.innerHTML = '<div class="exif-item" style="grid-column: 1 / -1;"><span class="exif-value" style="color: var(--text-muted); font-style: italic;">Aucune métadonnée EXIF détectée dans cette image.</span></div>';
    datetimeInput.value = '';
    exifSection.style.display = "flex";
    showError("L'image ne contient pas de métadonnées EXIF. Vous pouvez quand même définir une date et un GPS.");
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
    metadata.forEach(item => {
      exifDataGrid.innerHTML += `
        <div class="exif-item">
          <span class="exif-label">${item.label}</span>
          <span class="exif-value">${item.value}</span>
        </div>
      `;
    });
  } else {
    exifDataGrid.innerHTML = '<div class="exif-item" style="grid-column: 1 / -1;"><span class="exif-value" style="color: var(--text-muted); font-style: italic;">Aucune métadonnée EXIF détectée dans cette image.</span></div>';
  }

  // Toujours afficher la section pour permettre de créer/modifier une date
  exifSection.style.display = "flex";
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
 * Saves an image using the File System Access API ("Save As" dialog)
 * Falls back to classic download if the API is unavailable
 * @param {string} dataUrl - Base64 data URL of the image
 * @param {string} suggestedName - Suggested filename
 */
async function saveImageWithDialog(dataUrl, suggestedName) {
  // Convert data URL to Blob
  const byteString = atob(dataUrl.split(',')[1]);
  const mimeType = dataUrl.split(',')[0].split(':')[1].split(';')[0];
  const ab = new ArrayBuffer(byteString.length);
  const ia = new Uint8Array(ab);
  for (let i = 0; i < byteString.length; i++) {
    ia[i] = byteString.charCodeAt(i);
  }
  const blob = new Blob([ab], { type: mimeType });

  // Try File System Access API (Chrome/Edge)
  if (window.showSaveFilePicker) {
    try {
      const handle = await window.showSaveFilePicker({
        suggestedName: suggestedName,
        types: [{
          description: 'Image JPEG',
          accept: { 'image/jpeg': ['.jpg', '.jpeg'] }
        }]
      });
      const writable = await handle.createWritable();
      await writable.write(blob);
      await writable.close();
      showToast(`Image enregistrée : ${handle.name}`, 'success');
      return;
    } catch (err) {
      // User cancelled the dialog
      if (err.name === 'AbortError') {
        showToast('Enregistrement annulé.', 'warning');
        return;
      }
      console.warn('File System Access API failed, falling back to download:', err);
    }
  }

  // Fallback: classic download
  const a = document.createElement('a');
  a.href = dataUrl;
  a.download = suggestedName;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}

/**
 * Injects new GPS coordinates into image EXIF and saves via dialog
 */
function updateGPS() {
  const lat = parseFloat(latInput.value);
  const lng = parseFloat(lngInput.value);

  if (isNaN(lat) || isNaN(lng)) {
    showToast("Veuillez sélectionner des coordonnées valides en cliquant sur la carte.");
    return;
  }

  // Visual feedback on button
  const btn = document.querySelector('#singleModeSection .btn-primary');
  const originalInnerHTML = btn.innerHTML;
  btn.innerHTML = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="animate-spin"><line x1="12" y1="2" x2="12" y2="6"></line><line x1="12" y1="18" x2="12" y2="22"></line><line x1="4.93" y1="4.93" x2="7.76" y2="7.76"></line><line x1="16.24" y1="16.24" x2="19.07" y2="19.07"></line><line x1="2" y1="12" x2="6" y2="12"></line><line x1="18" y1="12" x2="22" y2="12"></line><line x1="4.93" y1="19.07" x2="7.76" y2="16.24"></line><line x1="16.24" y1="7.76" x2="19.07" y2="4.93"></line></svg> Génération...`;

  setTimeout(async () => {
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
        const exifDateTime = newDateTime.replace(/-/, ':').replace(/-/, ':').replace('T', ' ');
        if (!exifObj["Exif"]) exifObj["Exif"] = {};
        if (!exifObj["0th"]) exifObj["0th"] = {};
        exifObj["Exif"][piexif.ExifIFD.DateTimeOriginal] = exifDateTime;
        exifObj["0th"][piexif.ImageIFD.DateTime] = exifDateTime;
      }

      // Rebuild EXIF and inject into base64 image string
      const exifBytes = piexif.dump(exifObj);
      const newDataUrl = piexif.insert(exifBytes, originalImageDataUrl);

      // Déterminer le nom du fichier
      const customName = filenameInput.value.trim() || originalFileName;
      const keepOriginals = document.getElementById('singleKeepOriginals').checked;
      const fileName = keepOriginals ? `${customName}_geotagged.jpg` : `${customName}.jpg`;

      // Enregistrer via la boîte de dialogue
      await saveImageWithDialog(newDataUrl, fileName);

    } catch (err) {
      console.error("Erreur lors de la modification EXIF:", err);
      showToast("Une erreur inattendue est survenue lors de l'enregistrement. Vérifiez que votre image est bien un JPEG standard.");
    } finally {
      btn.innerHTML = originalInnerHTML;
    }
  }, 100);
}

/**
 * Requests browser Geolocation API to find user's current coordinates
 */
function getCurrentLocation() {
  if (!navigator.geolocation) {
    showToast("La géolocalisation n'est pas supportée ou est bloquée par ce navigateur.");
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

      showToast(msg);
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
  const btn = document.querySelector('#singleModeSection .btn-danger');
  if (!btn) return;

  const originalInnerHTML = btn.innerHTML;
  btn.innerHTML = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="animate-spin"><line x1="12" y1="2" x2="12" y2="6"></line><line x1="12" y1="18" x2="12" y2="22"></line><line x1="4.93" y1="4.93" x2="7.76" y2="7.76"></line><line x1="16.24" y1="16.24" x2="19.07" y2="19.07"></line><line x1="2" y1="12" x2="6" y2="12"></line><line x1="18" y1="12" x2="22" y2="12"></line><line x1="4.93" y1="19.07" x2="7.76" y2="16.24"></line><line x1="16.24" y1="7.76" x2="19.07" y2="4.93"></line></svg> Sécurisation...`;

  setTimeout(async () => {
    try {
      let exifObj = piexif.load(originalImageDataUrl);

      // Remove GPS data entirely from the EXIF object
      if (exifObj["GPS"]) {
        exifObj["GPS"] = {};
      }

      // Rebuild EXIF and inject into base64 image string
      const exifBytes = piexif.dump(exifObj);
      const newDataUrl = piexif.insert(exifBytes, originalImageDataUrl);

      // Déterminer le nom du fichier
      const customName = filenameInput.value.trim() || originalFileName;
      const keepOriginals = document.getElementById('singleKeepOriginals').checked;
      const fileName = keepOriginals ? `${customName}_sans_gps.jpg` : `${customName}.jpg`;

      // Enregistrer via la boîte de dialogue
      await saveImageWithDialog(newDataUrl, fileName);

    } catch (err) {
      console.error("Erreur lors de la suppression EXIF:", err);
      showToast("Une erreur est survenue lors de la sécurisation de l'image.");
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
    showToast("Veuillez entrer une ville ou un code postal.");
    return;
  }

  const btn = searchInput.nextElementSibling;
  const originalHTML = btn.innerHTML;
  btn.innerHTML = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="animate-spin"><line x1="12" y1="2" x2="12" y2="6"></line><line x1="12" y1="18" x2="12" y2="22"></line><line x1="4.93" y1="4.93" x2="7.76" y2="7.76"></line><line x1="16.24" y1="16.24" x2="19.07" y2="19.07"></line><line x1="2" y1="12" x2="6" y2="12"></line><line x1="18" y1="12" x2="22" y2="12"></line><line x1="4.93" y1="19.07" x2="7.76" y2="16.24"></line><line x1="16.24" y1="7.76" x2="19.07" y2="4.93"></line></svg>`;

  try {
    const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=5&accept-language=fr`);
    const data = await response.json();

    if (data && data.length > 0) {
      const lat = parseFloat(data[0].lat);
      const lng = parseFloat(data[0].lon);

      latInput.value = lat.toFixed(6);
      lngInput.value = lng.toFixed(6);

      updateMap(lat, lng);
      errorMsg.style.display = "none";
    } else {
      showToast("Aucun lieu trouvé pour cette recherche. Vérifiez l'orthographe ou le code postal.");
    }
  } catch (error) {
    console.error("Erreur de recherche:", error);
    showToast("Une erreur de réseau est survenue lors de la recherche du lieu.");
  } finally {
    btn.innerHTML = originalHTML;
  }
}

// --- Nouvelles Fonctions V3 : Choix de Dossier Cible ---

function validateManualFolder() {
  const inputEl = document.getElementById('batchFolderTextInput');
  const path = inputEl.value.trim();
  const display = document.getElementById('batchFolderNameDisplay');
  const hiddenInput = document.getElementById('batchFolderNameHidden');

  if (!path) {
    display.textContent = "Aucun dossier validé";
    hiddenInput.value = "";
    display.style.color = "var(--text-muted)";
    inputEl.style.cssText = "flex: 1; padding: 0.75rem; border: 1px solid var(--border); border-radius: 4px; background-color: #0f172a; color: #f8fafc; font-family: monospace; font-size: 0.95rem; -webkit-appearance: none; appearance: none;";
    inputEl.classList.remove('folder-validated');
    showToast("Veuillez d'abord coller le chemin d'un dossier.", "warning");
    return;
  }

  let cleanPath = path.replace(/^["']|["']$/g, '');
  inputEl.value = cleanPath;

  hiddenInput.value = cleanPath;
  display.textContent = "Dossier validé !";
  display.style.color = "#10b981";
  inputEl.style.cssText = "flex: 1; padding: 0.75rem; border: 2px solid #10b981; border-radius: 4px; background-color: #0f172a; color: #10b981; -webkit-text-fill-color: #10b981; font-family: monospace; font-size: 0.95rem; -webkit-appearance: none; appearance: none;";
  inputEl.classList.add('folder-validated');

  showToast("Chemin de dossier enregistré avec succès. Tous les générateurs .bat utiliseront ce chemin.", "success");
}

function updateBatchFolderName(input) {
  // Fonction d'origine, modifiée ou non utilisée, laissée pour éviter les erreurs de console si l'input legacy est encore appelé par mégarde.
  console.log("updateBatchFolderName est obsolète pour la V3.");
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

// ==========================================
// V2 : LOGIQUE DU MODE TRAITEMENT PAR LOT (BATCH)
// ==========================================

let batchMap = null;
let batchMarker = null;

// Affiche ou masque les conteneurs (Date / GPS) selon les cases cochées
function toggleBatchSection(type) {
  const checkbox = document.getElementById('batchCheck' + type);
  const container = document.getElementById('batch' + type + 'Container');

  // Sécurité : Forcer le choix du dossier avant d'activer une case
  const targetFolder = document.getElementById('batchFolderNameHidden').value;
  if (checkbox.checked && !targetFolder) {
    checkbox.checked = false; // Annuler le clic
    showToast("Veuillez d'abord Sélectionner le dossier cible avant de configurer les traitements.", 'warning');

    const folderBtn = document.querySelector('button[onclick*="batchFolderInput"]');
    if (folderBtn) {
      folderBtn.style.animation = 'pulseError 1s ease 2';
      setTimeout(() => folderBtn.style.animation = '', 2000);
    }
    return;
  }

  if (checkbox.checked) {
    container.style.display = 'block';
    if (type === 'GPS') {
      initBatchMap();
    }
  } else {
    container.style.display = 'none';
  }
}

// Initialise la 2ème carte Leaflet
function initBatchMap() {
  if (batchMap !== null) {
    setTimeout(() => batchMap.invalidateSize(), 100);
    return; // Déjà initialisée
  }

  // Initialisation sur la France par défaut, au zoom 5
  batchMap = L.map('batchMap').setView([46.2276, 2.2137], 5);
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '© OpenStreetMap contributors'
  }).addTo(batchMap);

  batchMap.on('click', function (e) {
    const lat = e.latlng.lat;
    const lng = e.latlng.lng;

    document.getElementById('batchLat').value = lat;
    document.getElementById('batchLng').value = lng;

    if (batchMarker) {
      batchMarker.setLatLng(e.latlng);
    } else {
      batchMarker = L.marker(e.latlng).addTo(batchMap);
    }
  });

  // Force Leaflet à recalculer sa taille car le conteneur était caché
  setTimeout(() => batchMap.invalidateSize(), 150);
}

// Recherche Nominatim pour la carte Batch
async function searchCityBatch() {
  const query = document.getElementById('batchSearchLocation').value;
  if (!query) return;

  const btn = document.querySelector('#batchSearchLocation').nextElementSibling;
  const originalIcon = btn.innerHTML;
  btn.innerHTML = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="animate-spin"><circle cx="12" cy="12" r="10"></circle></svg>`;

  try {
    const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=5&accept-language=fr`);
    const data = await response.json();

    if (data && data.length > 0) {
      const lat = parseFloat(data[0].lat);
      const lon = parseFloat(data[0].lon);

      document.getElementById('batchLat').value = lat;
      document.getElementById('batchLng').value = lon;

      const latlng = [lat, lon];
      batchMap.setView(latlng, 13);
      if (batchMarker) {
        batchMarker.setLatLng(latlng);
      } else {
        batchMarker = L.marker(latlng).addTo(batchMap);
      }
    } else {
      showToast("Lieu non trouvé.");
    }
  } catch (error) {
    showToast("Erreur lors de la recherche du lieu.");
    console.error(error);
  } finally {
    btn.innerHTML = originalIcon;
  }
}

// Affiche le nom du dossier sélectionné dans l'UI
function updateBatchFolderName(input) {
  if (input.files && input.files.length > 0) {
    // Le nom complet du dossier se trouve dans webkitRelativePath du 1er fichier
    const firstFilePath = input.files[0].webkitRelativePath;
    const folderName = firstFilePath.split('/')[0];

    document.getElementById('batchFolderNameDisplay').innerText = `📁 ${folderName}`;
    document.getElementById('batchFolderNameDisplay').style.color = 'var(--primary)';
    document.getElementById('batchFolderNameHidden').value = folderName;
  } else {
    document.getElementById('batchFolderNameDisplay').innerText = "Aucun dossier sélectionné";
    document.getElementById('batchFolderNameDisplay').style.color = 'var(--text)';
    document.getElementById('batchFolderNameHidden').value = '';
  }
}

// Générateur du script Batch (Étape 3)
async function generateBatchScript() {
  const checkDate = document.getElementById('batchCheckDate').checked;
  const checkGPS = document.getElementById('batchCheckGPS').checked;
  const keepOriginals = document.getElementById('batchKeepOriginals').checked;
  const targetFolder = document.getElementById('batchFolderNameHidden').value;

  if (!targetFolder) {
    showToast("Sécurité : Veuillez d'abord cliquer sur 'Choisir le dossier' pour désigner le dossier cible sur votre disque.");
    return;
  }

  if (!checkDate && !checkGPS) {
    showToast("Veuillez cocher au moins une option à modifier (Date ou GPS).");
    return;
  }

  let exifParams = [];

  // --- Gestion de la Date ---
  if (checkDate) {
    const rawDate = document.getElementById('batchDatetimeInput').value;
    if (!rawDate) {
      showToast("Veuillez sélectionner une date et heure.");
      return;
    }
    const formattedDate = rawDate.replace(/-/g, ':').replace('T', ' ');
    exifParams.push(`-AllDates="${formattedDate}"`);
  }

  // --- Gestion du GPS ---
  if (checkGPS) {
    const lat = document.getElementById('batchLat').value;
    const lng = document.getElementById('batchLng').value;
    if (!lat || !lng) {
      showToast("Veuillez cliquer sur la carte pour définir les coordonnées GPS.");
      return;
    }

    const latNum = parseFloat(lat);
    const lngNum = parseFloat(lng);
    const latRef = latNum >= 0 ? "N" : "S";
    const lngRef = lngNum >= 0 ? "E" : "W";

    exifParams.push(`-GPSLatitude=${Math.abs(latNum)}`);
    exifParams.push(`-GPSLatitudeRef=${latRef}`);
    exifParams.push(`-GPSLongitude=${Math.abs(lngNum)}`);
    exifParams.push(`-GPSLongitudeRef=${lngRef}`);
  }

  // --- Sécurité des originaux ---
  let exifCommand = "";

  if (!keepOriginals) {
    // Écrase les originaux
    exifParams.push(`-overwrite_original`);
    exifCommand = `exiftool ${exifParams.join(' ')} .`;
  } else {
    // Copie les originaux : l'échappement BATCH sous Windows nécessite de doubler les %, 
    // et dans un template JS literal, on a juste besoin d'envoyer %% pour créer un "vrai" double pourcentage.
    // Cmd.exe transformera %%d en %d et l'enverra à ExifTool.
    exifCommand = `exiftool ${exifParams.join(' ')} -o "%%d%%f_geophoto.%%e" .`;
  }

  // Extraction du nom final du dossier pour la vérification de sécurité
  const targetFolderName = targetFolder.split(/[\\/]/).filter(Boolean).pop();

  // Le Batch récupère le nom du dossier courant dans la variable folderName et le compare à cible
  const batContent = `@echo off
setlocal enabledelayedexpansion
chcp 65001 >nul

echo ========================================================
echo   GeoPhoto Editor - Traitement par Lot (ExifTool)
echo ========================================================
echo.

:: --- VERIFICATION DE SECURITE DU DOSSIER CIBLE ---
for %%I in (".") do set "currentFolder=%%~nxI"
set "targetFolder=${targetFolder}"
set "targetFolderName=${targetFolderName}"

if /i not "!currentFolder!"=="!targetFolderName!" (
    color 0c
    echo [ERREUR DE SECURITE CRITIQUE]
    echo.
    echo Ce script a ete concu SPECIFIQUEMENT pour traiter le dossier :
    echo -^> "!targetFolder!"
    echo.
    echo Mais vous l'avez execute depuis le dossier :
    echo -^> "!currentFolder!"
    echo.
    echo Par securite, le traitement est annule pour eviter d'ecraser
    echo les mauvaises photos par erreur.
    echo.
    echo Merci de executer ce fichier dans le BON dossier et de recommencer.
    echo.
    pause
    exit /b
)

:: --- FIN SECURITE ---

echo Formats pris en charge : JPEG, RAW (CR2, NEF...), PNG, HEIC...
echo Le traitement va s'appliquer sur TOUS les fichiers de : "!currentFolder!"
echo Vos choix : ${checkDate ? '[X]' : '[ ]'} Date et Heure
echo           : ${checkGPS ? '[X]' : '[ ]'} Coordonnees GPS
echo Options   : ${keepOriginals ? 'GARDER les originaux (cree de nouvelles copies _geophoto)' : 'ECRASER les originaux (Attention !)'}
echo.
echo Appuyez sur une touche pour commencer le traitement du dossier...
pause >nul

echo.
echo Traitement en cours... Veuillez patienter !
${exifCommand}

echo.
echo ========================================================
echo   TRAITEMENT TERMINE AVEC SUCCES !
echo ========================================================
pause
`;

  // --- Téléchargement du fichier ---
  // Nettoyer le nom du dossier pour le nom de fichier (retirer caractères spéciaux si besoin)
  const safeFolderName = targetFolder.replace(/[^a-z0-9]/gi, '_');

  // Générer des tags descriptifs basés sur les options choisies
  let tags = [];
  if (keepOriginals) tags.push("copie"); else tags.push("ecrase");
  if (checkDate) tags.push("date");
  if (checkGPS) tags.push("gps");

  const batFileName = `!_traitement_lot_[${safeFolderName}]_${tags.join('_')}.bat`;

  await downloadBatFile(batContent, batFileName);
}

// Générateur du script d'Extraction CSV (Étape 5)
async function generateCSVExtractionScript() {
  const targetFolder = document.getElementById('batchFolderNameHidden').value;

  if (!targetFolder) {
    showToast("Sécurité : Veuillez d'abord cliquer sur 'Choisir le dossier' (Étape 1) pour désigner le dossier cible sur votre disque.");
    return;
  }

  // La commande ExifTool de lecture va extraire tous les tags demandés au format tabulaire/CSV
  const csvFileName = `donnees_photos_completes.csv`;
  // On ajoute --ext csv pour éviter qu'ExifTool essaie de lire son propre fichier de destination en cours de création
  const exifCommand = `exiftool -csv --ext csv -FileName -Make -Model -ImageSize -DateTimeOriginal -GPSLatitude -GPSLongitude . > "${csvFileName}"`;

  // Extraction du nom final du dossier pour la vérification de sécurité
  const targetFolderName = targetFolder.split(/[\\/]/).filter(Boolean).pop();

  const batContent = `@echo off
setlocal enabledelayedexpansion
chcp 65001 >nul

echo ========================================================
echo   GeoPhoto Editor - Extraction des donnees CSV
echo ========================================================
echo.

:: --- VERIFICATION DE SECURITE DU DOSSIER CIBLE ---
for %%I in (".") do set "currentFolder=%%~nxI"
set "targetFolder=${targetFolder}"
set "targetFolderName=${targetFolderName}"

if /i not "!currentFolder!"=="!targetFolderName!" (
    color 0c
    echo [ERREUR DE SECURITE CRITIQUE]
    echo.
    echo Ce script d'extraction est prevu pour le dossier :
    echo -^> "!targetFolder!"
    echo Mais execute dans         :
    echo -^> "!currentFolder!"
    echo.
    pause
    exit /b
)
:: --- FIN SECURITE ---

echo Cette operation ne modifiera AUCUNE photo.
echo Elle va seulement dechiffrer tous les fichiers du dossier
echo et lister leurs donnees dans un tableur Excel.
echo.
echo Fichier genere : ${csvFileName}
echo.
echo Appuyez sur une touche pour lancer l'analyse...
pause >nul

echo.
echo Extraction en cours... (Cela peut prendre plusieurs secondes sur de gros dossiers)
${exifCommand}

echo.
echo ========================================================
echo   EXTRACTION TERMINEE AVEC SUCCES !
echo   Vous trouverez un nouveau fichier CSV dans votre dossier.
echo ========================================================
pause
`;

  const safeFolderName = targetFolder.replace(/[^a-z0-9]/gi, '_');
  const batFileName = `!_extraction_csv_[${safeFolderName}].bat`;

  await downloadBatFile(batContent, batFileName);
}

// === Navigation entre les Onglets (V3) ===
function switchBatchTab(targetTabId) {
  // Sécurité : Forcer le choix du dossier avant d'aller dans Organisation ou Utilitaires
  if (targetTabId !== 'tabMetadata') {
    const targetFolder = document.getElementById('batchFolderNameHidden').value;
    if (!targetFolder) {
      showToast("Veuillez d'abord Sélectionner le dossier cible (Étape 1) avant de pouvoir accéder aux options d'Organisation et aux Utilitaires.");
      // Optionnel : faire clignoter le bouton de choix de dossier pour guider l'oeil
      const folderBtn = document.querySelector('button[onclick*="batchFolderInput"]');
      if (folderBtn) {
        folderBtn.style.animation = 'pulseError 1s ease 2';
        setTimeout(() => folderBtn.style.animation = '', 2000);
      }
      return; // Interrompt la bascule
    }
  }

  // 1. Cacher tous les contenus d'onglets
  const tabContents = document.querySelectorAll('.tab-content');
  tabContents.forEach(tab => {
    tab.classList.remove('active');
  });

  // 2. Retirer l'état actif de tous les boutons
  const tabBtns = document.querySelectorAll('.tab-btn');
  tabBtns.forEach(btn => {
    btn.classList.remove('active');
  });

  // 3. Activer le bon contenu et le bon bouton
  document.getElementById(targetTabId).classList.add('active');
  // Trouve le bouton qui appelle la fonction avec ce targetTabId
  const correspondingBtnBtn = document.querySelector(`.tab-btn[onclick*="${targetTabId}"]`);
  if (correspondingBtnBtn) {
    correspondingBtnBtn.classList.add('active');
  }

  // 4. Invalidation de la carte (Si on ouvre l'onglet Métadonnées et que GPS est coché)
  if (targetTabId === 'tabMetadata' && document.getElementById('batchCheckGPS') && document.getElementById('batchCheckGPS').checked) {
    setTimeout(() => {
      if (typeof batchMap !== 'undefined' && batchMap) {
        batchMap.invalidateSize();
      }
    }, 100);
  }
}

// === Générateur du script d'Organisation (Étape 2 / V3) ===
async function generateOrganizeScript() {
  const targetFolder = document.getElementById('batchFolderNameHidden').value;

  if (!targetFolder) {
    showToast("Sécurité : Veuillez d'abord cliquer sur 'Choisir le dossier' (Étape 1) pour désigner le dossier cible sur votre disque.");
    return;
  }

  const rename = document.getElementById('orgCheckRename').checked;
  const classify = document.getElementById('orgCheckClassify').checked;

  if (!rename && !classify) {
    showToast("Veuillez cocher au moins une action : Renommer ou Classer.", "warning");
    return;
  }

  const byYear = document.getElementById('orgCheckYear').checked;
  const byMonth = document.getElementById('orgCheckMonth').checked;

  if (classify && !byYear && !byMonth) {
    showToast("Erreur : Vous avez choisi de Classer, mais vous n'avez sélectionné ni 'Année' ni 'Mois'. Veuillez cocher au moins une option de dossier.", "error");
    return;
  }

  const keepOriginals = document.getElementById('orgKeepOriginals').checked;

  // Construction du DateFormat (argument -d) pour ExifTool
  // Attention à l'échappement Batch : %Y devient %%Y, et %c devient %%%%c 
  let formatString = "";

  if (classify) {
    if (byYear && byMonth) {
      formatString += "%%Y/%%m/";
    } else if (byYear) {
      formatString += "%%Y/";
    }
  }

  if (rename) {
    // AnnéeMoisJour_numero.extension
    formatString += "%%Y%%m%%d_%%%%c.%%%%e";
  } else {
    // Garde le nom d'origine
    formatString += "%%%%f.%%%%e";
  }

  // Si on garde les originaux, on COPIE (-o .), sinon on DÉPLACE/RENOMME (-filename<...)
  let exifCommand = "";
  if (keepOriginals) {
    exifCommand = `exiftool -o . "-filename<DateTimeOriginal" -d "${formatString}" .`;
  } else {
    exifCommand = `exiftool "-filename<DateTimeOriginal" -d "${formatString}" .`;
  }

  // Extraction du nom final du dossier pour la vérification de sécurité
  const targetFolderName = targetFolder.split(/[\\/]/).filter(Boolean).pop();

  const batContent = `@echo off
setlocal enabledelayedexpansion
chcp 65001 >nul

echo ========================================================
echo   GeoPhoto Editor - Organisation Automatique
echo ========================================================
echo.

:: --- VERIFICATION DE SECURITE DU DOSSIER CIBLE ---
for %%I in (".") do set "currentFolder=%%~nxI"
set "targetFolder=${targetFolder}"
set "targetFolderName=${targetFolderName}"

if /i not "!currentFolder!"=="!targetFolderName!" (
    color 0c
    echo [ERREUR DE SECURITE CRITIQUE]
    echo.
    echo Ce script d'organisation est prevu pour le dossier :
    echo -^> "!targetFolder!"
    echo Mais execute dans         :
    echo -^> "!currentFolder!"
    echo.
    pause
    exit /b
)
:: --- FIN SECURITE ---

echo L'outil va lire la date interne de vos photos pour :
if "${rename}" == "true" echo - Renommer les fichiers (AnneeMoisJour_Numero)
if "${classify}" == "true" echo - Creer des dossiers et y ranger les photos
if "${keepOriginals}" == "true" echo - (VOS ORIGINAUX SERONT CONSERVES INTACTS / COPIE)
if "${keepOriginals}" == "false" echo - (ATTENTION: DEPLACEMENT DEFINITIF SANS COPIE DE SECURITE)
echo.
echo Appuyez sur une touche pour lancer le classement...
pause >nul

echo.
echo Organisation en cours...
${exifCommand}

echo.
echo ========================================================
echo   ORGANISATION TERMINEE AVEC SUCCES !
echo ========================================================
pause
`;

  const safeFolderName = targetFolder.replace(/[^a-z0-9]/gi, '_');

  // Générer des tags descriptifs basés sur les opérations choisies
  let tags = [];
  if (keepOriginals) {
    tags.push("copie");
  } else {
    tags.push("ecrase"); // on utilise "ecrase" partout sans sécurité
  }

  if (rename) tags.push("renomme");
  if (classify) {
    if (byYear && byMonth) tags.push("classe-A-M");
    else if (byYear) tags.push("classe-A");
  }

  const batFileName = `!_organisation_[${safeFolderName}]_${tags.join('_')}.bat`;

  await downloadBatFile(batContent, batFileName);
}

// === Générateur du script de Nettoyage EXIF (Kärcher) (Étape 3 / V3) ===
async function generateCleanScript() {
  const targetFolder = document.getElementById('batchFolderNameHidden').value;

  if (!targetFolder) {
    showToast("Sécurité : Veuillez d'abord cliquer sur 'Choisir le dossier' (Étape 1) pour désigner le dossier cible sur votre disque.");
    return;
  }

  // La commande ExifTool pour tout supprimer est -all=
  // On utilise -o pour forcer la création d'une copie purifiée afin de ne JAMAIS détruire l'original par erreur
  // La commande ExifTool pour tout supprimer est -all=
  // On utilise -o pour forcer la création d'une copie purifiée afin de ne JAMAIS détruire l'original par erreur
  const exifCommand = `exiftool -all= -o "%%d%%f_geophoto.%%e" .`;

  // Extraction du nom final du dossier pour la vérification de sécurité
  const targetFolderName = targetFolder.split(/[\\/]/).filter(Boolean).pop();

  const batContent = `@echo off
setlocal enabledelayedexpansion
chcp 65001 >nul

echo ========================================================
echo   GeoPhoto Editor - NETTOYAGE EXIF TOTAL (Karcher)
echo ========================================================
echo.

:: --- VERIFICATION DE SECURITE DU DOSSIER CIBLE ---
for %%I in (".") do set "currentFolder=%%~nxI"
set "targetFolder=${targetFolder}"
set "targetFolderName=${targetFolderName}"

if /i not "!currentFolder!"=="!targetFolderName!" (
    color 0c
    echo [ERREUR DE SECURITE CRITIQUE]
    echo.
    echo Ce script de nettoyage est prevu pour le dossier :
    echo -^> "!targetFolder!"
    echo Mais execute dans         :
    echo -^> "!currentFolder!"
    echo.
    pause
    exit /b
)
:: --- FIN SECURITE ---

color 4f
echo ATTENTION : Vous etes sur le point de SUPPRIMER DEFINITIVEMENT
echo TOUTES les metadonnees (Dates, GPS, Appareil) des photos.
echo.
echo Par securite, de nouvelles images "nom_geophoto.jpg"
echo totalement vierges seront creees pour ne pas detruire vos originaux.
echo.
echo Appuyez sur une touche pour PURIFIER les fichiers...
pause >nul

echo.
echo Nettoyage en cours...
color 07
${exifCommand}

echo.
echo ========================================================
echo   NETTOYAGE TERMINE AVEC SUCCES !
echo   Vos nouvelles photos sont pretes for le web.
echo ========================================================
pause
`;

  const safeFolderName = targetFolder.replace(/[^a-z0-9]/gi, '_');
  const batFileName = `!_nettoyage_exif_[${safeFolderName}]_${getTimestamp()}.bat`;

  await downloadBatFile(batContent, batFileName);
}

// ==========================================
// MODE 2 : SÉLECTION VISUELLE (MULTI-IMAGE)
// ==========================================

let visualMap = null;
let visualMarker = null;
let multiImages = [];
let focusedImageId = null;

// DOM Elements - Visual Mode
const multiImageInput = document.getElementById("multiImageInput");
const visualLoadingIndicator = document.getElementById("visualLoadingIndicator");
const visualContentSection = document.getElementById("visualContentSection");
const fileTableBody = document.getElementById("fileTableBody");
const selectAllImages = document.getElementById("selectAllImages");
const selectedCountEl = document.getElementById("selectedCount");

const visualPreview = document.getElementById("visualPreview");
const focusPlaceholder = document.getElementById("focusPlaceholder");
const focusBanner = document.getElementById("focusBanner");
const focusBannerName = document.getElementById("focusBannerName");
const focusBannerMod = document.getElementById("focusBannerMod");

const visualApplyDateCheck = document.getElementById("visualApplyDateCheck");
const visualDatetimeInput = document.getElementById("visualDatetimeInput");
const visualApplyGPSCheck = document.getElementById("visualApplyGPSCheck");
const visualLatInput = document.getElementById("visualLat");
const visualLngInput = document.getElementById("visualLng");

// --- Visual Mode: Event Listeners ---

if (multiImageInput) {
  multiImageInput.addEventListener("change", handleMultiFiles);
}

// Search on Enter key for Visual Mode
const visualSearchInputElement = document.getElementById('visualSearchLocation');
if (visualSearchInputElement) {
  visualSearchInputElement.addEventListener('keypress', function (e) {
    if (e.key === 'Enter') {
      e.preventDefault();
      searchCityVisual();
    }
  });
}

if (selectAllImages) {
  selectAllImages.addEventListener('change', function () {
    toggleSelectAll(this);
  });
}

const btnApplySelected = document.getElementById("btnApplySelected");
if (btnApplySelected) btnApplySelected.addEventListener('click', applyModificationsToSelected);

const btnGenerateVisualScript = document.getElementById("btnGenerateVisualScript");
if (btnGenerateVisualScript) btnGenerateVisualScript.addEventListener('click', generateVisualScript);

const btnRemoveGPS = document.getElementById("btnRemoveGPS");
if (btnRemoveGPS) btnRemoveGPS.addEventListener('click', generateVisualSecurityScript);

// --- Visual Mode: Folder Validation ---

function validateVisualFolder() {
  const inputEl = document.getElementById('visualFolderPathInput');
  const path = inputEl.value.trim();
  const display = document.getElementById('visualFolderStatusText');
  const browseArea = document.getElementById('visualBrowseArea');

  if (!path) {
    display.textContent = "Aucun dossier validé";
    display.style.color = "var(--text-muted)";
    inputEl.style.cssText = "flex: 1; padding: 0.75rem; border: 1px solid var(--border); border-radius: 4px; background-color: #0f172a; color: #f8fafc; font-family: monospace; font-size: 0.95rem; -webkit-appearance: none; appearance: none;";
    inputEl.classList.remove('folder-validated');
    browseArea.style.opacity = "0.5";
    browseArea.style.pointerEvents = "none";
    browseArea.style.cursor = "not-allowed";
    showToast("Veuillez d'abord coller le chemin d'origine du dossier.", "warning");
    return;
  }

  let cleanPath = path.replace(/^["']|["']$/g, '');
  inputEl.value = cleanPath;
  inputEl.style.cssText = "flex: 1; padding: 0.75rem; border: 2px solid #10b981; border-radius: 4px; background-color: #0f172a; color: #10b981; -webkit-text-fill-color: #10b981; font-family: monospace; font-size: 0.95rem; -webkit-appearance: none; appearance: none;";
  inputEl.classList.add('folder-validated');
  display.textContent = "Dossier validé !";
  display.style.color = "#10b981";

  browseArea.style.opacity = "1";
  browseArea.style.pointerEvents = "auto";
  browseArea.style.cursor = "pointer";

  showToast("Chemin validé. Vous pouvez maintenant 'Parcourir' pour sélectionner les images.", "success");
}

// --- Visual Mode: Core Functions ---

async function handleMultiFiles(e) {
  const files = Array.from(e.target.files).filter(f => f.type === "image/jpeg" || f.name.toLowerCase().endsWith('.jpg') || f.name.toLowerCase().endsWith('.jpeg'));

  if (files.length === 0) {
    showToast("Aucune image JPEG trouvée dans ce dossier.", "error");
    return;
  }

  // --- SÉCURITÉ : Vérifier la cohérence entre Étape 1 et Étape 2 ---
  const step1Path = document.getElementById('visualFolderPathInput').value.trim();
  if (step1Path && files[0].webkitRelativePath) {
    const browsedFolderName = files[0].webkitRelativePath.split('/')[0];
    // Extraire le dernier segment du chemin de l'étape 1
    const step1FolderName = step1Path.replace(/[\\/]+$/, '').split(/[\\/]/).pop();

    if (browsedFolderName.toLowerCase() !== step1FolderName.toLowerCase()) {
      const continuer = confirm(
        `⚠️ ATTENTION : Incohérence de dossier détectée !\n\n` +
        `• Étape 1 (chemin collé) : "${step1FolderName}"\n` +
        `• Étape 2 (dossier parcouru) : "${browsedFolderName}"\n\n` +
        `Le script .bat généré ciblera le dossier de l'Étape 1.\n` +
        `Si les dossiers sont différents, le script ne fonctionnera pas.\n\n` +
        `Voulez-vous continuer quand même ?`
      );
      if (!continuer) {
        // Réinitialiser l'input file pour permettre une nouvelle sélection
        e.target.value = '';
        showToast("Chargement annulé. Veuillez corriger le chemin de l'Étape 1 ou sélectionner le bon dossier.", "warning");
        return;
      }
    }
  }

  const uploadArea = document.querySelector('.upload-area-mini');
  if (uploadArea) uploadArea.style.display = 'none';

  visualLoadingIndicator.style.display = "flex";
  visualContentSection.style.display = "none";

  multiImages = [];
  focusedImageId = null;

  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    const dataUrl = await readFileAsDataURLVisual(file);
    const imgData = extractEXIFForMulti(dataUrl, file.name, i);
    multiImages.push({
      id: i,
      file: file,
      name: file.name,
      originalDataUrl: dataUrl,
      exifObjOriginal: imgData.exifObj,
      dateToApply: null,
      latToApply: null,
      lngToApply: null,
      ...imgData.parsed
    });
  }

  if (selectAllImages) selectAllImages.checked = false;

  renderVisualTable();
  updateVisualSelectionCount();

  visualLoadingIndicator.style.display = "none";
  visualContentSection.style.display = "grid";

  setTimeout(() => { if (visualMap) visualMap.invalidateSize(); }, 400);

  if (multiImages.length > 0) {
    focusImage(0);
  }
}

function readFileAsDataURLVisual(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = e => resolve(e.target.result);
    reader.onerror = e => reject(e);
    reader.readAsDataURL(file);
  });
}

function extractEXIFForMulti(dataUrl, fileName, id) {
  let parsed = { dateStr: "-", lat: null, lng: null, isModified: false, isSecured: false };
  let exifObj = {};
  try {
    exifObj = piexif.load(dataUrl);
    const ifd0 = exifObj["0th"] || {};
    const exif = exifObj["Exif"] || {};
    const gps = exifObj["GPS"];

    let dateTimeStr = exif[piexif.ExifIFD.DateTimeOriginal] || ifd0[piexif.ImageIFD.DateTime];
    if (dateTimeStr) {
      parsed.dateStr = dateTimeStr;
    }

    if (gps && gps[piexif.GPSIFD.GPSLatitude] && gps[piexif.GPSIFD.GPSLongitude]) {
      parsed.lat = parseFloat(dmsToDecimal(gps[piexif.GPSIFD.GPSLatitude], gps[piexif.GPSIFD.GPSLatitudeRef]));
      parsed.lng = parseFloat(dmsToDecimal(gps[piexif.GPSIFD.GPSLongitude], gps[piexif.GPSIFD.GPSLongitudeRef]));
    }
  } catch (err) {
    console.warn(`Erreur EXIF pour ${fileName}`, err);
  }
  return { exifObj, parsed };
}

function renderVisualTable() {
  if (!fileTableBody) return;
  fileTableBody.innerHTML = '';

  multiImages.forEach(img => {
    const tr = document.createElement("tr");
    tr.id = `row-${img.id}`;
    if (img.id === focusedImageId) tr.classList.add('focus-row');

    tr.onclick = (e) => {
      if (e.target.tagName.toLowerCase() !== 'input') {
        focusImage(img.id);
      }
    };

    let gpsText = img.lat !== null && !isNaN(img.lat) ? `${img.lat.toFixed(4)}, ${img.lng.toFixed(4)}` : `<span style="color:var(--text-muted)">Aucun GPS</span>`;
    let badges = "";
    if (img.isModified) badges += `<span class="status-badge modified">MODIFIÉ</span>`;
    if (img.isSecured) badges += `<span class="status-badge secured">SÉCURISÉ</span>`;

    let dateDisplay = img.dateStr && img.dateStr !== "-" ? img.dateStr.replace(/:/g, '/').replace("T", " ") : "-";

    tr.innerHTML = `
      <td style="text-align: center;" onclick="event.stopPropagation()">
        <input type="checkbox" class="row-checkbox" value="${img.id}" onchange="updateVisualSelectionCount()" style="width:16px; height:16px; cursor:pointer;">
      </td>
      <td style="font-weight: 500;">${img.name} ${badges}</td>
      <td style="font-family: monospace; font-size: 0.85rem;">${dateDisplay}</td>
      <td style="font-family: monospace; font-size: 0.85rem;">${gpsText}</td>
    `;
    fileTableBody.appendChild(tr);
  });
}

function toggleSelectAll(cb) {
  const checkboxes = document.querySelectorAll('.row-checkbox');
  checkboxes.forEach(c => c.checked = cb.checked);
  updateVisualSelectionCount();
}

function updateVisualSelectionCount() {
  if (!selectedCountEl) return;
  const count = document.querySelectorAll('.row-checkbox:checked').length;
  selectedCountEl.textContent = count;

  const btnApply = document.getElementById("btnApplySelected");
  const btnGen = document.getElementById("btnGenerateVisualScript");
  const btnRemGPS = document.getElementById("btnRemoveGPS");

  [btnApply, btnGen, btnRemGPS].forEach(btn => {
    if (btn) btn.disabled = count === 0;
  });
}

function focusImage(id) {
  document.querySelectorAll('.file-table tbody tr').forEach(tr => tr.classList.remove('focus-row'));
  const row = document.getElementById(`row-${id}`);
  if (row) row.classList.add('focus-row');

  focusedImageId = id;
  const img = multiImages.find(i => i.id === id);
  if (!img) return;

  if (visualPreview) {
    visualPreview.src = img.originalDataUrl;
    visualPreview.style.display = "block";
    visualPreview.style.opacity = "1";
  }
  if (focusPlaceholder) focusPlaceholder.style.display = "none";
  if (focusBanner) focusBanner.style.display = "flex";
  if (focusBannerName) focusBannerName.textContent = img.name;
  if (focusBannerMod) focusBannerMod.style.display = img.isModified || img.isSecured ? "inline-block" : "none";

  if (visualDatetimeInput) {
    if (img.dateStr !== "-") {
      visualDatetimeInput.value = img.dateStr.substring(0, 10).replace(/:/g, '-') + 'T' + img.dateStr.substring(11);
    } else {
      visualDatetimeInput.value = "";
    }
  }

  if (img.lat !== null && !isNaN(img.lat)) {
    if (visualLatInput) visualLatInput.value = img.lat;
    if (visualLngInput) visualLngInput.value = img.lng;
    updateVisualMap(parseFloat(img.lat), parseFloat(img.lng));
  } else {
    resetVisualMap();
  }
}

// --- Visual Mode: Map Functions (Independent from Mode 1) ---

function resetVisualMap() {
  if (visualLatInput) visualLatInput.value = "";
  if (visualLngInput) visualLngInput.value = "";
  updateVisualMap(48.8566, 2.3522);
  if (visualMarker && visualMap) {
    visualMap.removeLayer(visualMarker);
    visualMarker = null;
  }
}

function updateVisualMap(lat, lng) {
  if (!visualMap) {
    visualMap = L.map('visualMap', { zoomControl: false }).setView([lat, lng], 13);
    L.control.zoom({ position: 'bottomright' }).addTo(visualMap);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors',
      maxZoom: 19
    }).addTo(visualMap);

    visualMap.on('click', function (e) {
      if (visualLatInput) visualLatInput.value = e.latlng.lat.toFixed(6);
      if (visualLngInput) visualLngInput.value = e.latlng.lng.toFixed(6);
      updateVisualMarker(e.latlng.lat, e.latlng.lng);
    });
  } else {
    visualMap.setView([lat, lng], 13);
  }
  updateVisualMarker(lat, lng);
}

function updateVisualMarker(lat, lng) {
  if (!visualMarker && visualMap) {
    visualMarker = L.marker([lat, lng], { draggable: false }).addTo(visualMap);
  } else if (visualMarker) {
    visualMarker.setLatLng([lat, lng]);
  }
}

// --- Visual Mode: Search & Geolocation ---

async function searchCityVisual() {
  const searchInput = document.getElementById('visualSearchLocation');
  const query = searchInput.value.trim();
  if (!query) {
    showToast("Veuillez entrer une ville ou un code postal.");
    return;
  }

  const btn = searchInput.nextElementSibling;
  const originalHTML = btn.innerHTML;
  btn.innerHTML = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="animate-spin"><circle cx="12" cy="12" r="10"></circle></svg>`;

  try {
    const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=5&accept-language=fr`);
    const data = await response.json();
    if (data && data.length > 0) {
      const lat = parseFloat(data[0].lat);
      const lng = parseFloat(data[0].lon);
      if (visualLatInput) visualLatInput.value = lat.toFixed(6);
      if (visualLngInput) visualLngInput.value = lng.toFixed(6);
      updateVisualMap(lat, lng);
    } else {
      showToast("Aucun lieu trouvé pour cette recherche.");
    }
  } catch (error) {
    console.error("Erreur de recherche:", error);
    showToast("Erreur réseau lors de la recherche du lieu.");
  } finally {
    btn.innerHTML = originalHTML;
  }
}

function getVisualCurrentLocation() {
  if (navigator.geolocation) {
    showToast("Recherche de votre position...", "info");
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;
        if (visualLatInput) visualLatInput.value = lat.toFixed(6);
        if (visualLngInput) visualLngInput.value = lng.toFixed(6);
        updateVisualMap(lat, lng);
        showToast("Position trouvée !", "success");
      },
      (error) => {
        console.error("Erreur géolocalisation:", error);
        showToast("Impossible d'obtenir votre position.", "error");
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  } else {
    showToast("La géolocalisation n'est pas supportée par votre navigateur.", "error");
  }
}

// --- Visual Mode: Action Handlers ---

function getSelectedImageIds() {
  return Array.from(document.querySelectorAll('.row-checkbox:checked')).map(cb => parseInt(cb.value));
}

function applyModificationsToSelected() {
  const ids = getSelectedImageIds();
  if (ids.length === 0) return;

  const btn = document.getElementById("btnApplySelected");
  const origHtml = btn.innerHTML;
  btn.innerHTML = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" class="animate-spin"><circle cx="12" cy="12" r="10"></circle></svg> Application...`;

  const applyGPS = visualApplyGPSCheck.checked;
  const newLat = parseFloat(visualLatInput.value);
  const newLng = parseFloat(visualLngInput.value);

  const applyDate = visualApplyDateCheck.checked;
  const newDateVal = visualDatetimeInput.value;

  if (!applyGPS && !applyDate) {
    showToast("Veuillez cocher au moins une des deux actions : Date ou GPS", "info");
    btn.innerHTML = origHtml;
    return;
  }
  if (applyGPS && (isNaN(newLat) || isNaN(newLng))) {
    showToast("Coordonnées GPS invalides", "error");
    btn.innerHTML = origHtml;
    return;
  }
  if (applyDate && !newDateVal) {
    showToast("Date/Heure invalide", "error");
    btn.innerHTML = origHtml;
    return;
  }

  setTimeout(() => {
    ids.forEach(id => {
      const img = multiImages.find(i => i.id === id);
      if (!img) return;

      if (applyDate) {
        const exifDateTime = newDateVal.replace(/-/, ':').replace(/-/, ':').replace('T', ' ');
        img.dateToApply = exifDateTime;
        img.dateStr = exifDateTime;
        img.isModified = true;
      }

      if (applyGPS) {
        img.latToApply = newLat;
        img.lngToApply = newLng;
        img.lat = newLat;
        img.lng = newLng;
        img.isModified = true;
      }
    });

    renderVisualTable();
    ids.forEach(id => {
      const cb = document.querySelector(`.row-checkbox[value="${id}"]`);
      if (cb) cb.checked = true;
    });
    updateVisualSelectionCount();

    if (focusedImageId !== null) focusImage(focusedImageId);

    btn.innerHTML = origHtml;
    showToast(`${ids.length} photo(s) préparées en mémoire. Cliquez ensuite sur "Générer Script Modif" !`, "success");
  }, 50);
}

// --- Visual Mode: Script Generators ---

async function downloadBatFile(content, filename) {
  // Tentative via File System Access API (Dialogue "Enregistrer sous")
  if ('showSaveFilePicker' in window) {
    try {
      const handle = await window.showSaveFilePicker({
        suggestedName: filename,
        types: [{
          description: 'Script Batch Windows',
          accept: { 'text/plain': ['.bat'] },
        }],
      });
      const writable = await handle.createWritable();
      await writable.write(content);
      await writable.close();
      showToast(`Fichier enregistré : ${filename}`, "success");
      return;
    } catch (err) {
      if (err.name === 'AbortError') return; // L'utilisateur a annulé
      console.warn("showSaveFilePicker a échoué, repli sur le téléchargement classique", err);
    }
  }

  // Repli classique (Téléchargement forcé dans "Téléchargements")
  const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
  showToast(`Script généré : ${filename}`, "success");
}

function getTimestamp() {
  const now = new Date();
  return `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}_${String(now.getHours()).padStart(2, '0')}${String(now.getMinutes()).padStart(2, '0')}`;
}

function getBatSecurityCheck(targetFolder) {
  // Extract just the last folder name for comparison
  const targetFolderName = targetFolder.split(/[\\/]/).filter(Boolean).pop();
  // Uses %variable% syntax (NOT !variable!) — compatible with -o! in exiftool commands
  return `:: --- VERIFICATION DE SECURITE DU DOSSIER CIBLE ---\r\nfor %%I in (".") do set "currentFolder=%%~nxI"\r\nset "targetFolderName=${targetFolderName}"\r\nset "targetFullPath=${targetFolder}"\r\n\r\nif /i not "%currentFolder%"=="%targetFolderName%" (\r\n    color 0c\r\n    echo.\r\n    echo [ERREUR DE SECURITE CRITIQUE]\r\n    echo.\r\n    echo Ce script a ete concu SPECIFIQUEMENT pour le dossier :\r\n    echo -^> "%targetFullPath%"\r\n    echo.\r\n    echo Mais vous l'avez execute depuis le dossier :\r\n    echo -^> "%cd%"\r\n    echo.\r\n    echo Par securite, le traitement est annule.\r\n    echo Merci de deplacer ce fichier .bat dans le BON dossier.\r\n    echo.\r\n    pause\r\n    exit /b\r\n)\r\necho Dossier verifie : OK\r\necho.\r\n:: --- FIN SECURITE ---\r\n`;
}

async function generateVisualScript() {
  const targetFolder = document.getElementById('visualFolderPathInput').value.trim();
  const keepOriginals = document.getElementById('visualKeepOriginals').checked;

  if (!targetFolder) {
    showToast("Vous devez d'abord coller le chemin d'origine du dossier (Étape 1).", "error");
    return;
  }

  const ids = getSelectedImageIds();
  if (ids.length === 0) return;

  const modifiedImages = ids.map(id => multiImages.find(i => i.id === id)).filter(img => img && img.isModified);

  if (modifiedImages.length === 0) {
    showToast("Aucune photo sélectionnée n'a été modifiée. Faites 'Appliquer' d'abord.", "warning");
    return;
  }

  // Detect what types of modifications were applied
  let hasDate = modifiedImages.some(img => img.dateToApply);
  let hasGPS = modifiedImages.some(img => img.latToApply !== null && img.lngToApply !== null);

  let cleanFolder = targetFolder;
  if (!cleanFolder.endsWith('\\')) cleanFolder += '\\';

  // NOTE: PAS de enabledelayedexpansion ici ! Le ! de -o! serait consommé par le batch
  let batContent = `@echo off\r\nchcp 65001 >nul\r\n\r\necho ========================================================\r\necho   GeoPhoto Editor - Script Visuel (${modifiedImages.length} photos)\r\necho ========================================================\r\necho.\r\necho Options : ${keepOriginals ? 'GARDER les originaux (copie _geophoto)' : 'ECRASER les originaux'}\r\necho Modifs  : ${hasDate ? '[X]' : '[ ]'} Date   ${hasGPS ? '[X]' : '[ ]'} GPS\r\necho.\r\n`;

  // Add security check
  batContent += getBatSecurityCheck(targetFolder);

  batContent += `echo Appuyez sur une touche pour commencer le traitement...\r\npause >nul\r\necho.\r\necho Traitement en cours... Veuillez patienter !\r\necho.\r\n\r\n`;

  modifiedImages.forEach(img => {
    let params = [];

    if (img.dateToApply) {
      params.push(`-DateTimeOriginal="${img.dateToApply}" -CreateDate="${img.dateToApply}"`);
    }

    if (img.latToApply !== null && img.lngToApply !== null) {
      const latRef = img.latToApply >= 0 ? 'N' : 'S';
      const lonRef = img.lngToApply >= 0 ? 'E' : 'W';
      params.push(`-GPSLatitude="${Math.abs(img.latToApply)}" -GPSLatitudeRef="${latRef}" -GPSLongitude="${Math.abs(img.lngToApply)}" -GPSLongitudeRef="${lonRef}"`);
    }

    // Build the command per file
    if (keepOriginals) {
      // Strategy: copy original to _geophoto, then modify the copy in-place
      const nameParts = img.name.split('.');
      const ext = nameParts.pop();
      const baseName = nameParts.join('.');
      batContent += `copy /Y "${cleanFolder}${img.name}" "${cleanFolder}${baseName}_geophoto.${ext}"\r\n`;
      batContent += `exiftool -overwrite_original ${params.join(' ')} "${cleanFolder}${baseName}_geophoto.${ext}"\r\n`;
    } else {
      // Overwrite original
      batContent += `exiftool -overwrite_original ${params.join(' ')} "${cleanFolder}${img.name}"\r\n`;
    }
  });

  batContent += `\r\necho.\r\necho ========================================================\r\necho   TRAITEMENT TERMINE AVEC SUCCES ! (${modifiedImages.length} photos)\r\necho ========================================================\r\npause\r\n`;

  // Build filename: !_visuel_[folder]_copie_date_gps_20260302_2329.bat
  const safeFolderName = targetFolder.replace(/[^a-z0-9]/gi, '_');
  let tags = [];
  if (keepOriginals) tags.push("copie"); else tags.push("ecrase");
  if (hasDate) tags.push("date");
  if (hasGPS) tags.push("gps");
  const batFileName = `!_visuel_[${safeFolderName}]_${tags.join('_')}_${getTimestamp()}.bat`;

  await downloadBatFile(batContent, batFileName);
}

async function generateVisualSecurityScript() {
  const targetFolder = document.getElementById('visualFolderPathInput').value.trim();
  const keepOriginals = document.getElementById('visualKeepOriginals').checked;

  if (!targetFolder) {
    showToast("Vous devez d'abord coller le chemin d'origine du dossier (Étape 1).", "error");
    return;
  }

  const ids = getSelectedImageIds();
  if (ids.length === 0) return;

  let cleanFolder = targetFolder;
  if (!cleanFolder.endsWith('\\')) cleanFolder += '\\';

  // NOTE: PAS de enabledelayedexpansion ici !
  let batContent = `@echo off\r\nchcp 65001 >nul\r\n\r\necho ========================================================\r\necho   GeoPhoto Editor - NETTOYAGE EXIF TOTAL (${ids.length} photos)\r\necho ========================================================\r\necho.\r\necho ATTENTION : Ce script va SUPPRIMER DEFINITIVEMENT\r\necho TOUTES les metadonnees (Dates, GPS, Appareil, etc.)\r\necho des photos selectionnees.\r\necho.\r\necho Option : ${keepOriginals ? 'GARDER les originaux (copie _geophoto)' : 'ECRASER les originaux (Attention !)'}\r\necho.\r\n`;

  // Add security check
  batContent += getBatSecurityCheck(targetFolder);

  batContent += `echo Appuyez sur une touche pour PURIFIER les fichiers...\r\npause >nul\r\necho.\r\necho Nettoyage en cours...\r\necho.\r\n\r\n`;

  ids.forEach(id => {
    const img = multiImages.find(i => i.id === id);
    if (!img) return;

    if (keepOriginals) {
      // Strategy: copy original to _geophoto, then strip ALL exif from the copy
      const nameParts = img.name.split('.');
      const ext = nameParts.pop();
      const baseName = nameParts.join('.');
      batContent += `copy /Y "${cleanFolder}${img.name}" "${cleanFolder}${baseName}_geophoto.${ext}"\r\n`;
      batContent += `exiftool -overwrite_original -all= "${cleanFolder}${baseName}_geophoto.${ext}"\r\n`;
    } else {
      // Overwrite original — strip all exif in-place
      batContent += `exiftool -overwrite_original -all= "${cleanFolder}${img.name}"\r\n`;
    }

    img.isSecured = true;
    img.lat = null;
    img.lng = null;
  });

  batContent += `\r\necho.\r\necho ========================================================\r\necho   NETTOYAGE TERMINE AVEC SUCCES ! (${ids.length} photos)\r\necho   Toutes les metadonnees ont ete supprimees.\r\necho ========================================================\r\npause\r\n`;

  const safeFolderName = targetFolder.replace(/[^a-z0-9]/gi, '_');
  const batFileName = `!_visuel_[${safeFolderName}]_${keepOriginals ? 'copie' : 'ecrase'}_purge_${getTimestamp()}.bat`;

  await downloadBatFile(batContent, batFileName);
}
