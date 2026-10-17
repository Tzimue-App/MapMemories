# RememberMap — Angular 21 frontend

Angular port of the React frontend (`../frontend`). Both apps ship the same features, talk to the same
Spring Boot backend through `/api`, and share the JWT in `localStorage` (`remembermap_jwt_token`).

| App     | Dev server              | Docker (compose)        |
| ------- | ----------------------- | ----------------------- |
| React   | `http://localhost:3000` | `http://localhost:3000` |
| Angular | `http://localhost:3001` | `http://localhost:3001` |

## Stack

- Angular 21: standalone components, signals (`signal`, `computed`, `linkedSignal`, `model`, `input`, `output`),
  new control flow (`@if`, `@for`, `@switch`, `@let`), `OnPush` everywhere, zoneless change detection (no zone.js)
- `HttpClient` (`withFetch`) plus one functional interceptor that adds `Authorization: Bearer` to `/api/*` calls
- Reactive forms (sign-in / sign-up), RxJS for search-as-you-type (300 ms debounce, stale requests cancelled)
- Leaflet 1.9 used directly (no wrapper); popups host Angular components created with `createComponent`
- Tailwind CSS 4 through `@tailwindcss/postcss`
- Vitest (Angular CLI `@angular/build:unit-test` builder, jsdom)

## Layout

```
src/app/
├── app.ts / app.html        # shell: header, search tabs, counters, drawers, auth modal
├── app.config.ts            # HttpClient + JWT interceptor
├── core/                    # root services
│   ├── auth.service.ts      # user / loading / isAuthenticated signals, session restore via /api/auth/me
│   ├── auth.interceptor.ts
│   ├── token-storage.ts
│   ├── map-state.service.ts # single source of truth for the map screen (pins, boundaries, UI state)
│   └── *.service.ts         # modification, media, note, boundary (backend → Nominatim fallback), nominatim
├── models/                  # types and constants (same as React `types/`)
├── shared/                  # pure helpers: geo area, filters, admin levels, debounced search, popup host bindings
└── features/
    ├── map/                 # MapView (Leaflet), pin & boundary popup panels
    ├── search/              # address & boundary search
    ├── auth/                # sign-in / sign-up modal
    ├── media/               # authenticated images, gallery, lightbox, uploader, notes, memoryMedia()
    └── views/               # directory drawer, filters, detail drawer, photo carousel
```

## Commands

```bash
npm install
npm start          # ng serve on port 3001, /api proxied to http://localhost:8080 (proxy.conf.json)
npm test           # all Vitest specs, single run
npm run build      # production build → dist/remembermap-frontend-angular/browser
```

Run a subset of specs with `npx ng test --watch=false --include=src/app/core`.

## Differences from the React app

Behaviour is the same; a few React bugs were not carried over:

- Selecting a search suggestion no longer starts a new search and reopens the list.
- A pin keeps its id once saved (only `dbId` is set), so its popup stays open; the database id is never
  parsed out of `pin-<id>` strings.
- A pin that is still being saved is not saved twice when a photo or note is added right away.
- The pin popup no longer reloads photos/notes on every radius or colour change.
- `createdAt` is kept on loaded pins and boundaries, so the directory's date filter works.
- Boundaries get a `crypto.randomUUID()` local id instead of `Date.now()`.
