import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { ShipmentStatus } from "@prisma/client";

const VALID_STATUSES = Object.values(ShipmentStatus);

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

/**
 * Handle CORS preflight requests
 */
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: corsHeaders,
  });
}

/**
 * POST /api/shipments/update
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { externalTrackingId, status, location } = body;

    if (!externalTrackingId) {
      return NextResponse.json(
        { error: "Missing required field: externalTrackingId" },
        {
          status: 400,
          headers: corsHeaders,
        }
      );
    }

    if (!status) {
      return NextResponse.json(
        { error: "Missing required field: status" },
        {
          status: 400,
          headers: corsHeaders,
        }
      );
    }

    if (!VALID_STATUSES.includes(status as ShipmentStatus)) {
      return NextResponse.json(
        {
          error: `Invalid status "${status}". Must be one of: ${VALID_STATUSES.join(", ")}`,
        },
        {
          status: 400,
          headers: corsHeaders,
        }
      );
    }

    const shipment = await prisma.shipment.findUnique({
      where: { externalTrackingId },
    });

    if (!shipment) {
      return NextResponse.json(
        {
          error: `No shipment found with externalTrackingId "${externalTrackingId}"`,
        },
        {
          status: 404,
          headers: corsHeaders,
        }
      );
    }

    const [updatedShipment] = await prisma.$transaction([
      prisma.shipment.update({
        where: { trackingId: shipment.trackingId },
        data: {
          status: status as ShipmentStatus,
        },
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

    return NextResponse.json(
      {
        message: "Shipment status updated successfully",
        trackingId: updatedShipment.trackingId,
        externalTrackingId,
        newStatus: updatedShipment.status,
      },
      {
        headers: corsHeaders,
      }
    );
  } catch (error) {
    console.error("[POST /api/shipments/update]", error);

    return NextResponse.json(
      { error: "Failed to update shipment status" },
      {
        status: 500,
        headers: corsHeaders,
      }
    );
  }
}