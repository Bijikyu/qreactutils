// Attempt to load qtests setup so axios and winston stubs exist for tests
let qtestsAvailable = true; // track presence of qtests module for reporting
try { require('qtests/setup'); } catch (error) {
  qtestsAvailable = false; // qtests missing so we fall back to simple mocks
  console.log('test-setup: using local stubs because qtests is missing'); // log fallback so devs know why
  const Module = require('module'); // node module loader reference
  const axiosStub = { get: async () => ({}), post: async () => ({}) }; // minimal axios stub for HTTP calls
  const winstonStub = { createLogger: () => ({ info: () => {}, error: () => {}, debug: () => {} }), format: { combine: () => {}, timestamp: () => {}, json: () => {}, printf: () => {}, errors: () => {}, splat: () => {} }, transports: { Console: function () {}, File: function () {} } }; // winston stub with no-op methods
  const originalLoad = Module._load; // keep original loader to call for other modules
  Module._load = function patchedLoad(request, parent, isMain) { // replace loader to intercept axios/winston
    if (request === 'axios') { return axiosStub; } else if (request === 'winston') { return winstonStub; }
    return originalLoad(request, parent, isMain); // defer to original for everything else
  }; // loader patched so tests run without qtests
}
module.exports = { qtestsAvailable }; // export flag for potential debugging
