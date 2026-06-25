import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { fireShippingWebhooks, ShipmentStatus } from "@/lib/webhooks";

const NEXT_STATUS: Partial<Record<ShipmentStatus, ShipmentStatus>> = {
  LABEL_CREATED: "IN_TRANSIT",
  IN_TRANSIT: "DELIVERED",
};

// ── GET /api/shipments/[trackingId] ───────────────────────────────────────────

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ trackingId: string }> }
) {
  // Auth: validate API key
  const apiKey = req.headers.get("x-api-key");
  const validKeys = [process.env.SELLER_API_KEY, process.env.BUYER_API_KEY, process.env.SUPERADMIN_API_KEY].filter(Boolean);
  if (!apiKey || !validKeys.includes(apiKey)) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const { trackingId } = await params;
  try {
    const shipment = await prisma.shipment.findUnique({
      where: { trackingId },
      include: { events: { orderBy: { timestamp: "asc" } } },
    });

    if (!shipment) {
      return NextResponse.json(
        { error: "Shipment not found." },
        { status: 404 }
      );
    }

    return NextResponse.json(shipment);
  } catch (error) {
    console.error("[GET /api/shipments/:id]", error);
    return NextResponse.json(
      { error: "Failed to fetch shipment." },
      { status: 500 }
    );
  }
}

// ── PATCH /api/shipments/[trackingId] ─────────────────────────────────────────
// Advances the status one step forward only (LABEL_CREATED → IN_TRANSIT → DELIVERED).
// Fires webhooks to Buyer App and Seller App after the DB update.
// Body: { location: string }
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ trackingId: string }> }
) {
  // Auth: validate API key
  const apiKey = req.headers.get("x-api-key");
  const validKeys = [process.env.SHIPPING_API_KEY, process.env.COURIER_API_KEY, process.env.SUPERADMIN_API_KEY].filter(Boolean);
  if (!apiKey || !validKeys.includes(apiKey)) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const { trackingId } = await params;
  try {
    const body = await req.json();
    const { location } = body;

    if (!location) {
      return NextResponse.json(
        { error: "location is required." },
        { status: 400 }
      );
    }

    const existing = await prisma.shipment.findUnique({
      where: { trackingId },
    });

    if (!existing) {
      return NextResponse.json(
        { error: "Shipment not found." },
        { status: 404 }
      );
    }

    const nextStatus = NEXT_STATUS[existing.status as ShipmentStatus];

    if (!nextStatus) {
      return NextResponse.json(
        {
          error:
            "Shipment is already in its final status (DELIVERED). Status cannot go backwards.",
        },
        { status: 409 }
      );
    }

    const updated = await prisma.shipment.update({
      where: { trackingId },
      data: {
        status: nextStatus,
        events: {
          create: {
            statusUpdate: nextStatus,
            location,
          },
        },
      },
      include: { events: { orderBy: { timestamp: "asc" } } },
    });

    fireShippingWebhooks(updated.externalSellerOrderId, {
      trackingId: updated.trackingId,
      courier: updated.courier,
      status: nextStatus,
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("[PATCH /api/shipments/:id]", error);
    return NextResponse.json(
      { error: "Failed to advance shipment status." },
      { status: 500 }
    );
  }
}

// ── DELETE /api/shipments/[trackingId] ────────────────────────────────────────

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ trackingId: string }> }
  ) {
  const apiKey = req.headers.get("x-api-key");
  const validKeys = [
    process.env.SHIPPING_API_KEY,
    process.env.SUPERADMIN_API_KEY,
  ].filter(Boolean);
  if (!apiKey || !validKeys.includes(apiKey)) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const { trackingId } = await params;
  try {
    const existing = await prisma.shipment.findUnique({
      where: { trackingId },
    });

    if (!existing) {
      return NextResponse.json(
        { error: "Shipment not found." },
        { status: 404 }
      );
    }

    // ShipmentEvents are cascade-deleted by the schema (onDelete: Cascade)
    await prisma.shipment.delete({ where: { trackingId } });

    return NextResponse.json({ success: true, trackingId });
  } catch (error) {
    console.error("[DELETE /api/shipments/:id]", error);
    return NextResponse.json(
      { error: "Failed to delete shipment." },
      { status: 500 }
    );
  }
}