"use client";

import { useState, useRef } from "react";
import { Button } from "../ui/button";
import { toast } from "../../hooks/use-toast";
import { Icon } from "@/components/icons";

interface AvatarUploadProps {
  currentUrl?: string | null;
  displayName: string;
  onUpload: (url: string) => Promise<void>;
}

export function AvatarUpload({ currentUrl, displayName, onUpload }: AvatarUploadProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(currentUrl || null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith("image/")) {
      toast.error("Invalid file", "Please select an image file.");
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error("File too large", "Please select an image under 5MB.");
      return;
    }

    // Show preview immediately
    const reader = new FileReader();
    reader.onload = (e) => {
      setPreviewUrl(e.target?.result as string);
    };
    reader.readAsDataURL(file);

    // Upload to server
    setIsUploading(true);
    try {
      const token = localStorage.getItem("vlossom_token");
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/upload/avatar`,
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
      await onUpload(data.url);
    } catch (error) {
      // Revert preview on error
      setPreviewUrl(currentUrl || null);
      toast.error("Upload failed", "Please try again.");
    } finally {
      setIsUploading(false);
    }
  };

  const initials = displayName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <div className="flex flex-col items-center space-y-4">
      {/* Avatar Display */}
      <div className="relative">
        <div className="w-24 h-24 rounded-full overflow-hidden bg-background-tertiary border-2 border-border-default">
          {previewUrl ? (
            <img
              src={previewUrl}
              alt={displayName}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-2xl font-semibold text-text-secondary">
              {initials || <Icon name="profile" size="xl" />}
            </div>
          )}

          {/* Upload Overlay */}
          {isUploading && (
            <div className="absolute inset-0 bg-black/50 flex items-center justify-center rounded-full">
              <Icon name="loading" size="md" className="text-white animate-spin" />
            </div>
          )}
        </div>

        {/* Camera Button */}
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={isUploading}
          className="absolute bottom-0 right-0 w-8 h-8 rounded-full bg-brand-rose text-white flex items-center justify-center hover:bg-brand-clay transition-gentle disabled:opacity-50"
          aria-label="Change photo"
        >
          <Icon name="camera" size="sm" />
        </button>
      </div>

      {/* Hidden File Input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        className="hidden"
        aria-label="Upload profile photo"
      />

      {/* Upload Button */}
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={() => fileInputRef.current?.click()}
        disabled={isUploading}
      >
        {isUploading ? "Uploading..." : "Change photo"}
      </Button>

      <p className="text-xs text-text-muted text-center">
        JPG, PNG or GIF. Max 5MB.
      </p>
    </div>
  );
}
