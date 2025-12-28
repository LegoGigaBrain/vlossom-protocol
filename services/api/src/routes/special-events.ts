// Special Events Routes
// Placeholder for special events booking functionality

import { Router } from "express";

const router = Router();

// GET /api/v1/special-events - List special event types
router.get("/", (_req, res) => {
  res.json({
    success: true,
    data: {
      eventTypes: [
        { id: "wedding", name: "Wedding", description: "Bridal party styling" },
        { id: "photoshoot", name: "Photoshoot", description: "Professional photography styling" },
        { id: "gala", name: "Gala/Event", description: "Formal event styling" },
        { id: "graduation", name: "Graduation", description: "Graduation ceremony styling" },
      ],
    },
  });
});

// POST /api/v1/special-events/request - Submit special event request
router.post("/request", (_req, res) => {
  res.status(501).json({
    success: false,
    error: "Special events booking coming soon",
  });
});

export default router;
