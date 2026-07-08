// ============================================================
// Visual Suite — Módulo de Mapas (Leaflet + OSM)
// ============================================================

let mapInstance = null;
let markersLayer = null;
const markerList = [];

function initMaps() {
  setTimeout(() => {
    const container = document.getElementById('mapContainer');
    if (!container) return;
    if (container._leaflet_id) return;

    mapInstance = L.map(container, {
      center: [-34.6, -68.3],
      zoom: 8,
      zoomControl: true
    });

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a>',
      maxZoom: 19
    }).addTo(mapInstance);

    markersLayer = L.layerGroup().addTo(mapInstance);

    setTimeout(() => mapInstance.invalidateSize(), 300);
  }, 200);
}

function buscarUbicacion() {
  const q = document.getElementById('mapSearchInput').value.trim();
  if (!q) return toast('Ingresá una ubicación');

  fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(q)}&limit=5&accept-language=es`)
    .then(r => r.json())
    .then(data => {
      if (!data.length) return toast('Ubicación no encontrada');

      const loc = data[0];
      const lat = parseFloat(loc.lat);
      const lon = parseFloat(loc.lon);

      mapInstance.setView([lat, lon], 13);

      agregarMarcadorCoords(lat, lon, loc.display_name.split(',')[0], loc.display_name);
    })
    .catch(() => toast('Error al buscar ubicación'));
}

function agregarMarcador() {
  const title = document.getElementById('markerTitle').value.trim();
  const desc = document.getElementById('markerDesc').value.trim();
  if (!title) return toast('Ingresá un título para el marcador');

  const center = mapInstance.getCenter();
  agregarMarcadorCoords(center.lat, center.lng, title, desc || title);
  document.getElementById('markerTitle').value = '';
  document.getElementById('markerDesc').value = '';
}

function agregarMarcadorCoords(lat, lng, title, desc) {
  const marker = L.marker([lat, lng])
    .bindPopup(`<b>${title}</b>${desc !== title ? '<br>' + desc : ''}`)
    .addTo(markersLayer);

  markerList.push({ lat, lng, title, desc, marker });
  actualizarContadorMarcadores();
  toast(`Marcador agregado: ${title}`);
}

function limpiarMarcadores() {
  markersLayer.clearLayers();
  markerList.length = 0;
  actualizarContadorMarcadores();
  toast('Marcadores eliminados');
}

function actualizarContadorMarcadores() {
  document.getElementById('markerCount').textContent = `${markerList.length} marcadores`;
}

document.addEventListener('DOMContentLoaded', initMaps);
