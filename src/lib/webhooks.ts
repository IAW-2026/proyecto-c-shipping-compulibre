/**
 * lib/webhooks.ts
 *
 * Fires outbound shipping-status webhooks to Buyer App and Seller App
 * as specified in 02-responsabilidades.md and 03-apis.md.
 *
 * Both apps are keyed by sellerOrderId — the Buyer App listens on
 * POST /api/orders/:sellerOrderId/shipping-webhook because it already
 * knows the sellerOrderId from the order flow. No schema changes needed.
 *
 * Buyer App:  POST /api/orders/:sellerOrderId/shipping-webhook
 * Seller App: POST /api/seller-orders/:sellerOrderId/shipping-webhook
 *
 * Both calls are fire-and-forget: we await them with Promise.allSettled so
 * a downstream failure never breaks the Shipping App's own response.
 * Failures are logged to the console — wire up your preferred logger here.
 */

export type ShipmentStatus = "LABEL_CREATED" | "IN_TRANSIT" | "DELIVERED";

export interface ShippingWebhookPayload {
  trackingId: string;
  courier: string;
  status: ShipmentStatus;
}

const BUYER_APP_URL = process.env.BUYER_APP_URL?.replace(/\/$/, "") ?? "";
const SELLER_APP_URL = process.env.SELLER_APP_URL?.replace(/\/$/, "") ?? "";

/**
 * Sends shipping-status webhooks to Buyer App and Seller App.
 * Both use sellerOrderId as the order identifier in the URL.
 * Safe to call without await — internally uses Promise.allSettled.
 */
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
          }
        })
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
