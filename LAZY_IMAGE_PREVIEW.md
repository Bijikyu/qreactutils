# LazyImagePreview Component

## Overview

The `LazyImagePreview` component provides optimized image loading with a shimmer animation while images load and smooth opacity transitions once ready. It's designed to improve perceived performance in image-heavy applications.

## Features

- **Shimmer Loading Animation**: Displays a gray animated placeholder while the image loads
- **Smooth Transitions**: Uses opacity transitions for a polished loading experience
- **Preload Tracking**: JavaScript preloading ensures accurate loading state
- **Native Lazy Loading**: Leverages browser's `loading="lazy"` for additional optimization
- **Memory Leak Prevention**: Proper cleanup in useEffect prevents memory leaks
- **Accessibility**: Includes proper ARIA labels for screen readers

## Usage

### Basic Import

```javascript
const { LazyImagePreview } = require('qreactutils');
```

### Basic Usage

```jsx
<LazyImagePreview 
  src="/images/product.jpg" 
  alt="Product image" 
  className="w-64 h-48" 
/>
```

### Advanced Usage Examples

```jsx
// Hero banner with full screen size
<LazyImagePreview 
  src="/images/hero-banner.jpg" 
  alt="Hero banner showing our main product" 
  className="w-full h-screen object-cover" 
/>

// Product gallery with responsive sizing
<LazyImagePreview 
  src="/images/product-gallery-1.jpg" 
  alt="Product image 1" 
  className="w-full h-64 md:h-80 lg:h-96 rounded-lg shadow-lg" 
/>

// Profile avatar with circular cropping
<LazyImagePreview 
  src="/images/user-avatar.jpg" 
  alt="User profile picture" 
  className="w-20 h-20 rounded-full border-2 border-gray-300" 
/>
```

## Props

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `src` | string | Yes | Image source URL |
| `alt` | string | Yes | Alternative text for accessibility |
| `className` | string | No | Optional CSS classes for container styling |

## Implementation Details

### Loading State Management

The component uses JavaScript preloading to accurately track when images are ready:

1. Creates a new `Image()` object
2. Sets the `src` and `onload` handler
3. Updates loading state when image loads
4. Cleans up the handler to prevent memory leaks

### CSS Classes Used

- **Container**: `relative` + any provided `className`
- **Loading Shimmer**: `absolute inset-0 bg-gray-700 rounded animate-pulse`
- **Image**: `w-full h-full object-cover rounded transition-opacity duration-300`
- **Opacity States**: `opacity-100` (loaded) or `opacity-0` (loading)

### Browser Compatibility

- Supports all modern browsers with React support
- Uses native `loading="lazy"` attribute for additional optimization
- Gracefully degrades in older browsers

## Performance Benefits

1. **Reduced Layout Shift**: Container maintains dimensions while loading
2. **Perceived Performance**: Shimmer animation provides immediate visual feedback
3. **Network Optimization**: Native lazy loading defers off-screen images
4. **Memory Efficiency**: Proper cleanup prevents memory leaks

## Accessibility Features

- Proper `alt` attributes for screen readers
- Loading state announced with `aria-label="Loading image"`
- Maintains focus management during state transitions

## Styling Recommendations

### Responsive Images
```jsx
<LazyImagePreview 
  src="/images/responsive.jpg" 
  alt="Responsive image" 
  className="w-full h-48 sm:h-64 md:h-80 lg:h-96" 
/>
```

### Aspect Ratio Containers
```jsx
<LazyImagePreview 
  src="/images/aspect-ratio.jpg" 
  alt="16:9 aspect ratio image" 
  className="w-full aspect-video" 
/>
```

### Custom Loading Colors
Override the default gray shimmer by customizing the loading div styles in your CSS.

## Testing

The component has been tested for:
- Successful import and instantiation
- Proper handling of required props (`src`, `alt`)
- Optional prop handling (`className`)
- Memory leak prevention through cleanup

## Integration Notes

- Compatible with Tailwind CSS utility classes
- Works with any CSS framework or custom styles
- Follows React best practices with proper hook usage
- Integrates seamlessly with existing qreactutils library patterns