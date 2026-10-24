"use client";

import {
  updateCustomerProfile,
  type CustomerProfilePatchPayload,
  type CustomerProfilePatchResponse,
} from "@/lib/customer-profile-api";
import { useApiMutation } from "@/lib/hooks/use-api-mutation";
import type { MutationOptions } from "@/lib/types/api-client";

export function useUpdateCustomerProfile(
  options?: MutationOptions<
    CustomerProfilePatchResponse,
    CustomerProfilePatchPayload
  >
) {
  return useApiMutation(
    (payload: CustomerProfilePatchPayload) => updateCustomerProfile(payload),
    options
  );
}
