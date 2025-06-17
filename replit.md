# QReactUtils - React Hooks Utility Library

## Overview

QReactUtils is a comprehensive React hooks utility library designed to solve recurring patterns of boilerplate code across React applications. The library focuses on async operations, form management, dropdown handling, toast notifications, and UI state management with an emphasis on developer experience through consistency rather than maximum flexibility.

## System Architecture

### Module Structure
The library follows a hierarchical module organization with functions organized by purpose:
- **index.js**: Main entry point that aggregates all functionality and provides the public API
- **lib/hooks.js**: Central hooks aggregator that imports from specialized modules
- **lib/api.js**: HTTP request management and React Query integration
- **lib/utils.js**: Toast utilities and common utility functions
- **lib/validation.js**: Data validation helpers and type guards
- **lib/errorHandling.js**: Standardized error handling patterns
- **lib/toastIntegration.js**: Toast notification integration utilities
- **lib/socket.js**: WebSocket communication and Socket.IO integration
- **lib/accessibility.js**: Accessibility and keyboard navigation utilities
- **lib/dom.js**: DOM manipulation and event handling utilities

### Technology Stack
- **React 19.1.0**: Core React library for hook functionality
- **@tanstack/react-query 5.80.7**: Server state management and caching
- **axios 1.10.0**: HTTP client for API requests
- **react-responsive 10.0.1**: Responsive design utilities
- **nanoid 3.3.11**: Unique ID generation
- **Node.js 20**: Runtime environment

## Key Components

### Core Hooks
- **useAsyncAction**: Primary hook for async operations with loading states and error handling
- **useDropdownData**: Manages dropdown data fetching with React Query integration
- **useEditForm**: Form editing state management with validation
- **useIsMobile**: Mobile device detection with SSR support
- **useToast**: Centralized toast notification system
- **useAuthRedirect**: Authentication flow management
- **usePageFocus**: Accessibility-focused keyboard focus management for route changes
- **useSocket**: Real-time WebSocket communication for payment outcomes and usage updates

### API Layer
- **axiosClient**: Pre-configured Axios instance with credentials and error handling
- **apiRequest**: Standardized API request wrapper with consistent error handling
- **queryClient**: React Query client with sensible defaults

### Utility Functions
- **executeWithLoadingState**: Helper for managing async loading states
- **showToast/toastSuccess/toastError**: Toast notification utilities
- **formatAxiosError**: Error normalization for HTTP responses

## Data Flow

### Async Operations
1. Hooks use `executeWithLoadingState` to manage loading states
2. API calls go through `axiosClient` with consistent error handling
3. React Query manages caching and background updates
4. Errors are normalized through `formatAxiosError`
5. Toast notifications provide user feedback

### Authentication Flow
1. All requests include credentials via `withCredentials: true`
2. 401 errors trigger authentication redirects
3. Hooks support both optional (`returnNull`) and required data patterns
4. User context changes invalidate cached data

### State Management
- React Query handles server state and caching
- Local component state managed through custom hooks
- Toast system uses centralized state management
- Form state isolated within `useEditForm`

## External Dependencies

### Core Dependencies
- **React**: Hook execution and component lifecycle
- **@tanstack/react-query**: Server state management, caching, and background updates
- **axios**: HTTP client for API requests with interceptors and error handling
- **react-responsive**: Media query management for responsive design
- **socket.io-client**: Real-time WebSocket communication for payment and usage tracking

### Development Dependencies
- **react-test-renderer**: Hook testing without DOM requirements
- **qtests**: Testing utilities and mocking infrastructure

### Optional Integrations
- **MongoDB-style APIs**: Assumes `_id` fields in dropdown data
- **Session-based authentication**: Relies on cookies for auth state
- **Toast libraries**: Compatible with shadcn/ui, Chakra UI, Material-UI toast systems

## Deployment Strategy

### Module System
- Uses CommonJS (`require`/`module.exports`) for broad Node.js compatibility
- Targets Node.js 18+ environments
- Maintains compatibility across different Node.js versions

### Build Process
- No build step required - ships as source code
- Direct Node.js execution for immediate usage
- Comprehensive test suite with 92+ passing tests

### Distribution
- Published as npm package `qreactutils`
- Version 1.0.1 with semantic versioning
- Includes TypeScript definitions via `@types/node`

### Testing Infrastructure
- Multiple test runners for different scenarios
- Offline development mode with `OFFLINE_MODE=true`
- Comprehensive mocking for external dependencies
- CI/CD compatible test execution

## Changelog

- June 17, 2025: Initial setup
- June 17, 2025: Added useSocket hook for real-time WebSocket communication with Socket.IO
- June 17, 2025: Added usePageFocus hook for accessibility-focused keyboard navigation
- June 17, 2025: Reorganized /lib directory by purpose - created specialized modules (socket.js, accessibility.js, dom.js) for better code organization

## User Preferences

Preferred communication style: Simple, everyday language.