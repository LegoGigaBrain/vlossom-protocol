/**
 * Portfolio Upload Component
 * Reference: docs/specs/stylist-dashboard/F3.5-profile-management.md
 */

"use client";

import { useState, useRef } from "react";
import { Button } from "../ui/button";

interface PortfolioUploadProps {
  images: string[];
  onImagesChange: (images: string[]) => void;
  maxImages?: number;
  isLoading?: boolean;
}

export function PortfolioUpload({
  images,
  onImagesChange,
  maxImages = 12,
  isLoading,
}: PortfolioUploadProps) {
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const remainingSlots = maxImages - images.length;
    if (remainingSlots <= 0) return;

    const filesToUpload = Array.from(files).slice(0, remainingSlots);

    setUploading(true);

    try {
      // For now, create object URLs for preview
      // In production, this would upload to Cloudinary/S3
      const newImages = filesToUpload.map((file) => URL.createObjectURL(file));
      onImagesChange([...images, ...newImages]);
    } catch (error) {
      console.error("Upload failed:", error);
    } finally {
      setUploading(false);
      // Reset input
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleRemove = (index: number) => {
    const newImages = images.filter((_, i) => i !== index);
    onImagesChange(newImages);
  };

  // Reserved for future drag-and-drop reorder feature
  const _handleReorder = (fromIndex: number, toIndex: number) => {
    const newImages = [...images];
    const [movedImage] = newImages.splice(fromIndex, 1);
    newImages.splice(toIndex, 0, movedImage);
    onImagesChange(newImages);
  };
  void _handleReorder; // Suppress unused warning

  return (
    <div className="bg-background-primary rounded-card shadow-vlossom p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-h4 text-text-primary">Portfolio</h3>
        {images.length < maxImages && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading || isLoading}
          >
            {uploading ? "Uploading..." : "+ Add Images"}
          </Button>
        )}
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        multiple
        onChange={handleFileSelect}
        className="hidden"
      />

      {images.length === 0 ? (
        <div
          className="border-2 border-dashed border-border-default rounded-lg p-8 text-center cursor-pointer hover:border-brand-rose transition-colors"
          onClick={() => fileInputRef.current?.click()}
        >
          <div className="text-4xl mb-2">📷</div>
          <p className="text-body text-text-secondary">
            Click to add portfolio images
          </p>
          <p className="text-caption text-text-tertiary mt-1">
            JPEG, PNG, or WebP · Max 5MB each
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          {images.map((image, index) => (
            <div
              key={index}
              className="relative aspect-square rounded-lg overflow-hidden group"
            >
              <img
                src={image}
                alt={`Portfolio ${index + 1}`}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleRemove(index)}
                  className="text-white hover:bg-white/20"
                >
                  Remove
                </Button>
              </div>
              {index === 0 && (
                <span className="absolute top-2 left-2 px-2 py-1 bg-brand-rose text-white text-caption rounded">
                  Main
                </span>
              )}
            </div>
          ))}

          {images.length < maxImages && (
            <div
              className="aspect-square border-2 border-dashed border-border-default rounded-lg flex items-center justify-center cursor-pointer hover:border-brand-rose transition-colors"
              onClick={() => fileInputRef.current?.click()}
            >
              <div className="text-center">
                <span className="text-2xl text-text-tertiary">+</span>
                <p className="text-caption text-text-tertiary">Add</p>
              </div>
            </div>
          )}
        </div>
      )}

      <p className="text-caption text-text-tertiary mt-4">
        {images.length}/{maxImages} images · Drag to reorder
      </p>
    </div>
  );
}
