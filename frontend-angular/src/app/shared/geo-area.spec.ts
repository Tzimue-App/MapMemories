import { calculateCircleArea, calculatePolygonArea, formatArea, formatCoordinates } from './geo-area';

describe('geoArea utility', () => {
  const unitSquare = [
    [
      [0, 0],
      [1, 0],
      [1, 1],
      [0, 1],
      [0, 0],
    ],
  ];

  describe('calculateCircleArea', () => {
    it('calculates the area of a circle in square meters correctly', () => {
      expect(calculateCircleArea(1000)).toBeCloseTo(Math.PI * 1_000_000, 1);
    });

    it('returns 0 for radius 0 or negative', () => {
      expect(calculateCircleArea(0)).toBe(0);
      expect(calculateCircleArea(-100)).toBe(0);
    });
  });

  describe('calculatePolygonArea', () => {
    it('returns 0 for empty or invalid geojson', () => {
      expect(calculatePolygonArea(null)).toBe(0);
      expect(calculatePolygonArea(undefined)).toBe(0);
      expect(calculatePolygonArea('')).toBe(0);
      expect(calculatePolygonArea('{not json')).toBe(0);
      expect(calculatePolygonArea({})).toBe(0);
    });

    it('calculates area for a simple Polygon geojson', () => {
      const area = calculatePolygonArea({ type: 'Polygon', coordinates: unitSquare });
      expect(area).toBeGreaterThan(1e10);
      expect(area).toBeLessThan(1.3e10);
    });

    it('parses JSON string and calculates area', () => {
      expect(calculatePolygonArea(JSON.stringify({ type: 'Polygon', coordinates: unitSquare }))).toBeGreaterThan(1e10);
    });

    it('calculates area for MultiPolygon geojson', () => {
      const singleArea = calculatePolygonArea({ type: 'Polygon', coordinates: unitSquare });
      const multiArea = calculatePolygonArea({ type: 'MultiPolygon', coordinates: [unitSquare, unitSquare] });
      expect(multiArea).toBeCloseTo(singleArea * 2, -3);
    });

    it('unwraps GeoJSON Feature geometry', () => {
      const singleArea = calculatePolygonArea({ type: 'Polygon', coordinates: unitSquare });
      const featureArea = calculatePolygonArea({
        type: 'Feature',
        geometry: { type: 'Polygon', coordinates: unitSquare },
      });
      expect(featureArea).toBeCloseTo(singleArea, -3);
    });
  });

  describe('formatArea', () => {
    it('formats small areas in square meters', () => {
      expect(formatArea(500)).toBe('500 m²');
      expect(formatArea(9999)).toBe('9,999 m²');
    });

    it('formats medium areas in hectares when between 10,000m² and 1km²', () => {
      expect(formatArea(25000)).toBe('2.5 ha');
    });

    it('formats large areas in square kilometers', () => {
      expect(formatArea(3500000)).toBe('3.5 km²');
      expect(formatArea(551695000000)).toBe('551,695 km²');
    });

    it('returns 0 m² for zero or negative input', () => {
      expect(formatArea(0)).toBe('0 m²');
      expect(formatArea(-5)).toBe('0 m²');
    });
  });

  describe('formatCoordinates', () => {
    it('formats latitude and longitude with cardinal directions and decimals', () => {
      expect(formatCoordinates(48.8566, 2.3522)).toBe('48.8566° N, 2.3522° E');
      expect(formatCoordinates(-33.8688, 151.2093)).toBe('33.8688° S, 151.2093° E');
      expect(formatCoordinates(40.7128, -74.006)).toBe('40.7128° N, 74.0060° W');
      expect(formatCoordinates(-22.9068, -43.1729)).toBe('22.9068° S, 43.1729° W');
    });
  });
});
