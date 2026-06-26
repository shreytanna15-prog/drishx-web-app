"use client";

import { useCallback, useRef, useState } from "react";
import type { BrandConfirmOptions } from "@/components/shared/brand-confirm-dialog";

export function useBrandConfirm() {
  const [open, setOpen] = useState(false);
  const [options, setOptions] = useState<BrandConfirmOptions | null>(null);
  const resolveRef = useRef<((value: boolean) => void) | null>(null);

  const confirm = useCallback((nextOptions: BrandConfirmOptions) => {
    return new Promise<boolean>((resolve) => {
      resolveRef.current = resolve;
      setOptions(nextOptions);
      setOpen(true);
    });
  }, []);

  const finish = useCallback((result: boolean) => {
    setOpen(false);
    const resolve = resolveRef.current;
    resolveRef.current = null;
    resolve?.(result);
  }, []);

  return {
    confirm,
    open,
    options,
    onConfirm: () => finish(true),
    onCancel: () => finish(false),
  };
}
