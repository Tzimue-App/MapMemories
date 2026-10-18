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

## [v0.9.0-a] - 2026-10-18

# RememberMap - Alpha v0.9.0-a

> [!WARNING]
> **Statut : Alpha.** Version de développement destinée aux tests d'intégration internes.

_Phase 7 — Polish, Performance & CI/CD: marker clustering, mobile/touch layout, production Docker packaging and Docker-aware CI in both the React and the Angular frontends._

### Backend

#### Patches
- Accept phone-sized photo uploads: `spring.servlet.multipart` limits raised from Spring's 1MB default to 15MB per file / 16MB per request (`MAX_UPLOAD_FILE_SIZE`, `MAX_UPLOAD_REQUEST_SIZE`); `PhotoService` still enforces its own 10MB rule.
- Production server settings: `server.forward-headers-strategy=framework` (runs behind the nginx frontends) and graceful shutdown.
- `ProductionConfigTest` guards these values in the main `application.yml`.

### Frontend
#### Features
- Marker clustering with `leaflet.markercluster` in both frontends (React `MarkerClusterGroup` container built on `@react-leaflet/core`; Angular `MapView` adds markers to an `L.markerClusterGroup`). Size-coded cluster icons, spiderfy at max zoom, chunked loading. Radius circles stay on the map so areas remain visible when their markers are clustered.
- Mobile layout: drawers are full width on phones (`w-full sm:w-96`) and close with a swipe towards their edge (`useSwipeToClose` hook / `SwipeToClose` directive); the search header stacks above the map on small screens; `h-dvh` root, `viewport-fit=cover` and safe-area padding.
- Zoom control moved bottom-right (clear of the search header, reachable by thumb) with 40px tap targets on touch screens.
- Written test-first: new specs for cluster utilities, swipe detection, clustered map layers, zoom control placement and drawer touch/width behaviour (React 115 tests, Angular 214 tests).

#### Patches
- Test setups give Leaflet containers a real size in jsdom so viewport-culling plugins render markers.

#### Bug Fixes
- Angular production build: the map no longer fails to start (black screen). `leaflet.markercluster` registers on the global `L`, which the production bundle's `import * as L` copy never sees; `createClusterGroup()` now falls back to the global factory.

### Deployment & Configuration
- Dockerfiles: `npm ci` with a cached dependency layer, pinned `nginx:1.27-alpine`, container `HEALTHCHECK`s for the frontends, Maven dependency layer and container-aware JVM flags for the backend; new `.dockerignore` files for `frontend/` and `backend/`.
- nginx (both frontends): gzip, immutable caching for fingerprinted bundles, `no-cache` SPA shell, security headers, `client_max_body_size 16m` for photo uploads.
- `docker-compose.yml`: secrets and ports come from `.env` (template in `.env.example`, including `APP_JWT_SECRET`); Postgres, MinIO and the API are published on `127.0.0.1` only; the MinIO bucket is private (photos are streamed through the authenticated API); the backend waits for bucket creation and has a 1GB memory limit.
- `test.yml`: workflow concurrency (superseded runs are cancelled), read-only token, React production build (`tsc` + `vite`), a Docker image build matrix (backend, frontend, frontend-angular) after the test jobs, and a `docker compose config` check. `bump-and-tag.yml` also builds the React app in its gate.

---

## [v0.8.0-a] - 2026-10-17

# RememberMap - Alpha v0.8.0-a

> [!WARNING]
> **Statut : Alpha.** Version de développement destinée aux tests d'intégration internes.

### Frontend
#### Features
- Add the Angular 21 frontend in `frontend-angular/` (standalone components, signals, zoneless change detection, `OnPush`, new control flow) with the same features as the React app: map with pins/radii, boundary search, saved boundaries, photos and notes, global directory and detail drawer.
- Replace the React context and local state with root services: `AuthService` (signals, session restore through `/api/auth/me`), `MapStateService` (pins, boundaries and UI state with explicit methods), and a functional JWT `HttpInterceptor`.
- Drive Leaflet directly: effects diff the store against the layers on the map, and the pin/boundary popups host Angular components created with `createComponent`.
- Written test-first: 28 Vitest spec files (196 tests) covering services, the interceptor, the state store, every component and the Leaflet map.

