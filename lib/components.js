/**
 * React UI Components Module
 * 
 * This module provides factory functions for creating reusable React UI
 * components with consistent patterns and styling. Focuses on creating
 * flexible component factories that can generate different component
 * variations while maintaining consistent behavior and structure.
 */

const React = require('react'); // React for component creation and refs
const { cn } = require('./classNames'); // class name merging utility
const { useState, useEffect } = React; // React hooks for state and lifecycle management

/**
 * Creates a reusable sub-trigger UI component
 * 
 * Factory function that generates a sub-trigger component for context menus
 * or menubars. The component automatically includes a chevron icon and
 * supports forwarded refs for proper DOM manipulation and focus management.
 * 
 * This pattern allows creating multiple similar components with different
 * base components while maintaining consistent structure and behavior.
 * Useful for UI libraries that need multiple variations of the same
 * component pattern.
 * 
 * @param {string} displayName - Component type identifier
 * @param {React.Component} BaseComponent - The base trigger component to extend
 * @returns {React.ForwardRefExoticComponent} Configured sub-trigger component
 * 
 * @example
 * // Create a context menu sub-trigger
 * const ContextSubTrigger = createSubTrigger('ContextMenuSubTrigger', ContextMenuSubTrigger);
 * 
 * @example
 * // Create a menubar sub-trigger
 * const MenubarSubTrigger = createSubTrigger('MenubarSubTrigger', MenubarSubTrigger);
 * 
 * @example
 * // Usage in JSX
 * <ContextSubTrigger className="custom-class" inset>
 *   Settings
 * </ContextSubTrigger>
 */
function createSubTrigger(displayName, BaseComponent) {
  if (!BaseComponent) {
    throw new Error(`createSubTrigger: BaseComponent is required for ${displayName}`);
  }

  // Create the forwarded ref component
  const SubTrigger = React.forwardRef((props, ref) => {
    const { className, inset, children, ...restProps } = props;
    
    // Build className with inset support
    const mergedClassName = cn(
      className,
      inset && 'pl-8' // add left padding when inset is true
    );

    return React.createElement(
      BaseComponent,
      {
        ref: ref,
        className: mergedClassName,
        ...restProps
      },
      children,
      // Add chevron icon as the last child
      React.createElement(
        'svg',
        {
          width: '15',
          height: '15',
          viewBox: '0 0 15 15',
          fill: 'none',
          xmlns: 'http://www.w3.org/2000/svg',
          key: 'chevron-icon' // key to avoid React warnings
        },
        React.createElement('path', {
          d: 'M5.5 13L10.5 7.5L5.5 2',
          stroke: 'currentColor',
          strokeLinecap: 'round',
          strokeLinejoin: 'round'
        })
      )
    );
  });

  // Set display name for better debugging
  SubTrigger.displayName = displayName;

  return SubTrigger;
}

/**
 * Creates a context menu sub-trigger component
 * 
 * Convenience function that creates a sub-trigger specifically for context menus.
 * Assumes the ContextMenuSubTrigger component is available in the consuming
 * application. This wrapper provides a more specific API while using the
 * generic createSubTrigger factory.
 * 
 * @param {React.Component} ContextMenuSubTrigger - The base context menu trigger component
 * @returns {React.ForwardRefExoticComponent} Context menu sub-trigger component
 * 
 * @example
 * import { ContextMenuSubTrigger as BaseContextTrigger } from '@radix-ui/react-context-menu';
 * const ContextSubTrigger = createContextMenuSubTrigger(BaseContextTrigger);
 */
function createContextMenuSubTrigger(ContextMenuSubTrigger) {
  return createSubTrigger('ContextMenuSubTrigger', ContextMenuSubTrigger);
}

/**
 * Creates a menubar sub-trigger component
 * 
 * Convenience function that creates a sub-trigger specifically for menubars.
 * Assumes the MenubarSubTrigger component is available in the consuming
 * application. Provides a more specific API while leveraging the generic
 * createSubTrigger factory pattern.
 * 
 * @param {React.Component} MenubarSubTrigger - The base menubar trigger component
 * @returns {React.ForwardRefExoticComponent} Menubar sub-trigger component
 * 
 * @example
 * import { MenubarSubTrigger as BaseMenubarTrigger } from '@radix-ui/react-menubar';
 * const MenubarSubTrigger = createMenubarSubTrigger(BaseMenubarTrigger);
 */
function createMenubarSubTrigger(MenubarSubTrigger) {
  return createSubTrigger('MenubarSubTrigger', MenubarSubTrigger);
}

/**
 * Lazy Image Preview Component
 * 
 * A React component that provides lazy loading functionality for images with a loading state.
 * Features a shimmer loading animation while the image loads, and smooth opacity transition
 * once the image is ready. Ideal for improving perceived performance in image-heavy applications.
 * 
 * The component preloads images in JavaScript to ensure the loading state is accurate,
 * and uses the native 'loading="lazy"' attribute for additional browser-level optimizations.
 * 
 * @param {Object} props - Component props
 * @param {string} props.src - Image source URL
 * @param {string} props.alt - Alternative text for accessibility
 * @param {string} [props.className] - Optional CSS classes for container styling
 * @returns {React.ReactElement} Lazy loading image component
 * 
 * @example
 * // Basic usage
 * <LazyImagePreview 
 *   src="/images/product.jpg" 
 *   alt="Product image" 
 *   className="w-64 h-48" 
 * />
 * 
 * @example
 * // With responsive classes
 * <LazyImagePreview 
 *   src="/images/hero.jpg" 
 *   alt="Hero banner" 
 *   className="w-full h-screen object-cover" 
 * />
 */
function LazyImagePreview({ src, alt, className }) {
  const [loaded, setLoaded] = useState(false);
  
  useEffect(() => {
    // Preload the image to track loading state accurately
    const img = new Image();
    img.src = src;
    img.onload = () => setLoaded(true);
    
    // Cleanup function to prevent memory leaks
    return () => {
      img.onload = null;
    };
  }, [src]);

  return React.createElement(
    'div',
    {
      className: cn('relative', className)
    },
    // Loading shimmer - only visible while image is loading
    !loaded && React.createElement(
      'div',
      {
        className: 'absolute inset-0 bg-gray-700 rounded animate-pulse',
        'aria-label': 'Loading image'
      }
    ),
    // Actual image with lazy loading and smooth transition
    React.createElement('img', {
      src: src,
      alt: alt,
      className: cn(
        'w-full h-full object-cover rounded transition-opacity duration-300',
        loaded ? 'opacity-100' : 'opacity-0'
      ),
      loading: 'lazy' // Native browser lazy loading for additional optimization
    })
  );
}

module.exports = {
  createSubTrigger, // generic sub-trigger factory // exported for maximum flexibility
  createContextMenuSubTrigger, // context menu specific factory // exported for convenience
  createMenubarSubTrigger, // menubar specific factory // exported for convenience
  LazyImagePreview // lazy loading image component with shimmer animation // exported for image optimization
};