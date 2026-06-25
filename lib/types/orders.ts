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

export type OrderRecord = {
  id: string;
  orderNumber?: number | null;
  lensType: ApiLensType;
  quantity: number;
  status: OrderStatus;
  createdAt: string;
  singleVisionLens?: {
    id: string;
    brand?: string | null;
    category?: string | null;
    item?: string | null;
    coating?: string | null;
  } | null;
  kryptokLens?: {
    id: string;
    brand?: string | null;
    category?: string | null;
    coating?: string | null;
  } | null;
  progressiveLens?: {
    id: string;
    brand?: string | null;
    category?: string | null;
    item?: string | null;
    coating?: string | null;
  } | null;
};
