import { NextRequest, NextResponse } from "next/server";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ trackingId: string }> }
) {
  const { trackingId } = await params;

  const res = await fetch(
    `${process.env.NEXT_PUBLIC_APP_URL}/api/shipments/${encodeURIComponent(trackingId)}`,
    {
      headers: {
        "x-api-key": process.env.BUYER_API_KEY ?? "",
      },
    }
  );

  const data = await res.json();
  return NextResponse.json(data, { status: res.status });
}