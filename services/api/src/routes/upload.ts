/**
 * Upload API Routes (F4.5)
 * Endpoints for image upload (portfolio, avatars)
 */

import { Router, Response } from "express";
import { authenticate, type AuthenticatedRequest } from "../middleware/auth";
import {
  uploadImage,
  uploadMultipleImages,
  deleteImage,
  validateImageFile,
  generateUploadSignature,
} from "../lib/cloudinary";
import prisma from "../lib/prisma";
import { z } from "zod";

const router: ReturnType<typeof Router> = Router();

// Max images per portfolio
const MAX_PORTFOLIO_IMAGES = 20;

/**
 * Middleware to parse multipart form data
 * Note: In production, use multer or similar middleware
 * This is a simple implementation for the API
 */
async function parseMultipartBody(
  req: AuthenticatedRequest
): Promise<{ buffer: Buffer; mimetype: string } | null> {
  return new Promise((resolve) => {
    const chunks: Buffer[] = [];
    let mimetype = req.headers["content-type"] || "";

    // For multipart, extract the actual content type
    if (mimetype.includes("multipart/form-data")) {
      // Simple extraction - in production use multer
      mimetype = "image/jpeg"; // Default, will be validated
    }

    req.on("data", (chunk) => {
      chunks.push(chunk);
    });

    req.on("end", () => {
      if (chunks.length === 0) {
        resolve(null);
        return;
      }
      resolve({
        buffer: Buffer.concat(chunks),
        mimetype,
      });
    });

    req.on("error", () => {
      resolve(null);
    });
  });
}

/**
 * POST /api/upload/portfolio
 * Upload a portfolio image for authenticated stylist
 */
router.post("/portfolio", authenticate, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.userId!;

    // Verify user is a stylist
    const profile = await prisma.stylistProfile.findFirst({
      where: { userId },
    });

    if (!profile) {
      return res.status(403).json({
        error: {
          code: "NOT_A_STYLIST",
          message: "Only stylists can upload portfolio images",
        },
      });
    }

    // Check current portfolio count
    const currentImages = (profile.portfolioImages as string[]) || [];
    if (currentImages.length >= MAX_PORTFOLIO_IMAGES) {
      return res.status(400).json({
        error: {
          code: "PORTFOLIO_LIMIT_REACHED",
          message: `Maximum ${MAX_PORTFOLIO_IMAGES} portfolio images allowed`,
        },
      });
    }

    // Get the raw body data
    // Note: Express json middleware won't parse binary data
    // In production, use multer middleware
    const contentType = req.headers["content-type"] || "";

    if (!contentType.includes("application/octet-stream") &&
        !contentType.includes("image/")) {
      return res.status(400).json({
        error: {
          code: "INVALID_CONTENT_TYPE",
          message: "Content-Type must be an image type or application/octet-stream",
        },
      });
    }

    // Parse the body as Buffer
    const chunks: Buffer[] = [];
    for await (const chunk of req) {
      chunks.push(typeof chunk === "string" ? Buffer.from(chunk) : chunk);
    }
    const buffer = Buffer.concat(chunks);

    if (buffer.length === 0) {
      return res.status(400).json({
        error: {
          code: "NO_FILE",
          message: "No file data received",
        },
      });
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
      return res.status(400).json({
        error: {
          code: "INVALID_FILE",
          message: validation.error,
        },
      });
    }

    // Upload to Cloudinary
    const result = await uploadImage(buffer, {
      userId,
      folder: `vlossom/portfolio/${profile.id}`,
    });

    if (!result.success) {
      return res.status(500).json({
        error: {
          code: "UPLOAD_FAILED",
          message: result.error || "Failed to upload image",
        },
      });
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
  } catch (error: any) {
    console.error("Error uploading portfolio image:", error);
    return res.status(500).json({
      error: {
        code: "INTERNAL_ERROR",
        message: "Failed to upload image",
      },
    });
  }
});

/**
 * DELETE /api/upload/portfolio/:publicId
 * Delete a portfolio image
 */
router.delete("/portfolio/:publicId(*)", authenticate, async (req: AuthenticatedRequest, res: Response) => {
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
      return res.status(403).json({
        error: {
          code: "NOT_A_STYLIST",
          message: "Only stylists can delete portfolio images",
        },
      });
    }

    // Delete from Cloudinary
    const result = await deleteImage(decodedPublicId);

    if (!result.success) {
      console.warn("Cloudinary delete warning:", result.error);
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
  } catch (error: any) {
    console.error("Error deleting portfolio image:", error);
    return res.status(500).json({
      error: {
        code: "INTERNAL_ERROR",
        message: "Failed to delete image",
      },
    });
  }
});

/**
 * GET /api/upload/signature
 * Get a signed upload URL for direct client-side upload
 */
router.get("/signature", authenticate, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.userId!;

    // Verify user is a stylist
    const profile = await prisma.stylistProfile.findFirst({
      where: { userId },
    });

    if (!profile) {
      return res.status(403).json({
        error: {
          code: "NOT_A_STYLIST",
          message: "Only stylists can upload portfolio images",
        },
      });
    }

    // Generate signature
    const signature = generateUploadSignature(userId, {
      folder: `vlossom/portfolio/${profile.id}`,
    });

    if (!signature) {
      return res.status(500).json({
        error: {
          code: "SIGNATURE_FAILED",
          message: "Cloudinary is not configured",
        },
      });
    }

    return res.json({
      timestamp: signature.timestamp,
      signature: signature.signature,
      cloudName: signature.cloudName,
      apiKey: signature.apiKey,
      folder: signature.folder,
      uploadUrl: `https://api.cloudinary.com/v1_1/${signature.cloudName}/image/upload`,
    });
  } catch (error: any) {
    console.error("Error generating upload signature:", error);
    return res.status(500).json({
      error: {
        code: "INTERNAL_ERROR",
        message: "Failed to generate upload signature",
      },
    });
  }
});

/**
 * POST /api/upload/avatar
 * Upload avatar image for authenticated user
 */
router.post("/avatar", authenticate, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.userId!;

    // Get the raw body data
    const contentType = req.headers["content-type"] || "";

    if (!contentType.includes("application/octet-stream") &&
        !contentType.includes("image/")) {
      return res.status(400).json({
        error: {
          code: "INVALID_CONTENT_TYPE",
          message: "Content-Type must be an image type or application/octet-stream",
        },
      });
    }

    // Parse the body as Buffer
    const chunks: Buffer[] = [];
    for await (const chunk of req) {
      chunks.push(typeof chunk === "string" ? Buffer.from(chunk) : chunk);
    }
    const buffer = Buffer.concat(chunks);

    if (buffer.length === 0) {
      return res.status(400).json({
        error: {
          code: "NO_FILE",
          message: "No file data received",
        },
      });
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
      return res.status(400).json({
        error: {
          code: "INVALID_FILE",
          message: validation.error,
        },
      });
    }

    // Upload to Cloudinary
    const result = await uploadImage(buffer, {
      userId,
      folder: `vlossom/avatars`,
      publicId: userId, // Use userId as publicId to replace existing avatar
    });

    if (!result.success) {
      return res.status(500).json({
        error: {
          code: "UPLOAD_FAILED",
          message: result.error || "Failed to upload image",
        },
      });
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
  } catch (error: any) {
    console.error("Error uploading avatar:", error);
    return res.status(500).json({
      error: {
        code: "INTERNAL_ERROR",
        message: "Failed to upload avatar",
      },
    });
  }
});

export default router;
