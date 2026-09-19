"use client";

import { useRef, useState } from "react";

import { Button } from "@/components/ui/button";

export async function filesToDataUrls(files: FileList | File[]) {
  const selected = Array.from(files).filter((file) => file.type.startsWith("image/"));

  return Promise.all(
    selected.map(
      (file) =>
        new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(String(reader.result));
          reader.onerror = () => reject(reader.error);
          reader.readAsDataURL(file);
        })
    )
  );
}

type ImageUploadFieldProps = {
  label: string;
  value?: string | string[];
  multiple?: boolean;
  onChange: (value: string | string[]) => void;
};

export default function ImageUploadField({
  label,
  value,
  multiple = false,
  onChange,
}: ImageUploadFieldProps) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [error, setError] = useState("");
  const images = Array.isArray(value) ? value : value ? [value] : [];

  const handleFiles = async (files: FileList | null) => {
    if (!files?.length) return;

    try {
      setError("");
      const dataUrls = await filesToDataUrls(files);
      onChange(multiple ? [...images, ...dataUrls] : dataUrls[0] ?? "");
    } catch {
      setError("Could not read selected image.");
    } finally {
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  const removeImage = (index: number) => {
    if (multiple) {
      onChange(images.filter((_, imageIndex) => imageIndex !== index));
      return;
    }

    onChange("");
  };

  return (
    <div className="space-y-2 rounded-md border p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <p className="text-sm font-medium">{label}</p>
          <p className="text-xs text-muted-foreground">Upload image files for demo and documentation.</p>
        </div>
        <Button type="button" variant="outline" size="sm" onClick={() => inputRef.current?.click()}>
          Upload
        </Button>
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple={multiple}
        className="hidden"
        onChange={(event) => handleFiles(event.target.files)}
      />

      {error && <p className="text-sm text-red-600">{error}</p>}

      {images.length > 0 && (
        <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3">
          {images.map((image, index) => (
            <div key={`${image.slice(0, 30)}-${index}`} className="overflow-hidden rounded-md border border-border bg-card">
              <img src={image} alt={`${label} ${index + 1}`} className="h-32 w-full object-cover" />
              <button
                type="button"
                className="w-full border-t px-3 py-2 text-sm text-red-600 hover:bg-red-50"
                onClick={() => removeImage(index)}
              >
                Remove
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
