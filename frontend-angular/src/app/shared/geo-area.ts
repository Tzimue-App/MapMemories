// Radius of Earth in meters
const EARTH_RADIUS = 6378137;

type Ring = number[][];

export function calculateCircleArea(radiusMeters: number): number {
  if (!radiusMeters || radiusMeters <= 0) return 0;
  return Math.PI * radiusMeters * radiusMeters;
}

const toRadians = (degrees: number): number => (degrees * Math.PI) / 180;

function ringArea(coordinates: Ring): number {
  if (!coordinates || coordinates.length < 3) return 0;

  let totalAngle = 0;
  const len = coordinates.length;

  for (let i = 0; i < len; i++) {
    const p1 = coordinates[i];
    const p2 = coordinates[(i + 1) % len];
    const p3 = coordinates[(i + 2) % len];
    totalAngle += (toRadians(p3[0]) - toRadians(p1[0])) * Math.sin(toRadians(p2[1]));
  }

  return (Math.abs(totalAngle) * EARTH_RADIUS * EARTH_RADIUS) / 2;
}

/** Area of an outer ring minus its holes. */
function polygonArea(rings: Ring[]): number {
  if (!Array.isArray(rings) || rings.length === 0) return 0;
  return rings.slice(1).reduce((area, hole) => area - ringArea(hole), ringArea(rings[0]));
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function parseGeoJson(geojson: unknown): any | null {
  if (!geojson) return null;
  if (typeof geojson !== 'string') return geojson;
  try {
    return JSON.parse(geojson);
  } catch {
    return null;
  }
}

export function calculatePolygonArea(geojson: unknown): number {
  const data = parseGeoJson(geojson);
  if (!data?.type) return 0;

  if (data.type === 'Feature' && data.geometry) {
    return calculatePolygonArea(data.geometry);
  }

  let totalArea = 0;
  if (data.type === 'Polygon' && Array.isArray(data.coordinates)) {
    totalArea = polygonArea(data.coordinates);
  } else if (data.type === 'MultiPolygon' && Array.isArray(data.coordinates)) {
    for (const polygon of data.coordinates as Ring[][]) {
      totalArea += Math.max(0, polygonArea(polygon));
    }
  }

  return Math.max(0, totalArea);
}

const formatNumber = (num: number): string => new Intl.NumberFormat('en-US').format(num);

export function formatArea(areaMetersSquared: number): string {
  if (!areaMetersSquared || areaMetersSquared <= 0) return '0 m²';

  if (areaMetersSquared < 10_000) {
    return `${formatNumber(Math.round(areaMetersSquared))} m²`;
  }
  if (areaMetersSquared < 1_000_000) {
    const hectares = areaMetersSquared / 10_000;
    return `${hectares >= 10 ? formatNumber(Math.round(hectares)) : hectares.toFixed(1)} ha`;
  }
  const km2 = areaMetersSquared / 1_000_000;
  return `${km2 >= 100 ? formatNumber(Math.round(km2)) : km2.toFixed(1)} km²`;
}

export function formatCoordinates(lat: number, lng: number): string {
  const latDir = lat >= 0 ? 'N' : 'S';
  const lngDir = lng >= 0 ? 'E' : 'W';
  return `${Math.abs(lat).toFixed(4)}° ${latDir}, ${Math.abs(lng).toFixed(4)}° ${lngDir}`;
}
