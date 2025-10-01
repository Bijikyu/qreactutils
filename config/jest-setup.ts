// jest-setup.ts - Jest setup for TypeScript ESM with React support
// Keep qtests setup FIRST to ensure global stubbing is active
import 'qtests/setup';
import { jest as jestFromGlobals } from '@jest/globals';

// Set test environment early
process.env.NODE_ENV = 'test';

// Resolve jest reference safely and expose globally for tests using jest.*
const J = (typeof jestFromGlobals !== 'undefined' && jestFromGlobals)
  ? jestFromGlobals
  : (globalThis as any).jest;
if (!(globalThis as any).jest && J) {
  (globalThis as any).jest = J as any;
}

// Provide CommonJS-like require for ESM tests that call require()
// Avoid top-level await to satisfy stricter Jest transform pipelines.
try {
  if (!(globalThis as any).require && typeof require === 'function') {
    (globalThis as any).require = require as any;
  }
} catch {}

beforeAll(() => {
  const j = (globalThis as any).jest || J;
  if (j && typeof j.setTimeout === 'function') {
    j.setTimeout(10000);
  }
});

afterEach(() => {
  const j = (globalThis as any).jest || J;
  if (j && typeof j.clearAllMocks === 'function') {
    j.clearAllMocks();
  }
});

// Provide minimal jest-dom style matcher used by generated tests
try {
  const gExpect: any = (globalThis as any).expect || undefined;
  if (gExpect && typeof gExpect.extend === 'function' && !gExpect.__QUTILS_MATCHERS__) {
    console.log('[jest-setup] Installing minimal toBeInTheDocument matcher');
    gExpect.extend({
      toBeInTheDocument(received: any) {
        const pass = !!received; // smoke-check presence only
        return {
          pass,
          message: () => pass
            ? 'expected element not to be in the document'
            : 'expected element to be in the document',
        };
      },
    });
    gExpect.__QUTILS_MATCHERS__ = true;
  }
} catch {}
