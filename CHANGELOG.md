# Changelog

## [Unreleased]

_Description: Phase 2 - Drop Pins and Draw Radii (Interactive Map Interactivity)_

<!--
BUMP_TYPE :
1 = Major (X.0.0)
2 = Minor (0.X.0)
3 = Patch (0.0.X)
none = Pas de bump
-->
Backend Bump: none
Frontend Bump: 2

### Backend
#### Features

#### Patches

#### Bug Fixes


### Frontend
#### Features
- Implement interactive map click listener to place temporary point markers (Pins)
- Develop `PinConfigPanel` component embedded in Leaflet popups for adjusting radius (50m to 20km) and selecting marker/circle color
- Support disabling circle radius (`0m (Off)`) while preserving the pin marker on the map
- Implement drag-and-drop support on pin markers (`draggable={true}`), automatically resetting position for both the marker and its radius circle on drop
- Create TypeScript types (`PinItem`) and preset constants in `frontend/src/types/pin.ts`
- Write Vitest unit and component test suites (`PinConfigPanel.test.tsx`, `MapView.test.tsx`) covering pin creation, radius adjustments, color selection, drag events, and disabled radius rendering

#### Patches

#### Bug Fixes
- Fix click event propagation on `PinConfigPanel` and "Delete Pin" button (`stopPropagation` and `stopImmediatePropagation`) to prevent map click handler from dropping a new pin when deleting an existing pin


### Deployment & Configuration
- Release.yml add correctly backend and frontend category in the github release
### ChangeLog

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
