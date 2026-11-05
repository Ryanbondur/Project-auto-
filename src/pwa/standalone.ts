/**
 * Detect iOS / Android Home Screen (standalone) launch.
 * Used for CSS hooks only — persistence still uses the same localStorage API.
 */
export function isStandaloneDisplay(): boolean {
  if (typeof window === "undefined") return false;
  const mq = window.matchMedia?.("(display-mode: standalone)");
  if (mq?.matches) return true;
  // Legacy iOS Home Screen web clip
  const nav = window.navigator as Navigator & { standalone?: boolean };
  return nav.standalone === true;
}

export function applyStandaloneClass(): void {
  if (typeof document === "undefined") return;
  if (isStandaloneDisplay()) {
    document.documentElement.classList.add("standalone");
  }
}
