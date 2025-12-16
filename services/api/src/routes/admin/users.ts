/**
 * Admin Users API Routes
 * Provides user management for admin dashboard
 */

import { Router, type Response, type NextFunction } from "express";
import { authenticate, type AuthenticatedRequest, requireRole } from "../../middleware/auth";
import prisma from "../../lib/prisma";
import { z } from "zod";
import { createError } from "../../middleware/error-handler";

const router: ReturnType<typeof Router> = Router();

// All admin routes require authentication and ADMIN role
router.use(authenticate);
router.use(requireRole("ADMIN"));

// Query params validation
const listUsersSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
  search: z.string().optional(),
  role: z.string().optional(),
  status: z.string().optional(),
  sortBy: z.enum(["createdAt", "email", "displayName"]).default("createdAt"),
  sortOrder: z.enum(["asc", "desc"]).default("desc"),
});

/**
 * GET /api/v1/admin/users
 * List all users with pagination and filtering
 */
router.get("/", async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const params = listUsersSchema.parse(req.query);
    const { page, pageSize, search, role, status, sortBy, sortOrder } = params;

    // Build where clause
    const where: Record<string, unknown> = {};

    if (search) {
      where.OR = [
        { email: { contains: search, mode: "insensitive" } },
        { displayName: { contains: search, mode: "insensitive" } },
      ];
    }

    if (role) {
      where.roles = { has: role };
    }

    if (status) {
      where.verificationStatus = status;
    }

    // Get total count
    const total = await prisma.user.count({ where });

    // Get paginated users
    const users = await prisma.user.findMany({
      where,
      select: {
        id: true,
        email: true,
        displayName: true,
        avatarUrl: true,
        roles: true,
        verificationStatus: true,
        walletAddress: true,
        createdAt: true,
        updatedAt: true,
        _count: {
          select: {
            bookingsAsCustomer: true,
            bookingsAsStylist: true,
          },
        },
      },
      orderBy: { [sortBy]: sortOrder },
      skip: (page - 1) * pageSize,
      take: pageSize,
    });

    res.json({
      users,
      pagination: {
        page,
        pageSize,
        total,
        totalPages: Math.ceil(total / pageSize),
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return next(createError("VALIDATION_ERROR", { details: error.errors }));
    }
    console.error("Failed to fetch users:", error);
    return next(createError("INTERNAL_ERROR"));
  }
});

/**
 * GET /api/v1/admin/users/:id
 * Get detailed user information
 */
router.get("/:id", async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;

    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        displayName: true,
        avatarUrl: true,
        phone: true,
        roles: true,
        verificationStatus: true,
        walletAddress: true,
        createdAt: true,
        updatedAt: true,
        stylistProfile: {
          select: {
            id: true,
            bio: true,
            specialties: true,
            isAcceptingBookings: true,
          },
        },
        wallet: {
          select: {
            id: true,
            address: true,
            chainId: true,
            isDeployed: true,
          },
        },
        _count: {
          select: {
            bookingsAsCustomer: true,
            bookingsAsStylist: true,
          },
        },
      },
    });

    if (!user) {
      return next(createError("USER_NOT_FOUND"));
    }

    res.json({ user });
  } catch (error) {
    console.error("Failed to fetch user:", error);
    return next(createError("INTERNAL_ERROR"));
  }
});

/**
 * PATCH /api/v1/admin/users/:id
 * Update user (roles, verification status)
 */
router.patch("/:id", async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const { roles, verificationStatus } = req.body;

    const updateData: Record<string, unknown> = {};

    if (roles !== undefined) {
      // Validate roles
      const validRoles = ["CUSTOMER", "STYLIST", "PROPERTY_OWNER", "ADMIN"];
      const invalidRoles = roles.filter((r: string) => !validRoles.includes(r));
      if (invalidRoles.length > 0) {
        return next(createError("INVALID_ROLE", { invalidRoles }));
      }
      updateData.roles = roles;
    }

    if (verificationStatus !== undefined) {
      const validStatuses = ["PENDING", "VERIFIED", "REJECTED"];
      if (!validStatuses.includes(verificationStatus)) {
        return next(createError("VALIDATION_ERROR", { message: "Invalid verification status" }));
      }
      updateData.verificationStatus = verificationStatus;
    }

    const user = await prisma.user.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        email: true,
        displayName: true,
        roles: true,
        verificationStatus: true,
      },
    });

    res.json({ user });
  } catch (error) {
    console.error("Failed to update user:", error);
    return next(createError("INTERNAL_ERROR"));
  }
});

/**
 * GET /api/v1/admin/users/stats
 * Get user statistics
 */
router.get("/stats/overview", async (_req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const [
      totalUsers,
      totalCustomers,
      totalStylists,
      totalPropertyOwners,
      newUsersToday,
      verifiedUsers,
    ] = await Promise.all([
      prisma.user.count(),
      prisma.user.count({ where: { roles: { string_contains: "CUSTOMER" } } }),
      prisma.user.count({ where: { roles: { string_contains: "STYLIST" } } }),
      prisma.user.count({ where: { roles: { string_contains: "PROPERTY_OWNER" } } }),
      prisma.user.count({
        where: {
          createdAt: { gte: new Date(new Date().setHours(0, 0, 0, 0)) },
        },
      }),
      prisma.user.count({ where: { verificationStatus: "VERIFIED" } }),
    ]);

    res.json({
      stats: {
        totalUsers,
        totalCustomers,
        totalStylists,
        totalPropertyOwners,
        newUsersToday,
        verifiedUsers,
        verificationRate: totalUsers > 0 ? ((verifiedUsers / totalUsers) * 100).toFixed(1) : 0,
      },
    });
  } catch (error) {
    console.error("Failed to fetch user stats:", error);
    return next(createError("INTERNAL_ERROR"));
  }
});

export default router;
