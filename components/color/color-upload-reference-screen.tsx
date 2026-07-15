"use client";

import { ArrowRight, Camera, ImageIcon, Loader2, UploadCloud, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback, useRef, useState } from "react";
import {
  ColorAccentButton,
  ColorCard,
  ColorPageHeader,
} from "@/components/color/color-page-header";
import { buildColorLensPath } from "@/lib/color-lens-order";
import { uploadColorReference } from "@/lib/color-reference-api";
import { useColorLensBasePath } from "@/lib/on-behalf-order-hooks";
import { cn } from "@/lib/utils";

const MAX_BYTES = 10 * 1024 * 1024;

export function ColorUploadReferenceScreen() {
  const router = useRouter();
  const basePath = useColorLensBasePath();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const [pickedFile, setPickedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);

  const applyFile = useCallback((file: File | null) => {
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setError("Please choose a JPG or PNG image.");
      return;
    }

    if (file.size > MAX_BYTES) {
      setError("Please choose an image that is 10 MB or smaller.");
      return;
    }

    setError(null);
    setPickedFile(file);
    setPreviewUrl((current) => {
      if (current) URL.revokeObjectURL(current);
      return URL.createObjectURL(file);
    });
  }, []);

  const clearFile = () => {
    setPickedFile(null);
    setPreviewUrl((current) => {
      if (current) URL.revokeObjectURL(current);
      return null;
    });
  };

  const handleContinue = async () => {
    if (!pickedFile || uploading) return;

    setUploading(true);
    setError(null);
    try {
      const result = await uploadColorReference(pickedFile);
      router.push(
        buildColorLensPath(`${basePath}/lens-type`, {
          colorId: "upload-reference",
          colorName: "Color Reference",
          referenceImageUrl: result.storedImageUrl || result.imageUrl,
        })
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed. Please try again.");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="relative mx-auto w-full max-w-3xl flex-1 px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
      <ColorPageHeader title="Upload Reference" backHref={basePath} />

      <div
        onDragOver={(event) => {
          event.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(event) => {
          event.preventDefault();
          setDragOver(false);
          applyFile(event.dataTransfer.files?.[0] ?? null);
        }}
      >
        <ColorCard
          className={cn(
            "border-dashed transition-colors",
            dragOver &&
              "border-[var(--brand-primary)] bg-[color-mix(in_srgb,var(--brand-primary)_6%,var(--brand-card))]"
          )}
        >
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          className="hidden"
          onChange={(event) => applyFile(event.target.files?.[0] ?? null)}
        />
        <input
          ref={cameraInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          className="hidden"
          onChange={(event) => applyFile(event.target.files?.[0] ?? null)}
        />

        {previewUrl ? (
          <div className="relative mb-4 overflow-hidden rounded-xl">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={previewUrl}
              alt="Color reference preview"
              className="max-h-80 w-full object-cover"
            />
            <button
              type="button"
              onClick={clearFile}
              className="absolute right-3 top-3 flex size-9 items-center justify-center rounded-full bg-black/55 text-white transition-colors hover:bg-black/70"
              aria-label="Remove image"
            >
              <X className="size-4" />
            </button>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center gap-3 py-10 text-center">
            <span className="flex size-16 items-center justify-center rounded-full bg-[var(--brand-primary)]/12 text-[var(--brand-primary)]">
              <UploadCloud className="size-8" />
            </span>
            <div>
              <p className="text-lg font-extrabold text-[var(--brand-text)]">
                Upload or Capture
              </p>
              <p className="mt-1 text-sm font-medium text-[var(--brand-text-muted)]">
                Lens / Color Reference
              </p>
            </div>
            <p className="text-xs font-medium text-[var(--brand-text-muted)]">
              Supported: JPG, PNG (Max 10MB) · Drag and drop supported
            </p>
          </div>
        )}

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <button
            type="button"
            disabled={uploading}
            onClick={() => cameraInputRef.current?.click()}
            className="flex items-center justify-center gap-2 rounded-xl border border-[var(--brand-card-border)] bg-[var(--brand-background)] px-4 py-3 text-sm font-bold text-[var(--brand-text)] transition-colors hover:border-[var(--brand-primary)]/40 disabled:opacity-50"
          >
            <Camera className="size-4 text-[var(--brand-primary)]" />
            Camera
          </button>
          <button
            type="button"
            disabled={uploading}
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center justify-center gap-2 rounded-xl border border-[var(--brand-card-border)] bg-[var(--brand-background)] px-4 py-3 text-sm font-bold text-[var(--brand-text)] transition-colors hover:border-[var(--brand-primary)]/40 disabled:opacity-50"
          >
            <ImageIcon className="size-4 text-[var(--brand-primary)]" />
            Gallery
          </button>
        </div>

        {error ? (
          <p className="mt-4 text-center text-sm font-semibold text-[var(--brand-danger,#dc2626)]">
            {error}
          </p>
        ) : null}
        </ColorCard>
      </div>

      <div className="mt-6">
        <ColorAccentButton
          disabled={!pickedFile || uploading}
          onClick={() => void handleContinue()}
        >
          {uploading ? (
            <>
              <Loader2 className="size-5 animate-spin" />
              Uploading…
            </>
          ) : (
            <>
              {pickedFile ? "Next" : "Analyze Color"}
              <ArrowRight className="size-5" />
            </>
          )}
        </ColorAccentButton>
      </div>
    </div>
  );
}
