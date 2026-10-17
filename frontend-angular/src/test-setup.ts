// jsdom has no object-URL support; specs spy on these to assert creation/revocation.
URL.createObjectURL ??= () => 'blob:http://localhost/stub';
URL.revokeObjectURL ??= () => undefined;

// Global test setup: every spec starts from an empty token store,
// mirroring the React suite's `localStorage.clear()` in each beforeEach.
beforeEach(() => {
  localStorage.clear();
});

afterEach(() => {
  vi.restoreAllMocks();
});
