"use client";

import Image from "next/image";
import { useEffect, useId, useRef, useState } from "react";
import { ImagePlus, X } from "lucide-react";
import { productImagesContent as content } from "@/src/content/product-images";
import {
  mergeProductImageFiles,
  productImageAccept,
} from "@/src/lib/product-image-files";
import { adminControls } from "@/src/styles/admin-controls";

function Preview({ file }: { file: File }) {
  const [url, setUrl] = useState("");
  useEffect(() => {
    const objectUrl = URL.createObjectURL(file);
    const preview = new window.Image();
    preview.onload = () => setUrl(objectUrl);
    preview.src = objectUrl;
    return () => {
      preview.onload = null;
      URL.revokeObjectURL(objectUrl);
    };
  }, [file]);
  return url ? (
    <Image
      src={url}
      alt={file.name}
      fill
      unoptimized
      sizes="160px"
      className="object-contain p-2"
    />
  ) : null;
}

export default function ProductImageDropzone({
  files,
  onChange,
  disabled = false,
}: {
  files: File[];
  onChange: (files: File[]) => void;
  disabled?: boolean;
}) {
  const input = useRef<HTMLInputElement>(null);
  const id = useId();
  const [dragging, setDragging] = useState(false);
  const [message, setMessage] = useState("");
  function add(incoming: File[]) {
    if (disabled) return;
    const result = mergeProductImageFiles(files, incoming);
    onChange(result.files);
    setMessage(
      result.invalid ? content.invalid : result.duplicates ? content.duplicate : "",
    );
  }
  return (
    <div className="mt-6">
      <input
        ref={input}
        id={id}
        type="file"
        multiple
        accept={productImageAccept}
        disabled={disabled}
        className="sr-only"
        tabIndex={-1}
        onChange={(event) => {
          add(Array.from(event.currentTarget.files ?? []));
          event.currentTarget.value = "";
        }}
      />
      <button
        type="button"
        disabled={disabled}
        aria-describedby={id + "-help"}
        onClick={() => input.current?.click()}
        onDragEnter={(event) => {
          event.preventDefault();
          if (!disabled && event.dataTransfer.types.includes("Files")) setDragging(true);
        }}
        onDragOver={(event) => {
          event.preventDefault();
          event.dataTransfer.dropEffect = disabled ? "none" : "copy";
        }}
        onDragLeave={(event) => {
          if (!event.currentTarget.contains(event.relatedTarget as Node | null))
            setDragging(false);
        }}
        onDrop={(event) => {
          event.preventDefault();
          event.stopPropagation();
          setDragging(false);
          add(Array.from(event.dataTransfer.files));
        }}
        className={`flex min-h-44 w-full flex-col items-center justify-center gap-2 rounded-2xl! border-2 border-dashed px-5 py-7 text-center transition-colors focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white disabled:opacity-45 ${dragging ? "border-[#c4d0eb]! bg-[#202b42]!" : "border-[#414650]! bg-[#14171c]! hover:border-[#8190aa]!"}`}
      >
        <ImagePlus size={28} className="mb-2 text-[#c6cbd5]!" aria-hidden="true" />
        <span className="text-sm font-medium text-[#f2f3f5]!">
          {dragging ? content.dropping : content.drop}
        </span>
        <span className="text-xs text-[#b0b7c5]!">{content.choose}</span>
      </button>
      <p id={id + "-help"} className="mt-3 text-xs leading-5 text-neutral-400">
        {content.help}
      </p>
      {message && (
        <p role="status" className="mt-2 text-sm text-[#e4c2c8]!">
          {message}
        </p>
      )}
      <ul
        aria-label="Imagens selecionadas"
        className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3"
      >
        {files.map((file, index) => (
          <li
            key={[file.name, file.size, file.lastModified].join(":")}
            className="min-w-0 overflow-hidden rounded-2xl bg-[#191c22] p-2"
          >
            <div className="relative aspect-square overflow-hidden rounded-xl bg-[#252830]">
              <Preview file={file} />
              {index === 0 && (
                <span className="absolute bottom-2 left-2 rounded-md bg-[#171914] px-2 py-1 text-[10px] text-white!">
                  {content.cover}
                </span>
              )}
              <button
                type="button"
                aria-label={content.remove + ": " + file.name}
                disabled={disabled}
                onClick={() => onChange(files.filter((_, i) => i !== index))}
                className="absolute right-1 top-1 flex size-10 items-center justify-center rounded-xl! bg-[#171914]! text-white! disabled:opacity-40"
              >
                <X size={16} className="text-white!" />
              </button>
            </div>
            <p className="mt-2 truncate px-1 text-xs text-[#e4e7ed]!" title={file.name}>
              {file.name}
            </p>
            <p className="mt-1 px-1 text-[11px] text-neutral-400">
              {(file.size / 1024 / 1024).toFixed(2)} MB
            </p>
            {index > 0 && (
              <button
                type="button"
                disabled={disabled}
                onClick={() => onChange([file, ...files.filter((_, i) => i !== index)])}
                className={adminControls.secondary + " mt-2 w-full px-2! text-xs!"}
              >
                {content.makeCover}
              </button>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
