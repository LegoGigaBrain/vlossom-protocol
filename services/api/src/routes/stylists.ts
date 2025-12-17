// Stylists API Routes
// Reference: docs/specs/booking-flow-v1/feature-spec.md
// Reference: docs/specs/stylist-dashboard/MILESTONE-3-PLAN.md

import { Router, Request, Response, NextFunction } from "express";
import type { Prisma } from "@prisma/client";
import prisma from "../lib/prisma";
import { searchStylistsSchema, ServiceCategory, OperatingMode } from "../lib/validation";
import { authenticate, AuthenticatedRequest } from "../middleware/auth";
import { createError } from "../middleware/error-handler";
import { logger } from "../lib/logger";
import { z } from "zod";

// ============================================================================
// TYPE DEFINITIONS FOR QUERY FILTERS (H-3: Replace 'any' types)
// ============================================================================

/**
 * Typed filter interface for stylist search
 * H-3: Replaces 'any' type with explicit Prisma-compatible types
 */
interface StylistSearchFilters {
  isAcceptingBookings: boolean;
  operatingMode?: OperatingMode;
  services?: {
    some: ServiceFilterConditions;
  };
}

interface ServiceFilterConditions {
  isActive: boolean;
  category?: ServiceCategory;
  priceAmountCents?: {
    gte?: bigint;
    lte?: bigint;
  };
}

/**
 * Availability exception interface
 * L-2: Replaces 'any' type for availability exceptions
 */
interface AvailabilityException {
  date: string;
  blocked: boolean;
  note?: string;
}

/**
 * Weekly schedule structure
 * Maps day names to time slot arrays
 */
interface WeeklySchedule {
  [dayOfWeek: string]: Array<{ start: string; end: string }>;
}

// ============================================================================
// VALIDATION SCHEMAS FOR M3 ENDPOINTS
// ============================================================================

const createServiceSchema = z.object({
  name: z.string().min(2).max(100),
  category: z.enum(["Hair", "Nails", "Makeup", "Lashes", "Facials"]),
  description: z.string().max(500).optional(),
  priceAmountCents: z.number().int().min(1000).max(5000000), // R10 - R50,000
  estimatedDurationMin: z.number().int().min(15).max(480), // 15 min - 8 hours
  isActive: z.boolean().default(true),
});

const updateServiceSchema = createServiceSchema.partial();

const updateAvailabilitySchema = z.object({
  schedule: z.record(
    z.enum(["mon", "tue", "wed", "thu", "fri", "sat", "sun"]),
    z.array(
      z.object({
        start: z.string().regex(/^\d{2}:\d{2}$/),
        end: z.string().regex(/^\d{2}:\d{2}$/),
      })
    )
  ),
});

const addExceptionSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  blocked: z.boolean(),
  note: z.string().max(100).optional(),
});

const updateProfileSchema = z.object({
  bio: z.string().min(50).max(500).optional(),
  operatingMode: z.enum(["FIXED", "MOBILE", "HYBRID"]).optional(),
  baseLocationLat: z.number().optional(),
  baseLocationLng: z.number().optional(),
  baseLocationAddress: z.string().max(200).optional(),
  serviceRadius: z.number().int().min(5).max(100).optional(),
  specialties: z.array(z.string()).max(10).optional(),
  isAcceptingBookings: z.boolean().optional(),
});

const router: ReturnType<typeof Router> = Router();

/**
 * Calculate distance between two coordinates (Haversine formula)
 * Returns distance in kilometers
 */
function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
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

/**
 * GET /api/stylists
 * Search stylists with location, service, and advanced filters (F4.4)
 */
