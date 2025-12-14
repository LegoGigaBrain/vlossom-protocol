/**
 * Cloudinary Image Upload Service (F4.5)
 * Handles portfolio image uploads with CDN delivery
 */

import { v2 as cloudinary, UploadApiResponse, UploadApiErrorResponse } from "cloudinary";

// Configuration
const CLOUDINARY_CLOUD_NAME = process.env.CLOUDINARY_CLOUD_NAME || "vlossom";
const CLOUDINARY_API_KEY = process.env.CLOUDINARY_API_KEY || "";
const CLOUDINARY_API_SECRET = process.env.CLOUDINARY_API_SECRET || "";

// Image constraints
const MAX_FILE_SIZE_MB = 5;
const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;
const ALLOWED_FORMATS = ["jpg", "jpeg", "png", "webp", "gif"];

// Transformation presets
const TRANSFORMATIONS = {
  main: {
    width: 800,
    height: 800,
    crop: "limit",
    quality: "auto:good",
    fetch_format: "auto",
  },
  thumbnail: {
    width: 200,
    height: 200,
    crop: "fill",
    gravity: "auto",
    quality: "auto:low",
    fetch_format: "auto",
  },
};

// Initialize Cloudinary
let isConfigured = false;

function ensureConfigured(): void {
  if (!isConfigured) {
    if (!CLOUDINARY_API_KEY || !CLOUDINARY_API_SECRET) {
      console.warn("Cloudinary API credentials not configured - uploads will fail");
    }

    cloudinary.config({
      cloud_name: CLOUDINARY_CLOUD_NAME,
      api_key: CLOUDINARY_API_KEY,
      api_secret: CLOUDINARY_API_SECRET,
      secure: true,
    });

    isConfigured = true;
  }
}

export interface UploadResult {
  success: boolean;
  publicId?: string;
  url?: string;
  thumbnailUrl?: string;
  width?: number;
  height?: number;
  format?: string;
  bytes?: number;
  error?: string;
}

export interface DeleteResult {
  success: boolean;
  error?: string;
}

/**
 * Validate image file before upload
 */
export function validateImageFile(
  buffer: Buffer,
  mimetype: string
): { valid: boolean; error?: string } {
  // Check file size
  if (buffer.length > MAX_FILE_SIZE_BYTES) {
    return {
      valid: false,
      error: `File size exceeds ${MAX_FILE_SIZE_MB}MB limit`,
    };
  }

  // Check mime type
  const format = mimetype.split("/")[1]?.toLowerCase();
  if (!format || !ALLOWED_FORMATS.includes(format)) {
    return {
      valid: false,
      error: `Invalid file format. Allowed: ${ALLOWED_FORMATS.join(", ")}`,
    };
  }

  return { valid: true };
}

/**
 * Upload image to Cloudinary
 */
export async function uploadImage(
  buffer: Buffer,
  options: {
    userId: string;
    folder?: string;
    publicId?: string;
  }
): Promise<UploadResult> {
  ensureConfigured();

  // Check if Cloudinary is properly configured
  if (!CLOUDINARY_API_KEY || !CLOUDINARY_API_SECRET) {
    return {
      success: false,
      error: "Cloudinary is not configured. Please set CLOUDINARY_API_KEY and CLOUDINARY_API_SECRET.",
    };
  }

  const folder = options.folder || `vlossom/portfolio/${options.userId}`;

  return new Promise((resolve) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder,
        public_id: options.publicId,
        resource_type: "image",
        transformation: TRANSFORMATIONS.main,
        eager: [TRANSFORMATIONS.thumbnail],
        eager_async: true,
      },
      (error: UploadApiErrorResponse | undefined, result: UploadApiResponse | undefined) => {
        if (error || !result) {
          console.error("Cloudinary upload error:", error);
          resolve({
            success: false,
            error: error?.message || "Upload failed",
          });
          return;
        }

        // Build thumbnail URL
        const thumbnailUrl = cloudinary.url(result.public_id, {
          transformation: TRANSFORMATIONS.thumbnail,
        });

        resolve({
          success: true,
          publicId: result.public_id,
          url: result.secure_url,
          thumbnailUrl,
          width: result.width,
          height: result.height,
          format: result.format,
          bytes: result.bytes,
        });
      }
    );

    uploadStream.end(buffer);
  });
}

/**
 * Upload multiple images
 */
export async function uploadMultipleImages(
  files: Array<{ buffer: Buffer; mimetype: string }>,
  userId: string
): Promise<UploadResult[]> {
  const results: UploadResult[] = [];

  for (const file of files) {
    // Validate each file
    const validation = validateImageFile(file.buffer, file.mimetype);
    if (!validation.valid) {
      results.push({
        success: false,
        error: validation.error,
      });
      continue;
    }

    // Upload
    const result = await uploadImage(file.buffer, { userId });
    results.push(result);
  }

  return results;
}

/**
 * Delete image from Cloudinary
 */
export async function deleteImage(publicId: string): Promise<DeleteResult> {
  ensureConfigured();

  if (!CLOUDINARY_API_KEY || !CLOUDINARY_API_SECRET) {
    return {
      success: false,
      error: "Cloudinary is not configured",
    };
  }

  try {
    const result = await cloudinary.uploader.destroy(publicId);

    if (result.result === "ok" || result.result === "not found") {
      return { success: true };
    }

    return {
      success: false,
      error: `Delete failed: ${result.result}`,
    };
  } catch (error: any) {
    console.error("Cloudinary delete error:", error);
    return {
      success: false,
      error: error.message || "Delete failed",
    };
  }
}

/**
 * Delete multiple images
 */
export async function deleteMultipleImages(publicIds: string[]): Promise<DeleteResult[]> {
  const results: DeleteResult[] = [];

  for (const publicId of publicIds) {
    const result = await deleteImage(publicId);
    results.push(result);
  }

  return results;
}

/**
 * Generate a signed URL for direct upload (client-side upload)
 * This is useful for larger files or when you want to reduce server load
 */
export function generateUploadSignature(
  userId: string,
  options?: { folder?: string }
): {
  timestamp: number;
  signature: string;
  cloudName: string;
  apiKey: string;
  folder: string;
} | null {
  ensureConfigured();

  if (!CLOUDINARY_API_KEY || !CLOUDINARY_API_SECRET) {
    return null;
  }

  const timestamp = Math.round(Date.now() / 1000);
  const folder = options?.folder || `vlossom/portfolio/${userId}`;

  const signature = cloudinary.utils.api_sign_request(
    {
      timestamp,
      folder,
    },
    CLOUDINARY_API_SECRET
  );

  return {
    timestamp,
    signature,
    cloudName: CLOUDINARY_CLOUD_NAME,
    apiKey: CLOUDINARY_API_KEY,
    folder,
  };
}

/**
 * Get optimized image URL with transformations
 */
export function getOptimizedUrl(
  publicId: string,
  type: "main" | "thumbnail" = "main"
): string {
  ensureConfigured();

  return cloudinary.url(publicId, {
    transformation: TRANSFORMATIONS[type],
  });
}
