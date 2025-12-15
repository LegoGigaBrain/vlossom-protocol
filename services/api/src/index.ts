// @vlossom/api - Main Backend API Service
// Reference: docs/vlossom/14-backend-architecture-and-apis.md

import express from "express";
import authRouter from "./routes/auth";
import bookingsRouter from "./routes/bookings";
import stylistsRouter from "./routes/stylists";
import walletRouter from "./routes/wallet";
import notificationsRouter from "./routes/notifications";
import uploadRouter from "./routes/upload";
import internalRouter from "./routes/internal";
import propertiesRouter from "./routes/properties";
import reviewsRouter from "./routes/reviews";
import { errorHandler, notFoundHandler } from "./middleware/error-handler";
import { logger, logRequest, logResponse } from "./lib/logger";
import { apiSecurityHeaders, corsHeaders } from "./middleware/security-headers";
import { rateLimiters } from "./middleware/rate-limiter";

const app: ReturnType<typeof express> = express();
const PORT = process.env.PORT || 3002;

// F4.7: Security headers (applied to all responses)
app.use(apiSecurityHeaders);

// F4.7: CORS configuration
const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(",") || [
  "http://localhost:3000",
  "http://localhost:3001",
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

// API routes
app.use("/api/auth", authRouter);
app.use("/api/bookings", bookingsRouter);
app.use("/api/stylists", stylistsRouter);
app.use("/api/wallet", walletRouter);
app.use("/api/notifications", notificationsRouter);
app.use("/api/upload", uploadRouter);
app.use("/api/internal", internalRouter);
app.use("/api/properties", propertiesRouter);
app.use("/api/reviews", reviewsRouter);

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
