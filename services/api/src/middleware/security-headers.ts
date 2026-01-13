/**
 * Security Headers Middleware (F4.7: Security Hardening)
 * Implements OWASP recommended security headers
 */

import { Request, Response, NextFunction } from "express";

/**
 * Security headers configuration
 */
export interface SecurityHeadersConfig {
  // Content Security Policy
  contentSecurityPolicy?: boolean | {
    directives?: Record<string, string[]>;
  };
  // HTTP Strict Transport Security
  hsts?: boolean | {
    maxAge?: number;
    includeSubDomains?: boolean;
    preload?: boolean;
  };
  // X-Content-Type-Options
  noSniff?: boolean;
  // X-Frame-Options
  frameOptions?: "DENY" | "SAMEORIGIN" | false;
  // X-XSS-Protection (deprecated but still useful for older browsers)
  xssProtection?: boolean;
  // Referrer-Policy
  referrerPolicy?: string | false;
  // Cross-Origin-Embedder-Policy
  crossOriginEmbedderPolicy?: string | false;
  // Cross-Origin-Opener-Policy
  crossOriginOpenerPolicy?: string | false;
  // Cross-Origin-Resource-Policy
  crossOriginResourcePolicy?: string | false;
  // Permissions-Policy
  permissionsPolicy?: Record<string, string[]> | false;
}

/**
 * Default security headers configuration
 */
const DEFAULT_CONFIG: SecurityHeadersConfig = {
  contentSecurityPolicy: {
    directives: {
      "default-src": ["'self'"],
      "script-src": ["'self'"],
      "style-src": ["'self'", "'unsafe-inline'"],
      "img-src": ["'self'", "data:", "https://res.cloudinary.com"],
      "font-src": ["'self'"],
      "connect-src": ["'self'", "https://api.cloudinary.com"],
      "frame-ancestors": ["'none'"],
      "base-uri": ["'self'"],
      "form-action": ["'self'"],
    },
  },
  hsts: {
    maxAge: 31536000, // 1 year
    includeSubDomains: true,
    preload: false,
  },
  noSniff: true,
  frameOptions: "DENY",
  xssProtection: true,
  referrerPolicy: "strict-origin-when-cross-origin",
  crossOriginEmbedderPolicy: "require-corp",
  crossOriginOpenerPolicy: "same-origin",
  crossOriginResourcePolicy: "same-origin",
  permissionsPolicy: {
    camera: [],
    microphone: [],
    geolocation: ["self"],
    payment: ["self"],
  },
};

/**
 * Build Content-Security-Policy header value
 */
function buildCSP(directives: Record<string, string[]>): string {
  return Object.entries(directives)
    .map(([key, values]) => `${key} ${values.join(" ")}`)
    .join("; ");
}

/**
 * Build Permissions-Policy header value
 */
function buildPermissionsPolicy(policies: Record<string, string[]>): string {
  return Object.entries(policies)
    .map(([key, values]) => {
      if (values.length === 0) {
        return `${key}=()`;
      }
      return `${key}=(${values.join(" ")})`;
    })
    .join(", ");
}

/**
 * Create security headers middleware
 */
