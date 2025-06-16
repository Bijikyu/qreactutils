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
  const { executeWithErrorHandling, executeSyncWithErrorHandling } = require('../lib/errorHandling.js'); // error helpers for tests

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

  runTest('useDropdownData clears items when user becomes null', async () => {
    let calls = 0; // count fetcher runs for cache validation
    const fetcher = async () => { calls++; return ['x']; }; // fetch returns single item

    const { result, rerender } = renderHook(
      (p) => useDropdownData(fetcher, null, p.user), // hook with user prop to control auth
      { user: { _id: 'u1' } }
    );
    await TestRenderer.act(async () => { await Promise.resolve(); }); // allow initial query
    assertEqual(result.current.items.length, 1, 'Should load item for user');

    rerender({ user: null }); // simulate logout
    await TestRenderer.act(async () => { await Promise.resolve(); }); // allow effect cleanup
    assertEqual(result.current.items.length, 0, 'Items should reset when user is null');
  });

  runTest('executeWithErrorHandling wraps non-error transform', async () => {
    const errFn = async () => { throw new Error('orig'); }; // function that throws
    try {
      await executeWithErrorHandling(errFn, 'wrapTest', () => 'bad'); // transform returns string
      throw new Error('no throw');
    } catch (e) {
      assert(e instanceof Error, 'Should throw Error');
      assertEqual(e.message, 'bad', 'Message preserved');
    }
  });

  runTest('executeWithErrorHandling awaits promise transform', async () => {
    const errFn = async () => { throw new Error('orig'); }; // function that throws
    const trans = async () => { await Promise.resolve(); return null; }; // transform resolves to null
    try {
      await executeWithErrorHandling(errFn, 'awaitTest', trans); // should await transform
      throw new Error('no throw');
    } catch (e) {
      assertEqual(e.message, 'null', 'Null becomes error with message');
    }
  });

  runTest('executeSyncWithErrorHandling wraps non-error transform', async () => {
    const fn = () => { throw new Error('orig'); }; // sync function throwing error
    try {
      await executeSyncWithErrorHandling(fn, 'syncWrap', () => undefined); // transform undefined
      throw new Error('no throw');
    } catch (e) {
      assertEqual(e.message, 'undefined', 'Undefined becomes error with message');
    }
  });
};

