import { afterEach } from 'vitest';
import { cleanup } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';

// Nettoie le DOM virtuel après chaque test pour éviter l'accumulation en mémoire
afterEach(() => {
  cleanup();
});

// jsdom has no layout, so Leaflet maps measure 0x0 and plugins that cull by viewport
// (e.g. markercluster) would hide every marker. Give map containers a desktop-like size.
const LEAFLET_SIZE = { clientWidth: 1024, clientHeight: 768 } as const;
for (const [prop, size] of Object.entries(LEAFLET_SIZE)) {
  const original = Object.getOwnPropertyDescriptor(HTMLElement.prototype, prop);
  Object.defineProperty(HTMLElement.prototype, prop, {
    configurable: true,
    get(this: HTMLElement) {
      return this.classList.contains('leaflet-container') ? size : original?.get?.call(this) ?? 0;
    },
  });
}