export function securityHeaders(config: SecurityHeadersConfig = {}) {
  // Merge with defaults
  const finalConfig = { ...DEFAULT_CONFIG, ...config };

  return (_req: Request, res: Response, next: NextFunction) => {
    // Content-Security-Policy
    if (finalConfig.contentSecurityPolicy) {
      const cspConfig =
        typeof finalConfig.contentSecurityPolicy === "object"
          ? finalConfig.contentSecurityPolicy
          : DEFAULT_CONFIG.contentSecurityPolicy;

      if (cspConfig && typeof cspConfig === "object" && cspConfig.directives) {
        res.setHeader("Content-Security-Policy", buildCSP(cspConfig.directives));
      }
    }

    // HTTP Strict Transport Security
    if (finalConfig.hsts) {
      const hstsConfig =
        typeof finalConfig.hsts === "object"
          ? finalConfig.hsts
          : { maxAge: 31536000, includeSubDomains: true };

      let hstsValue = `max-age=${hstsConfig.maxAge || 31536000}`;
      if (hstsConfig.includeSubDomains) {
        hstsValue += "; includeSubDomains";
      }
      if (hstsConfig.preload) {
        hstsValue += "; preload";
      }
      res.setHeader("Strict-Transport-Security", hstsValue);
    }

    // X-Content-Type-Options
    if (finalConfig.noSniff) {
      res.setHeader("X-Content-Type-Options", "nosniff");
    }

    // X-Frame-Options
    if (finalConfig.frameOptions) {
      res.setHeader("X-Frame-Options", finalConfig.frameOptions);
    }

    // X-XSS-Protection
    if (finalConfig.xssProtection) {
      res.setHeader("X-XSS-Protection", "1; mode=block");
    }

    // Referrer-Policy
    if (finalConfig.referrerPolicy) {
      res.setHeader("Referrer-Policy", finalConfig.referrerPolicy);
    }

    // Cross-Origin-Embedder-Policy
    if (finalConfig.crossOriginEmbedderPolicy) {
      res.setHeader(
        "Cross-Origin-Embedder-Policy",
        finalConfig.crossOriginEmbedderPolicy
      );
    }

    // Cross-Origin-Opener-Policy
    if (finalConfig.crossOriginOpenerPolicy) {
      res.setHeader(
        "Cross-Origin-Opener-Policy",
        finalConfig.crossOriginOpenerPolicy
      );
    }

    // Cross-Origin-Resource-Policy
    if (finalConfig.crossOriginResourcePolicy) {
      res.setHeader(
        "Cross-Origin-Resource-Policy",
        finalConfig.crossOriginResourcePolicy
      );
    }

    // Permissions-Policy
    if (finalConfig.permissionsPolicy) {
      res.setHeader(
        "Permissions-Policy",
        buildPermissionsPolicy(finalConfig.permissionsPolicy)
      );
    }

    // Remove potentially dangerous headers
    res.removeHeader("X-Powered-By");

    next();
  };
}

/**
 * CORS configuration for API
 * V8.0.0 Security Fix: Fail-closed CORS validation and X-CSRF-Token support
 * Note: Use cors package in production for full CORS support
 */
export function corsHeaders(allowedOrigins: string[] = []) {
  return (req: Request, res: Response, next: NextFunction) => {
    const origin = req.headers.origin;

    // V8.0.0: Fail-closed CORS validation
    // In production, only explicitly allowed origins are permitted
    if (origin) {
      // Check if origin is in the explicit allowlist
      const isAllowed = origin && allowedOrigins.includes(origin);

      if (isAllowed) {
        res.setHeader("Access-Control-Allow-Origin", origin);
        res.setHeader("Access-Control-Allow-Credentials", "true");
      } else if (process.env.NODE_ENV === 'production') {
        // In production, reject requests from unknown origins for non-preflight
        if (req.method !== "OPTIONS") {
          return res.status(403).json({
            error: 'Origin not allowed',
            code: 'CORS_ORIGIN_DENIED'
          });
        }
      } else {
        // In development, allow any origin but log warning
        res.setHeader("Access-Control-Allow-Origin", origin);
        res.setHeader("Access-Control-Allow-Credentials", "true");
      }
    }

    // Handle preflight
    if (req.method === "OPTIONS") {
      res.setHeader(
        "Access-Control-Allow-Methods",
        "GET, POST, PUT, DELETE, PATCH, OPTIONS"
      );
      // V8.0.0: Include X-CSRF-Token in allowed headers for CSRF protection
      res.setHeader(
        "Access-Control-Allow-Headers",
        "Content-Type, Authorization, X-Requested-With, X-CSRF-Token"
      );
      res.setHeader("Access-Control-Max-Age", "86400"); // 24 hours
      return res.status(204).send();
    }

    next();
  };
}

/**
 * API-specific security headers (less restrictive CSP for API responses)
 */
export const apiSecurityHeaders = securityHeaders({
  contentSecurityPolicy: false, // API doesn't serve HTML
  crossOriginEmbedderPolicy: false, // Allow embedding API responses
  crossOriginResourcePolicy: "cross-origin", // Allow cross-origin requests
});

/**
 * Full security headers for web responses
 */
export const webSecurityHeaders = securityHeaders();
