# Changelog

## [Unreleased]

_Description: Écrire le résumé ici..._

<!--
BUMP_TYPE :
1 = Major (X.0.0)
2 = Minor (0.X.0)
3 = Patch (0.0.X)
none = Pas de bump
-->
Backend Bump: none
Frontend Bump: none

### Backend
#### Features

#### Patches

#### Bug Fixes


### Frontend
#### Features

#### Patches

#### Bug Fixes


### Deployment & Configuration

### ChangeLog

---

## [v0.4.0-a] - 2026-09-18

# RememberMap - Alpha v0.4.0-a

> [!WARNING]
> **Statut : Alpha.** Version de développement destinée aux tests d'intégration internes.

_Phase 3 — Boundaries: backend OSM boundary search & caching service with GeoJSON support, and frontend boundary search / display components with interactive configuration panel._

### Backend
#### Features
- Implement REST boundary search endpoint (`GET /api/boundaries/search?q=`) returning cached or live OSM boundary results as `BoundaryDTO` (id, osmId, name, displayName, adminLevel, boundaryType, geoJson)
- Create `OsmBoundaryService` querying the Overpass API for administrative boundaries by name, parsing OSM XML responses and extracting polygon geometries
- Build `BoundaryCache` JPA entity with Hibernate Spatial `Geometry` column (SRID 4326), unique `osmId` constraint, and `TEXT`-typed `geoJson` field for persisting boundary polygons
- Implement `BoundaryCacheRepository` with Spring Data JPA providing `findByNameContainingIgnoreCase` and `findByOsmId` query methods
- Convert OSM node/way/relation data into GeoJSON `Polygon` and `MultiPolygon` representations stored alongside JTS geometries

### Frontend
#### Features
- Create `BoundarySearch` component with debounced text input querying the backend boundary search API, async loading spinner, and clickable suggestion dropdown
- Implement `boundaryService` HTTP client (`fetchBoundaries`) calling `GET /api/boundaries/search` and returning typed `BoundaryResult[]` objects
- Develop `BoundaryConfigPanel` component for toggling boundary GeoJSON polygon visibility, adjusting stroke color, fill color, and fill opacity via interactive controls
- Render selected boundary GeoJSON polygons on the Leaflet map as `GeoJSON` layers with configurable style (stroke color, fill color, fill opacity)
- Define TypeScript types (`BoundaryResult`, `BoundaryItem`, `BoundaryStyle`) in `frontend/src/types/boundary.ts`
- Integrate boundary selection into `App.tsx` state management, lifting boundary items and active boundary list to the application root
- Write Vitest unit and component test suites (`BoundarySearch.test.tsx`, `BoundaryConfigPanel.test.tsx`, `MapView.test.tsx`, `boundaryService.test.ts`) covering boundary search, config panel interactions, GeoJSON rendering, and service HTTP calls

#### Patches
- Add Vite dev-server proxy rule (`/api` → `http://localhost:8080`) in `vite.config.ts` for seamless backend API integration during development

---

## [v0.3.0-a] - 2026-09-17

# RememberMap - Alpha v0.3.0-a

> [!WARNING]
> **Statut : Alpha.** Version de développement destinée aux tests d'intégration internes.

### Frontend
#### Features
- Implement interactive map click listener to place temporary point markers (Pins)
- Develop `PinConfigPanel` component embedded in Leaflet popups for adjusting radius (50m to 20km) and selecting marker/circle color
- Support disabling circle radius (`0m (Off)`) while preserving the pin marker on the map
- Implement drag-and-drop support on pin markers (`draggable={true}`), automatically resetting position for both the marker and its radius circle on drop
- Create TypeScript types (`PinItem`) and preset constants in `frontend/src/types/pin.ts`
- Write Vitest unit and component test suites (`PinConfigPanel.test.tsx`, `MapView.test.tsx`) covering pin creation, radius adjustments, color selection, drag events, and disabled radius rendering

#### Bug Fixes
- Fix click event propagation on `PinConfigPanel` and "Delete Pin" button (`stopPropagation` and `stopImmediatePropagation`) to prevent map click handler from dropping a new pin when deleting an existing pin

### Deployment & Configuration
- Release.yml add correctly backend and frontend category in the github release

---

## [v0.2.0-a] - 2026-09-14

# RememberMap - Alpha v0.2.0-a

> [!WARNING]
> **Statut : Alpha.** Version de développement destinée aux tests d'intégration internes.

#### Features
- Integrate Leaflet (`leaflet`, `react-leaflet`) for interactive map rendering
- Configure OpenStreetMap tile layer with required attribution (`© OpenStreetMap contributors`)
- Build `AddressSearch` component featuring debounced place search, async loading spinner, suggestion dropdown, and Tailwind CSS v4 styling
- Create `nominatimService` HTTP client querying OpenStreetMap Nominatim geocoding API (`https://nominatim.openstreetmap.org/search`)
- Implement `MapController` helper component providing smooth animated `flyTo` transitions when a location is selected
- Build comprehensive Vitest TDD unit test suite covering `MapView`, `AddressSearch`, `nominatimService`, and `App` components (100% passing tests)

### ChangeLog

---

## [v0.1.0-a] - 2026-09-14

# RememberMap - Alpha v0.1.0-a

> [!WARNING]
> **Statut : Alpha.** Version de développement destinée aux tests d'intégration internes.

#### Features
- Initialize Java 25 Spring Boot application with Maven build setup
- Configure Spring Web, Spring Data JPA, Spring Security, Hibernate Spatial, and MinIO Java SDK dependencies
- Implement REST health endpoint (`GET /api/health`) returning application status and Java runtime version
- Add public security filter chain configuration in `SecurityConfig`
- Add Spring Boot context load sanity test suite (`RememberMapApplicationTests`) with H2 test database profile
- Create multi-stage Java 25 `Dockerfile` (`eclipse-temurin:25-jdk` builder and `eclipse-temurin:25-jre` runner)

#### Bug Fixes
- Configure `mainClass` and `MAVEN_OPTS` for Java 25 Spring Boot 3.4 repackaging compatibility


#### Features
- Initialize React 19 + TypeScript + Vite 6 application framework
- Integrate Tailwind CSS (v4) with `@tailwindcss/vite` plugin and `@import "tailwindcss";` in `src/index.css`
- Set up Vitest test framework and component rendering test suite (`App.test.tsx`)
- Generate `package-lock.json` for deterministic `npm ci` builds
- Create multi-stage frontend `Dockerfile` (Node 22 builder and Nginx Alpine runner)

#### Bug Fixes
- Fix package-lock.json for CI

### Deployment & Configuration
- Configure local multi-container orchestration in `docker-compose.yml` (`postgres`, `minio`, `minio-init`, `backend`, `frontend`)
- Add PostgreSQL init script (`docker/postgres/init.sql`) enabling `postgis` and `postgis_topology` extensions
- Add automated MinIO bucket initialization helper (`remembermap-minio-init`) for `remembermap-photos`
- Create GitHub Actions test workflow (`.github/workflows/test.yml`) running Maven and Vitest suites on PRs and feature pushes
- Create GitHub Actions release workflow (`.github/workflows/bump-and-tag.yml`) with automated version tagging
- Update `bump_version.py` script supporting independent component version bumps for backend, frontend, and root package

### ChangeLog

---
