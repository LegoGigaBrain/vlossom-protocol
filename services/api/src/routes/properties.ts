// Property Owner API Routes
// Reference: docs/vlossom/17-property-owner-and-chair-rental-module.md

import { Router, Response } from "express";
import prisma from "../lib/prisma";
import { authenticate, AuthenticatedRequest } from "../middleware/auth";
import { z } from "zod";
import { ChairType } from "@prisma/client";

const router: ReturnType<typeof Router> = Router();

// ============================================================================
// VALIDATION SCHEMAS
// ============================================================================

const createPropertySchema = z.object({
  name: z.string().min(2).max(100),
  category: z.enum(["LUXURY", "BOUTIQUE", "STANDARD", "HOME_BASED"]),
  address: z.string().min(5).max(200),
  city: z.string().min(2).max(100),
  country: z.string().default("ZA"),
  lat: z.number().min(-90).max(90),
  lng: z.number().min(-180).max(180),
  description: z.string().max(1000).optional(),
  operatingHours: z.record(z.string(), z.object({
    open: z.string().regex(/^\d{2}:\d{2}$/),
    close: z.string().regex(/^\d{2}:\d{2}$/),
  })).optional(),
  approvalMode: z.enum(["FULL_APPROVAL", "NO_APPROVAL", "CONDITIONAL"]).default("CONDITIONAL"),
  images: z.array(z.string()).max(10).optional(),
  coverImage: z.string().optional(),
  minStylistRating: z.number().min(0).max(5).optional(),
  minTpsScore: z.number().min(0).max(100).optional(),
});

const updatePropertySchema = createPropertySchema.partial();

const createChairSchema = z.object({
  name: z.string().min(1).max(50),
  type: z.enum([
    "BRAID_CHAIR",
    "BARBER_CHAIR",
    "STYLING_STATION",
    "NAIL_STATION",
    "LASH_BED",
    "FACIAL_BED",
    "GENERAL",
  ]).default("GENERAL"),
  amenities: z.array(z.string()).max(20).optional(),
  // Pricing in cents (ZAR)
  hourlyRateCents: z.number().int().min(0).optional(),
  dailyRateCents: z.number().int().min(0).optional(),
  weeklyRateCents: z.number().int().min(0).optional(),
  monthlyRateCents: z.number().int().min(0).optional(),
  perBookingFeeCents: z.number().int().min(0).optional(),
  rentalModesEnabled: z.array(z.enum(["PER_BOOKING", "PER_HOUR", "PER_DAY", "PER_WEEK", "PER_MONTH"])).optional(),
});

const updateChairSchema = createChairSchema.partial().extend({
  status: z.enum(["AVAILABLE", "OCCUPIED", "MAINTENANCE", "BLOCKED"]).optional(),
});

const rentalRequestSchema = z.object({
  chairId: z.string().uuid(),
  rentalMode: z.enum(["PER_BOOKING", "PER_HOUR", "PER_DAY", "PER_WEEK", "PER_MONTH"]),
  startTime: z.string().datetime(),
  endTime: z.string().datetime(),
});

const rentalDecisionSchema = z.object({
  decision: z.enum(["APPROVE", "REJECT"]),
  rejectionReason: z.string().max(500).optional(),
});

// ============================================================================
// PROPERTY CRUD ENDPOINTS
// ============================================================================

/**
 * GET /api/properties
 * List all properties (public, with optional filters)
 */
