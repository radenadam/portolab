import { useSyncExternalStore } from "react";

// Whether the page runs in a browser never changes, so the store never calls back.
function subscribeToNothing(): () => void {
  return () => undefined;
}

/** Whether the page runs in a browser. The server and the first render in the browser give false, so a chart draws the same markup on both, and a reader before JavaScript loads meets no control that waits for it. */
export function useIsInBrowser(): boolean {
  return useSyncExternalStore(
    subscribeToNothing,
    () => true,
    () => false,
  );
}
