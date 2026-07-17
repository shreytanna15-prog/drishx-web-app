import type { ApiLensType } from "../lens";
import type { CartLineType, WholesaleSpec } from "@/lib/types/lens";

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

export type WholesaleOrderLineItem = {
  id: string;
  powerKey: string;
  quantity: number;
  reservedQuantity?: number;
  unitPrice?: number;
  totalAmount?: number;
  sph: number;
  cyl?: number | null;
  axis?: number | null;
  add?: number | null;
  needsProcurement?: boolean;
  createdAt?: string;
  updatedAt?: string;
};

export type OrderRecord = {
  id: string;
  orderNumber?: number | null;
  checkoutBatchId?: string | null;
  orderImageUrl?: string | null;
  lensType: ApiLensType;
  lineType?: CartLineType | null;
  wholesaleSpec?: WholesaleSpec | null;
  wholesaleLineItems?: WholesaleOrderLineItem[];
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
    sph?: number | string | null;
    cyl?: number | string | null;
    crossPower?: number | string | null;
    /** Current inventory stock (pieces), when included by the API. */
    quantity?: number | null;
  } | null;
  kryptokLens?: {
    id: string;
    brand?: string | null;
    category?: string | null;
    item?: string | null;
    coating?: string | null;
    sph?: number | string | null;
    cyl?: number | string | null;
    crossPower?: number | string | null;
    axis?: number | null;
    add?: number | string;
    /** Current inventory stock (pieces), when included by the API. */
    quantity?: number | null;
  } | null;
  progressiveLens?: {
    id: string;
    brand?: string | null;
    category?: string | null;
    item?: string | null;
    coating?: string | null;
    sph?: number | string | null;
    cyl?: number | string | null;
    crossPower?: number | string | null;
    axis?: number | null;
    add?: number | string;
    eye?: string;
    /** Current inventory stock (pieces), when included by the API. */
    quantity?: number | null;
  } | null;
};
