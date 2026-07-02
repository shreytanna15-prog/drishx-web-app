"use client";

import { useMemo } from "react";
import { useSearchParams } from "next/navigation";
import { parseColorLensOrderParams } from "@/lib/color-lens-order";

export function useColorLensOrder() {
  const searchParams = useSearchParams();

  return useMemo(() => {
    const params: Record<string, string | undefined> = {};
    searchParams.forEach((value, key) => {
      params[key] = value;
    });
    return parseColorLensOrderParams(params);
  }, [searchParams]);
}
