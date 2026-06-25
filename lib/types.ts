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
  approvedAt: string | null;
  rejectionReason: string | null;
  createdAt: string;
  updatedAt: string;
};

export type LoginResponse = {
  user: SafeUser;
  token: string;
};

export type SignupResponse = {
  user: SafeUser;
  message: string;
};

export type ApiError = {
  error: string;
  rejectionReason?: string;
  user?: SafeUser;
};
