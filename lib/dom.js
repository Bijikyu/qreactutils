/**
 * DOM Utilities Module
 * 
 * This module provides standardized DOM manipulation and event handling utilities
 * for consistent interaction patterns across React components. Functions prioritize
 * browser compatibility and graceful degradation.
 */

/**
 * Prevent default event behavior and stop event propagation
 *
 * This utility combines the two most common event handling patterns into a single
 * function call, reducing boilerplate code in event handlers while ensuring
 * consistent behavior across all components.
 *
 * Design rationale: most form submissions and link clicks need both preventDefault
 * and stopPropagation to work correctly in React applications. Combining them
 * reduces the chance of forgetting one or the other in event handlers.
 *
 * @param {Event} event - The DOM event to handle
 * @returns {void} No return value - performs side effects only
 */
function stopEvent(event) {
  console.log(`stopEvent is running with event type ${event?.type}`); // log event type for debugging
  
  if (event && typeof event.preventDefault === 'function') {
    event.preventDefault(); // prevent default browser behavior
  }
  
  if (event && typeof event.stopPropagation === 'function') {
    event.stopPropagation(); // stop event bubbling
  }
  
  console.log(`stopEvent has run resulting in a final value of undefined`); // exit log
}

module.exports = {
  stopEvent
};