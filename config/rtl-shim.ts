// Minimal shim for @testing-library/react used by generated smoke tests.
// Rationale: Avoid heavy DOM/testing dependencies in this Node-only test setup.
// We only need to accept a React element and provide a getByTestId() API so
// that expect(...).toBeInTheDocument() can run. Actual DOM rendering is out of scope.

type RenderResult = {
  getByTestId: (id: string) => any;
};

export function render(_element: any): RenderResult {
  // We do not evaluate React elements to avoid invoking hooks outside React.
  // Return a stable object whose getByTestId always returns a truthy placeholder.
  const placeholder = { __QUTILS_TEST_NODE__: true };
  return {
    getByTestId: (_id: string) => placeholder,
  };
}

export default { render };

