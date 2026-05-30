"use client";

import { useEffect, useState, useCallback } from "react";
import { useAuth } from "@clerk/nextjs";

// ─── Types ────────────────────────────────────────────────────────────────────

type ShipmentStatus = "LABEL_CREATED" | "IN_TRANSIT" | "DELIVERED";

interface ShipmentEvent {
  id: string;
  trackingId: string;
  statusUpdate: ShipmentStatus;
  location: string;
  timestamp: string;
}

interface Shipment {
  trackingId: string;
  externalTrackingId: string;
  externalSellerOrderId: string;
  courier: string;
  originAddress: string;
  destinationAddress: string;
  status: ShipmentStatus;
  labelUrl: string | null;
  createdAt: string;
  updatedAt: string;
  events: ShipmentEvent[];
}

// ─── Constants ────────────────────────────────────────────────────────────────

const STATUS_LABELS: Record<ShipmentStatus, string> = {
  LABEL_CREATED: "Label Created",
  IN_TRANSIT: "In Transit",
  DELIVERED: "Delivered",
};

const STATUS_COLORS: Record<ShipmentStatus, string> = {
  LABEL_CREATED: "#f59e0b",
  IN_TRANSIT: "#3b82f6",
  DELIVERED: "#10b981",
};

const NEXT_STATUS: Record<ShipmentStatus, ShipmentStatus | null> = {
  LABEL_CREATED: "IN_TRANSIT",
  IN_TRANSIT: "DELIVERED",
  DELIVERED: null,
};

const NEXT_LABEL: Record<ShipmentStatus, string | null> = {
  LABEL_CREATED: "Mark In Transit →",
  IN_TRANSIT: "Mark Delivered →",
  DELIVERED: null,
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmt(dateStr: string) {
  return new Date(dateStr).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

// ─── Components ───────────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: ShipmentStatus }) {
  return (
    <span
      style={{
        background: STATUS_COLORS[status] + "22",
        color: STATUS_COLORS[status],
        border: `1px solid ${STATUS_COLORS[status]}55`,
        padding: "2px 10px",
        borderRadius: 999,
        fontSize: 11,
        fontWeight: 700,
        letterSpacing: "0.08em",
        textTransform: "uppercase",
        fontFamily: "var(--font-mono)",
        whiteSpace: "nowrap",
      }}
    >
      {STATUS_LABELS[status]}
    </span>
  );
}

function StatusTimeline({ events }: { events: ShipmentEvent[] }) {
  const steps: ShipmentStatus[] = ["LABEL_CREATED", "IN_TRANSIT", "DELIVERED"];
  const reached = new Set(events.map((e) => e.statusUpdate));
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 0, margin: "10px 0 4px" }}>
      {steps.map((s, i) => (
        <div key={s} style={{ display: "flex", alignItems: "center", flex: i < steps.length - 1 ? 1 : "none" }}>
          <div
            style={{
              width: 10,
              height: 10,
              borderRadius: "50%",
              background: reached.has(s) ? STATUS_COLORS[s] : "#334155",
              border: `2px solid ${reached.has(s) ? STATUS_COLORS[s] : "#475569"}`,
              flexShrink: 0,
              transition: "background 0.3s",
            }}
          />
          {i < steps.length - 1 && (
            <div
              style={{
                flex: 1,
                height: 2,
                background: reached.has(steps[i + 1]) ? "#3b82f6" : "#334155",
                transition: "background 0.3s",
              }}
            />
          )}
        </div>
      ))}
    </div>
  );
}

