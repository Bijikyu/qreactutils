// Attempt to load qtests setup so axios and winston stubs exist for tests // ensures consistent mocks across suites
// Hooks are executed with react-test-renderer and queued sequentially in the runners // sequential execution keeps state isolated
// to keep this plain Node environment simple without Jest and still simulate a test framework // avoids dependency on heavy test runners
// This file loads before all test files so network calls are stubbed and console noise stays minimal
let qtestsAvailable = true; // track presence of qtests module for reporting and summary output
try { require('qtests/setup'); } catch (error) { // qtests provides axios/winston mocks when available
  qtestsAvailable = false; // qtests missing so we fall back to simple mocks
  console.log('test-setup: using local stubs because qtests is missing'); // log fallback so devs know why
  const Module = require('module'); // node module loader reference for patching to return stubs
  const axiosStub = {
    get: async () => ({}), // resolves with empty object so callers see successful GET
    post: async () => ({}), // resolves with empty object so POST based tests stay offline
    request: async () => ({}) // generic request handler used by axios.create instances
  }; // stub mimics axios to avoid real HTTP traffic during tests
  axiosStub.create = () => ({ request: axiosStub.request, get: axiosStub.get, post: axiosStub.post }); // mirrors axios.create returning stub methods for early imports
  axiosStub.isAxiosError = (error) => error && error.isAxiosError === true; // helps formatAxiosError detect stubbed axios errors
  const winstonStub = { createLogger: () => ({ info: () => {}, error: () => {}, debug: () => {} }), format: { combine: () => {}, timestamp: () => {}, json: () => {}, printf: () => {}, errors: () => {}, splat: () => {} }, transports: { Console: function () {}, File: function () {} } }; // lightweight winston stub to silence logging
  const originalLoad = Module._load; // preserve original loader for other modules before patching
  Module._load = function patchedLoad(request, parent, isMain) { // intercept requires so axios/winston return stubs rather than real modules
    if (request === 'axios') { return axiosStub; } else if (request === 'winston') { return winstonStub; }
    return originalLoad(request, parent, isMain); // defer to original for everything else
  }; // loader patched so tests run without qtests
}
module.exports = { qtestsAvailable }; // expose flag so test files know if fallback mocks were used