router.get("/", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const input = searchStylistsSchema.parse(req.query);

    // H-3: Build where clause with typed interface (no 'any')
    const where: StylistSearchFilters = {
      isAcceptingBookings: true,
    };

    // Filter by operating mode if provided (validated by Zod enum)
    if (input.operatingMode) {
      where.operatingMode = input.operatingMode;
    }

    // H-3: Build service filter conditions with typed interface
    const serviceWhere: ServiceFilterConditions = { isActive: true };

    // Filter by service category if provided (validated by Zod enum)
    if (input.serviceCategory) {
      serviceWhere.category = input.serviceCategory;
    }

    // Filter by price range if provided
    if (input.minPrice !== undefined || input.maxPrice !== undefined) {
      serviceWhere.priceAmountCents = {};
      if (input.minPrice !== undefined) {
        serviceWhere.priceAmountCents.gte = BigInt(input.minPrice);
      }
      if (input.maxPrice !== undefined) {
        serviceWhere.priceAmountCents.lte = BigInt(input.maxPrice);
      }
    }

    // Apply service filters if any (check if more than just isActive)
    if (serviceWhere.category || serviceWhere.priceAmountCents) {
      where.services = { some: serviceWhere };
    }

    // Fetch stylists with availability for date filtering
    const allStylists = await prisma.stylistProfile.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            displayName: true,
            avatarUrl: true,
            verificationStatus: true,
            createdAt: true,
          },
        },
        services: {
          where: { isActive: true },
          orderBy: { priceAmountCents: "asc" },
        },
        availability: true,
      },
    });

    // Apply post-fetch filters
    let filteredStylists = allStylists;

    // F4.4: Filter by text query (name/bio)
    if (input.query) {
      const queryLower = input.query.toLowerCase();
      filteredStylists = filteredStylists.filter((stylist) => {
        const nameMatch = stylist.user.displayName.toLowerCase().includes(queryLower);
        const bioMatch = stylist.bio?.toLowerCase().includes(queryLower) || false;
        const specialtiesMatch = (stylist.specialties as string[])?.some(
          (s) => s.toLowerCase().includes(queryLower)
        ) || false;
        return nameMatch || bioMatch || specialtiesMatch;
      });
    }

    // F4.4: Filter by price range (ensure services match)
    if (input.minPrice !== undefined || input.maxPrice !== undefined) {
      filteredStylists = filteredStylists.filter((stylist) => {
        return stylist.services.some((service) => {
          const price = Number(service.priceAmountCents);
          const meetsMin = input.minPrice === undefined || price >= input.minPrice;
          const meetsMax = input.maxPrice === undefined || price <= input.maxPrice;
          return meetsMin && meetsMax;
        });
      });
    }

    // F4.4: Filter by availability on specific date
    if (input.availability) {
      const targetDate = new Date(input.availability);
      const dayOfWeek = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"][targetDate.getDay()];

      filteredStylists = filteredStylists.filter((stylist) => {
        if (!stylist.availability) return true; // No availability set = always available

        // Check if date is blocked in exceptions
        const exceptions = (stylist.availability.exceptions as unknown as AvailabilityException[]) || [];
        const isBlocked = exceptions.some(
          (ex: AvailabilityException) => ex.date === input.availability && ex.blocked
        );
        if (isBlocked) return false;

        // Check if day of week has schedule
        const schedule = (stylist.availability.schedule as unknown as WeeklySchedule) || {};
        const daySchedule = schedule[dayOfWeek];
        if (!daySchedule || daySchedule.length === 0) return false;

        return true;
      });
    }

    // Calculate distances for location-aware filtering and sorting
    type StylistWithDistance = (typeof allStylists)[0] & { distance?: number };
    let stylistsWithDistance: StylistWithDistance[] = filteredStylists;

    // Filter by location if coordinates provided
    if (input.lat && input.lng) {
      const radius = input.radius || 50; // Default 50km radius

      stylistsWithDistance = filteredStylists
        .map((stylist) => {
          let distance: number | undefined;

          // Calculate distance for fixed/hybrid stylists with base location
          if (
            stylist.baseLocationLat &&
            stylist.baseLocationLng &&
            (stylist.operatingMode === "FIXED" || stylist.operatingMode === "HYBRID")
          ) {
            distance = calculateDistance(
              input.lat!,
              input.lng!,
              stylist.baseLocationLat,
              stylist.baseLocationLng
            );
          }

          // Calculate distance for mobile stylists
          if (
            stylist.operatingMode === "MOBILE" &&
            stylist.baseLocationLat &&
            stylist.baseLocationLng
          ) {
            distance = calculateDistance(
              input.lat!,
              input.lng!,
              stylist.baseLocationLat,
              stylist.baseLocationLng
            );
          }

          return { ...stylist, distance };
        })
        .filter((stylist) => {
          if (stylist.distance === undefined) return false;

          // For fixed/hybrid, check within search radius
          if (stylist.operatingMode === "FIXED" || stylist.operatingMode === "HYBRID") {
            return stylist.distance <= radius;
          }

          // For mobile, check within their service radius
          if (stylist.operatingMode === "MOBILE" && stylist.serviceRadius) {
            return stylist.distance <= stylist.serviceRadius;
          }

          return false;
        });
    }

    // F4.4: Apply sorting
    if (input.sortBy) {
      stylistsWithDistance.sort((a, b) => {
        switch (input.sortBy) {
          case "price_asc": {
            const aMinPrice = Math.min(...a.services.map((s) => Number(s.priceAmountCents)));
            const bMinPrice = Math.min(...b.services.map((s) => Number(s.priceAmountCents)));
            return aMinPrice - bMinPrice;
          }
          case "price_desc": {
            const aMaxPrice = Math.max(...a.services.map((s) => Number(s.priceAmountCents)));
            const bMaxPrice = Math.max(...b.services.map((s) => Number(s.priceAmountCents)));
            return bMaxPrice - aMaxPrice;
          }
          case "distance": {
            const aDist = a.distance ?? Infinity;
            const bDist = b.distance ?? Infinity;
            return aDist - bDist;
          }
          case "newest": {
            return b.user.createdAt.getTime() - a.user.createdAt.getTime();
          }
          default:
            return 0;
        }
      });
    }

    // Pagination
    const total = stylistsWithDistance.length;
    const skip = (input.page - 1) * input.pageSize;
    const paginatedStylists = stylistsWithDistance.slice(skip, skip + input.pageSize);

    // Transform response
    const items = paginatedStylists.map((stylist) => ({
      id: stylist.id,
      userId: stylist.userId,
      displayName: stylist.user.displayName,
      avatarUrl: stylist.user.avatarUrl,
      verificationStatus: stylist.user.verificationStatus,
      bio: stylist.bio,
      specialties: stylist.specialties,
      operatingMode: stylist.operatingMode,
      baseLocation: stylist.baseLocationLat
        ? {
            lat: stylist.baseLocationLat,
            lng: stylist.baseLocationLng,
            address: stylist.baseLocationAddress,
          }
        : null,
      serviceRadius: stylist.serviceRadius,
      distance: stylist.distance !== undefined ? Math.round(stylist.distance * 10) / 10 : null,
      services: stylist.services.map((service) => ({
        id: service.id,
        name: service.name,
        category: service.category,
        description: service.description,
        priceAmountCents: service.priceAmountCents.toString(),
        estimatedDurationMin: service.estimatedDurationMin,
      })),
      // Include min/max price for easy display
      priceRange: {
        min: Math.min(...stylist.services.map((s) => Number(s.priceAmountCents))),
        max: Math.max(...stylist.services.map((s) => Number(s.priceAmountCents))),
      },
    }));

    return res.json({
      items,
      pagination: {
        page: input.page,
        pageSize: input.pageSize,
        total,
        totalPages: Math.ceil(total / input.pageSize),
      },
      filters: {
        query: input.query || null,
        serviceCategory: input.serviceCategory || null,
        operatingMode: input.operatingMode || null,
        priceRange: input.minPrice !== undefined || input.maxPrice !== undefined
          ? { min: input.minPrice || null, max: input.maxPrice || null }
          : null,
        availability: input.availability || null,
        sortBy: input.sortBy || null,
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return next(createError("VALIDATION_ERROR", { details: error.errors }));
    }
    logger.error("Error searching stylists", { error });
    return next(createError("INTERNAL_ERROR"));
  }
});

