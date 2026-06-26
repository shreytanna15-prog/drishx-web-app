import type { ApiLensType } from "../lens";

export type OrderStatus =
  | "PENDING"
  | "PICKING"
  | "PACKED"
  | "DISPATCHED"
  | "PARTIALLY_FULFILLED"
  | "AWAITING_PROCUREMENT"
  | "COMPLETED"
  | "CANCELLED";

export type OrderUser = {
  id: string;
  name: string | null;
  email: string;
  role?: string;
  businessName?: string | null;
};

export type OrderRecord = {
  id: string;
  orderNumber?: number | null;
  checkoutBatchId?: string | null;
  orderImageUrl?: string | null;
  lensType: ApiLensType;
  quantity: number;
  reservedQuantity?: number;
  pickedQuantity?: number;
  unitPrice?: number | string;
  totalAmount?: number | string;
  status: OrderStatus;
  notes?: string | null;
  sph?: number | string | null;
  cyl?: number | string | null;
  axis?: number | null;
  add?: number | string | null;
  eye?: string | null;
  createdAt: string;
  updatedAt?: string;
  user?: OrderUser;
  singleVisionLens?: {
    id: string;
    brand?: string | null;
    category?: string | null;
    item?: string | null;
    coating?: string | null;
    sph?: number | string;
    cyl?: number | string | null;
  } | null;
  kryptokLens?: {
    id: string;
    brand?: string | null;
    category?: string | null;
    coating?: string | null;
    sph?: number | string;
    cyl?: number | string | null;
    axis?: number | null;
    add?: number | string;
  } | null;
  progressiveLens?: {
    id: string;
    brand?: string | null;
    category?: string | null;
    item?: string | null;
    coating?: string | null;
    sph?: number | string;
    cyl?: number | string | null;
    axis?: number | null;
    add?: number | string;
    eye?: string;
  } | null;
};
