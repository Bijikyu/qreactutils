const React = require('react'); // React for hook execution
const TestRenderer = require('react-test-renderer'); // renderer to run hooks

module.exports = function helpersTests({ runTest, renderHook, assert, assertEqual }) {
  const {
    useStableCallbackWithHandlers,
    useAsyncStateWithCallbacks,
    useCallbackWithErrorHandling,
    executeWithLoadingState,
    useDropdownData
  } = require('../lib/hooks.js'); // import functions under test
  const { withToastLogging } = require('../lib/utils.js'); // import wrapper for async logging tests

  runTest('executeWithLoadingState resolves and toggles loading', async () => {
    let loading = false; // tracks loading state changes
    const setLoading = (v) => { loading = v; }; // mimic setState
    const promise = executeWithLoadingState(setLoading, async () => 'ok');
    assertEqual(loading, true, 'Loading should be true immediately');
    const result = await promise; // wait for completion
    assertEqual(result, 'ok', 'Should return result');
    assertEqual(loading, false, 'Loading should be false after finish');
  });

  runTest('executeWithLoadingState propagates errors', async () => {
    let loading = false;
    const setLoading = (v) => { loading = v; };
    let threw = false;
    const err = new Error('fail');
    try {
      await executeWithLoadingState(setLoading, async () => { throw err; });
    } catch (e) { threw = e === err; }
    assert(threw, 'Original error should be thrown');
    assertEqual(loading, false, 'Loading cleared on error');
  });

  runTest('useStableCallbackWithHandlers calls onSuccess', async () => {
    let success;
    const { result } = renderHook(() =>
      useStableCallbackWithHandlers((v) => v + 1, { onSuccess: (r) => { success = r; } }, [])
    );
    const val = await result.current(1);
    assertEqual(val, 2, 'Returned value should match');
    assertEqual(success, 2, 'onSuccess receives result');
  });

  runTest('useStableCallbackWithHandlers handles errors', async () => {
    let errOut;
    const error = new Error('boom');
    const { result } = renderHook(() =>
      useStableCallbackWithHandlers(() => { throw error; }, { onError: (e) => { errOut = e; } }, [])
    );
    let threw = false;
    try { await result.current(); } catch (e) { threw = e === error; }
    assert(threw, 'Error should propagate');
    assertEqual(errOut, error, 'onError receives error');
  });

  runTest('useAsyncStateWithCallbacks manages loading and callbacks', async () => {
    let success;
    let resolveFn;
    const asyncFn = () => new Promise(res => { resolveFn = () => res(3); });
    const { result } = renderHook(() =>
      useAsyncStateWithCallbacks(asyncFn, { onSuccess: (r) => { success = r; } })
    );
    const [run] = result.current;
    let promise;
    TestRenderer.act(() => { promise = run(); });
    assertEqual(result.current[1], true, 'isLoading true after run');
    await TestRenderer.act(async () => { resolveFn(); await promise; });
    assertEqual(result.current[1], false, 'isLoading false after run');
    assertEqual(success, 3, 'onSuccess called with result');
  });

  runTest('useAsyncStateWithCallbacks propagates errors', async () => {
    let errOut;
    const error = new Error('oops');
    const { result } = renderHook(() =>
      useAsyncStateWithCallbacks(() => Promise.reject(error), { onError: (e) => { errOut = e; } })
    );
    let threw = false;
    try { await result.current[0](); } catch (e) { threw = e === error; }
    assert(threw, 'Error should propagate from run');
    assertEqual(errOut, error, 'onError called with error');
    assertEqual(result.current[1], false, 'Loading cleared after error');
  });

  runTest('useCallbackWithErrorHandling executes handlers', async () => {
    let success;
    const { result } = renderHook(() =>
      useCallbackWithErrorHandling((v) => v * 2, { onSuccess: (r) => { success = r; } }, [])
    );
    const val = await result.current(2);
    assertEqual(val, 4, 'Return value correct');
    assertEqual(success, 4, 'onSuccess invoked');
  });

  runTest('useCallbackWithErrorHandling propagates error', async () => {
    let errOut;
    const error = new Error('err');
    const { result } = renderHook(() =>
      useCallbackWithErrorHandling(() => { throw error; }, { onError: (e) => { errOut = e; } }, [])
    );
    let threw = false;
    try { await result.current(); } catch (e) { threw = e === error; }
    assert(threw, 'Error should be thrown');
    assertEqual(errOut, error, 'onError invoked with error');
  });

  runTest('useDropdownData refetches when user changes', async () => {
    let calls = 0; // track fetcher invocations for assertion
    const fetcher = async () => { calls++; return ['i']; }; // simple fetcher returning data

    const { rerender } = renderHook(
      (p) => useDropdownData(fetcher, null, p.user), // hook under test with user prop
      { user: { _id: 'u1' } } // initial user id
    );
    await TestRenderer.act(async () => { await Promise.resolve(); }); // allow initial query
    assertEqual(calls, 1, 'Should fetch once for first user');

    rerender({ user: { _id: 'u2' } }); // update user id
    await TestRenderer.act(async () => { await Promise.resolve(); }); // trigger effect
    assertEqual(calls, 2, 'Should refetch for new user');
  });

  runTest('withToastLogging supports async functions', async () => {
    const wrapped = withToastLogging('asyncFn', async (t, n) => n + 1); // wrap promise-returning op with toast param
    const result = await wrapped(null, 1); // call wrapper with dummy toast and number arg
    assertEqual(result, 2, 'Should resolve and return awaited result');

    const err = new Error('fail');
    const failWrap = withToastLogging('asyncErr', async () => { throw err; }); // wrap failing async op
    let threw = false;
    try { await failWrap(); } catch (e) { threw = e === err; }
    assert(threw, 'Should rethrow async error');
  });
};

