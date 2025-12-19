/**
 * Property Image Upload Component
 * Drag-and-drop image manager for property owners with cover image selection
 */

"use client";

import { useState, useRef, useCallback } from "react";
import Image from "next/image";
import { Button } from "../ui/button";
import { Icon } from "@/components/icons";
import { cn } from "@/lib/utils";
import { toast } from "@/hooks/use-toast";

interface PropertyImageUploadProps {
  propertyId: string;
  images: string[];
  coverImage?: string;
  onImagesChange: (images: string[]) => void;
  onCoverChange: (coverImage: string) => void;
  maxImages?: number;
}

export function PropertyImageUpload({
  propertyId,
  images,
  coverImage,
  onImagesChange,
  onCoverChange,
  maxImages = 10,
}: PropertyImageUploadProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Validate file before upload
  const validateFile = useCallback((file: File): boolean => {
    // Check file type
    if (!file.type.startsWith("image/")) {
      toast.error("Invalid file type", "Please select an image file (JPG, PNG, or WebP).");
      return false;
    }

    // Check file size (max 10MB)
    const maxSize = 10 * 1024 * 1024;
    if (file.size > maxSize) {
      toast.error("File too large", "Please select an image under 10MB.");
      return false;
    }

    return true;
  }, []);

  // Handle file upload
  const handleFileUpload = useCallback(
    async (files: FileList | null) => {
      if (!files || files.length === 0) return;

      const remainingSlots = maxImages - images.length;
      if (remainingSlots <= 0) {
        toast.warning("Maximum images reached", `You can upload up to ${maxImages} images.`);
        return;
      }

      const filesToUpload = Array.from(files)
        .filter(validateFile)
        .slice(0, remainingSlots);

      if (filesToUpload.length === 0) return;

      setIsUploading(true);
      setUploadProgress(0);

      try {
        const token = localStorage.getItem("vlossom_token");
        const formData = new FormData();

        filesToUpload.forEach((file) => {
          formData.append("files", file);
        });
        formData.append("propertyId", propertyId);

        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/upload/property-images`,
          {
            method: "POST",
            headers: {
              Authorization: `Bearer ${token}`,
            },
            body: formData,
          }
        );

        if (!response.ok) {
          throw new Error("Upload failed");
        }

        const data = await response.json();
        const newImages = [...images, ...data.urls];
        onImagesChange(newImages);

        // Set first image as cover if none exists
        if (!coverImage && data.urls.length > 0) {
          onCoverChange(data.urls[0]);
        }

        toast.success("Upload successful", `${filesToUpload.length} image(s) uploaded.`);
      } catch (error) {
        toast.error("Upload failed", "Please try again.");
      } finally {
        setIsUploading(false);
        setUploadProgress(0);
        if (fileInputRef.current) {
          fileInputRef.current.value = "";
        }
      }
    },
    [images, maxImages, propertyId, validateFile, onImagesChange, coverImage, onCoverChange]
  );

  // Handle file input change
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    handleFileUpload(e.target.files);
  };

  // Handle drag and drop
  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    handleFileUpload(e.dataTransfer.files);
  };

  // Handle image deletion
  const handleDeleteImage = useCallback(
    (imageUrl: string) => {
      const newImages = images.filter((url) => url !== imageUrl);
      onImagesChange(newImages);

      // If deleted image was cover, set first remaining as cover
      if (coverImage === imageUrl) {
        onCoverChange(newImages[0] || "");
      }

      toast.success("Image deleted", "Image removed from property.");
    },
    [images, coverImage, onImagesChange, onCoverChange]
  );

  // Handle cover image selection
  const handleSetCover = useCallback(
    (imageUrl: string) => {
      onCoverChange(imageUrl);
      toast.success("Cover image set", "This image will be shown first.");
    },
    [onCoverChange]
  );

  const hasImages = images.length > 0;
  const canUploadMore = images.length < maxImages;

  return (
    <div className="space-y-4">
      {/* Drag & Drop Zone */}
      {canUploadMore && (
        <div
          onDragEnter={handleDragEnter}
          onDragLeave={handleDragLeave}
          onDragOver={handleDragOver}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={cn(
            "relative rounded-card border-2 border-dashed transition-gentle cursor-pointer",
            isDragging
              ? "border-brand-rose bg-brand-rose/5"
              : "border-border-default hover:border-brand-rose hover:bg-background-tertiary"
          )}
        >
          <div className="p-8 text-center">
            <div className="mx-auto w-12 h-12 mb-3 rounded-full bg-background-tertiary flex items-center justify-center">
              <Icon
                name={isUploading ? "clock" : "image"}
                size="xl"
                className={cn(
                  "text-text-secondary",
                  isUploading && "animate-spin"
                )}
              />
            </div>
            <p className="text-body font-medium text-text-primary mb-1">
              {isUploading
                ? "Uploading..."
                : isDragging
                  ? "Drop images here"
                  : "Drag and drop images here"}
            </p>
            <p className="text-caption text-text-tertiary">
              or click to browse • JPG, PNG, WebP • Max 10MB each
            </p>
            <p className="text-caption text-text-muted mt-2">
              {images.length}/{maxImages} images uploaded
            </p>
          </div>

          {/* Upload Progress Bar */}
          {isUploading && uploadProgress > 0 && (
            <div className="absolute bottom-0 left-0 right-0 h-1 bg-background-tertiary rounded-b-card overflow-hidden">
              <div
                className="h-full bg-brand-rose transition-all duration-300"
                style={{ width: `${uploadProgress}%` }}
              />
            </div>
          )}
        </div>
      )}

      {/* Hidden File Input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        multiple
        onChange={handleFileChange}
        className="hidden"
        aria-label="Upload property images"
      />

      {/* Image Grid */}
      {hasImages && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {images.map((imageUrl) => {
            const isCover = coverImage === imageUrl;

            return (
              <div
                key={imageUrl}
                className="relative aspect-square rounded-card overflow-hidden bg-background-tertiary group"
              >
                {/* Image */}
                <Image
                  src={imageUrl}
                  alt="Property image"
                  className="w-full h-full object-cover"
                  width={300}
                  height={300}
                />

                {/* Cover Badge */}
                {isCover && (
                  <div className="absolute top-2 left-2 px-2 py-1 bg-accent-orange text-white text-caption font-medium rounded flex items-center gap-1">
                    <Icon name="star" size="sm" weight="fill" />
                    Cover
                  </div>
                )}

                {/* Hover Actions */}
                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-gentle flex items-center justify-center gap-2">
                  {/* Set Cover Button */}
                  {!isCover && (
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleSetCover(imageUrl)}
                      className="text-white hover:bg-white/20 hover:text-white"
                      aria-label="Set as cover image"
                    >
                      <Icon name="star" size="md" />
                    </Button>
                  )}

                  {/* Delete Button */}
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDeleteImage(imageUrl)}
                    className="text-white hover:bg-status-error/80 hover:text-white"
                    aria-label="Delete image"
                  >
                    <Icon name="close" size="md" />
                  </Button>
                </div>
              </div>
            );
          })}

          {/* Add More Placeholder */}
          {canUploadMore && (
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading}
              className={cn(
                "aspect-square rounded-card border-2 border-dashed border-border-default",
                "flex flex-col items-center justify-center gap-2",
                "text-text-tertiary hover:border-brand-rose hover:text-brand-rose",
                "transition-gentle disabled:opacity-50 disabled:cursor-not-allowed"
              )}
              aria-label="Add more images"
            >
              <Icon name="add" size="xl" />
              <span className="text-caption font-medium">Add Image</span>
            </button>
          )}
        </div>
      )}

      {/* Empty State */}
      {!hasImages && !canUploadMore && (
        <div className="text-center py-8 text-text-muted">
          <Icon name="image" size="2xl" className="mx-auto mb-2" />
          <p className="text-body">No images uploaded yet</p>
        </div>
      )}

      {/* Helper Text */}
      {hasImages && (
        <div className="flex items-start gap-2 p-4 bg-background-tertiary rounded-card">
          <Icon name="info" size="md" className="text-text-secondary mt-0.5" />
          <div className="text-caption text-text-secondary">
            <p className="font-medium mb-1">Image Tips</p>
            <ul className="space-y-1 text-text-tertiary">
              <li>The cover image appears first in listings</li>
              <li>Show different angles and amenities</li>
              <li>Well-lit photos attract more bookings</li>
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}
