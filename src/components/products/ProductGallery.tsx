"use client";

import { productStyles } from "@/src/styles/product";

import Image from "next/image";
import { useState } from "react";

type ProductGalleryProps = {
  name: string;
  images: string[];
};

export default function ProductGallery({ name, images }: ProductGalleryProps) {
  const [selectedImage, setSelectedImage] = useState(images[0]);

  return (
    <div className={productStyles.productGallery}>
      <div className="relative aspect-square overflow-hidden rounded-[26px] bg-[#f4f2ef]">
        <Image
          src={selectedImage}
          alt={name}
          fill
          priority
          className="object-cover object-center"
          sizes="(max-width: 1024px) 100vw, 50vw"
        />
      </div>

      {images.length > 1 && (
        <div className="mt-4 flex gap-3 overflow-x-auto pb-2">
          {images.map((image, index) => (
            <button
              key={`${image}-${index}`}
              type="button"
              aria-label={`Ver foto ${index + 1} de ${name}`}
              aria-pressed={selectedImage === image}
              onClick={() => setSelectedImage(image)}
              className={`relative size-20 shrink-0 overflow-hidden rounded-2xl border bg-neutral-100 transition ${
                selectedImage === image
                  ? "border-neutral-950"
                  : "border-neutral-200 hover:border-neutral-500"
              }`}
            >
              <Image
                src={image}
                alt={`${name} - imagem ${index + 1}`}
                fill
                className="object-cover object-center"
                sizes="120px"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
