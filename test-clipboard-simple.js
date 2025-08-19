/**
 * Simple clipboard functionality test
 * 
 * Tests the core clipboard utilities without React dependencies
 * to verify the functionality works correctly.
 */

const { makeCopyFn, copyToClipboard } = require('./index.js');

console.log('Testing clipboard functionality...\n');

// Mock browser environment
global.navigator = {
  clipboard: {
    writeText: async (text) => Promise.resolve()
  }
};

global.window = { document: { 
  createElement: () => ({ 
    value: '', style: {}, select: () => {}, setSelectionRange: () => {} 
  }),
  body: { appendChild: () => {}, removeChild: () => {} },
  execCommand: () => true 
}};

global.document = global.window.document;

async function testClipboard() {
  let tests = 0;
  let passed = 0;

  function test(name, fn) {
    tests++;
    try {
      fn();
      console.log(`✅ ${name}`);
      passed++;
    } catch (err) {
      console.log(`❌ ${name}: ${err.message}`);
    }
  }

  // Test 1: Basic factory function
  test('makeCopyFn creates function', () => {
    const fn = makeCopyFn();
    if (typeof fn !== 'function') throw new Error('Should return function');
  });

  // Test 2: Success callback
  test('Success callback works', async () => {
    let success = false;
    const fn = makeCopyFn(() => success = true, null);
    await fn('test');
    if (!success) throw new Error('Success callback not called');
  });

  // Test 3: Error callback
  test('Error callback works', async () => {
    let error = false;
    const fn = makeCopyFn(null, () => error = true);
    await fn(123); // Invalid input
    if (!error) throw new Error('Error callback not called');
  });

  // Test 4: Basic utility
  test('copyToClipboard utility works', async () => {
    const result = await copyToClipboard('test');
    if (!result) throw new Error('Should return true on success');
  });

  // Test 5: Input validation
  test('Input validation works', async () => {
    const result = await copyToClipboard(null);
    if (result) throw new Error('Should return false for invalid input');
  });

  console.log(`\nResults: ${passed}/${tests} tests passed`);
  
  if (passed === tests) {
    console.log('🎉 All clipboard tests passed!');
    return true;
  } else {
    console.log('⚠️ Some tests failed');
    return false;
  }
}

testClipboard().then(success => {
  process.exit(success ? 0 : 1);
});