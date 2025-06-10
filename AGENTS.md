# AGENTS.md

## VISION

This React hooks utility library was designed to solve the recurring pattern of boilerplate code across React applications, particularly around async operations, form management, and UI state. The library emphasizes **stability over features** - each hook provides stable function references to prevent unnecessary re-renders, which is critical for performance in large React applications.

The business logic prioritizes **developer experience through consistency** rather than maximum flexibility. For example, `useDropdownData` assumes MongoDB-style `_id` fields and specific toast integration patterns because these represent the most common use cases in typical business applications. The library trades some generic flexibility for reduced cognitive load when implementing common patterns.

The **offline-first development approach** embedded throughout (via `codexRequest` infrastructure) reflects a design philosophy where frontend development should never be blocked by backend availability. This addresses the real-world scenario where frontend and backend teams work in parallel.

## FUNCTIONALITY

### Agent Boundaries for Code Modifications

- **Preserve CommonJS Module System**: All agents must maintain `require`/`module.exports` patterns. Never introduce ES modules (`import`/`export`) as this breaks Node.js compatibility requirements.
- **Maintain Stable Function References**: When modifying hooks, ensure `useCallback` dependencies are correctly managed. Breaking stable references will cause performance regressions in consuming applications.
- **Preserve Logging Infrastructure**: The comprehensive `console.log` statements throughout serve dual purposes: debugging and API documentation. Agents should maintain this logging pattern when adding new functions.
- **Axios Configuration Integrity**: The `axiosClient` instance in `lib/api.js` uses `withCredentials: true` for session-based authentication. This pattern must be preserved as it's foundational to the authentication flow.

### Expected Agent Behaviors

- **Comment Rationale, Not Just Functionality**: When adding or modifying code, explain *why* design decisions were made, not just what the code does. Future maintainers need to understand the tradeoffs.
- **Test-Driven Modifications**: Any changes to hook behavior must be reflected in the comprehensive test suite. The test patterns demonstrate expected usage.
- **Dependency Injection Patterns**: Maintain the pattern where hooks accept external dependencies (like `toast` instances) rather than importing them directly. This preserves testability and flexibility.
- **Error Handling Consistency**: All async operations must follow the established pattern: try-catch blocks with proper loading state management and error propagation.

### Critical Architecture Patterns

- **Hook Aggregation**: The `lib/hooks.js` file serves as the central aggregator, importing from specialized modules. This pattern allows for clean separation while maintaining a single import point.
- **Helper Function Hierarchy**: Functions that assist only one function stay inline, functions helping multiple functions in one file become helpers, functions helping across files become utilities.
- **Error Handling Consistency**: All async operations follow the established executeWithErrorHandling pattern with proper logging and error transformation.
- **Loading State Management**: The executeWithLoadingState helper standardizes async operation patterns across all hooks.
- **401 Error Handling**: The `handle401Error` function supports both `returnNull` and `throw` behaviors, enabling different authentication strategies (optional vs required data).

## SCOPE

### In-Scope

- React hooks for common UI patterns (async actions, dropdowns, forms, mobile detection)
- Utility functions that support the hooks ecosystem
- API request wrappers with consistent error handling
- Toast notification integration patterns
- Client-side authentication flow helpers

### Out-of-Scope

- Server-side rendering (SSR) optimizations
- State management solutions (Redux, Zustand, etc.) - this library complements them
- Complex animations or UI components - this is a hooks library, not a component library
- Backend/API implementation - this library only provides frontend integration patterns
- Build tools or bundling configurations

### Change Boundaries

- **Hook Signatures**: Public APIs (function parameters, return values) should remain stable to avoid breaking changes
- **Core Patterns**: The async-loading-error pattern used throughout should be maintained for consistency
- **Test Structure**: The Node.js-based testing approach (without complex React testing frameworks) should be preserved

## CONSTRAINTS

### Protected Components

- **`index.js`**: The main export structure should not be altered without careful consideration of breaking changes for existing consumers
- **`lib/api.js`**: The `executeAxiosRequest` and error handling patterns are foundational to the entire library
- **`test.js`**: The comprehensive test structure serves as both validation and documentation

### Required Approval Process

- **Breaking Changes**: Any modifications to hook return values or parameter requirements need explicit justification
- **New Dependencies**: Additional npm packages must be justified against bundle size and maintenance overhead
- **Module System Changes**: Any deviation from CommonJS requires approval as it affects Node.js compatibility

### Special Workflows

- **Testing**: All changes must pass the existing Node.js-based test suite. No changes should require external testing frameworks
- **Documentation**: README.md updates must accompany any public API changes

## POLICY

### React-Specific Policies

- **Hooks Over Classes**: All React functionality must use hooks, never class components
- **Business Logic Separation**: Complex logic should reside in hooks or utility functions, not directly in React components
- **Immutable State Updates**: Never mutate state directly; always use proper React state update patterns

### Code Organization Policies

- **Single Responsibility**: Each hook should solve one specific problem well rather than being overly generic
- **Consistent Error Handling**: All async operations must follow the try-catch-finally pattern with proper loading state management
- **Stable References**: Use `useCallback` and `useMemo` appropriately to prevent unnecessary re-renders

### Maintenance Policies

- **Performance First**: Optimizations for preventing re-renders take precedence over code brevity
- **Backwards Compatibility**: Public APIs should remain stable; deprecate before removing
- **Documentation as Code**: The extensive commenting serves as the primary documentation source

### Integration Requirements

- **Toast System Agnostic**: Toast integration must work with any toast library that accepts `{title, description, variant}` objects
- **Framework Agnostic Utilities**: Non-React utilities should work in any JavaScript environment
- **Test Coverage**: All public functions must have corresponding test cases in the Node.js test suite

### Critical Implementation Details

- **Mobile Breakpoint Standard**: The 768px breakpoint in `useIsMobile` aligns with Bootstrap's md breakpoint and should not be changed without considering existing applications
- **Query Client Configuration**: The React Query client uses default settings optimized for typical CRUD operations. Custom configurations should be applied at the application level, not in this library
- **Error Propagation Pattern**: Functions always re-throw errors after handling them (logging, toasts) to preserve the error chain for calling code
- **Codex Request Infrastructure**: The `codexRequest` wrapper exists for offline development scenarios but currently passes through to live requests. This infrastructure should be preserved for future enhancement