router.get("/", async (req, res: Response) => {
  try {
    const { city, category, lat, lng, radius } = req.query;

    const where: Record<string, unknown> = {
      isActive: true,
    };

    if (city) {
      where.city = { contains: city as string, mode: "insensitive" };
    }

    if (category) {
      where.category = category;
    }

    const properties = await prisma.property.findMany({
      where,
      include: {
        chairs: {
          where: { status: "AVAILABLE", isActive: true },
          select: {
            id: true,
            name: true,
            type: true,
            hourlyRateCents: true,
            dailyRateCents: true,
          },
        },
        _count: {
          select: { chairs: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    // Filter by distance if lat/lng/radius provided
    let results = properties;
    if (lat && lng && radius) {
      const userLat = parseFloat(lat as string);
      const userLng = parseFloat(lng as string);
      const maxRadius = parseFloat(radius as string);

      results = properties.filter((p) => {
        const distance = calculateDistance(userLat, userLng, p.lat, p.lng);
        return distance <= maxRadius;
      });
    }

    // Convert BigInt to number for JSON serialization
    const serialized = results.map((p) => ({
      ...p,
      chairs: p.chairs.map((c) => ({
        ...c,
        hourlyRateCents: c.hourlyRateCents ? Number(c.hourlyRateCents) : null,
        dailyRateCents: c.dailyRateCents ? Number(c.dailyRateCents) : null,
      })),
    }));

    res.json({ properties: serialized });
  } catch (error) {
    console.error("Failed to fetch properties:", error);
    res.status(500).json({ error: "Failed to fetch properties" });
  }
});

/**
 * GET /api/properties/:id
 * Get property details with all chairs
 */
router.get("/:id", async (req, res: Response) => {
  try {
    const { id } = req.params;

    const property = await prisma.property.findUnique({
      where: { id },
      include: {
        chairs: {
          where: { isActive: true },
          orderBy: { name: "asc" },
        },
      },
    });

    if (!property) {
      return res.status(404).json({ error: "Property not found" });
    }

    // Fetch owner info separately
    const owner = await prisma.user.findUnique({
      where: { id: property.ownerId },
      select: {
        id: true,
        displayName: true,
        avatarUrl: true,
        verificationStatus: true,
      },
    });

    // Serialize BigInt fields
    const serialized = {
      ...property,
      owner,
      chairs: property.chairs.map((c) => ({
        ...c,
        hourlyRateCents: c.hourlyRateCents ? Number(c.hourlyRateCents) : null,
        dailyRateCents: c.dailyRateCents ? Number(c.dailyRateCents) : null,
        weeklyRateCents: c.weeklyRateCents ? Number(c.weeklyRateCents) : null,
        monthlyRateCents: c.monthlyRateCents ? Number(c.monthlyRateCents) : null,
        perBookingFeeCents: c.perBookingFeeCents ? Number(c.perBookingFeeCents) : null,
      })),
    };

    res.json({ property: serialized });
  } catch (error) {
    console.error("Failed to fetch property:", error);
    res.status(500).json({ error: "Failed to fetch property" });
  }
});

/**
 * POST /api/properties
 * Create a new property (property owner only)
 */
router.post("/", authenticate, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.sub;
    const input = createPropertySchema.parse(req.body);

    // Check if user has property owner role
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { roles: true },
    });

    if (!user) {
      return res.status(403).json({ error: "User not found" });
    }

    const roles = user.roles as string[] | null;
    if (!roles || (!roles.includes("PROPERTY_OWNER") && !roles.includes("ADMIN"))) {
      return res.status(403).json({ error: "Only property owners can create properties" });
    }

    const property = await prisma.property.create({
      data: {
        ownerId: userId,
        name: input.name,
        category: input.category,
        address: input.address,
        city: input.city,
        country: input.country || "ZA",
        lat: input.lat,
        lng: input.lng,
        description: input.description,
        operatingHours: input.operatingHours || {},
        approvalMode: input.approvalMode,
        images: input.images || [],
        coverImage: input.coverImage,
        minStylistRating: input.minStylistRating,
        minTpsScore: input.minTpsScore,
      },
    });

    res.status(201).json({ property });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: "Validation error", details: error.errors });
    }
    console.error("Failed to create property:", error);
    res.status(500).json({ error: "Failed to create property" });
  }
});

/**
 * PUT /api/properties/:id
 * Update property (owner only)
 */
router.put("/:id", authenticate, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.sub;
    const { id } = req.params;
    const input = updatePropertySchema.parse(req.body);

    // Check ownership
    const property = await prisma.property.findUnique({
      where: { id },
      select: { ownerId: true },
    });

    if (!property) {
      return res.status(404).json({ error: "Property not found" });
    }

    if (property.ownerId !== userId) {
      return res.status(403).json({ error: "Not authorized to update this property" });
    }

    const updated = await prisma.property.update({
      where: { id },
      data: input,
    });

    res.json({ property: updated });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: "Validation error", details: error.errors });
    }
    console.error("Failed to update property:", error);
    res.status(500).json({ error: "Failed to update property" });
  }
});