#### Bug Fixes
- Angular frontend: picking a search suggestion no longer starts a new search; saved pins keep a stable id; a pin is never saved twice when a photo or note is added while it is still being saved; the date filter works on loaded memories.

### Deployment & Configuration
- Add a `frontend-angular` service to `docker-compose.yml` (port `3001`), with its own Dockerfile and nginx config (same `/api` proxy).
- Add a `Frontend Angular Tests (Vitest)` job to `test.yml` and to the `bump-and-tag.yml` gate.
- `bump_version.py` keeps `frontend-angular/package.json` at the same version as `frontend/package.json`.

---

## [v0.7.0-a] - 2026-10-12

# RememberMap - Alpha v0.7.0-a

> [!WARNING]
> **Statut : Alpha.** Version de développement destinée aux tests d'intégration internes.

_Phase 6 — Global and Detailed Views: Global memories directory with multi-criteria filtering (element type, date range, search query), interactive slide-over detailed view drawer, geodesic polygon surface area calculations, photo carousel, and responsive Leaflet map integration._

### Frontend
#### Features
- Implement geodesic spherical polygon surface area calculation and circle area calculation utilities in `frontend/src/utils/geoArea.ts` with test coverage (`geoArea.test.ts`).
- Create `filterModifications` utility and `FilterToolbar` component for multi-dimensional filtering by element type (All, Pins, Radii, Boundaries), date range (All, Today, Week, Month), and live search text query.
- Build `PhotoCarousel` component supporting thumbnail navigation, photo index badges, full-stage view, and lightbox integration.
- Build collapsible `GlobalViewDrawer` displaying user memories with category counters, badges, coordinates, and interactive click-to-fly map centering.
- Build `DetailSideDrawer` slide-over panel displaying rich element metadata, formatted coordinates with quick copy button, exact calculated surface area, embedded photo carousel, and notes stream with inline creation/deletion.
- Integrate Global View and Detailed View interactions into `MapView.tsx` (marker and polygon click handlers) and `App.tsx` (Directory toolbar button, slide-over management, and state sync).
- Complete comprehensive Vitest TDD test suites (`geoArea.test.ts`, `filterModifications.test.ts`, `PhotoCarousel.test.tsx`, `FilterToolbar.test.tsx`, `GlobalViewDrawer.test.tsx`, `DetailSideDrawer.test.tsx`, `MapView.test.tsx`, `App.test.tsx`).

---

## [v0.6.0-a] - 2026-10-10

# RememberMap - Alpha v0.6.0-a

> [!WARNING]
> **Statut : Alpha.** Version de développement destinée aux tests d'intégration internes.

_Phase 5 — Rich Media Association (Photos & Notes): MinIO Object Storage integration, Photo & Note JPA persistence entities, secured REST media endpoints, user-isolated object storage management, frontend mediaService, PhotoUploader, PhotoGallery, PhotoLightbox, NoteList components, and tabbed popup configuration integration._

### Backend
#### Features
- Configure `MinioConfig` and `MinioStorageService` for S3-compatible MinIO bucket interaction (`remembermap-photos`).
- Create `Photo` and `Note` JPA entities linked to `Modification` and `User` for metadata and comment persistence.
- Create `PhotoRepository` and `NoteRepository` enforcing user-isolated database query filters.
- Build `PhotoService` enforcing image file format validation (JPEG, PNG, WebP) and max 10MB file size limits.
- Build `NoteService` for managing structured notes and memory descriptions on map pins.
- Expose secured REST endpoints in `PhotoController` (`POST /api/modifications/{id}/photos`, `GET /api/modifications/{id}/photos`, `GET /api/photos/{id}/content`, `DELETE /api/modifications/{id}/photos/{id}`) and `NoteController`.
- Create backend unit and integration TDD test suites (`MinioStorageServiceTest`, `PhotoServiceTest`, `PhotoRepositoryTest`, `NoteRepositoryTest`, `PhotoControllerTest`, `NoteControllerTest`).

