
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
    const {
      sellerOrderId,
      sellerId,
      buyerAddress,
      originAddress,
      courier,
      externalTrackingId,
    } = body;
 
    if (!sellerOrderId || !buyerAddress || !originAddress || !courier) {
      return NextResponse.json(
        {
          error:
            "Missing required fields: sellerOrderId, buyerAddress, originAddress, courier",
        },
        { status: 400 }
      );
    }
 
    if (!externalTrackingId) {
      return NextResponse.json(
        { error: "Missing required field: externalTrackingId" },
        { status: 400 }
      );
    }
 
    // Accepted but unused — kept for compatibility with Payments App contract
    void sellerId;
 
    const trackingId = generateTrackingId();
    const generatedLabelUrl =
    `https://proyecto-c-shipping-compulibre.vercel.app/track/${encodeURIComponent(trackingId)}`;
 
    const shipment = await prisma.shipment.create({
      data: {
        trackingId,
        externalTrackingId,
        externalSellerOrderId: sellerOrderId,
        courier,
        originAddress,
        destinationAddress: buyerAddress,
        status: ShipmentStatus.LABEL_CREATED,
        labelUrl: generatedLabelUrl,
        events: {
          create: {
            statusUpdate: ShipmentStatus.LABEL_CREATED,
            location: originAddress,
          },
        },
      },
      include: { events: true },
    });
 
    // Register with external courier status-change listener.
    // If this fails the shipment is still valid — caller receives a warning.
    let webhookWarning: string | undefined;
    try {
      const webhookUrl = `${process.env.NEXT_PUBLIC_APP_URL}/api/shipments/update`;;
      const courierBase = process.env.COURIER_LISTENER_URL?.replace(/\/$/, "");
      console.log("COURIER:", process.env.COURIER_LISTENER_URL);
      console.log("APP:", process.env.NEXT_PUBLIC_APP_URL);
      console.log("REGISTER URL:", `${courierBase}/register`);
      console.log("CALLBACK URL:", webhookUrl);
    const webhookRes = await fetch(
    `${courierBase}/register`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
      externalTrackingId,
      callbackUrl: webhookUrl,
    }),
  }
);
 
      if (!webhookRes.ok) {
        const text = await webhookRes.text();
        console.warn(
          "[POST /api/shipments] Webhook registration non-2xx:",
          webhookRes.status,
          text
        );
        webhookWarning =
          "Shipment created but status-change listener registration failed. Updates may not be received automatically.";
      }
    } catch (webhookError) {
      console.warn(
        "[POST /api/shipments] Webhook registration threw:",
        webhookError
      );
      webhookWarning =
        "Shipment created but status-change listener could not be reached. Updates may not be received automatically.";
    }
 
    const response = {
      trackingId: shipment.trackingId,
      externalTrackingId: shipment.externalTrackingId,
      status: shipment.status,
      courier: shipment.courier,
      labelUrl: shipment.labelUrl,
      ...(webhookWarning ? { warning: webhookWarning } : {}),
    };
 
    return NextResponse.json(response, { status: 201 });
  } catch (error) {
    console.error("[POST /api/shipments]", error);
    return NextResponse.json(
      { error: "Failed to create shipment" },
      { status: 500 }
    );
  }
}