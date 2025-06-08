
# My NPM Module

A simple npm module template with basic utility functions.

## Installation

```bash
npm install your-module-name
```

## Usage

```javascript
const { greet, capitalize } = require('your-module-name');

// Use the greet function
console.log(greet('World')); // Output: Hello, World!

// Use the capitalize function
console.log(capitalize('hello world')); // Output: Hello world
```

## API

### greet(name)
Returns a greeting message for the given name.

**Parameters:**
- `name` (string): The name to greet

**Returns:** String - A greeting message

### capitalize(text)
Capitalizes the first letter of the given text.

**Parameters:**
- `text` (string): The text to capitalize

**Returns:** String - Capitalized text

## License

ISC
