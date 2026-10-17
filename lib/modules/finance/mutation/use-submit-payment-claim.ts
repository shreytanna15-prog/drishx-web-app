"use client";

import {
  submitPaymentClaim,
  type SubmitPaymentClaimPayload,
} from "@/lib/finance-api";
import { useApiMutation } from "@/lib/hooks/use-api-mutation";
import type { MutationOptions } from "@/lib/types/api-client";

export function useSubmitPaymentClaim(
  options?: MutationOptions<unknown, SubmitPaymentClaimPayload>
) {
  return useApiMutation(
    (payload: SubmitPaymentClaimPayload) => submitPaymentClaim(payload),
    options
  );
}
