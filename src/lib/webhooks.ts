export type ShipmentStatus =
  | "LABEL_CREATED"
  | "IN_TRANSIT"
  | "DELIVERED";

export interface ShippingWebhookPayload {
  trackingId: string;
  courier: string;
  status: ShipmentStatus;
}

async function sendWebhook(
  url: string,
  body: string,
  headers: HeadersInit,
  label: string
): Promise<void> {
  const MAX_RETRIES = 3;

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    const controller = new AbortController();

    const timeout = setTimeout(() => {
      controller.abort();
    }, 10000);

    try {
      console.log(`[webhook] Sending to ${label}: ${url}`);

      const res = await fetch(url, {
        method: "POST",
        headers,
        body,
        signal: controller.signal,
      });

      clearTimeout(timeout);

      if (!res.ok) {
        const text = await res.text().catch(() => "(no body)");

        console.error(
          `[webhook] ${label} returned ${res.status}: ${text}`
        );

        // Retry on server errors
        if (res.status >= 500 && attempt < MAX_RETRIES) {
          console.log(
            `[webhook] Retrying ${label} (${attempt}/${MAX_RETRIES})...`
          );

          await new Promise((resolve) => setTimeout(resolve, 1000));
          continue;
        }

        return;
      }

      console.info(`[webhook] ${label} successfully processed webhook.`);
      return;

    } catch (err) {
      clearTimeout(timeout);

      console.error(
        `[webhook] ${label} failed on attempt ${attempt}:`,
        err
      );

      if (attempt < MAX_RETRIES) {
        await new Promise((resolve) => setTimeout(resolve, 1000));
      }
    }
  }

  console.error(`[webhook] ${label} failed after all retries.`);
}

export async function fireShippingWebhooks(
  sellerOrderId: string,
  payload: ShippingWebhookPayload
): Promise<void> {

  // Read env vars INSIDE the function
  const BUYER_APP_URL =
    process.env.BUYER_APP_URL?.replace(/\/$/, "") ?? "";

  const SELLER_APP_URL =
    process.env.SELLER_APP_URL?.replace(/\/$/, "") ?? "";

  console.log("[webhook] BUYER_APP_URL:", BUYER_APP_URL);
  console.log("[webhook] SELLER_APP_URL:", SELLER_APP_URL);

  const body = JSON.stringify(payload);

  const headers = {
    "Content-Type": "application/json",
  };

  const calls: Promise<void>[] = [];

  // ── Buyer App ─────────────────────────────────────────────
  if (BUYER_APP_URL) {
    const url =
      `${BUYER_APP_URL}/api/orders/${sellerOrderId}/shipping-webhook`;

    calls.push(
      sendWebhook(
        url,
        body,
        headers,
        "Buyer App"
      )
    );
  } else {
    console.warn(
      "[webhook] BUYER_APP_URL is not set — skipping Buyer App webhook."
    );
  }

  // ── Seller App ────────────────────────────────────────────
  if (SELLER_APP_URL) {
    const url =
      `${SELLER_APP_URL}/api/seller-orders/${sellerOrderId}/shipping-webhook`;

    calls.push(
      sendWebhook(
        url,
        body,
        headers,
        "Seller App"
      )
    );
  } else {
    console.warn(
      "[webhook] SELLER_APP_URL is not set — skipping Seller App webhook."
    );
  }

  await Promise.allSettled(calls);
}