### Frontend
#### Features
- Create TypeScript types (`PhotoItem`, `NoteItem`) in `frontend/src/types/media.ts`.
- Create `mediaService` and `noteService` HTTP client modules handling multipart uploads, authenticated content retrieval, and deletions.
- Build `PhotoUploader` component with image validation, drag-and-drop selector, file preview, and caption input.
- Build `PhotoGallery` thumbnail grid component with deletion trigger.
- Build `PhotoLightbox` modal component for full-resolution image preview.
- Build `NoteList` component for adding and deleting rich text notes on pins.
- Enhance `PinConfigPanel` with tabbed navigation ("Config", "Photos", "Notes") displaying item badges and media attachment panels.
- Create frontend Vitest test suites (`mediaService.test.ts`, `noteService.test.ts`, `PinConfigPanel.test.tsx`).

### Deployment & Configuration
- Verify Docker compose MinIO environment compatibility and bucket initialization rules.

---

## [v0.5.0-a] - 2026-10-02

# RememberMap - Alpha v0.5.0-a

> [!WARNING]
> **Statut : Alpha.** Version de développement destinée aux tests d'intégration internes.

_Phase 4 — Authentication & Database Persistence: Spring Security JWT authentication framework, BCrypt password encoding, User & Modification JPA persistence entities, secured REST endpoints, React AuthContext, AuthModal, and user-isolated map modifications persistence._

### Backend
#### Features
- Implement Spring Security JWT authentication with stateless `SecurityConfig`, `JwtAuthenticationFilter`, and `JwtService` for token generation, validation, and claim parsing.
- Implement BCrypt password hashing (`BCryptPasswordEncoder`) and custom `CustomUserDetailsService` for authentication handling.
- Create `User` JPA entity with unique username/email constraints and `UserRepository` with query methods (`findByUsername`, `existsByUsername`, `existsByEmail`).
- Create `Modification` JPA entity with `ModificationType` enum (`PIN`, `RADIUS`, `BOUNDARY`) linked via `@ManyToOne` to `User`.
- Create `ModificationRepository` supporting user-isolated query operations (`findByUserOrderByCreatedAtDesc`, `findByIdAndUser`).
- Expose REST authentication endpoints in `AuthController`: `POST /api/auth/register`, `POST /api/auth/login`, and `GET /api/auth/me`.
- Expose secured REST modification endpoints in `ModificationController`: `POST /api/modifications` (save modification), `GET /api/modifications` (retrieve user history), and `DELETE /api/modifications/{id}` (delete modification).
- Add backend test configuration (`src/test/resources/application.yml`) and full TDD test suite (`UserRepositoryTest`, `ModificationRepositoryTest`, `JwtServiceTest`, `AuthControllerTest`, `ModificationControllerTest`).

### Frontend
#### Features
- Create `authService` for handling JWT login, registration, local storage persistence, and authenticated `getMe` requests.
- Create `AuthContext` provider and `useAuth` hook managing global user authentication state, token storage, and session lifecycle.
- Build interactive `AuthModal` component supporting tabbed Sign In / Sign Up forms, input validation, and user feedback.
- Create `modificationService` for saving, fetching, and deleting user pins, radius circles, and boundaries via authenticated Bearer token API requests.
- Integrate authentication flow into `App.tsx`: auto-prompt login modal on initial load when unauthenticated, display authentication status banner, and synchronize user-saved modifications with Leaflet map markers and polygons.
- Implement strict user state isolation in `App.tsx` and `MapView.tsx`, resetting active map markers and boundaries immediately upon logout or user switch.
- Write Vitest unit and integration test suites (`authService.test.ts`, `modificationService.test.ts`, `AuthContext.test.tsx`, `AuthModal.test.tsx`, `App.test.tsx`, `MapView.test.tsx`) covering authentication flows, token handling, modal interactions, user state resets, and API request handling.

#### Bug Fixes
- Fix input text visibility in `AuthModal.tsx` by adding explicit Tailwind text and background color classes (`text-gray-900 dark:text-white bg-white dark:bg-gray-700`).
- Fix `MapView.tsx` pin state sync bug by ensuring `initialPins` updates properly propagate when reset to an empty array.

### Deployment & Configuration
- Create custom `frontend/nginx.conf` proxying all `/api/` requests to `http://backend:8080/api/` in Docker containers.
- Update `frontend/Dockerfile` to copy `nginx.conf` into `/etc/nginx/conf.d/default.conf`.

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