/**
 * GET /api/stylists/:id
 * Get detailed stylist profile with all services
 */
router.get("/:id", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;

    const stylist = await prisma.stylistProfile.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            displayName: true,
            avatarUrl: true,
            verificationStatus: true,
            createdAt: true,
          },
        },
        services: {
          where: { isActive: true },
          orderBy: { category: "asc" },
        },
      },
    });

    if (!stylist) {
      return next(createError("STYLIST_NOT_FOUND"));
    }

    // Transform response
    const response = {
      id: stylist.id,
      userId: stylist.userId,
      displayName: stylist.user.displayName,
      avatarUrl: stylist.user.avatarUrl,
      verificationStatus: stylist.user.verificationStatus,
      memberSince: stylist.user.createdAt,
      bio: stylist.bio,
      specialties: stylist.specialties,
      serviceCategories: stylist.serviceCategories,
      portfolioImages: stylist.portfolioImages,
      operatingMode: stylist.operatingMode,
      serviceRadius: stylist.serviceRadius,
      baseLocation: stylist.baseLocationLat
        ? {
            lat: stylist.baseLocationLat,
            lng: stylist.baseLocationLng,
            address: stylist.baseLocationAddress,
          }
        : null,
      isAcceptingBookings: stylist.isAcceptingBookings,
      services: stylist.services.map((service) => ({
        id: service.id,
        name: service.name,
        category: service.category,
        description: service.description,
        priceAmountCents: service.priceAmountCents.toString(),
        estimatedDurationMin: service.estimatedDurationMin,
      })),
    };

    return res.json(response);
  } catch (error) {
    logger.error("Error fetching stylist", { error });
    return next(createError("INTERNAL_ERROR"));
  }
});

