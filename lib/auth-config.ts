// lib/auth-config.ts

// A list of paths that are public and don't require authentication.
const AUTH_EXEMPT_PATHS: string[] = [
  "/", // Home page is public
  "/terms",
  "/report-bug"
];

/**
 * Checks if a given path is exempt from authentication.
 * @param path The URL path to check.
 * @returns {boolean} True if the path is exempt, false otherwise.
 */
export function isAuthExemptPath(path: string): boolean {
  if (AUTH_EXEMPT_PATHS.includes(path)) {
    return true;
  }
  // Add other public path checks if needed, e.g., using startsWith for categories
  if (path.startsWith("/search")) {
    return true;
  }
  return false;
}

/**
 * Validates and returns a safe redirect path from a query parameter.
 * Prevents open redirect vulnerabilities.
 * @param redirectPath The redirect path from the URL query.
 * @returns {string | null} A safe, relative path or null if invalid.
 */
export function getSafeRedirectPath(redirectPath: string | null): string | null {
  if (!redirectPath) {
    return null;
  }
  // Ensure the redirect path is relative and starts with a '/'
  // This prevents redirects to external, malicious domains.
  if (redirectPath.startsWith("/") && !redirectPath.startsWith("//")) {
    try {
      // Sanitize by decoding to handle encoded characters
      const decodedPath = decodeURIComponent(redirectPath);
      // Use URL constructor for robust parsing
      const url = new URL(decodedPath, "http://localhost"); // Dummy base URL
      return url.pathname + url.search + url.hash;
    } catch (error) {
      return null; // Invalid URL format
    }
  }

  return null;
}
