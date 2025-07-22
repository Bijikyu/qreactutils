/**
 * Class Name Merging Utilities Module
 * 
 * This module provides utilities for merging class names with Tailwind CSS
 * conflict resolution. Uses clsx for conditional class handling and 
 * tailwind-merge for intelligent Tailwind class deduplication.
 */

const clsx = require('clsx'); // conditional class name utility
const { twMerge } = require('tailwind-merge'); // tailwind class conflict resolution

/**
 * Merges class names using clsx and tailwind-merge
 * 
 * Combines multiple class values into a single string while resolving
 * Tailwind CSS conflicts. Uses clsx for conditional classes and falsy
 * value filtering, then tailwind-merge to deduplicate conflicting
 * Tailwind classes (e.g., "text-red-500 text-blue-500" becomes "text-blue-500").
 * 
 * Perfect for component libraries where you need to merge default styles
 * with user-provided overrides while avoiding Tailwind class conflicts.
 * 
 * @param {...*} inputs - Class values to merge (strings, objects, arrays, conditionals)
 * @returns {string} Merged class string with conflicts resolved
 * 
 * @example
 * // Basic usage
 * cn('px-4 py-2', 'bg-blue-500') // "px-4 py-2 bg-blue-500"
 * 
 * @example
 * // Conditional classes
 * cn('px-4', isActive && 'bg-blue-500', { 'text-white': isActive }) // "px-4 bg-blue-500 text-white" (when isActive is true)
 * 
 * @example
 * // Tailwind conflict resolution
 * cn('text-red-500', 'text-blue-500') // "text-blue-500" (later class wins)
 * 
 * @example
 * // Component with overrides
 * function Button({ className, ...props }) {
 *   return <button className={cn('px-4 py-2 bg-blue-500', className)} {...props} />
 * }
 */
function cn(...inputs) {
  return twMerge(clsx(inputs)); // clsx handles conditionals, twMerge resolves conflicts
}

module.exports = {
  cn // export class name merger for component styling // public for consistent class handling across components
};