// ============================================================================
// M3: STYLIST DASHBOARD ENDPOINTS
// ============================================================================

/**
 * GET /api/stylists/dashboard
 * Get dashboard summary for authenticated stylist
 */
router.get("/dashboard", authenticate, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.userId!;

    // Get stylist profile
    const profile = await prisma.stylistProfile.findFirst({
      where: { userId },
    });

    if (!profile) {
      return next(createError("STYLIST_NOT_FOUND"));
    }

    // Get pending requests count
    const pendingRequests = await prisma.booking.count({
      where: {
        stylistId: userId,
        status: "PENDING_STYLIST_APPROVAL",
      },
    });

    // Get upcoming bookings (next 7 days)
    const now = new Date();
    const weekFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

    const upcomingBookingsData = await prisma.booking.findMany({
      where: {
        stylistId: userId,
        status: { in: ["CONFIRMED", "IN_PROGRESS"] },
        scheduledStartTime: {
          gte: now,
          lte: weekFromNow,
        },
      },
      include: {
        customer: {
          select: { displayName: true },
        },
      },
      orderBy: { scheduledStartTime: "asc" },
      take: 10,
    });

    // Get earnings
    const settledBookings = await prisma.booking.aggregate({
      where: {
        stylistId: userId,
        status: "SETTLED",
      },
      _sum: { stylistPayoutCents: true },
      _count: true,
    });

    // This month earnings
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const thisMonthBookings = await prisma.booking.aggregate({
      where: {
        stylistId: userId,
        status: "SETTLED",
        updatedAt: { gte: startOfMonth },
      },
      _sum: { stylistPayoutCents: true },
    });

    // Pending requests list (top 3)
    const pendingRequestsList = await prisma.booking.findMany({
      where: {
        stylistId: userId,
        status: "PENDING_STYLIST_APPROVAL",
      },
      include: {
        customer: {
          select: { displayName: true },
        },
      },
      orderBy: { createdAt: "asc" },
      take: 3,
    });

    return res.json({
      stats: {
        pendingRequests,
        upcomingBookings: upcomingBookingsData.length,
        thisMonthEarnings: Number(thisMonthBookings._sum.stylistPayoutCents || 0),
        totalEarnings: Number(settledBookings._sum.stylistPayoutCents || 0),
      },
      upcomingBookings: upcomingBookingsData.map((b) => ({
        id: b.id,
        customerName: b.customer.displayName,
        serviceName: b.serviceType,
        scheduledAt: b.scheduledStartTime.toISOString(),
        durationMinutes: b.estimatedDurationMin,
        status: b.status,
      })),
      pendingRequests: pendingRequestsList.map((b) => ({
        id: b.id,
        customerName: b.customer.displayName,
        serviceName: b.serviceType,
        requestedAt: b.createdAt.toISOString(),
        scheduledAt: b.scheduledStartTime.toISOString(),
      })),
    });
  } catch (error) {
    logger.error("Error fetching dashboard", { error });
    return next(createError("INTERNAL_ERROR"));
  }
});

// ============================================================================
// M3: SERVICES CRUD ENDPOINTS (F3.3)
// ============================================================================

/**
 * GET /api/stylists/services
 * Get all services for authenticated stylist
 */
