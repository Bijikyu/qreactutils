/**
 * Accessibility and Navigation Utilities Module
 * 
 * This module provides accessibility-focused functionality for managing
 * keyboard navigation, focus management, and WCAG compliance in React applications.
 * All functions prioritize accessibility standards over performance.
 */

const { useEffect } = require('react');

/**
 * React hook for managing keyboard focus during page navigation
 *
 * This accessibility-focused hook automatically moves keyboard focus to the main content
 * area when routes change, providing skip-link style navigation for keyboard users.
 * The implementation follows WCAG guidelines for focus management in single-page applications.
 *
 * Design decisions:
 * - Uses location state to trigger focus changes on route transitions
 * - Targets #main-content element following semantic HTML conventions
 * - Provides graceful degradation when main content element is not found
 * - Logs focus management actions for debugging accessibility issues
 * - Works with any routing library that provides location state
 *
 * The hook prioritizes accessibility compliance over performance, ensuring
 * keyboard users can navigate efficiently without getting trapped in navigation
 * elements after route changes. This is essential for screen reader users.
 *
 * @param {string} location - Current route location for dependency tracking
 * @returns {void} No return value - performs side effects only
 */
function usePageFocus(location) {
  console.log(`usePageFocus is running with location ${location}`); // trace start with location
  
  useEffect(() => {
    // Locate main content element using standard accessibility ID
    const main = (typeof document !== 'undefined') ? document.getElementById('main-content') : null;
    
    if (main && typeof main.focus === 'function') {
      console.log(`usePageFocus focusing main content element`); // log focus action
      main.focus(); // move keyboard focus to main content area
    } else {
      console.log(`usePageFocus: main-content element not found or not focusable`); // log when element missing
    }
  }, [location]); // re-run when location changes to handle route transitions
  
  console.log(`usePageFocus has run resulting in a final value of undefined`); // trace end
}

module.exports = {
  usePageFocus
};