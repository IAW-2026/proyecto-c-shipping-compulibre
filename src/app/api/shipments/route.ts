import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { ShipmentStatus, Prisma } from "@prisma/client";

const PAGE_SIZE = 10;

function generateTrackingId(): string {
  const num = Math.floor(Math.random() * 90000) + 10000;
  return `TRK-COMPU-${num}`;
}

// GET /api/shipments?page=1&status=IN_TRANSIT&q=TRK-COMPU
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = req.nextUrl;
    const page   = Math.max(1, parseInt(searchParams.get("page")  ?? "1", 10));
    const status = searchParams.get("status") as ShipmentStatus | null;
    const q      = searchParams.get("q")?.trim() ?? "";

    // Build the where clause
    const where: Prisma.ShipmentWhereInput = {};

    if (status && Object.values(ShipmentStatus).includes(status)) {
      where.status = status;
    }

    if (q) {
      where.OR = [
        { trackingId:             { contains: q, mode: "insensitive" } },
        { externalTrackingId:     { contains: q, mode: "insensitive" } },
        { externalSellerOrderId:  { contains: q, mode: "insensitive" } },
        { courier:                { contains: q, mode: "insensitive" } },
        { destinationAddress:     { contains: q, mode: "insensitive" } },
      ];
    }

    // Run count + page fetch in parallel
    const [total, shipments] = await Promise.all([
      prisma.shipment.count({ where }),
      prisma.shipment.findMany({
        where,
        include: {
          events: { orderBy: { timestamp: "desc" } },
        },
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * PAGE_SIZE,
        take: PAGE_SIZE,
      }),
    ]);

    // Status counts are always unfiltered by search/status so stat cards stay accurate
    const [labelCreated, inTransit, delivered] = await Promise.all([
      prisma.shipment.count({ where: { status: ShipmentStatus.LABEL_CREATED } }),
      prisma.shipment.count({ where: { status: ShipmentStatus.IN_TRANSIT } }),
      prisma.shipment.count({ where: { status: ShipmentStatus.DELIVERED } }),
    ]);

    return NextResponse.json({
      shipments,
      pagination: {
        page,
        pageSize: PAGE_SIZE,
        total,
        totalPages: Math.ceil(total / PAGE_SIZE),
      },
      counts: {
        ALL: labelCreated + inTransit + delivered,
        LABEL_CREATED: labelCreated,
        IN_TRANSIT: inTransit,
        DELIVERED: delivered,
      },
    });
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
  // Auth: validate API key
  const apiKey = req.headers.get("x-api-key");
  const validKeys = [process.env.SELLER_API_KEY, process.env.SHIPPING_API_KEY].filter(Boolean);
  if (!apiKey || !validKeys.includes(apiKey)) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  try {
    const body = await req.json();
    const {
      sellerOrderId,
      externalSellerId,
      externalBuyerOrder,
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

    const trackingId = generateTrackingId();
    const generatedLabelUrl =
      `https://proyecto-c-shipping-compulibre.vercel.app/track/${encodeURIComponent(trackingId)}`;

    const shipment = await prisma.shipment.create({
      data: {
        trackingId,
        externalTrackingId,
        externalSellerOrderId: sellerOrderId,
        externalSellerId: externalSellerId ?? "",
        externalBuyerOrderId: externalBuyerOrder ?? "",
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
    let webhookWarning: string | undefined;
    try {
      const webhookUrl = `${process.env.NEXT_PUBLIC_APP_URL}/api/shipments/update`;
      const courierBase = process.env.COURIER_LISTENER_URL?.replace(/\/$/, "");
      const webhookRes = await fetch(`${courierBase}/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ externalTrackingId, callbackUrl: webhookUrl }),
      });

      if (!webhookRes.ok) {
        const text = await webhookRes.text();
        console.warn("[POST /api/shipments] Webhook registration non-2xx:", webhookRes.status, text);
        webhookWarning =
          "Shipment created but status-change listener registration failed. Updates may not be received automatically.";
      }
    } catch (webhookError) {
      console.warn("[POST /api/shipments] Webhook registration threw:", webhookError);
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