/**
 * DELETE /api/properties/:id
 * Soft delete property (owner only)
 */
router.delete("/:id", authenticate, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.sub;
    const { id } = req.params;

    // Check ownership
    const property = await prisma.property.findUnique({
      where: { id },
      select: { ownerId: true },
    });

    if (!property) {
      return res.status(404).json({ error: "Property not found" });
    }

    if (property.ownerId !== userId) {
      return res.status(403).json({ error: "Not authorized to delete this property" });
    }

    // Soft delete
    await prisma.property.update({
      where: { id },
      data: { isActive: false },
    });

    res.json({ success: true });
  } catch (error) {
    console.error("Failed to delete property:", error);
    res.status(500).json({ error: "Failed to delete property" });
  }
});

// ============================================================================
// PROPERTY OWNER DASHBOARD ENDPOINTS
// ============================================================================

/**
 * GET /api/properties/my/all
 * Get all properties owned by current user
 */
router.get("/my/all", authenticate, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.sub;

    const properties = await prisma.property.findMany({
      where: { ownerId: userId },
      include: {
        chairs: true,
        _count: {
          select: {
            chairs: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    // Get pending rental count separately
    const pendingCounts = await Promise.all(
      properties.map(async (p) => ({
        propertyId: p.id,
        pendingRentals: await prisma.chairRentalRequest.count({
          where: { propertyId: p.id, status: "PENDING_APPROVAL" },
        }),
      }))
    );

    // Serialize BigInt fields
    const serialized = properties.map((p) => {
      const pending = pendingCounts.find((pc) => pc.propertyId === p.id);
      return {
        ...p,
        pendingRentalCount: pending?.pendingRentals || 0,
        chairs: p.chairs.map((c) => ({
          ...c,
          hourlyRateCents: c.hourlyRateCents ? Number(c.hourlyRateCents) : null,
          dailyRateCents: c.dailyRateCents ? Number(c.dailyRateCents) : null,
          weeklyRateCents: c.weeklyRateCents ? Number(c.weeklyRateCents) : null,
          monthlyRateCents: c.monthlyRateCents ? Number(c.monthlyRateCents) : null,
          perBookingFeeCents: c.perBookingFeeCents ? Number(c.perBookingFeeCents) : null,
        })),
      };
    });

    res.json({ properties: serialized });
  } catch (error) {
    console.error("Failed to fetch owned properties:", error);
    res.status(500).json({ error: "Failed to fetch properties" });
  }
});

// ============================================================================
// CHAIR CRUD ENDPOINTS
// ============================================================================

/**
 * POST /api/properties/:propertyId/chairs
 * Add a chair to property (owner only)
 */
router.post("/:propertyId/chairs", authenticate, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.sub;
    const { propertyId } = req.params;
    const input = createChairSchema.parse(req.body);

    // Check ownership
    const property = await prisma.property.findUnique({
      where: { id: propertyId },
      select: { ownerId: true },
    });

    if (!property) {
      return res.status(404).json({ error: "Property not found" });
    }

    if (property.ownerId !== userId) {
      return res.status(403).json({ error: "Not authorized to add chairs to this property" });
    }

    const chair = await prisma.chair.create({
      data: {
        propertyId,
        name: input.name,
        type: input.type as ChairType,
        amenities: input.amenities || [],
        hourlyRateCents: input.hourlyRateCents ? BigInt(input.hourlyRateCents) : null,
        dailyRateCents: input.dailyRateCents ? BigInt(input.dailyRateCents) : null,
        weeklyRateCents: input.weeklyRateCents ? BigInt(input.weeklyRateCents) : null,
        monthlyRateCents: input.monthlyRateCents ? BigInt(input.monthlyRateCents) : null,
        perBookingFeeCents: input.perBookingFeeCents ? BigInt(input.perBookingFeeCents) : null,
        rentalModesEnabled: input.rentalModesEnabled || ["PER_BOOKING"],
      },
    });

    // Serialize BigInt for response
    const serialized = {
      ...chair,
      hourlyRateCents: chair.hourlyRateCents ? Number(chair.hourlyRateCents) : null,
      dailyRateCents: chair.dailyRateCents ? Number(chair.dailyRateCents) : null,
      weeklyRateCents: chair.weeklyRateCents ? Number(chair.weeklyRateCents) : null,
      monthlyRateCents: chair.monthlyRateCents ? Number(chair.monthlyRateCents) : null,
      perBookingFeeCents: chair.perBookingFeeCents ? Number(chair.perBookingFeeCents) : null,
    };

    res.status(201).json({ chair: serialized });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: "Validation error", details: error.errors });
    }
    console.error("Failed to create chair:", error);
    res.status(500).json({ error: "Failed to create chair" });
  }
});

