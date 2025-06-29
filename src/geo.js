// geo.js

// Haversine distance in meters
export function haversine([lat1, lon1], [lat2, lon2]) {
  const R = 6371000; // Earth radius in meters
  const toRad = deg => deg * Math.PI / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a = Math.sin(dLat / 2) ** 2 +
            Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
            Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(a));
}

// Weighted average of coordinates
export function weightedAverage(coords, weights) {
  const totalWeight = weights.reduce((a, b) => a + b, 0);
  const lat = coords.reduce((sum, [lat], i) => sum + weights[i] * lat, 0) / totalWeight;
  const lon = coords.reduce((sum, [, lon], i) => sum + weights[i] * lon, 0) / totalWeight;
  return [lat, lon];
}

// Centroid (arithmetic mean)
export function computeCentroid(coords) {
  const lat = coords.reduce((sum, [lat]) => sum + lat, 0) / coords.length;
  const lon = coords.reduce((sum, [, lon]) => sum + lon, 0) / coords.length;
  return [lat, lon];
}

// Geometric median (Weiszfeld's algorithm)
export function computeGeometricMedian(coords, tolerance = 1e-5, maxIterations = 100) {
  let current = computeCentroid(coords);

  for (let iter = 0; iter < maxIterations; iter++) {
    const distances = coords.map(p => haversine(current, p));
    const weights = distances.map(d => 1 / Math.max(d, 1e-10));
    const next = weightedAverage(coords, weights);
    if (haversine(current, next) < tolerance) break;
    current = next;
  }

  return current;
}

// Exponential falloff function (adjustable scale)
function falloff(distance, scale = 200000) {
  return Math.exp(-distance / scale);
}

// Weighted centerpoint (iterative exponential weighting)
export function computeWeightedCenter(coords, scale = 200000, tolerance = 1.0, maxIterations = 100) {
  let current = computeCentroid(coords);

  for (let iter = 0; iter < maxIterations; iter++) {
    const distances = coords.map(p => haversine(current, p));
    const weights = distances.map(d => falloff(d, scale));
    const next = weightedAverage(coords, weights);
    if (haversine(current, next) < tolerance) break;
    current = next;
  }

  return current;
}

// Convenience wrapper to compute all centers at once
export function computeCenters(coords) {
  return {
    centroid: computeCentroid(coords),
    geomMedian: computeGeometricMedian(coords),
    weighted: computeWeightedCenter(coords)
  };
}

// Parse textarea input into [lat, lon] pairs
export function parseCoords(input) {
  return input.trim().split('\n')
    .map(line => line.trim())
    .filter(line => line)
    .map(line => {
      // Remove surrounding brackets if present
      line = line.replace(/^\[|\]$/g, '').replace(/^\(|\)$/g, '');
      const parts = line.split(',').map(p => parseFloat(p.trim()));
      if (parts.length !== 2 || parts.some(isNaN)) {
        throw new Error(`Invalid coordinate format: '${line}'`);
      }
      return parts;
    });
}