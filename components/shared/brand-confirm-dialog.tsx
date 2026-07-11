"use client";

import { AlertTriangle, Trash2 } from "lucide-react";
import { useEffect } from "react";
import { createPortal } from "react-dom";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export type BrandConfirmOptions = {
  title: string;
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  destructive?: boolean;
};

type BrandConfirmDialogProps = {
  open: boolean;
  options: BrandConfirmOptions | null;
  onConfirm: () => void;
  onCancel: () => void;
};

export function BrandConfirmDialog({
  open,
  options,
  onConfirm,
  onCancel,
}: BrandConfirmDialogProps) {
  useEffect(() => {
    if (!open) return;

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        onCancel();
      }
    }

    document.addEventListener("keydown", onKeyDown);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [open, onCancel]);

  if (!open || !options || typeof document === "undefined") {
    return null;
  }

  const Icon = options.destructive ? Trash2 : AlertTriangle;

  return createPortal(
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4"
      style={{ pointerEvents: "auto" }}
    >
      <button
        type="button"
        aria-label="Close dialog"
        className="absolute inset-0 bg-black/65 backdrop-blur-sm"
        onClick={onCancel}
      />

      <div
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="brand-confirm-title"
        aria-describedby="brand-confirm-description"
        onPointerDown={(event) => event.stopPropagation()}
        onClick={(event) => event.stopPropagation()}
        className={cn(
          "relative z-10 w-full max-w-md overflow-hidden rounded-2xl border shadow-[0_24px_64px_-24px_rgba(0,0,0,0.85)]",
          "border-[var(--brand-card-border)] bg-[var(--brand-card)]",
          "animate-in fade-in-0 zoom-in-95 duration-200"
        )}
      >
        <div
          aria-hidden
          className="pointer-events-none absolute -right-8 -top-8 h-32 w-32 rounded-full opacity-30 blur-2xl"
          style={{
            background: options.destructive
              ? "var(--brand-danger)"
              : "var(--brand-primary)",
          }}
        />

        <div className="relative p-6">
          <div className="flex items-start gap-4">
            <div
              className={cn(
                "flex size-12 shrink-0 items-center justify-center rounded-2xl",
                options.destructive
                  ? "bg-[var(--brand-danger)]/12 text-[var(--brand-danger)]"
                  : "bg-[var(--brand-primary)]/12 text-[var(--brand-primary)]"
              )}
            >
              <Icon className="size-5" />
            </div>

            <div className="min-w-0 flex-1 pt-0.5">
              <h2
                id="brand-confirm-title"
                className="text-lg font-extrabold text-[var(--brand-text)]"
              >
                {options.title}
              </h2>
              {options.description ? (
                <p
                  id="brand-confirm-description"
                  className="mt-2 text-sm leading-relaxed text-[var(--brand-text-muted)]"
                >
                  {options.description}
                </p>
              ) : null}
            </div>
          </div>

          <div className="mt-6 flex flex-col-reverse gap-2.5 sm:flex-row sm:justify-end">
            <Button
              type="button"
              variant="outline"
              onClick={(event) => {
                event.stopPropagation();
                onCancel();
              }}
              className="h-11 flex-1 rounded-xl border-[var(--brand-input-border)] font-semibold text-[var(--brand-text)] hover:bg-[var(--brand-primary)]/8 sm:flex-none"
            >
              {options.cancelLabel ?? "Cancel"}
            </Button>
            <Button
              type="button"
              onClick={(event) => {
                event.stopPropagation();
                onConfirm();
              }}
              className={cn(
                "h-11 flex-1 rounded-xl px-6 font-bold sm:flex-none",
                options.destructive
                  ? "bg-[var(--brand-danger)] text-white hover:bg-[color-mix(in_srgb,var(--brand-danger)_88%,black_12%)]"
                  : "bg-gradient-to-r from-[#f5ad42] to-[#e8941f] text-[var(--brand-primary-text)] hover:opacity-95"
              )}
            >
              {options.confirmLabel ?? "Confirm"}
            </Button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}