/**
 * PUT /api/properties/:propertyId/chairs/:chairId
 * Update chair (owner only)
 */
router.put("/:propertyId/chairs/:chairId", authenticate, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.sub;
    const { propertyId, chairId } = req.params;
    const input = updateChairSchema.parse(req.body);

    // Check ownership
    const property = await prisma.property.findUnique({
      where: { id: propertyId },
      select: { ownerId: true },
    });

    if (!property) {
      return res.status(404).json({ error: "Property not found" });
    }

    if (property.ownerId !== userId) {
      return res.status(403).json({ error: "Not authorized to update chairs in this property" });
    }

    // Check chair exists and belongs to property
    const chair = await prisma.chair.findFirst({
      where: { id: chairId, propertyId },
    });

    if (!chair) {
      return res.status(404).json({ error: "Chair not found" });
    }

    const updateData: Record<string, unknown> = {};

    if (input.name !== undefined) updateData.name = input.name;
    if (input.type !== undefined) updateData.type = input.type as ChairType;
    if (input.status !== undefined) updateData.status = input.status;
    if (input.amenities !== undefined) updateData.amenities = input.amenities;
    if (input.rentalModesEnabled !== undefined) updateData.rentalModesEnabled = input.rentalModesEnabled;

    // Convert cents to BigInt
    if (input.hourlyRateCents !== undefined) {
      updateData.hourlyRateCents = input.hourlyRateCents ? BigInt(input.hourlyRateCents) : null;
    }
    if (input.dailyRateCents !== undefined) {
      updateData.dailyRateCents = input.dailyRateCents ? BigInt(input.dailyRateCents) : null;
    }
    if (input.weeklyRateCents !== undefined) {
      updateData.weeklyRateCents = input.weeklyRateCents ? BigInt(input.weeklyRateCents) : null;
    }
    if (input.monthlyRateCents !== undefined) {
      updateData.monthlyRateCents = input.monthlyRateCents ? BigInt(input.monthlyRateCents) : null;
    }
    if (input.perBookingFeeCents !== undefined) {
      updateData.perBookingFeeCents = input.perBookingFeeCents ? BigInt(input.perBookingFeeCents) : null;
    }

    const updated = await prisma.chair.update({
      where: { id: chairId },
      data: updateData,
    });

    // Serialize BigInt
    const serialized = {
      ...updated,
      hourlyRateCents: updated.hourlyRateCents ? Number(updated.hourlyRateCents) : null,
      dailyRateCents: updated.dailyRateCents ? Number(updated.dailyRateCents) : null,
      weeklyRateCents: updated.weeklyRateCents ? Number(updated.weeklyRateCents) : null,
      monthlyRateCents: updated.monthlyRateCents ? Number(updated.monthlyRateCents) : null,
      perBookingFeeCents: updated.perBookingFeeCents ? Number(updated.perBookingFeeCents) : null,
    };

    res.json({ chair: serialized });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: "Validation error", details: error.errors });
    }
    console.error("Failed to update chair:", error);
    res.status(500).json({ error: "Failed to update chair" });
  }
});

/**
 * DELETE /api/properties/:propertyId/chairs/:chairId
 * Delete chair (owner only)
 */
