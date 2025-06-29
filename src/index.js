import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { parseCoords, computeCenters } from './geo.js';

const map = L.map('map').setView([39, -98], 4);
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(map);

const markers = [];

function clearMap() {
  markers.forEach(m => m.remove());
  markers.length = 0;
}

function addMarker([lat, lon], color, label, isInput = false) {
  const marker = isInput
    ? L.marker([lat, lon], {
      icon: L.divIcon({
        className: 'custom-input-marker',
        html: `<div style="background:${color}; border-radius:50%; width:14px; height:14px; border:2px solid white;"></div>`
      })
    })
    : L.circleMarker([lat, lon], {
      radius: 8,
      color,
      fillColor: color,
      fillOpacity: 0.8
    });
  marker.bindPopup(label).addTo(map);
  markers.push(marker);
}

document.getElementById('compute').addEventListener('click', () => {
  try {
    const input = document.getElementById('coords').value;
    const coords = parseCoords(input);

    clearMap();
    // Add points
    coords.forEach(([lat, lon], i) => {
      addMarker([lat, lon], '#6666ff', `Input Point ${i + 1}`, true);
    });

    // Compute centers
    const centers = computeCenters(coords);

    // Add center markers
    // addMarker(centers.centroid, 'blue', 'Centroid');
    addMarker(centers.geomMedian, 'green', 'Geometric Median');
    // addMarker(centers.weighted, 'red', 'Weighted Center');
    map.flyTo(centers.geomMedian, 10);
  } catch (err) {
    alert(err.message);
  }
});
