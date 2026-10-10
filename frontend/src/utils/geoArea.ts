// Radius of Earth in meters
const EARTH_RADIUS = 6378137;

export function calculateCircleArea(radiusMeters: number): number {
  if (!radiusMeters || radiusMeters <= 0) return 0;
  return Math.PI * radiusMeters * radiusMeters;
}

function toRadians(degrees: number): number {
  return (degrees * Math.PI) / 180;
}

function ringArea(coordinates: number[][]): number {
  if (!coordinates || coordinates.length < 3) return 0;

  let totalAngle = 0;
  const len = coordinates.length;

  for (let i = 0; i < len; i++) {
    const p1 = coordinates[i];
    const p2 = coordinates[(i + 1) % len];
    const p3 = coordinates[(i + 2) % len];

    const lon1 = toRadians(p1[0]);
    const lat2 = toRadians(p2[1]);
    const lon3 = toRadians(p3[0]);

    totalAngle += (lon3 - lon1) * Math.sin(lat2);
  }

  const area = (Math.abs(totalAngle) * EARTH_RADIUS * EARTH_RADIUS) / 2;
  return area;
}

export function calculatePolygonArea(geojson: any): number {
  if (!geojson) return 0;

  let data = geojson;
  if (typeof geojson === 'string') {
    try {
      data = JSON.parse(geojson);
    } catch {
      return 0;
    }
  }

  if (!data || !data.type) return 0;

  let totalArea = 0;

  if (data.type === 'Polygon' && Array.isArray(data.coordinates)) {
    if (data.coordinates.length > 0) {
      totalArea += ringArea(data.coordinates[0]);
      for (let i = 1; i < data.coordinates.length; i++) {
        totalArea -= ringArea(data.coordinates[i]);
      }
    }
  } else if (data.type === 'MultiPolygon' && Array.isArray(data.coordinates)) {
    for (const polygon of data.coordinates) {
      if (Array.isArray(polygon) && polygon.length > 0) {
        let polyArea = ringArea(polygon[0]);
        for (let i = 1; i < polygon.length; i++) {
          polyArea -= ringArea(polygon[i]);
        }
        totalArea += Math.max(0, polyArea);
      }
    }
  } else if (data.type === 'Feature' && data.geometry) {
    return calculatePolygonArea(data.geometry);
  }

  return Math.max(0, totalArea);
}

function formatNumber(num: number): string {
  return new Intl.NumberFormat('en-US').format(num);
}

export function formatArea(areaMetersSquared: number): string {
  if (!areaMetersSquared || areaMetersSquared <= 0) return '0 m²';

  if (areaMetersSquared < 10000) {
    return `${formatNumber(Math.round(areaMetersSquared))} m²`;
  } else if (areaMetersSquared < 1000000) {
    const hectares = areaMetersSquared / 10000;
    const formatted = hectares >= 10 ? formatNumber(Math.round(hectares)) : hectares.toFixed(1);
    return `${formatted} ha`;
  } else {
    const km2 = areaMetersSquared / 1000000;
    const formatted = km2 >= 100 ? formatNumber(Math.round(km2)) : km2.toFixed(1);
    return `${formatted} km²`;
  }
}

export function formatCoordinates(lat: number, lng: number): string {
  const latDir = lat >= 0 ? 'N' : 'S';
  const lngDir = lng >= 0 ? 'E' : 'W';
  return `${Math.abs(lat).toFixed(4)}° ${latDir}, ${Math.abs(lng).toFixed(4)}° ${lngDir}`;
}
