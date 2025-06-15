// Attempt to load qtests setup so axios and winston stubs exist for tests // ensures consistent mocks across suites
// Hooks are executed with react-test-renderer and queued sequentially in the runners // sequential execution keeps state isolated
// to keep this plain Node environment simple without Jest and still simulate a test framework // avoids dependency on heavy test runners
let qtestsAvailable = true; // track presence of qtests module for reporting and summary output
try { require('qtests/setup'); } catch (error) { // qtests provides axios/winston mocks when available
  qtestsAvailable = false; // qtests missing so we fall back to simple mocks
  console.log('test-setup: using local stubs because qtests is missing'); // log fallback so devs know why
  const Module = require('module'); // node module loader reference for patching to return stubs
  const axiosStub = { get: async () => ({}), post: async () => ({}) }; // stub mimics axios to avoid real HTTP traffic during tests
  const winstonStub = { createLogger: () => ({ info: () => {}, error: () => {}, debug: () => {} }), format: { combine: () => {}, timestamp: () => {}, json: () => {}, printf: () => {}, errors: () => {}, splat: () => {} }, transports: { Console: function () {}, File: function () {} } }; // lightweight winston stub to silence logging
  const originalLoad = Module._load; // preserve original loader for other modules before patching
  Module._load = function patchedLoad(request, parent, isMain) { // intercept requires so axios/winston return stubs rather than real modules
    if (request === 'axios') { return axiosStub; } else if (request === 'winston') { return winstonStub; }
    return originalLoad(request, parent, isMain); // defer to original for everything else
  }; // loader patched so tests run without qtests
}
module.exports = { qtestsAvailable }; // export so tests can log whether real qtests mocks loaded for diagnostics
