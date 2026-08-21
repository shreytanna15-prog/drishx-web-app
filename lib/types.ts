export type UserRole = "ADMIN" | "EMPLOYEE" | "CUSTOMER";

export type ApprovalStatus = "PENDING_REVIEW" | "APPROVED" | "REJECTED";

export type SafeUser = {
  id: string;
  email: string;
  name: string | null;
  role: UserRole;
  isActive: boolean;
  isApproved: boolean;
  approvalStatus: ApprovalStatus;
  gstNumber: string | null;
  businessName: string | null;
  businessAddress: string | null;
  state: string | null;
  pincode: string | null;
  mobileNumber?: string | null;
  alternateMobileNumber?: string | null;
  whatsappNumber?: string | null;
  shopName?: string | null;
  businessType?: string | null;
  addressLine1?: string | null;
  addressLine2?: string | null;
  city?: string | null;
  businessEmail?: string | null;
  shopPhoneNumber?: string | null;
  legalBusinessName?: string | null;
  tradeName?: string | null;
  gstRegistrationState?: string | null;
  panNumber?: string | null;
  billingLegalName?: string | null;
  billingAddress?: string | null;
  billingCity?: string | null;
  billingState?: string | null;
  billingPincode?: string | null;
  billingGstState?: string | null;
  shippingLegalName?: string | null;
  shippingAddress?: string | null;
  shippingCity?: string | null;
  shippingState?: string | null;
  shippingPincode?: string | null;
  approvedAt: string | null;
  rejectionReason: string | null;
  createdAt: string;
  updatedAt: string;
  permissions?: string[];
  staffRole?: {
    id: string;
    slug: string;
    name: string;
    description: string | null;
    isSystem: boolean;
    permissions: string[];
  } | null;
};

export type LoginResponse = {
  user: SafeUser;
  token: string;
  accessToken?: string;
};

export type SignupResponse = {
  user: SafeUser;
  message: string;
};

export type ApiError = {
  error: string;
  code?: string;
  rejectionReason?: string;
  user?: SafeUser;
};
