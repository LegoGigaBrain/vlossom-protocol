/**
 * Upload API Routes (F4.5)
 * Endpoints for image upload (portfolio, avatars)
 */

import { Router, Response, NextFunction } from "express";
import { authenticate, type AuthenticatedRequest } from "../middleware/auth";
import {
  uploadImage,
  deleteImage,
  validateImageFile,
  generateUploadSignature,
} from "../lib/cloudinary";
import prisma from "../lib/prisma";
import { createError } from "../middleware/error-handler";
import { logger } from "../lib/logger";
const router: ReturnType<typeof Router> = Router();

// Max images per portfolio
const MAX_PORTFOLIO_IMAGES = 20;

// Max images per property
const MAX_PROPERTY_IMAGES = 10;

// Note: In production, use multer or similar middleware for multipart form data parsing

/**
 * POST /api/upload/portfolio
 * Upload a portfolio image for authenticated stylist
 */
router.post("/portfolio", authenticate, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.userId!;

    // Verify user is a stylist
    const profile = await prisma.stylistProfile.findFirst({
      where: { userId },
    });

    if (!profile) {
      return next(createError("NOT_A_STYLIST"));
    }

    // Check current portfolio count
    const currentImages = (profile.portfolioImages as string[]) || [];
    if (currentImages.length >= MAX_PORTFOLIO_IMAGES) {
      return next(createError("PORTFOLIO_LIMIT", { max: MAX_PORTFOLIO_IMAGES }));
    }

    // Get the raw body data
    // Note: Express json middleware won't parse binary data
    // In production, use multer middleware
    const contentType = req.headers["content-type"] || "";

    if (!contentType.includes("application/octet-stream") &&
        !contentType.includes("image/")) {
      return next(createError("INVALID_CONTENT_TYPE"));
    }

    // Parse the body as Buffer
    const chunks: Buffer[] = [];
    for await (const chunk of req) {
      chunks.push(typeof chunk === "string" ? Buffer.from(chunk) : chunk);
    }
    const buffer = Buffer.concat(chunks);

    if (buffer.length === 0) {
      return next(createError("NO_FILE"));
    }

    // Determine mimetype from content-type or magic bytes
    let mimetype = contentType.split(";")[0].trim();
    if (mimetype === "application/octet-stream") {
      // Try to detect from magic bytes
      if (buffer[0] === 0xff && buffer[1] === 0xd8) {
        mimetype = "image/jpeg";
      } else if (buffer[0] === 0x89 && buffer[1] === 0x50) {
        mimetype = "image/png";
      } else if (buffer[0] === 0x47 && buffer[1] === 0x49) {
        mimetype = "image/gif";
      } else if (buffer[0] === 0x52 && buffer[1] === 0x49) {
        mimetype = "image/webp";
      }
    }

    // Validate the file
    const validation = validateImageFile(buffer, mimetype);
    if (!validation.valid) {
      return next(createError("INVALID_FILE", { reason: validation.error }));
    }

    // Upload to Cloudinary
    const result = await uploadImage(buffer, {
      userId,
      folder: `vlossom/portfolio/${profile.id}`,
    });

    if (!result.success) {
      return next(createError("UPLOAD_FAILED", { reason: result.error }));
    }

    // Update stylist profile with new image
    const updatedImages = [...currentImages, result.url!];
    await prisma.stylistProfile.update({
      where: { id: profile.id },
      data: { portfolioImages: updatedImages },
    });

    return res.status(201).json({
      success: true,
      image: {
        publicId: result.publicId,
        url: result.url,
        thumbnailUrl: result.thumbnailUrl,
        width: result.width,
        height: result.height,
        format: result.format,
        bytes: result.bytes,
      },
      totalImages: updatedImages.length,
    });
  } catch (error) {
    logger.error("Error uploading portfolio image", { error });
    return next(createError("INTERNAL_ERROR"));
  }
});

/**
 * DELETE /api/upload/portfolio/:publicId
 * Delete a portfolio image
 */
