"use client";

import { useState } from "react";
import Image from "next/image";

interface PortfolioGalleryProps {
  images: string[];
}

export function PortfolioGallery({ images }: PortfolioGalleryProps) {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  if (images.length === 0) {
    return null;
  }

  return (
    <div>
      <h2 className="text-xl font-display font-semibold text-text-primary mb-4">
        Portfolio
      </h2>

      {/* Image Grid */}
      <div className="grid grid-cols-3 gap-2">
        {images.map((image, index) => (
          <button
            key={index}
            onClick={() => setSelectedImage(image)}
            className="aspect-square rounded-lg overflow-hidden bg-secondary hover:opacity-90 transition-opacity"
          >
            <Image
              src={image}
              alt={`Portfolio image ${index + 1}`}
              className="w-full h-full object-cover"
              width={300}
              height={300}
            />
          </button>
        ))}
      </div>

      {/* Lightbox */}
      {selectedImage && (
        <div
          className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4"
          onClick={() => setSelectedImage(null)}
        >
          <button
            onClick={() => setSelectedImage(null)}
            className="absolute top-4 right-4 text-white hover:text-gray-300 transition-colors"
          >
            <svg
              className="w-8 h-8"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
          <Image
            src={selectedImage}
            alt="Portfolio full view"
            className="max-w-full max-h-[90vh] object-contain rounded-lg"
            onClick={(e) => e.stopPropagation()}
            width={800}
            height={800}
          />
        </div>
      )}
    </div>
  );
}