router.delete("/:propertyId/chairs/:chairId", authenticate, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.sub;
    const { propertyId, chairId } = req.params;

    // Check ownership
    const property = await prisma.property.findUnique({
      where: { id: propertyId },
      select: { ownerId: true },
    });

    if (!property) {
      return res.status(404).json({ error: "Property not found" });
    }

    if (property.ownerId !== userId) {
      return res.status(403).json({ error: "Not authorized to delete chairs from this property" });
    }

    // Check for active rentals
    const activeRentals = await prisma.chairRentalRequest.count({
      where: {
        chairId,
        status: { in: ["APPROVED", "ACTIVE"] },
      },
    });

    if (activeRentals > 0) {
      return res.status(400).json({ error: "Cannot delete chair with active rentals" });
    }

    // Soft delete by setting isActive to false
    await prisma.chair.update({
      where: { id: chairId },
      data: { isActive: false },
    });

    res.json({ success: true });
  } catch (error) {
    console.error("Failed to delete chair:", error);
    res.status(500).json({ error: "Failed to delete chair" });
  }
});

// ============================================================================
// CHAIR RENTAL REQUEST ENDPOINTS
// ============================================================================

/**
 * POST /api/properties/rentals/request
 * Create a chair rental request (stylist)
 */
router.post("/rentals/request", authenticate, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.sub;
    const input = rentalRequestSchema.parse(req.body);

    // Get chair and property details
    const chair = await prisma.chair.findUnique({
      where: { id: input.chairId },
      include: {
        property: {
          include: {
            blocklist: true,
          },
        },
      },
    });

    if (!chair) {
      return res.status(404).json({ error: "Chair not found" });
    }

    // Check if stylist is blocked
    const isBlocked = chair.property.blocklist.some((b) => b.stylistId === userId);
    if (isBlocked) {
      return res.status(403).json({ error: "You are not allowed to rent chairs at this property" });
    }

    // Check chair availability
    if (chair.status !== "AVAILABLE") {
      return res.status(400).json({ error: "Chair is not available for rental" });
    }

    // Determine initial status based on property approval mode
    let initialStatus: "PENDING_APPROVAL" | "APPROVED" = "PENDING_APPROVAL";
    if (chair.property.approvalMode === "NO_APPROVAL") {
      initialStatus = "APPROVED";
    }

    // Calculate pricing based on rental mode and duration
    const startTime = new Date(input.startTime);
    const endTime = new Date(input.endTime);
    const durationMs = endTime.getTime() - startTime.getTime();
    const durationHours = durationMs / (1000 * 60 * 60);
    const durationDays = durationHours / 24;

    let totalAmountCents = 0n;
    switch (input.rentalMode) {
      case "PER_HOUR":
        totalAmountCents = BigInt(Math.ceil(durationHours)) * (chair.hourlyRateCents || 0n);
        break;
      case "PER_DAY":
        totalAmountCents = BigInt(Math.ceil(durationDays)) * (chair.dailyRateCents || 0n);
        break;
      case "PER_WEEK":
        totalAmountCents = BigInt(Math.ceil(durationDays / 7)) * (chair.weeklyRateCents || 0n);
        break;
      case "PER_MONTH":
        totalAmountCents = BigInt(Math.ceil(durationDays / 30)) * (chair.monthlyRateCents || 0n);
        break;
      case "PER_BOOKING":
        totalAmountCents = chair.perBookingFeeCents || 0n;
        break;
    }

    // Platform fee (10%)
    const platformFeeCents = totalAmountCents / 10n;
    const ownerPayoutCents = totalAmountCents - platformFeeCents;

    const rentalRequest = await prisma.chairRentalRequest.create({
      data: {
        chairId: input.chairId,
        propertyId: chair.propertyId,
        stylistId: userId,
        rentalMode: input.rentalMode,
        status: initialStatus,
        startTime,
        endTime,
        totalAmountCents,
        platformFeeCents,
        ownerPayoutCents,
        approvedAt: initialStatus === "APPROVED" ? new Date() : null,
      },
    });

    // Serialize BigInt
    const serialized = {
      ...rentalRequest,
      totalAmountCents: Number(rentalRequest.totalAmountCents),
      platformFeeCents: Number(rentalRequest.platformFeeCents),
      ownerPayoutCents: Number(rentalRequest.ownerPayoutCents),
    };

    res.status(201).json({ rentalRequest: serialized });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: "Validation error", details: error.errors });
    }
    console.error("Failed to create rental request:", error);
    res.status(500).json({ error: "Failed to create rental request" });
  }
});

/**
 * GET /api/properties/:propertyId/rentals
 * Get rental requests for property (owner only)
 */