router.delete("/portfolio/:publicId(*)", authenticate, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.userId!;
    const { publicId } = req.params;

    // URL decode the publicId (it may contain slashes)
    const decodedPublicId = decodeURIComponent(publicId);

    // Verify user is a stylist
    const profile = await prisma.stylistProfile.findFirst({
      where: { userId },
    });

    if (!profile) {
      return next(createError("NOT_A_STYLIST"));
    }

    // Delete from Cloudinary
    const result = await deleteImage(decodedPublicId);

    if (!result.success) {
      logger.warn("Cloudinary delete warning", { publicId: decodedPublicId, error: result.error });
      // Continue anyway - the image might already be deleted from Cloudinary
    }

    // Remove from portfolio
    const currentImages = (profile.portfolioImages as string[]) || [];
    const updatedImages = currentImages.filter((url) => !url.includes(decodedPublicId));

    await prisma.stylistProfile.update({
      where: { id: profile.id },
      data: { portfolioImages: updatedImages },
    });

    return res.status(200).json({
      success: true,
      message: "Image deleted successfully",
      totalImages: updatedImages.length,
    });
  } catch (error) {
    logger.error("Error deleting portfolio image", { error });
    return next(createError("INTERNAL_ERROR"));
  }
});

/**
 * GET /api/upload/signature
 * Get a signed upload URL for direct client-side upload
 */
router.get("/signature", authenticate, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.userId!;

    // Verify user is a stylist
    const profile = await prisma.stylistProfile.findFirst({
      where: { userId },
    });

    if (!profile) {
      return next(createError("NOT_A_STYLIST"));
    }

    // Generate signature
    const signature = generateUploadSignature(userId, {
      folder: `vlossom/portfolio/${profile.id}`,
    });

    if (!signature) {
      return next(createError("SIGNATURE_FAILED"));
    }

    return res.json({
      timestamp: signature.timestamp,
      signature: signature.signature,
      cloudName: signature.cloudName,
      apiKey: signature.apiKey,
      folder: signature.folder,
      uploadUrl: `https://api.cloudinary.com/v1_1/${signature.cloudName}/image/upload`,
    });
  } catch (error) {
    logger.error("Error generating upload signature", { error });
    return next(createError("INTERNAL_ERROR"));
  }
});

/**
 * POST /api/upload/avatar
 * Upload avatar image for authenticated user
 */
router.post("/avatar", authenticate, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.userId!;

    // Get the raw body data
    const contentType = req.headers["content-type"] || "";

    if (!contentType.includes("application/octet-stream") &&
        !contentType.includes("image/")) {
      return next(createError("INVALID_CONTENT_TYPE"));
    }

    // Parse the body as Buffer
    const chunks: Buffer[] = [];
    for await (const chunk of req) {
      chunks.push(typeof chunk === "string" ? Buffer.from(chunk) : chunk);
    }
    const buffer = Buffer.concat(chunks);

    if (buffer.length === 0) {
      return next(createError("NO_FILE"));
    }

    // Determine mimetype
    let mimetype = contentType.split(";")[0].trim();
    if (mimetype === "application/octet-stream") {
      if (buffer[0] === 0xff && buffer[1] === 0xd8) {
        mimetype = "image/jpeg";
      } else if (buffer[0] === 0x89 && buffer[1] === 0x50) {
        mimetype = "image/png";
      } else if (buffer[0] === 0x47 && buffer[1] === 0x49) {
        mimetype = "image/gif";
      } else if (buffer[0] === 0x52 && buffer[1] === 0x49) {
        mimetype = "image/webp";
      }
    }

    // Validate the file
    const validation = validateImageFile(buffer, mimetype);
    if (!validation.valid) {
      return next(createError("INVALID_FILE", { reason: validation.error }));
    }

    // Upload to Cloudinary
    const result = await uploadImage(buffer, {
      userId,
      folder: `vlossom/avatars`,
      publicId: userId, // Use userId as publicId to replace existing avatar
    });

    if (!result.success) {
      return next(createError("UPLOAD_FAILED", { reason: result.error }));
    }

    // Update user avatar
    await prisma.user.update({
      where: { id: userId },
      data: { avatarUrl: result.url },
    });

    return res.status(201).json({
      success: true,
      avatar: {
        url: result.url,
        thumbnailUrl: result.thumbnailUrl,
      },
    });
  } catch (error) {
    logger.error("Error uploading avatar", { error });
    return next(createError("INTERNAL_ERROR"));
  }
});