router.get("/services", authenticate, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.userId!;

    const profile = await prisma.stylistProfile.findFirst({
      where: { userId },
      include: {
        services: {
          orderBy: { createdAt: "desc" },
        },
      },
    });

    if (!profile) {
      return next(createError("STYLIST_NOT_FOUND"));
    }

    return res.json({
      services: profile.services.map((s) => ({
        id: s.id,
        name: s.name,
        category: s.category,
        description: s.description,
        priceAmountCents: Number(s.priceAmountCents),
        estimatedDurationMin: s.estimatedDurationMin,
        isActive: s.isActive,
        createdAt: s.createdAt.toISOString(),
      })),
      total: profile.services.length,
    });
  } catch (error) {
    logger.error("Error fetching services", { error });
    return next(createError("INTERNAL_ERROR"));
  }
});

/**
 * POST /api/stylists/services
 * Create a new service
 */
router.post("/services", authenticate, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.userId!;
    const input = createServiceSchema.parse(req.body);

    const profile = await prisma.stylistProfile.findFirst({
      where: { userId },
    });

    if (!profile) {
      return next(createError("STYLIST_NOT_FOUND"));
    }

    const service = await prisma.stylistService.create({
      data: {
        stylistId: profile.id,
        name: input.name,
        category: input.category,
        description: input.description,
        priceAmountCents: BigInt(input.priceAmountCents),
        estimatedDurationMin: input.estimatedDurationMin,
        isActive: input.isActive,
      },
    });

    return res.status(201).json({
      id: service.id,
      name: service.name,
      category: service.category,
      description: service.description,
      priceAmountCents: Number(service.priceAmountCents),
      estimatedDurationMin: service.estimatedDurationMin,
      isActive: service.isActive,
      createdAt: service.createdAt.toISOString(),
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return next(createError("VALIDATION_ERROR", { details: error.errors }));
    }
    logger.error("Error creating service", { error });
    return next(createError("INTERNAL_ERROR"));
  }
});

/**
 * PUT /api/stylists/services/:id
 * Update a service
 */
router.put("/services/:id", authenticate, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.userId!;
    const { id } = req.params;
    const input = updateServiceSchema.parse(req.body);

    // Verify ownership
    const profile = await prisma.stylistProfile.findFirst({
      where: { userId },
      include: { services: { where: { id } } },
    });

    if (!profile || profile.services.length === 0) {
      return next(createError("SERVICE_NOT_FOUND"));
    }

    const service = await prisma.stylistService.update({
      where: { id },
      data: {
        ...(input.name && { name: input.name }),
        ...(input.category && { category: input.category }),
        ...(input.description !== undefined && { description: input.description }),
        ...(input.priceAmountCents && { priceAmountCents: BigInt(input.priceAmountCents) }),
        ...(input.estimatedDurationMin && { estimatedDurationMin: input.estimatedDurationMin }),
        ...(input.isActive !== undefined && { isActive: input.isActive }),
      },
    });

    return res.json({
      id: service.id,
      name: service.name,
      category: service.category,
      description: service.description,
      priceAmountCents: Number(service.priceAmountCents),
      estimatedDurationMin: service.estimatedDurationMin,
      isActive: service.isActive,
      updatedAt: service.updatedAt.toISOString(),
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return next(createError("VALIDATION_ERROR", { details: error.errors }));
    }
    logger.error("Error updating service", { error });
    return next(createError("INTERNAL_ERROR"));
  }
});

/**
 * DELETE /api/stylists/services/:id
 * Delete a service (only if no active bookings)
 */
router.delete("/services/:id", authenticate, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.userId!;
    const { id } = req.params;

    // Verify ownership
    const profile = await prisma.stylistProfile.findFirst({
      where: { userId },
      include: { services: { where: { id } } },
    });

    if (!profile || profile.services.length === 0) {
      return next(createError("SERVICE_NOT_FOUND"));
    }

    // Check for active bookings using this service
    const activeBookings = await prisma.booking.count({
      where: {
        serviceId: id,
        status: { in: ["PENDING_STYLIST_APPROVAL", "PENDING_CUSTOMER_PAYMENT", "CONFIRMED", "IN_PROGRESS"] },
      },
    });

    if (activeBookings > 0) {
      return next(createError("SERVICE_HAS_BOOKINGS", { count: activeBookings }));
    }

    await prisma.stylistService.delete({ where: { id } });

    return res.status(204).send();
  } catch (error) {
    logger.error("Error deleting service", { error });
    return next(createError("INTERNAL_ERROR"));
  }
});

