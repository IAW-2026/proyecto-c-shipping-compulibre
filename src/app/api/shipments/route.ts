import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { ShipmentStatus } from "@prisma/client";

function generateTrackingId(): string {
  const num = Math.floor(Math.random() * 90000) + 10000;
  return `TRK-COMPU-${num}`;
}

// GET /api/shipments — list all shipments with their events
export async function GET() {
  try {
    const shipments = await prisma.shipment.findMany({
      include: {
        events: {
          orderBy: { timestamp: "desc" },
        },
      },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json(shipments);
  } catch (error) {
    console.error("[GET /api/shipments]", error);
    return NextResponse.json(
      { error: "Failed to fetch shipments" },
      { status: 500 }
    );
  }
}

// POST /api/shipments — create a new shipment (called by Payments App or admin)
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { sellerOrderId, sellerId, buyerAddress, originAddress, courier, labelUrl } = body;

    if (!sellerOrderId || !buyerAddress || !originAddress || !courier) {
      return NextResponse.json(
        { error: "Missing required fields: sellerOrderId, buyerAddress, originAddress, courier" },
        { status: 400 }
      );
    }

    // Se acepta sellerId sin usar (enviado por Payments App) para mantener compatibilidad, 
    // pero no se utiliza en este servicio
    void sellerId;

    const trackingId = generateTrackingId();

    const shipment = await prisma.shipment.create({
      data: {
        trackingId,
        externalSellerOrderId: sellerOrderId,
        courier,
        originAddress,
        destinationAddress: buyerAddress,
        status: ShipmentStatus.LABEL_CREATED,
        labelUrl: labelUrl ?? null,
        events: {
          create: {
            statusUpdate: ShipmentStatus.LABEL_CREATED,
            location: originAddress,
          },
        },
      },
      include: { events: true },
    });

    return NextResponse.json(
      {
        trackingId: shipment.trackingId,
        status: shipment.status,
        courier: shipment.courier,
        labelUrl: shipment.labelUrl,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("[POST /api/shipments]", error);
    return NextResponse.json(
      { error: "Failed to create shipment" },
      { status: 500 }
    );
  }
}