/**
 * POST /api/upload/property/:propertyId
 * Upload property images for authenticated property owner
 */
router.post("/property/:propertyId", authenticate, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.userId!;
    const { propertyId } = req.params;

    // Verify property exists and user owns it
    const property = await prisma.property.findFirst({
      where: { id: propertyId },
    });

    if (!property) {
      return next(createError("PROPERTY_NOT_FOUND"));
    }

    if (property.ownerId !== userId) {
      return next(createError("FORBIDDEN", { reason: "Not property owner" }));
    }

    // Check current image count
    const currentImages = (property.images as string[]) || [];
    if (currentImages.length >= MAX_PROPERTY_IMAGES) {
      return next(createError("PROPERTY_IMAGE_LIMIT", { max: MAX_PROPERTY_IMAGES }));
    }

    // Get the raw body data
    const contentType = req.headers["content-type"] || "";

    if (!contentType.includes("application/octet-stream") &&
        !contentType.includes("image/")) {
      return next(createError("INVALID_CONTENT_TYPE"));
    }

    // Parse the body as Buffer
    const chunks: Buffer[] = [];
    for await (const chunk of req) {
      chunks.push(typeof chunk === "string" ? Buffer.from(chunk) : chunk);
    }
    const buffer = Buffer.concat(chunks);

    if (buffer.length === 0) {
      return next(createError("NO_FILE"));
    }

    // Determine mimetype from content-type or magic bytes
    let mimetype = contentType.split(";")[0].trim();
    if (mimetype === "application/octet-stream") {
      // Try to detect from magic bytes
      if (buffer[0] === 0xff && buffer[1] === 0xd8) {
        mimetype = "image/jpeg";
      } else if (buffer[0] === 0x89 && buffer[1] === 0x50) {
        mimetype = "image/png";
      } else if (buffer[0] === 0x47 && buffer[1] === 0x49) {
        mimetype = "image/gif";
      } else if (buffer[0] === 0x52 && buffer[1] === 0x49) {
        mimetype = "image/webp";
      }
    }

    // Validate the file
    const validation = validateImageFile(buffer, mimetype);
    if (!validation.valid) {
      return next(createError("INVALID_FILE", { reason: validation.error }));
    }

    // Upload to Cloudinary
    const result = await uploadImage(buffer, {
      userId,
      folder: `vlossom/properties/${propertyId}`,
    });

    if (!result.success) {
      return next(createError("UPLOAD_FAILED", { reason: result.error }));
    }

    // Update property with new image
    const updatedImages = [...currentImages, result.url!];
    await prisma.property.update({
      where: { id: propertyId },
      data: { images: updatedImages },
    });

    return res.status(201).json({
      success: true,
      image: {
        publicId: result.publicId,
        url: result.url,
        thumbnailUrl: result.thumbnailUrl,
        width: result.width,
        height: result.height,
        format: result.format,
        bytes: result.bytes,
      },
      totalImages: updatedImages.length,
    });
  } catch (error) {
    logger.error("Error uploading property image", { error });
    return next(createError("INTERNAL_ERROR"));
  }
});

/**
 * DELETE /api/upload/property/:propertyId/:publicId
 * Delete a property image
 */
