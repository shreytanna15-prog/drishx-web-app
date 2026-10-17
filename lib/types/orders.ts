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

export type OrderAssignee = {
  id: string;
  name: string | null;
  email: string;
  role?: string;
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
  /** List summary flag — signed URL only on detail GET (RW-11 Phase B). */
  hasOrderImage?: boolean;
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
  /** Staff-only — never sent to CUSTOMER role by the API. */
  internalNotes?: string | null;
  cancelReason?: string | null;
  courierName?: string | null;
  trackingNumber?: string | null;
  /** Courier dispatch slot decided at order placement (cutoff-aware). */
  dispatchDate?: string | null;
  /** True when the order was placed after the admin-configured dispatch cutoff. */
  cutoffDeferred?: boolean;
  dispatchOverridden?: boolean;
  deliveryServiceId?: string | null;
  deliveryService?: {
    id: string;
    courierCompany: string;
    serviceName: string;
    serviceType: string;
    customerRate: number | string;
    etaText?: string | null;
  } | null;
  delivery?: {
    actualWeight: number | string;
    chargeableWeight: number | string;
    customerCharge: number | string;
    internalCost?: number | string;
    margin?: number | string;
    weightEnteredAt?: string | null;
  } | null;
  sph?: number | string | null;
  cyl?: number | string | null;
  axis?: number | null;
  add?: number | string | null;
  eye?: string | null;
  createdAt: string;
  updatedAt?: string;
  user?: OrderUser;
  assignedToId?: string | null;
  assignedAt?: string | null;
  assignedTo?: OrderAssignee | null;
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
  powerVersions?: OrderPowerVersion[];
  alternateSuggestions?: AlternatePowerSuggestion[];
};

export type OrderPowerVersion = {
  id: string;
  orderId: string;
  versionNumber: number;
  sph: number | null;
  cyl: number | null;
  axis: number | null;
  add: number | null;
  eye: string | null;
  lensType: string;
  lensId: string | null;
  source: string;
  status: string;
  reservedQuantity: number;
  pickedQuantity: number;
  isFinalFulfilled: boolean;
  acceptedAt?: string | null;
  supersededAt?: string | null;
  notes?: string | null;
  createdAt: string;
};

export type AlternatePowerSuggestion = {
  id: string;
  orderId: string;
  forVersionId: string;
  sph: number;
  cyl: number | null;
  axis: number | null;
  add: number | null;
  eye: string | null;
  lensType: string;
  lensId: string;
  availability: "WAREHOUSE" | "SUPPLIER" | "OUT_OF_STOCK" | string;
  etaDays: number | null;
  distanceScore: number;
  status: string;
  createdAt: string;
};
