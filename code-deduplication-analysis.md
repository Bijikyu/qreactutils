# Code Deduplication Analysis

## Executive Summary

Analysis reveals several patterns of repeated code that can be consolidated into helper functions and utilities. The analysis follows the specified hierarchy: single-function code stays inline, multi-function same-file code becomes helpers, multi-file code becomes utilities.

## Repeated Patterns Identified

### 1. Logging Pattern Repetition (Cross-file Utility Candidate)

**Pattern**: Standardized function entry/exit logging
**Files**: `lib/hooks.js`, `lib/utils.js`, `lib/api.js`
**Frequency**: 15+ occurrences

**Current Implementation**:
```javascript
// In multiple files
console.log(`functionName is running with ${params}`);
// ... function logic
console.log(`functionName is returning ${result}`);
```

**Recommendation**: Create utility function `logFunctionExecution`
**Location**: New file `lib/logger.js`
**Justification**: Used across multiple files, standardizes debugging output

### 2. Try-Catch Error Handling Pattern (Cross-file Utility Candidate)

**Pattern**: Consistent try-catch-log-rethrow pattern
**Files**: `lib/utils.js`, `lib/api.js`, `lib/toastIntegration.js`
**Frequency**: 8+ occurrences

**Current Implementation**:
```javascript
// Repeated in multiple functions
try {
  const result = operation();
  console.log(`function returning ${JSON.stringify(result)}`);
  return result;
} catch (err) {
  console.log(`function has run resulting in failure`);
  throw err;
}
```

**Recommendation**: Already partially implemented in `lib/errorHandling.js`
**Action**: Expand usage of `executeWithErrorHandling` utility

### 3. Toast Function Wrapping Pattern (Single-file Helper Candidate)

**Pattern**: Toast function validation and error handling
**File**: `lib/utils.js`
**Frequency**: 3 occurrences (toastError, toastSuccess, showToast)

**Current Implementation**:
```javascript
// Repeated pattern in lib/utils.js
function toastFunction(toast, message, title, variant) {
  console.log(`toastFunction is running with ${message}`);
  try {
    const result = showToast(toast, message, title, variant);
    console.log(`toastFunction is returning ${JSON.stringify(result)}`);
    return result;
  } catch (err) {
    console.log(`toastFunction has run resulting in failure`);
    throw err;
  }
}
```

**Recommendation**: Already abstracted via `withToastLogging` helper
**Status**: Well-implemented, no action needed

### 4. useCallback Error Handling Pattern (Single-file Helper)

**Pattern**: useCallback with try-catch and callback invocation
**File**: `lib/hooks.js`
**Frequency**: 3 occurrences

**Current Implementation**:
```javascript
// Pattern in useAsyncAction, useStableCallbackWithHandlers
const callback = useCallback(async (...args) => {
  try {
    const result = await operation(...args);
    options?.onSuccess?.(result);
    return result;
  } catch (error) {
    options?.onError?.(error);
    throw error;
  }
}, deps);
```

**Recommendation**: Already abstracted via `useStableCallbackWithHandlers`
**Status**: Properly abstracted, consider expanding usage

### 5. Axios Request Configuration Pattern (Cross-file Utility Candidate)

**Pattern**: Request configuration with error handling
**Files**: `lib/api.js` (multiple functions)
**Frequency**: 4 occurrences

**Current Implementation**:
```javascript
// Repeated in apiRequest, getQueryFn
const response = await codexRequest(
  () => axiosClient.request({ url, method, data }),
  mockResponse
);
```

**Recommendation**: Already abstracted via `executeAxiosRequest`
**Status**: Well-implemented utility

## Specific Recommendations by Priority

### High Priority - Create New Utilities

#### Task A: Logging Utility Enhancement
**File**: `lib/logger.js` (new)
**Purpose**: Centralize logging patterns used across all files

```javascript
/**
 * Standardized logging utility for consistent function tracing
 */
function createFunctionLogger(functionName) {
  return {
    entry: (params) => console.log(`${functionName} is running with ${params}`),
    exit: (result) => console.log(`${functionName} is returning ${JSON.stringify(result)}`),
    completion: (value) => console.log(`${functionName} has run resulting in a final value of ${value}`),
    error: () => console.log(`${functionName} has run resulting in a final value of failure`)
  };
}
```

**Usage**:
```javascript
// Replace scattered logging with:
const logger = createFunctionLogger('useAsyncAction');
logger.entry(asyncFn);
// ... function logic
logger.exit(result);
```

**Impact**: Reduces 50+ lines of repetitive logging code

#### Task B: React Hook Wrapper Utility  
**File**: `lib/hookUtils.js` (new)
**Purpose**: Standardize useCallback patterns with error handling

```javascript
/**
 * Creates useCallback with standardized error handling and logging
 */
function useStandardCallback(operation, options, deps, functionName) {
  const logger = createFunctionLogger(functionName);
  return useCallback(async (...args) => {
    logger.entry(args);
    try {
      const result = await operation(...args);
      options?.onSuccess?.(result);
      logger.exit(result);
      return result;
    } catch (error) {
      options?.onError?.(error);
      logger.error();
      throw error;
    }
  }, deps);
}
```

### Medium Priority - Expand Existing Utilities

#### Task C: Expand Error Handling Utility Usage
**Files**: `lib/utils.js`, `lib/api.js`
**Action**: Replace manual try-catch blocks with `executeWithErrorHandling`

**Current**:
```javascript
// In multiple functions
try {
  const result = operation();
  return result;
} catch (err) {
  console.error('Error:', err);
  throw err;
}
```

**Improved**:
```javascript
// Use existing utility
return executeWithErrorHandling(
  operation,
  'functionName',
  (error) => formatAxiosError(error)
);
```