router.delete("/property/:propertyId/:publicId(*)", authenticate, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.userId!;
    const { propertyId, publicId } = req.params;

    // URL decode the publicId (it may contain slashes)
    const decodedPublicId = decodeURIComponent(publicId);

    // Verify property exists and user owns it
    const property = await prisma.property.findFirst({
      where: { id: propertyId },
    });

    if (!property) {
      return next(createError("PROPERTY_NOT_FOUND"));
    }

    if (property.ownerId !== userId) {
      return next(createError("FORBIDDEN", { reason: "Not property owner" }));
    }

    // Delete from Cloudinary
    const result = await deleteImage(decodedPublicId);

    if (!result.success) {
      logger.warn("Cloudinary delete warning", { publicId: decodedPublicId, error: result.error });
      // Continue anyway - the image might already be deleted from Cloudinary
    }

    // Remove from property images
    const currentImages = (property.images as string[]) || [];
    const updatedImages = currentImages.filter((url) => !url.includes(decodedPublicId));

    await prisma.property.update({
      where: { id: propertyId },
      data: { images: updatedImages },
    });

    return res.status(200).json({
      success: true,
      message: "Image deleted successfully",
      totalImages: updatedImages.length,
    });
  } catch (error) {
    logger.error("Error deleting property image", { error });
    return next(createError("INTERNAL_ERROR"));
  }
});

/**
 * POST /api/upload/property/:propertyId/cover
 * Set property cover image for authenticated property owner
 */
router.post("/property/:propertyId/cover", authenticate, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.userId!;
    const { propertyId } = req.params;

    // Verify property exists and user owns it
    const property = await prisma.property.findFirst({
      where: { id: propertyId },
    });

    if (!property) {
      return next(createError("PROPERTY_NOT_FOUND"));
    }

    if (property.ownerId !== userId) {
      return next(createError("FORBIDDEN", { reason: "Not property owner" }));
    }

    // Get the raw body data
    const contentType = req.headers["content-type"] || "";

    if (!contentType.includes("application/octet-stream") &&
        !contentType.includes("image/")) {
      return next(createError("INVALID_CONTENT_TYPE"));
    }

    // Parse the body as Buffer
    const chunks: Buffer[] = [];
    for await (const chunk of req) {
      chunks.push(typeof chunk === "string" ? Buffer.from(chunk) : chunk);
    }
    const buffer = Buffer.concat(chunks);

    if (buffer.length === 0) {
      return next(createError("NO_FILE"));
    }

    // Determine mimetype from content-type or magic bytes
    let mimetype = contentType.split(";")[0].trim();
    if (mimetype === "application/octet-stream") {
      // Try to detect from magic bytes
      if (buffer[0] === 0xff && buffer[1] === 0xd8) {
        mimetype = "image/jpeg";
      } else if (buffer[0] === 0x89 && buffer[1] === 0x50) {
        mimetype = "image/png";
      } else if (buffer[0] === 0x47 && buffer[1] === 0x49) {
        mimetype = "image/gif";
      } else if (buffer[0] === 0x52 && buffer[1] === 0x49) {
        mimetype = "image/webp";
      }
    }

    // Validate the file
    const validation = validateImageFile(buffer, mimetype);
    if (!validation.valid) {
      return next(createError("INVALID_FILE", { reason: validation.error }));
    }

    // Upload to Cloudinary
    const result = await uploadImage(buffer, {
      userId,
      folder: `vlossom/properties/${propertyId}`,
      publicId: `${propertyId}_cover`, // Use specific ID for cover image
    });

    if (!result.success) {
      return next(createError("UPLOAD_FAILED", { reason: result.error }));
    }

    // Update property cover image
    await prisma.property.update({
      where: { id: propertyId },
      data: { coverImage: result.url },
    });

    return res.status(201).json({
      success: true,
      coverImage: {
        url: result.url,
        thumbnailUrl: result.thumbnailUrl,
      },
    });
  } catch (error) {
    logger.error("Error uploading property cover image", { error });
    return next(createError("INTERNAL_ERROR"));
  }
});

export default router;
