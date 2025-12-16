// @vlossom/api - Main Backend API Service
// Reference: docs/vlossom/14-backend-architecture-and-apis.md
//
// SECURITY AUDIT (V1.9.0):
// - M-7: Production secret validation at startup

import express from "express";

/**
 * M-7: Validate required secrets in production
 * Fails fast at startup if critical configuration is missing
 */
function validateProductionSecrets(): void {
  if (process.env.NODE_ENV !== 'production') {
    return; // Skip validation in development
  }

  const required = [
    'JWT_SECRET',
    'DATABASE_URL',
    'TREASURY_ADDRESS',
    'ESCROW_ADDRESS',
    'RPC_URL',
  ];

  const missing = required.filter(key => !process.env[key]);

  if (missing.length > 0) {
    throw new Error(
      `FATAL: Missing required production secrets: ${missing.join(', ')}. ` +
      'Ensure all required environment variables are configured.'
    );
  }

  console.log('✓ Production secrets validated');
}

// Validate secrets before anything else
validateProductionSecrets();
import authRouter from "./routes/auth";
import bookingsRouter from "./routes/bookings";
import stylistsRouter from "./routes/stylists";
import walletRouter from "./routes/wallet";
import notificationsRouter from "./routes/notifications";
import uploadRouter from "./routes/upload";
import internalRouter from "./routes/internal";
import propertiesRouter from "./routes/properties";
import reviewsRouter from "./routes/reviews";
import adminPaymasterRouter from "./routes/admin/paymaster";
import adminUsersRouter from "./routes/admin/users";
import adminBookingsRouter from "./routes/admin/bookings";
import { errorHandler, notFoundHandler } from "./middleware/error-handler";
import { logger, logRequest, logResponse } from "./lib/logger";
import { apiSecurityHeaders, corsHeaders } from "./middleware/security-headers";
import { rateLimiters } from "./middleware/rate-limiter";
import { correlationIdMiddleware } from "./middleware/correlation-id";

const app: ReturnType<typeof express> = express();
const PORT = process.env.PORT || 3002;

// F4.7: Security headers (applied to all responses)
app.use(apiSecurityHeaders);

// Correlation ID middleware (generates/extracts X-Request-ID for tracing)
app.use(correlationIdMiddleware);

// F4.7: CORS configuration
const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(",") || [
  "http://localhost:3000",
  "http://localhost:3001",
  "http://localhost:3003",
];
app.use(corsHeaders(allowedOrigins));

// F4.7: Global rate limiting (100 requests per minute per IP)
app.use(rateLimiters.global);

// Body parser middleware
app.use(express.json({ limit: "10mb" })); // Limit payload size

// Request logging middleware
app.use((req, res, next) => {
  const start = Date.now();
  logRequest(req);

  // Log response when finished
  res.on('finish', () => {
    const duration = Date.now() - start;
    logResponse(req, res, duration);
  });

  next();
});

// Health check (exempt from rate limiting)
app.get("/health", (_req, res) => {
  res.json({ status: "ok", service: "@vlossom/api" });
});

// API v1 routes
app.use("/api/v1/auth", authRouter);
app.use("/api/v1/bookings", bookingsRouter);
app.use("/api/v1/stylists", stylistsRouter);
app.use("/api/v1/wallet", walletRouter);
app.use("/api/v1/notifications", notificationsRouter);
app.use("/api/v1/upload", uploadRouter);
app.use("/api/v1/internal", internalRouter);
app.use("/api/v1/properties", propertiesRouter);
app.use("/api/v1/reviews", reviewsRouter);
app.use("/api/v1/admin/paymaster", adminPaymasterRouter);
app.use("/api/v1/admin/users", adminUsersRouter);
app.use("/api/v1/admin/bookings", adminBookingsRouter);

// 404 handler - must come after all routes
app.use(notFoundHandler);

// Global error handler - must be last middleware
app.use(errorHandler);

app.listen(PORT, () => {
  logger.info(`Vlossom API running on port ${PORT}`, {
    port: PORT,
    environment: process.env.NODE_ENV || 'development'
  });
});

export default app;