// ============================================================================
// M3: AVAILABILITY ENDPOINTS (F3.4)
// ============================================================================

/**
 * GET /api/stylists/availability
 * Get availability schedule for authenticated stylist
 */
router.get("/availability", authenticate, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.userId!;

    const profile = await prisma.stylistProfile.findFirst({
      where: { userId },
      include: { availability: true },
    });

    if (!profile) {
      return next(createError("STYLIST_NOT_FOUND"));
    }

    // Return default schedule if none exists
    const defaultSchedule = {
      mon: [{ start: "09:00", end: "17:00" }],
      tue: [{ start: "09:00", end: "17:00" }],
      wed: [{ start: "09:00", end: "17:00" }],
      thu: [{ start: "09:00", end: "17:00" }],
      fri: [{ start: "09:00", end: "17:00" }],
      sat: [],
      sun: [],
    };

    return res.json({
      schedule: profile.availability?.schedule || defaultSchedule,
      exceptions: profile.availability?.exceptions || [],
    });
  } catch (error) {
    logger.error("Error fetching availability", { error });
    return next(createError("INTERNAL_ERROR"));
  }
});

/**
 * PUT /api/stylists/availability
 * Update weekly availability schedule
 */
router.put("/availability", authenticate, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.userId!;
    const input = updateAvailabilitySchema.parse(req.body);

    const profile = await prisma.stylistProfile.findFirst({
      where: { userId },
      include: { availability: true },
    });

    if (!profile) {
      return next(createError("STYLIST_NOT_FOUND"));
    }

    // Upsert availability
    const availability = await prisma.stylistAvailability.upsert({
      where: { stylistId: profile.id },
      create: {
        stylistId: profile.id,
        schedule: input.schedule,
        exceptions: [],
      },
      update: {
        schedule: input.schedule,
      },
    });

    return res.json({
      schedule: availability.schedule,
      exceptions: availability.exceptions,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return next(createError("VALIDATION_ERROR", { details: error.errors }));
    }
    logger.error("Error updating availability", { error });
    return next(createError("INTERNAL_ERROR"));
  }
});

/**
 * POST /api/stylists/availability/exceptions
 * Add a date exception (blocked date)
 */
router.post("/availability/exceptions", authenticate, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.userId!;
    const input = addExceptionSchema.parse(req.body);

    const profile = await prisma.stylistProfile.findFirst({
      where: { userId },
      include: { availability: true },
    });

    if (!profile) {
      return next(createError("STYLIST_NOT_FOUND"));
    }

    // Get current exceptions
    const currentExceptions = (profile.availability?.exceptions as unknown as AvailabilityException[]) || [];

    // Check if date already exists
    const existingIndex = currentExceptions.findIndex((e: AvailabilityException) => e.date === input.date);
    if (existingIndex >= 0) {
      currentExceptions[existingIndex] = input;
    } else {
      currentExceptions.push(input);
    }

    // Upsert availability with new exception
    const availability = await prisma.stylistAvailability.upsert({
      where: { stylistId: profile.id },
      create: {
        stylistId: profile.id,
        schedule: {},
        exceptions: currentExceptions as unknown as Prisma.InputJsonValue,
      },
      update: {
        exceptions: currentExceptions as unknown as Prisma.InputJsonValue,
      },
    });

    return res.status(201).json({
      exceptions: availability.exceptions,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return next(createError("VALIDATION_ERROR", { details: error.errors }));
    }
    logger.error("Error adding exception", { error });
    return next(createError("INTERNAL_ERROR"));
  }
});

/**
 * DELETE /api/stylists/availability/exceptions/:date
 * Remove a date exception
 */
