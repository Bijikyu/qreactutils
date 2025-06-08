
// Simple test file for the module
const { greet, capitalize } = require('./index.js');

console.log('Running tests...\n');

// Test greet function
console.log('Testing greet function:');
console.log('greet("World"):', greet('World'));
console.log('greet("Alice"):', greet('Alice'));

console.log('\nTesting capitalize function:');
console.log('capitalize("hello"):', capitalize('hello'));
console.log('capitalize("WORLD"):', capitalize('WORLD'));
console.log('capitalize(""):', capitalize(''));

console.log('\nAll tests completed!');