#### Task D: Toast Integration Pattern Consolidation
**File**: `lib/toastIntegration.js`
**Action**: Create additional toast integration patterns

```javascript
/**
 * Execute operation with loading toast feedback
 */
async function executeWithLoadingToast(operation, toast, loadingMessage, successMessage) {
  const loadingToastId = toast({ title: 'Loading', description: loadingMessage });
  try {
    const result = await operation();
    toast.dismiss(loadingToastId);
    showToast(toast, successMessage, 'Success');
    return result;
  } catch (error) {
    toast.dismiss(loadingToastId);
    showToast(toast, error.message, 'Error', 'destructive');
    throw error;
  }
}
```

### Low Priority - Helper Function Opportunities

#### Task E: Form Field Update Pattern (Single-file Helper)
**File**: `lib/hooks.js`
**Pattern**: Functional state updates in `useEditForm`

**Current**:
```javascript
function setField(key, value) {
  setFields((prev) => ({ ...prev, [key]: value }));
}
```

**Recommendation**: Keep as-is - simple and specific to useEditForm

#### Task F: Toast State Reducer Helpers
**File**: `lib/hooks.js`  
**Pattern**: Toast state management actions

**Recommendation**: Consider extracting toast action creators if more toast types are added

## Implementation Strategy

### Phase 1: Cross-file Utilities (High Impact)
1. Create `lib/logger.js` with standardized logging utilities
2. Create `lib/hookUtils.js` with React hook helper patterns
3. Update all files to use new utilities

### Phase 2: Expand Existing Utilities (Medium Impact)  
1. Increase usage of `executeWithErrorHandling` in `lib/utils.js` and `lib/api.js`
2. Add loading toast patterns to `lib/toastIntegration.js`

### Phase 3: Code Cleanup (Low Impact)
1. Remove redundant try-catch blocks after utility adoption
2. Standardize function signatures across similar patterns

## Task Assignment for Parallel Work

### Task A: Logging Utility (Independent)
- **Files**: Create `lib/logger.js`, update imports
- **Conflicts**: None - new file and import additions only

### Task B: Hook Utils (Independent) 
- **Files**: Create `lib/hookUtils.js`, update `lib/hooks.js` selectively
- **Conflicts**: None - isolated to hook patterns

### Task C: Error Handling Expansion (Independent)
- **Files**: Update `lib/utils.js` and `lib/api.js` separately  
- **Conflicts**: None - different files

### Task D: Toast Integration (Independent)
- **Files**: Expand `lib/toastIntegration.js` only
- **Conflicts**: None - isolated to toast patterns

## Additional Patterns Identified

### 6. State Update Pattern with Logging (Single-file Helper)

**Pattern**: setState calls with logging
**File**: `lib/hooks.js`
**Frequency**: 4 occurrences in useEditForm, useDropdownToggle

**Current Implementation**:
```javascript
function setField(key, value) {
  console.log(`setField is running with ${String(key)}, ${value}`);
  setFields((prev) => ({ ...prev, [key]: value }));
  console.log(`setField has run resulting in a final value of ${value}`);
}
```

**Recommendation**: Create helper for logged state updates within useEditForm

### 7. Async Operation Wrapper Pattern (Cross-file Utility)

**Pattern**: Async operations with loading state and error handling
**Files**: `lib/hooks.js`, `lib/toastIntegration.js`
**Frequency**: 5 occurrences

**Current Implementation**:
```javascript
// Pattern across useAsyncAction, executeWithLoadingState, etc.
async function operationWithState(operation, setLoading) {
  try {
    setLoading(true);
    return await operation();
  } finally {
    setLoading(false);
  }
}
```

**Recommendation**: Expand `executeWithLoadingState` utility usage

## Expected Benefits

- **Code Reduction**: 15-20% reduction in repetitive code
- **Consistency**: Standardized patterns across all modules  
- **Maintainability**: Single source of truth for common patterns
- **Debugging**: Centralized logging improves troubleshooting
- **Performance**: Potential micro-optimizations in shared utilities
- **Type Safety**: Centralized utilities easier to enhance with TypeScript
- **Testing**: Utilities can be unit tested independently

## NPM Alternative Consideration

**Logging**: Could use `debug` package (1.4M weekly downloads)
**Recommendation**: Keep custom - too lightweight and specific to justify dependency

**Error Handling**: Could use `verror` package (400k weekly downloads)  
**Recommendation**: Keep custom - current patterns are React-specific

The custom utilities are well-suited to this library's specific patterns and don't justify additional dependencies.

## Task #24 Revision: Enhanced Deduplication Analysis

### Additional Pattern Recognition
**Cross-Module State Management**: Similar useState patterns across hooks could benefit from a shared state management utility
**Error Message Construction**: Repeated error message formatting patterns in api.js and utils.js
**Validation Logic**: Similar input validation patterns across multiple hooks

### Advanced Helper Function Opportunities
**Generic State Setter Factory**: Create reusable state setter patterns for form fields and dropdown states
**Event Handler Factory**: Standardize event handler creation patterns with consistent preventDefault/stopPropagation logic
**Async Operation Wrapper**: Enhanced version of executeWithLoadingState with retry logic and timeout handling

### Refactoring Safety Analysis
All proposed changes maintain:
- Backward compatibility with existing APIs
- Clear separation of concerns
- Testability of individual components
- Performance characteristics of original implementations

### Memory Optimization Opportunities
**Function Reference Stability**: Shared useCallback patterns could reduce memory allocation
**Event Listener Management**: Consolidated event handling patterns
**State Update Batching**: Opportunity for batched state updates in form operations