function ShipmentRow({
  shipment,
  onAdvance,
  onDelete,
  onExpand,
  expanded,
}: {
  shipment: Shipment;
  onAdvance: (id: string) => void;
  onDelete: (id: string) => void;
  onExpand: (id: string) => void;
  expanded: boolean;
}) {
  const nextLabel = NEXT_LABEL[shipment.status];

  return (
    <div
      style={{
        background: "#0f172a",
        border: "1px solid #1e293b",
        borderRadius: 12,
        marginBottom: 12,
        overflow: "hidden",
        transition: "border-color 0.2s",
      }}
      onMouseEnter={(e) =>
        ((e.currentTarget as HTMLDivElement).style.borderColor = "#334155")
      }
      onMouseLeave={(e) =>
        ((e.currentTarget as HTMLDivElement).style.borderColor = "#1e293b")
      }
    >
      {/* Main row */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr 1fr auto auto auto",
          gap: 16,
          alignItems: "center",
          padding: "14px 20px",
        }}
      >
        {/* Tracking IDs */}
        <div>
          <div style={{ fontSize: 10, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 2, fontFamily: "var(--font-mono)" }}>
            Tracking ID
          </div>
          <div style={{ fontSize: 13, color: "#f8fafc", fontFamily: "var(--font-mono)", fontWeight: 600 }}>
            {shipment.trackingId}
          </div>
          <div style={{ fontSize: 11, color: "#475569", marginTop: 2, fontFamily: "var(--font-mono)" }}>
            ext: {shipment.externalTrackingId}
          </div>
          <div style={{ fontSize: 11, color: "#475569", marginTop: 1 }}>
            Order: {shipment.externalSellerOrderId}
          </div>
        </div>

        {/* Courier + status */}
        <div>
          <div style={{ fontSize: 10, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 4, fontFamily: "var(--font-mono)" }}>
            Courier
          </div>
          <div style={{ fontSize: 13, color: "#e2e8f0", marginBottom: 6 }}>{shipment.courier}</div>
          <StatusBadge status={shipment.status} />
        </div>

        {/* Addresses */}
        <div>
          <div style={{ fontSize: 11, color: "#64748b", marginBottom: 2 }}>
            <span style={{ color: "#94a3b8" }}>From: </span>
            {shipment.originAddress}
          </div>
          <div style={{ fontSize: 11, color: "#64748b" }}>
            <span style={{ color: "#94a3b8" }}>To: </span>
            {shipment.destinationAddress}
          </div>
        </div>

        {/* Advance status */}
        <div>
          {nextLabel ? (
            <button
              onClick={() => onAdvance(shipment.trackingId)}
              style={{
                background: "transparent",
                border: "1px solid #3b82f6",
                color: "#60a5fa",
                padding: "6px 14px",
                borderRadius: 8,
                fontSize: 12,
                cursor: "pointer",
                fontFamily: "var(--font-mono)",
                fontWeight: 600,
                whiteSpace: "nowrap",
                transition: "background 0.15s",
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLButtonElement).style.background = "#1d4ed822";
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLButtonElement).style.background = "transparent";
              }}
            >
              {nextLabel}
            </button>
          ) : (
            <span style={{ fontSize: 11, color: "#10b981", fontFamily: "var(--font-mono)" }}>
              ✓ Final
            </span>
          )}
        </div>

        {/* Expand */}
        <button
          onClick={() => onExpand(shipment.trackingId)}
          title="View events"
          style={{
            background: "transparent",
            border: "1px solid #334155",
            color: "#94a3b8",
            width: 32,
            height: 32,
            borderRadius: 8,
            cursor: "pointer",
            fontSize: 14,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
          }}
        >
          {expanded ? "▲" : "▼"}
        </button>

        {/* Delete */}
        <button
          onClick={() => onDelete(shipment.trackingId)}
          title="Delete shipment"
          style={{
            background: "transparent",
            border: "1px solid #7f1d1d",
            color: "#f87171",
            width: 32,
            height: 32,
            borderRadius: 8,
            cursor: "pointer",
            fontSize: 14,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
          }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLButtonElement).style.background = "#7f1d1d33";
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLButtonElement).style.background = "transparent";
          }}
        >
          ✕
        </button>
      </div>

      {/* Timeline strip */}
      <div style={{ padding: "0 20px 10px" }}>
        <StatusTimeline events={shipment.events} />
      </div>

      {/* Expanded events */}
      {expanded && (
        <div
          style={{
            borderTop: "1px solid #1e293b",
            padding: "16px 20px",
            background: "#080f1a",
          }}
        >
          <div
            style={{
              fontSize: 10,
              color: "#64748b",
              textTransform: "uppercase",
              letterSpacing: "0.1em",
              marginBottom: 10,
              fontFamily: "var(--font-mono)",
            }}
          >
            Event History
          </div>
          {shipment.events.length === 0 ? (
            <p style={{ color: "#475569", fontSize: 13 }}>No events recorded.</p>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {[...shipment.events]
                .sort(
                  (a, b) =>
                    new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
                )
                .map((ev) => (
                  <div
                    key={ev.id}
                    style={{
                      display: "flex",
                      gap: 12,
                      alignItems: "flex-start",
                      fontSize: 12,
                    }}
                  >
                    <div
                      style={{
                        width: 8,
                        height: 8,
                        borderRadius: "50%",
                        background: STATUS_COLORS[ev.statusUpdate],
                        marginTop: 3,
                        flexShrink: 0,
                      }}
                    />
                    <div>
                      <StatusBadge status={ev.statusUpdate} />
                      <span style={{ color: "#94a3b8", marginLeft: 8 }}>
                        {ev.location}
                      </span>
                      <span style={{ color: "#475569", marginLeft: 8 }}>
                        {fmt(ev.timestamp)}
                      </span>
                    </div>
                  </div>
                ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Create Modal ─────────────────────────────────────────────────────────────

const COURIERS = ["Andreani", "OCA", "Correo Argentino", "Urbano", "DHL"];

function CreateModal({
  onClose,
  onCreate,
}: {
  onClose: () => void;
  onCreate: (data: {
    sellerOrderId: string;
    externalTrackingId: string;
    courier: string;
    originAddress: string;
    buyerAddress: string;
    labelUrl?: string;
    externalBuyerOrder: string;  // ← renamed
    externalSellerId: string;
  }) => void;
  }) {
  const [form, setForm] = useState({
    sellerOrderId: "",
    externalTrackingId: "",
    courier: COURIERS[0],
    originAddress: "",
    buyerAddress: "",
    labelUrl: "",
    externalBuyerOrder: "",  // ← renamed
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
      setError("Seller Order ID, Courier Tracking ID, Origin Address, and Destination Address are required.");
      return;
    }
    onCreate({
      sellerOrderId: form.sellerOrderId.trim(),
      externalTrackingId: form.externalTrackingId.trim(),
      courier: form.courier,
      originAddress: form.originAddress.trim(),
      buyerAddress: form.buyerAddress.trim(),
      labelUrl: form.labelUrl.trim() || undefined,
      externalBuyerOrder: form.externalBuyerOrder.trim(),  // ← renamed
      externalSellerId: form.externalSellerId.trim(),
    });
  }

  const inputStyle: React.CSSProperties = {
    width: "100%",
    background: "#0f172a",
    border: "1px solid #334155",
    borderRadius: 8,
    padding: "8px 12px",
    color: "#f8fafc",
    fontSize: 13,
    outline: "none",
    boxSizing: "border-box",
    fontFamily: "inherit",
  };

  const labelStyle: React.CSSProperties = {
    fontSize: 11,
    color: "#64748b",
    textTransform: "uppercase",
    letterSpacing: "0.08em",
    marginBottom: 4,
    display: "block",
    fontFamily: "var(--font-mono)",
  };

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "#00000099",
        backdropFilter: "blur(4px)",
        zIndex: 50,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        style={{
          background: "#0d1929",
          border: "1px solid #1e293b",
          borderRadius: 16,
          padding: 32,
          width: "100%",
          maxWidth: 480,
          boxShadow: "0 24px 64px #00000088",
        }}
      >
        <h2
          style={{
            margin: "0 0 24px",
            fontSize: 18,
            color: "#f8fafc",
            fontWeight: 700,
            letterSpacing: "-0.02em",
          }}
        >
          New Shipment
        </h2>

        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div>
            <label style={labelStyle}>Seller Order ID *</label>
            <input
              style={inputStyle}
              placeholder="sell_ord_888"
              value={form.sellerOrderId}
              onChange={(e) => setForm((f) => ({ ...f, sellerOrderId: e.target.value }))}
            />
          </div>

          <div>
            <label style={labelStyle}>Courier Tracking ID *</label>
            <input
              style={inputStyle}
              placeholder="ANDREANI-00123456"
              value={form.externalTrackingId}
              onChange={(e) => setForm((f) => ({ ...f, externalTrackingId: e.target.value }))}
            />
            <div style={{ fontSize: 11, color: "#475569", marginTop: 4 }}>
              The tracking ID provided by the courier for status updates.
            </div>
          </div>

          <div>
            <label style={labelStyle}>Courier *</label>
            <select
              style={{ ...inputStyle, cursor: "pointer" }}
              value={form.courier}
              onChange={(e) => setForm((f) => ({ ...f, courier: e.target.value }))}
            >
              {COURIERS.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label style={labelStyle}>Origin Address *</label>
            <input
              style={inputStyle}
              placeholder="Av. Siempreviva 742, Springfield"
              value={form.originAddress}
              onChange={(e) => setForm((f) => ({ ...f, originAddress: e.target.value }))}
            />
          </div>

          <div>
            <label style={labelStyle}>Destination Address *</label>
            <input
              style={inputStyle}
              placeholder="Av. Siempreviva 742, Springfield"
              value={form.buyerAddress}
              onChange={(e) => setForm((f) => ({ ...f, buyerAddress: e.target.value }))}
            />
          </div>
          <div>
            <label style={labelStyle}>Buyer Order ID</label>
            <input
              style={inputStyle}
              placeholder="buy_ord_123"                        
              value={form.externalBuyerOrder}              
              onChange={(e) => setForm((f) => ({ ...f, externalBuyerOrder: e.target.value }))}
            />
          </div>

<div>
  <label style={labelStyle}>Seller ID</label>
  <input
    style={inputStyle}
    placeholder="seller_456"
    value={form.externalSellerId}
    onChange={(e) => setForm((f) => ({ ...f, externalSellerId: e.target.value }))}
  />
</div>

          {error && (
            <p style={{ color: "#f87171", fontSize: 12, margin: 0 }}>{error}</p>
          )}

          <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", marginTop: 8 }}>
            <button
              type="button"
              onClick={onClose}
              style={{
                background: "transparent",
                border: "1px solid #334155",
                color: "#94a3b8",
                padding: "8px 20px",
                borderRadius: 8,
                cursor: "pointer",
                fontSize: 13,
              }}
            >
              Cancel
            </button>
            <button
              type="submit"
              style={{
                background: "#1d4ed8",
                border: "none",
                color: "#fff",
                padding: "8px 24px",
                borderRadius: 8,
                cursor: "pointer",
                fontSize: 13,
                fontWeight: 600,
              }}
            >
              Create Shipment
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function AdminDashboardClient({ displayName }: { displayName: string }) {
  const { signOut } = useAuth();

  // Sync AdminProfile row on first login (per 05-usuarios.md)
  useEffect(() => {
    fetch("/api/admin/sync-profile", { method: "POST" }).catch(() => {});
  }, []);

  const [shipments, setShipments] = useState<Shipment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [filter, setFilter] = useState<ShipmentStatus | "ALL">("ALL");
  const [search, setSearch] = useState("");
  const [toast, setToast] = useState<{ msg: string; type: "success" | "error" | "warning" } | null>(null);

  const showToast = (msg: string, type: "success" | "error" | "warning" = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 4000);
  };

  const loadShipments = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/shipments");
      if (!res.ok) throw new Error("Failed to load");
      const data = await res.json();
      setShipments(data);
    } catch {
      setError("Could not load shipments. Check your database connection.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadShipments();
  }, [loadShipments]);

  async function handleAdvance(trackingId: string) {
    const shipment = shipments.find((s) => s.trackingId === trackingId);
    const location = shipment?.status === "IN_TRANSIT" ? shipment.destinationAddress : "En camino";

    try {
      const res = await fetch(`/api/shipments/${trackingId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ location }),
      });
      if (!res.ok) {
        const d = await res.json();
        showToast(d.error ?? "Failed to advance status", "error");
        return;
      }
      const updated: Shipment = await res.json();
      setShipments((prev) =>
        prev.map((s) => (s.trackingId === trackingId ? updated : s))
      );
      showToast(`Status advanced → ${STATUS_LABELS[updated.status]}`);
    } catch {
      showToast("Network error", "error");
    }
  }

  async function handleDelete(trackingId: string) {
    if (!confirm(`Delete shipment ${trackingId}? This cannot be undone.`)) return;
    try {
      const res = await fetch(`/api/shipments/${trackingId}`, { method: "DELETE" });
      if (!res.ok) {
        showToast("Failed to delete shipment", "error");
        return;
      }
      setShipments((prev) => prev.filter((s) => s.trackingId !== trackingId));
      showToast(`Shipment ${trackingId} deleted`);
    } catch {
      showToast("Network error", "error");
    }
  }

  async function handleCreate(data: {
    sellerOrderId: string;
    externalTrackingId: string;
    courier: string;
    originAddress: string;
    buyerAddress: string;
    labelUrl?: string;
    externalBuyerOrder: string;
    externalSellerId: string;
  }) {
    try {
      const res = await fetch("/api/shipments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const d = await res.json();
        showToast(d.error ?? "Failed to create", "error");
        return;
      }
      const created = await res.json();
      setShowCreate(false);
      // Surface webhook warning if the API returned one
      if (created.warning) {
        showToast(`Created — ⚠ ${created.warning}`, "warning");
      } else {
        showToast("Shipment created successfully");
      }
      await loadShipments();
    } catch {
      showToast("Network error", "error");
    }
  }

  const filtered = shipments.filter((s) => {
    const matchStatus = filter === "ALL" || s.status === filter;
    const q = search.toLowerCase();
    const matchSearch =
      !q ||
      s.trackingId.toLowerCase().includes(q) ||
      s.externalTrackingId.toLowerCase().includes(q) ||
      s.externalSellerOrderId.toLowerCase().includes(q) ||
      s.courier.toLowerCase().includes(q) ||
      s.destinationAddress.toLowerCase().includes(q);
    return matchStatus && matchSearch;
  });

  // Stats
  const counts = {
    ALL: shipments.length,
    LABEL_CREATED: shipments.filter((s) => s.status === "LABEL_CREATED").length,
    IN_TRANSIT: shipments.filter((s) => s.status === "IN_TRANSIT").length,
    DELIVERED: shipments.filter((s) => s.status === "DELIVERED").length,
  };

  const toastColors = {
    success: { bg: "#052e16", border: "#166534", text: "#4ade80" },
    error:   { bg: "#1c0a0a", border: "#7f1d1d", text: "#f87171" },
    warning: { bg: "#1c1500", border: "#92400e", text: "#fbbf24" },
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Mono:wght@400;500&family=Sora:wght@400;600;700;800&display=swap');
        *, *::before, *::after { box-sizing: border-box; }
        body { margin: 0; background: #060d18; }
        :root { --font-mono: 'DM Mono', monospace; }
        ::-webkit-scrollbar { width: 6px; }
        ::-webkit-scrollbar-track { background: #0d1929; }
        ::-webkit-scrollbar-thumb { background: #334155; border-radius: 3px; }
        select option { background: #0f172a; }
      `}</style>

      <div
        style={{
          minHeight: "100vh",
          background: "#060d18",
          fontFamily: "'Sora', sans-serif",
          color: "#f8fafc",
          padding: "0 0 60px",
        }}
      >
        {/* Header */}
        <div
          style={{
            background: "#0d1929",
            borderBottom: "1px solid #1e293b",
            padding: "0 40px",
          }}
        >
          <div style={{ maxWidth: 1200, margin: "0 auto", display: "flex", alignItems: "center", justifyContent: "space-between", height: 64 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <div
                style={{
                  width: 32,
                  height: 32,
                  background: "linear-gradient(135deg, #1d4ed8, #3b82f6)",
                  borderRadius: 8,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 16,
                }}
              >
                📦
              </div>
              <div>
                <div style={{ fontSize: 15, fontWeight: 700, color: "#f8fafc", letterSpacing: "-0.02em" }}>
                  CompuLibre
                </div>
                <div style={{ fontSize: 10, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.1em", fontFamily: "var(--font-mono)" }}>
                  Shipping Admin
                </div>
              </div>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <div
                style={{
                  background: "#1e293b",
                  border: "1px solid #334155",
                  borderRadius: 20,
                  padding: "4px 14px",
                  fontSize: 11,
                  color: "#94a3b8",
                  fontFamily: "var(--font-mono)",
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                }}
              >
                <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#10b981" }} />
                {displayName.toUpperCase()}
              </div>
              <button
                onClick={() => signOut({ redirectUrl: "/sign-in" })}
                style={{
                  background: "transparent",
                  border: "1px solid #334155",
                  color: "#64748b",
                  padding: "4px 12px",
                  borderRadius: 20,
                  cursor: "pointer",
                  fontSize: 11,
                  fontFamily: "var(--font-mono)",
                  letterSpacing: "0.06em",
                  transition: "color 0.15s, border-color 0.15s",
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.color = "#f87171";
                  (e.currentTarget as HTMLButtonElement).style.borderColor = "#7f1d1d";
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.color = "#64748b";
                  (e.currentTarget as HTMLButtonElement).style.borderColor = "#334155";
                }}
              >
                SIGN OUT
              </button>
            </div>
          </div>
        </div>

        <div style={{ maxWidth: 1200, margin: "0 auto", padding: "32px 40px 0" }}>

          {/* Stats row */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12, marginBottom: 28 }}>
            {(["ALL", "LABEL_CREATED", "IN_TRANSIT", "DELIVERED"] as const).map((s) => (
              <button
                key={s}
                onClick={() => setFilter(s)}
                style={{
                  background: filter === s ? "#1e293b" : "#0d1929",
                  border: `1px solid ${filter === s ? "#3b82f6" : "#1e293b"}`,
                  borderRadius: 12,
                  padding: "14px 16px",
                  cursor: "pointer",
                  textAlign: "left",
                  transition: "border-color 0.2s, background 0.2s",
                }}
              >
                <div
                  style={{
                    fontSize: 24,
                    fontWeight: 800,
                    color: s === "ALL" ? "#f8fafc" : STATUS_COLORS[s],
                    letterSpacing: "-0.03em",
                    fontFamily: "'Sora', sans-serif",
                  }}
                >
                  {counts[s]}
                </div>
                <div
                  style={{
                    fontSize: 10,
                    color: "#64748b",
                    textTransform: "uppercase",
                    letterSpacing: "0.08em",
                    marginTop: 2,
                    fontFamily: "var(--font-mono)",
                  }}
                >
                  {s === "ALL" ? "All Shipments" : STATUS_LABELS[s]}
                </div>
              </button>
            ))}
          </div>

          {/* Toolbar */}
          <div style={{ display: "flex", gap: 12, alignItems: "center", marginBottom: 20 }}>
            <input
              placeholder="Search tracking ID, courier ID, order, courier, address…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{
                flex: 1,
                background: "#0d1929",
                border: "1px solid #1e293b",
                borderRadius: 10,
                padding: "9px 16px",
                color: "#f8fafc",
                fontSize: 13,
                outline: "none",
                fontFamily: "inherit",
              }}
            />
            <button
              onClick={() => setShowCreate(true)}
              style={{
                background: "#1d4ed8",
                border: "none",
                color: "#fff",
                padding: "9px 22px",
                borderRadius: 10,
                cursor: "pointer",
                fontSize: 13,
                fontWeight: 600,
                whiteSpace: "nowrap",
                display: "flex",
                alignItems: "center",
                gap: 6,
              }}
            >
              + New Shipment
            </button>
            <button
              onClick={loadShipments}
              title="Refresh"
              style={{
                background: "transparent",
                border: "1px solid #1e293b",
                color: "#94a3b8",
                padding: "9px 14px",
                borderRadius: 10,
                cursor: "pointer",
                fontSize: 14,
              }}
            >
              ↺
            </button>
          </div>

          {/* Content */}
          {loading ? (
            <div style={{ textAlign: "center", padding: "80px 0", color: "#475569" }}>
              <div style={{ fontSize: 32, marginBottom: 12 }}>⟳</div>
              <div style={{ fontFamily: "var(--font-mono)", fontSize: 12, textTransform: "uppercase", letterSpacing: "0.1em" }}>
                Loading shipments…
              </div>
            </div>
          ) : error ? (
            <div
              style={{
                background: "#1c0a0a",
                border: "1px solid #7f1d1d",
                borderRadius: 12,
                padding: 24,
                color: "#f87171",
                fontSize: 13,
              }}
            >
              {error}
            </div>
          ) : filtered.length === 0 ? (
            <div style={{ textAlign: "center", padding: "80px 0", color: "#334155" }}>
              <div style={{ fontSize: 48, marginBottom: 12 }}>📭</div>
              <div style={{ fontSize: 14, color: "#475569" }}>
                {shipments.length === 0
                  ? "No shipments yet. Create one to get started."
                  : "No shipments match your search or filter."}
              </div>
            </div>
          ) : (
            <div>
              {filtered.map((s) => (
                <ShipmentRow
                  key={s.trackingId}
                  shipment={s}
                  onAdvance={handleAdvance}
                  onDelete={handleDelete}
                  onExpand={(id) => setExpandedId((prev) => (prev === id ? null : id))}
                  expanded={expandedId === s.trackingId}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Create modal */}
      {showCreate && (
        <CreateModal onClose={() => setShowCreate(false)} onCreate={handleCreate} />
      )}

      {/* Toast */}
      {toast && (
        <div
          style={{
            position: "fixed",
            bottom: 24,
            right: 24,
            background: toastColors[toast.type].bg,
            border: `1px solid ${toastColors[toast.type].border}`,
            color: toastColors[toast.type].text,
            padding: "10px 20px",
            borderRadius: 10,
            fontSize: 13,
            fontFamily: "var(--font-mono)",
            zIndex: 100,
            animation: "fadeIn 0.2s ease",
            boxShadow: "0 8px 32px #00000066",
            maxWidth: 420,
          }}
        >
          {toast.msg}
        </div>
      )}
    </>
  );
}