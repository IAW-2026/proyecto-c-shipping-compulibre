import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { ShipmentStatus } from "@prisma/client";

const VALID_STATUSES = Object.values(ShipmentStatus);

/**
 * POST /api/shipments/update
 *
 * Receives a status change pushed by the courier platform.
 * In production this would be a signed webhook from the courier.
 * For now it is open so the mock external API — or a developer
 * hitting it with curl / Postman — can drive status transitions
 * end-to-end.
 *
 * Body
 * ────
 * {
 *   "externalTrackingId": "COURIER-XYZ-123",  // required
 *   "status": "IN_TRANSIT",                    // required — must be a valid ShipmentStatus
 *   "location": "Buenos Aires Hub"             // optional — recorded on the event
 * }
 *
 * Responses
 * ─────────
 * 200  { message, trackingId, externalTrackingId, newStatus }
 * 400  missing / invalid fields
 * 404  no shipment found for externalTrackingId
 * 500  unexpected error
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { externalTrackingId, status, location } = body;

    if (!externalTrackingId) {
      return NextResponse.json(
        { error: "Missing required field: externalTrackingId" },
        { status: 400 }
      );
    }

    if (!status) {
      return NextResponse.json(
        { error: "Missing required field: status" },
        { status: 400 }
      );
    }

    if (!VALID_STATUSES.includes(status as ShipmentStatus)) {
      return NextResponse.json(
        {
          error: `Invalid status "${status}". Must be one of: ${VALID_STATUSES.join(", ")}`,
        },
        { status: 400 }
      );
    }

    // externalTrackingId has a @unique constraint so findUnique is safe here
    const shipment = await prisma.shipment.findUnique({
      where: { externalTrackingId },
    });

    if (!shipment) {
      return NextResponse.json(
        {
          error: `No shipment found with externalTrackingId "${externalTrackingId}"`,
        },
        { status: 404 }
      );
    }

    // Shipment uses trackingId as @id — update and event creation are atomic
    const [updatedShipment] = await prisma.$transaction([
      prisma.shipment.update({
        where: { trackingId: shipment.trackingId },
        data: { status: status as ShipmentStatus },
      }),
      prisma.shipmentEvent.create({
        data: {
          trackingId: shipment.trackingId,
          statusUpdate: status as ShipmentStatus,
          location: location ?? null,
        },
      }),
    ]);

    console.info(
      `[POST /api/shipments/update] ${externalTrackingId} → ${status}`,
      location ? `@ ${location}` : ""
    );

    return NextResponse.json({
      message: "Shipment status updated successfully",
      trackingId: updatedShipment.trackingId,
      externalTrackingId,
      newStatus: updatedShipment.status,
    });
  } catch (error) {
    console.error("[POST /api/shipments/update]", error);
    return NextResponse.json(
      { error: "Failed to update shipment status" },
      { status: 500 }
    );
  }
}