router.delete("/availability/exceptions/:date", authenticate, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.userId!;
    const { date } = req.params;

    const profile = await prisma.stylistProfile.findFirst({
      where: { userId },
      include: { availability: true },
    });

    if (!profile || !profile.availability) {
      return next(createError("AVAILABILITY_NOT_FOUND"));
    }

    const currentExceptions = (profile.availability.exceptions as unknown as AvailabilityException[]) || [];
    const filteredExceptions = currentExceptions.filter((e: AvailabilityException) => e.date !== date);

    await prisma.stylistAvailability.update({
      where: { stylistId: profile.id },
      data: { exceptions: filteredExceptions as unknown as Prisma.InputJsonValue },
    });

    return res.status(204).send();
  } catch (error) {
    logger.error("Error removing exception", { error });
    return next(createError("INTERNAL_ERROR"));
  }
});

// ============================================================================
// M3: PROFILE ENDPOINTS (F3.5)
// ============================================================================

/**
 * GET /api/stylists/profile
 * Get own stylist profile
 */
router.get("/profile", authenticate, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.userId!;

    const profile = await prisma.stylistProfile.findFirst({
      where: { userId },
      include: {
        user: {
          select: {
            displayName: true,
            avatarUrl: true,
          },
        },
      },
    });

    if (!profile) {
      return next(createError("STYLIST_NOT_FOUND"));
    }

    return res.json({
      id: profile.id,
      displayName: profile.user.displayName,
      avatarUrl: profile.user.avatarUrl,
      bio: profile.bio,
      operatingMode: profile.operatingMode,
      baseLocationLat: profile.baseLocationLat,
      baseLocationLng: profile.baseLocationLng,
      baseLocationAddress: profile.baseLocationAddress,
      serviceRadius: profile.serviceRadius,
      specialties: profile.specialties,
      portfolioImages: profile.portfolioImages,
      isAcceptingBookings: profile.isAcceptingBookings,
    });
  } catch (error) {
    logger.error("Error fetching profile", { error });
    return next(createError("INTERNAL_ERROR"));
  }
});

/**
 * PUT /api/stylists/profile
 * Update own stylist profile
 */
router.put("/profile", authenticate, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.userId!;
    const input = updateProfileSchema.parse(req.body);

    const profile = await prisma.stylistProfile.findFirst({
      where: { userId },
    });

    if (!profile) {
      return next(createError("STYLIST_NOT_FOUND"));
    }

    const updated = await prisma.stylistProfile.update({
      where: { id: profile.id },
      data: {
        ...(input.bio !== undefined && { bio: input.bio }),
        ...(input.operatingMode && { operatingMode: input.operatingMode }),
        ...(input.baseLocationLat !== undefined && { baseLocationLat: input.baseLocationLat }),
        ...(input.baseLocationLng !== undefined && { baseLocationLng: input.baseLocationLng }),
        ...(input.baseLocationAddress !== undefined && { baseLocationAddress: input.baseLocationAddress }),
        ...(input.serviceRadius !== undefined && { serviceRadius: input.serviceRadius }),
        ...(input.specialties !== undefined && { specialties: input.specialties }),
        ...(input.isAcceptingBookings !== undefined && { isAcceptingBookings: input.isAcceptingBookings }),
      },
      include: {
        user: {
          select: {
            displayName: true,
            avatarUrl: true,
          },
        },
      },
    });

    return res.json({
      id: updated.id,
      displayName: updated.user.displayName,
      avatarUrl: updated.user.avatarUrl,
      bio: updated.bio,
      operatingMode: updated.operatingMode,
      baseLocationLat: updated.baseLocationLat,
      baseLocationLng: updated.baseLocationLng,
      baseLocationAddress: updated.baseLocationAddress,
      serviceRadius: updated.serviceRadius,
      specialties: updated.specialties,
      portfolioImages: updated.portfolioImages,
      isAcceptingBookings: updated.isAcceptingBookings,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return next(createError("VALIDATION_ERROR", { details: error.errors }));
    }
    logger.error("Error updating profile", { error });
    return next(createError("INTERNAL_ERROR"));
  }
});

// ============================================================================
// M3: EARNINGS ENDPOINTS (F3.6)
// ============================================================================

/**
 * GET /api/stylists/earnings
 * Get earnings summary for authenticated stylist
 */
