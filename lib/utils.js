
/**
 * Basic utility functions
 */

/**
 * A simple example function
 * @param {string} name - The name to greet
 * @returns {string} A greeting message
 */
function greet(name) {
  return `Hello, ${name}!`;
}

/**
 * A utility function to capitalize text
 * @param {string} text - The text to capitalize
 * @returns {string} Capitalized text
 */
function capitalize(text) {
  if (!text || typeof text !== 'string') {
    return '';
  }
  return text.charAt(0).toUpperCase() + text.slice(1).toLowerCase();
}

module.exports = {
  greet,
  capitalize
};
