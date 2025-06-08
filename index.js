/**
 * Main entry point for the npm module
 */
const { useAsyncAction, useDropdownData, createDropdownListHook, useDropdownToggle, useEditForm, useIsMobile } = require('./lib/hooks');

// Export all functions for use as a module
module.exports = {
  useAsyncAction,
  useDropdownData,
  createDropdownListHook,
  useDropdownToggle,
  useEditForm,
  useIsMobile
};