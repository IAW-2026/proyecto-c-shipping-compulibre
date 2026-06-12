export type ShipmentStatus = "LABEL_CREATED" | "IN_TRANSIT" | "DELIVERED";

export interface ShipmentEvent {
  id: string;
  trackingId: string;
  statusUpdate: ShipmentStatus;
  location: string;
  timestamp: string;
}

export interface Shipment {
  trackingId: string;
  externalTrackingId: string;
  externalSellerOrderId: string;
  courier: string;
  originAddress: string;
  destinationAddress: string;
  status: ShipmentStatus;
  labelUrl: string | null;
  createdAt: string;
  updatedAt: string;
  events: ShipmentEvent[];
}