router.get("/:propertyId/rentals", authenticate, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.sub;
    const { propertyId } = req.params;
    const { status } = req.query;

    // Check ownership
    const property = await prisma.property.findUnique({
      where: { id: propertyId },
      select: { ownerId: true },
    });

    if (!property) {
      return res.status(404).json({ error: "Property not found" });
    }

    if (property.ownerId !== userId) {
      return res.status(403).json({ error: "Not authorized to view rentals for this property" });
    }

    const where: Record<string, unknown> = {
      propertyId,
    };

    if (status) {
      where.status = status;
    }

    const rentals = await prisma.chairRentalRequest.findMany({
      where,
      include: {
        chair: {
          select: { id: true, name: true, type: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    // Fetch stylist info separately
    const stylistIds = [...new Set(rentals.map((r) => r.stylistId))];
    const stylists = await prisma.user.findMany({
      where: { id: { in: stylistIds } },
      select: { id: true, displayName: true, avatarUrl: true },
    });
    const stylistMap = new Map(stylists.map((s) => [s.id, s]));

    // Serialize BigInt
    const serialized = rentals.map((r) => ({
      ...r,
      totalAmountCents: Number(r.totalAmountCents),
      platformFeeCents: Number(r.platformFeeCents),
      ownerPayoutCents: Number(r.ownerPayoutCents),
      stylist: stylistMap.get(r.stylistId) || null,
    }));

    res.json({ rentals: serialized });
  } catch (error) {
    console.error("Failed to fetch rentals:", error);
    res.status(500).json({ error: "Failed to fetch rentals" });
  }
});

/**
 * POST /api/properties/rentals/:rentalId/decision
 * Approve or reject rental request (owner only)
 */
router.post("/rentals/:rentalId/decision", authenticate, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.sub;
    const { rentalId } = req.params;
    const input = rentalDecisionSchema.parse(req.body);

    // Get rental with property info
    const rental = await prisma.chairRentalRequest.findUnique({
      where: { id: rentalId },
      include: {
        property: true,
      },
    });

    if (!rental) {
      return res.status(404).json({ error: "Rental request not found" });
    }

    if (rental.property.ownerId !== userId) {
      return res.status(403).json({ error: "Not authorized to manage this rental request" });
    }

    if (rental.status !== "PENDING_APPROVAL") {
      return res.status(400).json({ error: "Rental request has already been processed" });
    }

    const updateData: Record<string, unknown> = {};

    if (input.decision === "APPROVE") {
      updateData.status = "APPROVED";
      updateData.approvedAt = new Date();
      updateData.approvedBy = userId;
    } else {
      updateData.status = "REJECTED";
      updateData.rejectedAt = new Date();
      updateData.rejectionReason = input.rejectionReason;
    }

    const updated = await prisma.chairRentalRequest.update({
      where: { id: rentalId },
      data: updateData,
    });

    // Serialize BigInt
    const serialized = {
      ...updated,
      totalAmountCents: Number(updated.totalAmountCents),
      platformFeeCents: Number(updated.platformFeeCents),
      ownerPayoutCents: Number(updated.ownerPayoutCents),
    };

    res.json({ rentalRequest: serialized });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: "Validation error", details: error.errors });
    }
    console.error("Failed to process rental decision:", error);
    res.status(500).json({ error: "Failed to process rental decision" });
  }
});

/**
 * GET /api/properties/rentals/my
 * Get stylist's own rental requests
 */
