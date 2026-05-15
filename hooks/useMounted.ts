import { useState, useEffect } from 'react';

// Prevents Next.js Hydration errors when rendering local Zustand states (like Watchlist/History).
// It ensures that data specific to the user's local browser doesn't render until the client has mounted.
export function useMounted() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  },[]);
  return mounted;
}
