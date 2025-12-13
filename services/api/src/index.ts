// @vlossom/api - Main Backend API Service
// Reference: docs/vlossom/14-backend-architecture-and-apis.md

import express from "express";

const app = express();
const PORT = process.env.PORT || 3002;

app.use(express.json());

// Health check
app.get("/health", (_req, res) => {
  res.json({ status: "ok", service: "@vlossom/api" });
});

// API routes will be added here
// app.use("/api/bookings", bookingsRouter);
// app.use("/api/users", usersRouter);
// app.use("/api/wallet", walletRouter);

app.listen(PORT, () => {
  console.log(`Vlossom API running on port ${PORT}`);
});

export default app;
