/**
 * Client-side authentication storage adapter for Supabase.
 * Uses window.localStorage when running in the browser, and undefined during SSR.
 */
export function brokeredPreviewStorage(): Storage | undefined {
  if (typeof window === "undefined") return undefined;
  return localStorage;
}
