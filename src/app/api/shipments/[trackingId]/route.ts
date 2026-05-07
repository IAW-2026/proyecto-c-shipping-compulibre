// app/api/shipments/[trackingId]/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ trackingId: string }> }
) {
  const { trackingId } = await params

  const shipment = await prisma.shipment.findUnique({
    where: { trackingId },
    include: {
      events: {
        orderBy: { timestamp: 'asc' },
      },
    },
  })

  if (!shipment) {
    return NextResponse.json(
      { error: 'Envío no encontrado' },
      { status: 404 }
    )
  }

  return NextResponse.json(shipment)
}
