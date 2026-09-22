import { useEffect, useRef, useState } from 'react';

/**
 * Runs an async loader whenever `deps` change. Keeps the previous data on
 * screen (at reduced opacity via `loading`) instead of flashing a skeleton.
 */
export function useApi(loader, deps) {
  const [state, setState] = useState({ data: null, loading: true, error: null });
  const seq = useRef(0);

  useEffect(() => {
    const id = ++seq.current;
    setState((s) => ({ ...s, loading: true, error: null }));
    loader()
      .then((data) => {
        if (seq.current === id) setState({ data, loading: false, error: null });
      })
      .catch((error) => {
        if (seq.current === id) setState((s) => ({ ...s, loading: false, error }));
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  return state;
}