router.get("/rentals/my", authenticate, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.sub;

    const rentals = await prisma.chairRentalRequest.findMany({
      where: { stylistId: userId },
      include: {
        chair: true,
        property: {
          select: {
            id: true,
            name: true,
            address: true,
            city: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    // Serialize BigInt
    const serialized = rentals.map((r) => ({
      ...r,
      totalAmountCents: Number(r.totalAmountCents),
      platformFeeCents: Number(r.platformFeeCents),
      ownerPayoutCents: Number(r.ownerPayoutCents),
      chair: {
        ...r.chair,
        hourlyRateCents: r.chair.hourlyRateCents ? Number(r.chair.hourlyRateCents) : null,
        dailyRateCents: r.chair.dailyRateCents ? Number(r.chair.dailyRateCents) : null,
        weeklyRateCents: r.chair.weeklyRateCents ? Number(r.chair.weeklyRateCents) : null,
        monthlyRateCents: r.chair.monthlyRateCents ? Number(r.chair.monthlyRateCents) : null,
        perBookingFeeCents: r.chair.perBookingFeeCents ? Number(r.chair.perBookingFeeCents) : null,
      },
    }));

    res.json({ rentals: serialized });
  } catch (error) {
    console.error("Failed to fetch stylist rentals:", error);
    res.status(500).json({ error: "Failed to fetch rentals" });
  }
});

// ============================================================================
// BLOCKLIST MANAGEMENT
// ============================================================================

/**
 * POST /api/properties/:propertyId/blocklist
 * Block a stylist from property (owner only)
 */
router.post("/:propertyId/blocklist", authenticate, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.sub;
    const { propertyId } = req.params;
    const { stylistId, reason } = req.body;

    if (!stylistId) {
      return res.status(400).json({ error: "stylistId is required" });
    }

    // Check ownership
    const property = await prisma.property.findUnique({
      where: { id: propertyId },
      select: { ownerId: true },
    });

    if (!property) {
      return res.status(404).json({ error: "Property not found" });
    }

    if (property.ownerId !== userId) {
      return res.status(403).json({ error: "Not authorized to manage blocklist for this property" });
    }

    // Check if already blocked
    const existing = await prisma.propertyBlocklist.findUnique({
      where: {
        propertyId_stylistId: { propertyId, stylistId },
      },
    });

    if (existing) {
      return res.status(400).json({ error: "Stylist is already blocked" });
    }

    const block = await prisma.propertyBlocklist.create({
      data: {
        propertyId,
        stylistId,
        reason,
        blockedBy: userId,
      },
    });

    res.status(201).json({ block });
  } catch (error) {
    console.error("Failed to add to blocklist:", error);
    res.status(500).json({ error: "Failed to add to blocklist" });
  }
});

/**
 * DELETE /api/properties/:propertyId/blocklist/:stylistId
 * Remove stylist from blocklist (owner only)
 */
router.delete("/:propertyId/blocklist/:stylistId", authenticate, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.sub;
    const { propertyId, stylistId } = req.params;

    // Check ownership
    const property = await prisma.property.findUnique({
      where: { id: propertyId },
      select: { ownerId: true },
    });

    if (!property) {
      return res.status(404).json({ error: "Property not found" });
    }

    if (property.ownerId !== userId) {
      return res.status(403).json({ error: "Not authorized to manage blocklist for this property" });
    }

    await prisma.propertyBlocklist.delete({
      where: {
        propertyId_stylistId: { propertyId, stylistId },
      },
    });

    res.json({ success: true });
  } catch (error) {
    console.error("Failed to remove from blocklist:", error);
    res.status(500).json({ error: "Failed to remove from blocklist" });
  }
});

/**
 * GET /api/properties/:propertyId/blocklist
 * Get blocklist for property (owner only)
 */
router.get("/:propertyId/blocklist", authenticate, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.sub;
    const { propertyId } = req.params;

    // Check ownership
    const property = await prisma.property.findUnique({
      where: { id: propertyId },
      select: { ownerId: true },
    });

    if (!property) {
      return res.status(404).json({ error: "Property not found" });
    }

    if (property.ownerId !== userId) {
      return res.status(403).json({ error: "Not authorized to view blocklist for this property" });
    }

    const blocklist = await prisma.propertyBlocklist.findMany({
      where: { propertyId },
      orderBy: { blockedAt: "desc" },
    });

    // Fetch stylist info
    const stylistIds = blocklist.map((b) => b.stylistId);
    const stylists = await prisma.user.findMany({
      where: { id: { in: stylistIds } },
      select: { id: true, displayName: true, avatarUrl: true },
    });
    const stylistMap = new Map(stylists.map((s) => [s.id, s]));

    const enriched = blocklist.map((b) => ({
      ...b,
      stylist: stylistMap.get(b.stylistId) || null,
    }));

    res.json({ blocklist: enriched });
  } catch (error) {
    console.error("Failed to fetch blocklist:", error);
    res.status(500).json({ error: "Failed to fetch blocklist" });
  }
});

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Calculate distance between two coordinates (Haversine formula)
 */
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Earth's radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

export default router;
