import type { ShipmentStatus } from "./types";

export const STATUS_LABELS: Record<ShipmentStatus, string> = {
  LABEL_CREATED: "Label Created",
  IN_TRANSIT: "In Transit",
  DELIVERED: "Delivered",
};

export const STATUS_COLORS: Record<ShipmentStatus, string> = {
  LABEL_CREATED: "#f59e0b",
  IN_TRANSIT: "#3b82f6",
  DELIVERED: "#10b981",
};

export const NEXT_STATUS: Record<ShipmentStatus, ShipmentStatus | null> = {
  LABEL_CREATED: "IN_TRANSIT",
  IN_TRANSIT: "DELIVERED",
  DELIVERED: null,
};

export const NEXT_LABEL: Record<ShipmentStatus, string | null> = {
  LABEL_CREATED: "Mark In Transit →",
  IN_TRANSIT: "Mark Delivered →",
  DELIVERED: null,
};
