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
  const body = JSON.stringify(payload);
  const headers = { "Content-Type": "application/json" };
  const calls: Promise<void>[] = [];

  // ── Buyer App ──────────────────────────────────────────────────────────────
  // POST /api/orders/:sellerOrderId/shipping-webhook
  if (BUYER_APP_URL) {
    const url = 
    `${BUYER_APP_URL}/api/orders/${sellerOrderId}/shipping-webhook`;
    calls.push(
      fetch(url, { method: "POST", headers, body })
        .then(async (res) => {
          if (!res.ok) {
            const text = await res.text().catch(() => "(no body)");
            console.error(
              `[webhook] Buyer App returned ${res.status} for seller order ${sellerOrderId}: ${text}`
            );
          } else {
            console.info(
              `[webhook] Buyer App successfully processed webhook for seller order ${sellerOrderId}. ${BUYER_APP_URL}`
            );
          }
        }
      
      )
        .catch((err) => {
          console.error(
            `[webhook] Failed to reach Buyer App for seller order ${sellerOrderId}:`,
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
    calls.push(
      fetch(url, { method: "POST", headers, body })
        .then(async (res) => {
          if (!res.ok) {
            const text = await res.text().catch(() => "(no body)");
            console.error(
              `[webhook] Seller App returned ${res.status} for seller order ${sellerOrderId}: ${text}`
            );
          } else {
            console.info(
              `[webhook] Seller App successfully processed webhook for seller order ${sellerOrderId}. ${SELLER_APP_URL}`
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
