let reloading = false;

/**
 * Turn opaque runtime errors into human-friendly messages.
 * The "Unexpected token 'T', \"The page c\"... is not valid JSON" error occurs
 * when the client bundle calls a server-function URL whose hash no longer
 * exists on the server (stale tab after a redeploy). The response body is the
 * host's HTML 404 page, which JSON.parse chokes on. Recover by reloading once.
 */
export function friendlyError(err: unknown, fallback = "Something went wrong"): string {
  const msg = err instanceof Error ? err.message : String(err ?? "");
  if (/is not valid JSON/i.test(msg) && /The page c/i.test(msg)) {
    if (typeof window !== "undefined" && !reloading) {
      reloading = true;
      setTimeout(() => window.location.reload(), 800);
    }
    return "The app was updated. Refreshing…";
  }
  return msg || fallback;
}
