import { prisma } from "@/lib/prisma";

export type ShipmentStatus = "LABEL_CREATED" | "IN_TRANSIT" | "DELIVERED";

export interface ShippingWebhookPayload {
  trackingId: string;
  courier: string;
  status: ShipmentStatus;
}

const BUYER_APP_URL = process.env.BUYER_APP_URL?.replace(/\/$/, "") ?? "";
const SELLER_APP_URL = process.env.SELLER_APP_URL?.replace(/\/$/, "") ?? "";

export async function fireShippingWebhooks(
  sellerOrderId: string,
  payload: ShippingWebhookPayload
): Promise<void> {
  const shipment = await prisma.shipment.findFirst({
    where: { externalSellerOrderId: sellerOrderId },
    select: { externalBuyerOrderId: true, externalSellerId: true },  // ← updated field name
  });

  if (!shipment) {
    console.error(
      `[webhook] No shipment found for seller order ${sellerOrderId} — aborting webhooks.`
    );
    return;
  }

  const headers = { "Content-Type": "application/json" };
  const calls: Promise<void>[] = [];

  // ── Buyer App ──────────────────────────────────────────────────────────────
  // POST /api/orders/:buyerOrderId/shipping-webhook
  if (BUYER_APP_URL) {
    const buyerOrderId = shipment.externalBuyerOrderId;  // ← use as URL segment
    const url = `${BUYER_APP_URL}/api/orders/${buyerOrderId}/shipping-webhook`;
    const body = JSON.stringify(payload);  // ← no longer sending buyerId in body
    calls.push(
      fetch(url, { method: "POST", headers, body })
        .then(async (res) => {
          if (!res.ok) {
            const text = await res.text().catch(() => "(no body)");
            console.error(
              `[webhook] Buyer App returned ${res.status} for buyer order ${buyerOrderId}: ${text}`
            );
          }
        })
        .catch((err) => {
          console.error(
            `[webhook] Failed to reach Buyer App for buyer order ${buyerOrderId}:`,
            err
          );
        })
    );
  } else {
    console.warn("[webhook] BUYER_APP_URL is not set — skipping Buyer App webhook.");
  }

  // ── Seller App ─────────────────────────────────────────────────────────────
  // POST /api/seller-orders/:sellerOrderId/shipping-webhook
  if (SELLER_APP_URL) {
    const url = `${SELLER_APP_URL}/api/seller-orders/${sellerOrderId}/shipping-webhook`;
    const body = JSON.stringify({ ...payload, sellerId: shipment.externalSellerId });
    calls.push(
      fetch(url, { method: "POST", headers, body })
        .then(async (res) => {
          if (!res.ok) {
            const text = await res.text().catch(() => "(no body)");
            console.error(
              `[webhook] Seller App returned ${res.status} for seller order ${sellerOrderId}: ${text}`
            );
          }
        })
        .catch((err) => {
          console.error(
            `[webhook] Failed to reach Seller App for seller order ${sellerOrderId}:`,
            err
          );
        })
    );
  } else {
    console.warn("[webhook] SELLER_APP_URL is not set — skipping Seller App webhook.");
  }

  await Promise.allSettled(calls);
}