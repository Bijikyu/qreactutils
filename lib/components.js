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

module.exports = {
  createSubTrigger, // generic sub-trigger factory // exported for maximum flexibility
  createContextMenuSubTrigger, // context menu specific factory // exported for convenience
  createMenubarSubTrigger // menubar specific factory // exported for convenience
};