import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { ShipmentStatus } from "@prisma/client";

export async function GET(req: NextRequest) {
  const apiKey = req.headers.get("x-api-key");
  if (!apiKey || apiKey !== process.env.ANALYTICS_API_KEY) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  try {
    const [completedDeliveries, pendingDeliveries] = await Promise.all([
      prisma.shipment.count({
        where: { status: ShipmentStatus.DELIVERED },
      }),
      prisma.shipment.count({
        where: { status: { in: [ShipmentStatus.LABEL_CREATED, ShipmentStatus.IN_TRANSIT] } },
      }),
    ]);

    return NextResponse.json({ completedDeliveries, pendingDeliveries });
  } catch (error) {
    console.error("[GET /api/analytics/summary]", error);
    return NextResponse.json(
      { error: "Failed to fetch analytics summary" },
      { status: 500 }
    );
  }
}