router.get("/earnings", authenticate, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.userId!;
    const now = new Date();

    // Total earnings
    const totalEarnings = await prisma.booking.aggregate({
      where: {
        stylistId: userId,
        status: "SETTLED",
      },
      _sum: { stylistPayoutCents: true },
      _count: true,
    });

    // This month
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const thisMonthEarnings = await prisma.booking.aggregate({
      where: {
        stylistId: userId,
        status: "SETTLED",
        updatedAt: { gte: startOfMonth },
      },
      _sum: { stylistPayoutCents: true },
    });

    // Last month (for comparison)
    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);
    const lastMonthEarnings = await prisma.booking.aggregate({
      where: {
        stylistId: userId,
        status: "SETTLED",
        updatedAt: { gte: startOfLastMonth, lte: endOfLastMonth },
      },
      _sum: { stylistPayoutCents: true },
    });

    // Pending (in escrow)
    const pendingEarnings = await prisma.booking.aggregate({
      where: {
        stylistId: userId,
        status: { in: ["CONFIRMED", "IN_PROGRESS", "AWAITING_CUSTOMER_CONFIRMATION"] },
      },
      _sum: { stylistPayoutCents: true },
      _count: true,
    });

    return res.json({
      totalEarnings: Number(totalEarnings._sum.stylistPayoutCents || 0),
      thisMonthEarnings: Number(thisMonthEarnings._sum.stylistPayoutCents || 0),
      lastMonthEarnings: Number(lastMonthEarnings._sum.stylistPayoutCents || 0),
      pendingEarnings: Number(pendingEarnings._sum.stylistPayoutCents || 0),
      pendingBookingsCount: pendingEarnings._count,
      completedBookingsCount: totalEarnings._count,
    });
  } catch (error) {
    logger.error("Error fetching earnings", { error });
    return next(createError("INTERNAL_ERROR"));
  }
});

/**
 * GET /api/stylists/earnings/trend
 * Get earnings trend data (week/month/year)
 */
router.get("/earnings/trend", authenticate, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.userId!;
    const period = (req.query.period as string) || "week";
    const now = new Date();

    let startDate: Date;
    if (period === "week") {
      startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    } else if (period === "month") {
      startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    } else {
      startDate = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate());
    }

    const bookings = await prisma.booking.findMany({
      where: {
        stylistId: userId,
        status: "SETTLED",
        updatedAt: { gte: startDate },
      },
      select: {
        stylistPayoutCents: true,
        updatedAt: true,
      },
      orderBy: { updatedAt: "asc" },
    });

    // Group by date
    const dataMap = new Map<string, number>();
    bookings.forEach((b) => {
      const dateKey = b.updatedAt.toISOString().split("T")[0];
      const existing = dataMap.get(dateKey) || 0;
      dataMap.set(dateKey, existing + Number(b.stylistPayoutCents));
    });

    // Fill in missing dates with 0
    const data: { date: string; earnings: number }[] = [];
    const current = new Date(startDate);
    while (current <= now) {
      const dateKey = current.toISOString().split("T")[0];
      data.push({
        date: dateKey,
        earnings: dataMap.get(dateKey) || 0,
      });
      current.setDate(current.getDate() + 1);
    }

    return res.json({
      period,
      data,
    });
  } catch (error) {
    logger.error("Error fetching earnings trend", { error });
    return next(createError("INTERNAL_ERROR"));
  }
});

/**
 * GET /api/stylists/earnings/history
 * Get payout history (completed bookings)
 */
router.get("/earnings/history", authenticate, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.userId!;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;

    const [payouts, total] = await Promise.all([
      prisma.booking.findMany({
        where: {
          stylistId: userId,
          status: "SETTLED",
        },
        include: {
          customer: {
            select: { displayName: true },
          },
        },
        orderBy: { updatedAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.booking.count({
        where: {
          stylistId: userId,
          status: "SETTLED",
        },
      }),
    ]);

    return res.json({
      payouts: payouts.map((p) => ({
        id: p.id,
        date: p.updatedAt.toISOString(),
        serviceName: p.serviceType,
        customerName: p.customer.displayName,
        amount: Number(p.stylistPayoutCents),
        status: p.status,
      })),
      pagination: {
        page,
        limit,
        total,
        hasMore: page * limit < total,
      },
    });
  } catch (error) {
    logger.error("Error fetching payout history", { error });
    return next(createError("INTERNAL_ERROR"));
  }
});

export default router;
