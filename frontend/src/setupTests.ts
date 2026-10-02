import { afterEach } from 'vitest';
import { cleanup } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';

// Nettoie le DOM virtuel après chaque test pour éviter l'accumulation en mémoire
afterEach(() => {
  cleanup();
});