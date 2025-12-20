/**
 * Deep Link Validator (V7.0.0)
 *
 * Security utility for validating deep link URLs and parameters.
 * Prevents URL injection and malicious deep link attacks.
 *
 * V7.0.0 (M-11): Deep link scheme validation
 */

// Allowed deep link paths - whitelist approach
const ALLOWED_PATHS = [
  '/reset-password',
  '/booking',
  '/pay',
  '/stylist',
  '/property',
  '/message',
] as const;

// Allowed URL schemes
const ALLOWED_SCHEMES = ['vlossom', 'exp+vlossom'] as const;

// Max parameter lengths to prevent DoS
const PARAM_LIMITS = {
  token: 64, // Reset tokens are 64 hex chars
  id: 36, // UUIDs are 36 chars
  default: 100,
} as const;

export interface DeepLinkValidationResult {
  isValid: boolean;
  path: string | null;
  params: Record<string, string>;
  error?: string;
}

/**
 * Sanitize a parameter value
 * Strips potentially dangerous characters, keeps alphanumeric, dash, underscore
 */
function sanitizeParam(value: string, maxLength: number): string {
  // Remove any characters that aren't alphanumeric, dash, or underscore
  const sanitized = value.replace(/[^a-zA-Z0-9\-_]/g, '');
  return sanitized.slice(0, maxLength);
}

/**
 * Parse and validate a deep link URL
 */
export function validateDeepLink(url: string): DeepLinkValidationResult {
  try {
    // Check if URL is a string
    if (!url || typeof url !== 'string') {
      return { isValid: false, path: null, params: {}, error: 'Invalid URL format' };
    }

    // Parse the URL
    const parsed = new URL(url);

    // Validate scheme
    const scheme = parsed.protocol.replace(':', '');
    if (!ALLOWED_SCHEMES.includes(scheme as typeof ALLOWED_SCHEMES[number])) {
      console.warn('[DeepLink] Invalid scheme:', scheme);
      return { isValid: false, path: null, params: {}, error: 'Invalid URL scheme' };
    }

    // Normalize path
    const path = parsed.pathname || parsed.hostname || '';
    const normalizedPath = path.startsWith('/') ? path : `/${path}`;

    // Check if path matches allowed paths (allow subpaths like /booking/123)
    const isAllowedPath = ALLOWED_PATHS.some(
      (allowed) => normalizedPath === allowed || normalizedPath.startsWith(`${allowed}/`)
    );

    if (!isAllowedPath) {
      console.warn('[DeepLink] Blocked path:', normalizedPath);
      return { isValid: false, path: null, params: {}, error: 'Path not allowed' };
    }

    // Sanitize query parameters
    const params: Record<string, string> = {};
    for (const [key, value] of parsed.searchParams.entries()) {
      // Determine max length based on parameter name
      const maxLength = key === 'token' ? PARAM_LIMITS.token :
                       key === 'id' ? PARAM_LIMITS.id :
                       PARAM_LIMITS.default;

      const sanitizedKey = sanitizeParam(key, 50);
      const sanitizedValue = sanitizeParam(value, maxLength);

      if (sanitizedKey && sanitizedValue) {
        params[sanitizedKey] = sanitizedValue;
      }
    }

    return {
      isValid: true,
      path: normalizedPath,
      params,
    };
  } catch (error) {
    console.warn('[DeepLink] Parse error:', error);
    return { isValid: false, path: null, params: {}, error: 'Failed to parse URL' };
  }
}

/**
 * Extract and validate a specific parameter from deep link
 */
export function extractDeepLinkParam(
  url: string,
  paramName: string
): string | null {
  const result = validateDeepLink(url);
  if (!result.isValid) return null;
  return result.params[paramName] || null;
}

/**
 * Check if a URL is a valid Vlossom deep link
 */
export function isValidVlossomDeepLink(url: string): boolean {
  return validateDeepLink(url).isValid;
}
