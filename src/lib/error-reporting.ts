/**
 * Application Error Reporting & Logging
 * Captures unhandled runtime errors and boundary exceptions for monitoring.
 */

export interface ErrorReportContext {
  boundary?: string;
  route?: string;
  [key: string]: unknown;
}

export function reportAppError(error: unknown, context: ErrorReportContext = {}): void {
  if (typeof window === "undefined") {
    console.error("[SSR Error]", error, context);
    return;
  }

  const errorDetails = {
    message:
      error instanceof Response
        ? `HTTP ${error.status} ${error.statusText || ""} (${error.url || "unknown url"})`
        : error instanceof Error
          ? error.message
          : String(error),
    stack: error instanceof Error ? error.stack : undefined,
    route: window.location.pathname,
    timestamp: new Date().toISOString(),
    ...context,
  };

  // Structured console logging for debugging
  console.error("[GovVerify Application Error]", errorDetails);
}
