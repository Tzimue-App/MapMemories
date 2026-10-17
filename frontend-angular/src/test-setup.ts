// jsdom has no object-URL support; specs spy on these to assert creation/revocation.
URL.createObjectURL ??= () => 'blob:http://localhost/stub';
URL.revokeObjectURL ??= () => undefined;

// jsdom has no layout, so Leaflet maps measure 0x0 and plugins that cull by viewport
// (e.g. markercluster) would hide every marker. Give map containers a desktop-like size.
const LEAFLET_SIZE = { clientWidth: 1024, clientHeight: 768 } as const;
for (const [prop, size] of Object.entries(LEAFLET_SIZE)) {
  const original = Object.getOwnPropertyDescriptor(HTMLElement.prototype, prop);
  Object.defineProperty(HTMLElement.prototype, prop, {
    configurable: true,
    get(this: HTMLElement) {
      return this.classList.contains('leaflet-container') ? size : (original?.get?.call(this) ?? 0);
    },
  });
}

// Global test setup: every spec starts from an empty token store,
// mirroring the React suite's `localStorage.clear()` in each beforeEach.
beforeEach(() => {
  localStorage.clear();
});

afterEach(() => {
  vi.restoreAllMocks();
});
