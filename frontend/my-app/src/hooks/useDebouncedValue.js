import { useEffect, useState } from 'react';

/**
 * Delays a fast-changing value (the search box) so typing does not fire one
 * request per keystroke. This is the only debounce in the app.
 */
export function useDebouncedValue(value, delay = 350) {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);

  return debounced;
}

export default useDebouncedValue;
