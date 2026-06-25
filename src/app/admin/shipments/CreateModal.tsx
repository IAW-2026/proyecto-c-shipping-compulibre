import { useState } from "react";

const COURIERS = ["Andreani", "OCA", "Correo Argentino", "Urbano", "DHL"];

export interface CreateShipmentData {
  sellerOrderId: string;
  externalTrackingId: string;
  courier: string;
  originAddress: string;
  buyerAddress: string;
  labelUrl?: string;
  externalBuyerOrder: string;
  externalSellerId: string;
}

interface CreateModalProps {
  onClose: () => void;
  onCreate: (data: CreateShipmentData) => void;
}

export function CreateModal({ onClose, onCreate }: CreateModalProps) {
  const [form, setForm] = useState({
    sellerOrderId: "",
    externalTrackingId: "",
    courier: COURIERS[0],
    originAddress: "",
    buyerAddress: "",
    labelUrl: "",
    externalBuyerOrder: "",
    externalSellerId: "",
  });
  const [error, setError] = useState("");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (
      !form.sellerOrderId.trim() ||
      !form.externalTrackingId.trim() ||
      !form.originAddress.trim() ||
      !form.buyerAddress.trim()
    ) {
      setError(
        "Seller Order ID, Courier Tracking ID, Origin Address, and Destination Address are required."
      );
      return;
    }
    onCreate({
      sellerOrderId: form.sellerOrderId.trim(),
      externalTrackingId: form.externalTrackingId.trim(),
      courier: form.courier,
      originAddress: form.originAddress.trim(),
      buyerAddress: form.buyerAddress.trim(),
      labelUrl: form.labelUrl.trim() || undefined,
      externalBuyerOrder: form.externalBuyerOrder.trim(),
      externalSellerId: form.externalSellerId.trim(),
    });
  }

  function set(field: keyof typeof form) {
    return (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
      setForm((f) => ({ ...f, [field]: e.target.value }));
  }

  return (
    <div
      className="modal-overlay"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="modal-box">
        <h2 className="modal-title">New Shipment</h2>

        <form className="modal-form" onSubmit={handleSubmit}>
          <div>
            <label className="form-label">Seller Order ID *</label>
            <input
              className="form-input"
              placeholder="sell_ord_888"
              value={form.sellerOrderId}
              onChange={set("sellerOrderId")}
            />
          </div>

          <div>
            <label className="form-label">Courier Tracking ID *</label>
            <input
              className="form-input"
              placeholder="ANDREANI-00123456"
              value={form.externalTrackingId}
              onChange={set("externalTrackingId")}
            />
            <div className="form-hint">
              The tracking ID provided by the courier for status updates.
            </div>
          </div>

          <div>
            <label className="form-label">Courier *</label>
            <select className="form-select" value={form.courier} onChange={set("courier")}>
              {COURIERS.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="form-label">Origin Address *</label>
            <input
              className="form-input"
              placeholder="Av. Siempreviva 742, Springfield"
              value={form.originAddress}
              onChange={set("originAddress")}
            />
          </div>

          <div>
            <label className="form-label">Destination Address *</label>
            <input
              className="form-input"
              placeholder="Av. Siempreviva 742, Springfield"
              value={form.buyerAddress}
              onChange={set("buyerAddress")}
            />
          </div>

          <div>
            <label className="form-label">Buyer Order ID</label>
            <input
              className="form-input"
              placeholder="buy_ord_123"
              value={form.externalBuyerOrder}
              onChange={set("externalBuyerOrder")}
            />
          </div>

          <div>
            <label className="form-label">Seller ID</label>
            <input
              className="form-input"
              placeholder="seller_456"
              value={form.externalSellerId}
              onChange={set("externalSellerId")}
            />
          </div>

          {error && <p className="form-error">{error}</p>}

          <div className="modal-actions">
            <button type="button" className="btn-cancel" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn-submit">
              Create Shipment
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
