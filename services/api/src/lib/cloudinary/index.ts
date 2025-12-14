/**
 * Cloudinary Module (F4.5)
 * Export all cloudinary-related functionality
 */

export {
  uploadImage,
  uploadMultipleImages,
  deleteImage,
  deleteMultipleImages,
  validateImageFile,
  generateUploadSignature,
  getOptimizedUrl,
  type UploadResult,
  type DeleteResult,
} from "./cloudinary-service";
