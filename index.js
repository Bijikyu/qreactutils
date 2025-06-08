/**
 * Main entry point for the npm module
 */
const { greet, capitalize } = require('./lib/utils');
const { useAsyncAction, useDropdownData, createDropdownListHook } = require('./lib/hooks');

// Export all functions for use as a module
module.exports = {
  greet,
  capitalize,
  useAsyncAction,
  useDropdownData,
  createDropdownListHook
};