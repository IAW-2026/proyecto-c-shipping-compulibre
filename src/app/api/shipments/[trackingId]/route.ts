import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { ShipmentStatus } from "@prisma/client";

const STATUS_ORDER: ShipmentStatus[] = [
  ShipmentStatus.LABEL_CREATED,
  ShipmentStatus.IN_TRANSIT,
  ShipmentStatus.DELIVERED,
];

function nextStatus(current: ShipmentStatus): ShipmentStatus | null {
  const idx = STATUS_ORDER.indexOf(current);

  return idx < STATUS_ORDER.length - 1
    ? STATUS_ORDER[idx + 1]
    : null;
}

// GET /api/shipments/[trackingId]
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ trackingId: string }> }
) {
  const { trackingId } = await params;

  try {
    const shipment = await prisma.shipment.findUnique({
      where: { trackingId },
      include: {
        events: {
          orderBy: { timestamp: "asc" },
        },
      },
    });

    if (!shipment) {
      return NextResponse.json(
        { error: "Shipment not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(shipment);
  } catch (error) {
    console.error("[GET /api/shipments/:trackingId]", error);

    return NextResponse.json(
      { error: "Failed to fetch shipment" },
      { status: 500 }
    );
  }
}

// DELETE /api/shipments/[trackingId]
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ trackingId: string }> }
) {
  const { trackingId } = await params;

  try {
    await prisma.shipment.delete({
      where: { trackingId },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[DELETE /api/shipments/:trackingId]", error);

    return NextResponse.json(
      { error: "Failed to delete shipment" },
      { status: 500 }
    );
  }
}

// PATCH /api/shipments/[trackingId]
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ trackingId: string }> }
) {
  const { trackingId } = await params;

  try {
    const body = await req.json().catch(() => ({}));

    const location: string =
      body.location ?? "In transit";

    const shipment = await prisma.shipment.findUnique({
      where: { trackingId },
    });

    if (!shipment) {
      return NextResponse.json(
        { error: "Shipment not found" },
        { status: 404 }
      );
    }

    const newStatus = nextStatus(shipment.status);

    if (!newStatus) {
      return NextResponse.json(
        {
          error:
            "Shipment is already in its final status (DELIVERED)",
        },
        { status: 400 }
      );
    }

    const updated = await prisma.shipment.update({
      where: { trackingId },
      data: {
        status: newStatus,
        events: {
          create: {
            statusUpdate: newStatus,
            location,
          },
        },
      },
      include: {
        events: {
          orderBy: { timestamp: "asc" },
        },
      },
    });

    const webhookPayload = {
      trackingId,
      courier: shipment.courier,
      status: newStatus,
    };

    const OrderId =
      shipment.externalSellerOrderId;

    if (OrderId && process.env.BUYER_APP_URL) {
      fetch(
        `${process.env.BUYER_APP_URL}/api/orders/${OrderId}/shipping-webhook`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(webhookPayload),
        }
      ).catch((e) =>
        console.warn("[Webhook → BuyerApp]", e)
      );
    }

    return NextResponse.json(updated);
  } catch (error) {
    console.error("[PATCH /api/shipments/:trackingId]", error);

    return NextResponse.json(
      { error: "Failed to update shipment status" },
      { status: 500 }
    );
  }
}