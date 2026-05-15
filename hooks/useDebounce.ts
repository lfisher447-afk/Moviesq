import { useState, useEffect } from 'react';

// Prevents the Command Search Bar from spamming TMDB API by waiting for the user to finish typing
export function useDebounce<T>(value: T, delay: number): T {
  const[debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(handler);
  }, [value, delay]);

  return debouncedValue;
}
