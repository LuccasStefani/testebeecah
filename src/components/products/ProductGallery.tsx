"use client";

import Image from "next/image";
import { useState } from "react";

type ProductGalleryProps = {
  name: string;
  images: string[];
};

export default function ProductGallery({
  name,
  images,
}: ProductGalleryProps) {
  const [selectedImage, setSelectedImage] = useState(
    images[0]
  );

  return (
    <div>
      <div className="relative aspect-square overflow-hidden bg-neutral-100">
        <Image
          src={selectedImage}
          alt={name}
          fill
          priority
          className="object-contain p-10"
          sizes="(max-width: 1024px) 100vw, 50vw"
        />
      </div>

      {images.length > 1 && (
        <div className="mt-4 grid grid-cols-4 gap-3">
          {images.map((image, index) => (
            <button
              key={`${image}-${index}`}
              type="button"
              onClick={() => setSelectedImage(image)}
              className={`relative aspect-square overflow-hidden border bg-neutral-100 transition ${
                selectedImage === image
                  ? "border-neutral-950"
                  : "border-neutral-200 hover:border-neutral-500"
              }`}
            >
              <Image
                src={image}
                alt={`${name} - imagem ${index + 1}`}
                fill
                className="object-contain p-2"
                sizes="120px"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}