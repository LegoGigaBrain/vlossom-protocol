/**
 * HTTPS Enforcement Middleware (V8.0.0)
 *
 * Ensures all requests in production use HTTPS.
 * Redirects HTTP to HTTPS and sets security headers.
 */

import { Request, Response, NextFunction } from "express";

/**
 * HTTPS enforcement middleware
 * - In production: Redirects HTTP to HTTPS using 301 redirect
 * - In development: Allows HTTP for local development
 *
 * Note: Most cloud platforms (Heroku, Vercel, AWS ALB) handle HTTPS
 * termination at the load balancer level. This middleware handles
 * cases where the app is exposed directly or behind a proxy that
 * forwards the x-forwarded-proto header.
 */
export function httpsEnforcement() {
  return (req: Request, res: Response, next: NextFunction) => {
    // Skip in non-production environments
    if (process.env.NODE_ENV !== "production") {
      return next();
    }

    // Skip for health checks (load balancers need this on HTTP)
    if (req.path === "/health" || req.path === "/ready") {
      return next();
    }

    // Check if request is already HTTPS
    // Check x-forwarded-proto for requests behind a proxy/load balancer
    const isHttps =
      req.secure ||
      req.headers["x-forwarded-proto"] === "https" ||
      req.protocol === "https";

    if (!isHttps) {
      // Construct the HTTPS URL
      const host = req.headers.host || req.hostname;
      const httpsUrl = `https://${host}${req.originalUrl}`;

      // Log the redirect for monitoring
      console.warn(
        `[Security] Redirecting HTTP to HTTPS: ${req.method} ${req.originalUrl}`
      );

      // Use 301 (permanent) redirect for SEO and caching
      return res.redirect(301, httpsUrl);
    }

    // Add HSTS header for secure connections
    // This tells browsers to always use HTTPS for future requests
    res.setHeader(
      "Strict-Transport-Security",
      "max-age=31536000; includeSubDomains; preload"
    );

    next();
  };
}

/**
 * Trust proxy configuration for Express
 *
 * When running behind a reverse proxy (nginx, AWS ALB, Cloudflare),
 * Express needs to trust the X-Forwarded-* headers.
 *
 * Usage: app.set('trust proxy', getTrustProxyConfig())
 */
export function getTrustProxyConfig():
  | boolean
  | number
  | string
  | string[]
  | ((ip: string, hopIndex: number) => boolean) {
  const trustProxy = process.env.TRUST_PROXY;

  if (!trustProxy) {
    // Default: trust first proxy (standard for most cloud platforms)
    return 1;
  }

  if (trustProxy === "true") {
    return true;
  }

  if (trustProxy === "false") {
    return false;
  }

  // Check if it's a number
  const numValue = parseInt(trustProxy, 10);
  if (!isNaN(numValue)) {
    return numValue;
  }

  // Otherwise, treat as comma-separated IP addresses or subnets
  return trustProxy.split(",").map((ip) => ip.trim());
}

export default httpsEnforcement;
