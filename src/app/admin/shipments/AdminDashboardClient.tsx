"use client";

import { useEffect, useState, useCallback } from "react";
import { useAuth } from "@clerk/nextjs";

import type { Shipment, ShipmentStatus } from "./types";
import { STATUS_LABELS } from "./constants";
import { ShipmentRow } from "./ShipmentRow";
import { CreateModal, type CreateShipmentData } from "./CreateModal";

import "./dashboard.css";

// ─── Types ────────────────────────────────────────────────────────────────────

type ToastType = "success" | "error" | "warning";

interface Toast {
  msg: string;
  type: ToastType;
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function AdminDashboardClient({
  displayName,
}: {
  displayName: string;
}) {
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
  const [toast, setToast] = useState<Toast | null>(null);

  function showToast(msg: string, type: ToastType = "success") {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 4000);
  }

  const loadShipments = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/shipments");
      if (!res.ok) throw new Error("Failed to load");
      setShipments(await res.json());
    } catch {
      setError("Could not load shipments. Check your database connection.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadShipments();
  }, [loadShipments]);

  // ─── Handlers ──────────────────────────────────────────────────────────────

  async function handleAdvance(trackingId: string) {
    const shipment = shipments.find((s) => s.trackingId === trackingId);
    const location =
      shipment?.status === "IN_TRANSIT"
        ? shipment.destinationAddress
        : "En camino";

    try {
      const res = await fetch(`/api/shipments/${trackingId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": process.env.NEXT_PUBLIC_SHIPPING_API_KEY ?? "",
        },
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
      const res = await fetch(`/api/shipments/${trackingId}`, {
        method: "DELETE",
      });
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

  async function handleCreate(data: CreateShipmentData) {
    try {
      const res = await fetch("/api/shipments", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          // API key is public — this function is only used in the admin context.
          "x-api-key": process.env.NEXT_PUBLIC_SHIPPING_API_KEY ?? "",
        },
        body: JSON.stringify(data),
      });

      if (!res.ok) {
        const d = await res.json();
        showToast(d.error ?? "Failed to create", "error");
        return;
      }

      const created = await res.json();
      setShowCreate(false);
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

  // ─── Derived data ───────────────────────────────────────────────────────────

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

  const counts = {
    ALL: shipments.length,
    LABEL_CREATED: shipments.filter((s) => s.status === "LABEL_CREATED").length,
    IN_TRANSIT: shipments.filter((s) => s.status === "IN_TRANSIT").length,
    DELIVERED: shipments.filter((s) => s.status === "DELIVERED").length,
  };

  const STAT_TABS = [
    { key: "ALL" as const, label: "All Shipments", color: "#f8fafc" },
    { key: "LABEL_CREATED" as const, label: STATUS_LABELS.LABEL_CREATED, color: "#f59e0b" },
    { key: "IN_TRANSIT" as const, label: STATUS_LABELS.IN_TRANSIT, color: "#3b82f6" },
    { key: "DELIVERED" as const, label: STATUS_LABELS.DELIVERED, color: "#10b981" },
  ];

  // ─── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="dashboard-root">
      {/* Header */}
      <div className="header">
        <div className="header-inner">
          <div className="header-brand">
            <div className="header-logo">📦</div>
            <div>
              <div className="header-brand-name">CompuLibre</div>
              <div className="header-brand-sub">Shipping Admin</div>
            </div>
          </div>

          <div className="header-actions">
            <div className="user-pill">
              <div className="user-pill-dot" />
              {displayName.toUpperCase()}
            </div>
            <button
              className="btn-signout"
              onClick={() => signOut({ redirectUrl: "/sign-in" })}
            >
              SIGN OUT
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="content">
        {/* Stats row */}
        <div className="stats-grid">
          {STAT_TABS.map(({ key, label, color }) => (
            <button
              key={key}
              className={`stat-card${filter === key ? " active" : ""}`}
              onClick={() => setFilter(key)}
            >
              <div className="stat-number" style={{ color }}>
                {counts[key]}
              </div>
              <div className="stat-label">{label}</div>
            </button>
          ))}
        </div>

        {/* Toolbar */}
        <div className="toolbar">
          <input
            className="search-input"
            placeholder="Search tracking ID, courier ID, order, courier, address…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <button className="btn-new" onClick={() => setShowCreate(true)}>
            + New Shipment
          </button>
          <button className="btn-refresh" onClick={loadShipments} title="Refresh">
            ↺
          </button>
        </div>

        {/* List */}
        {loading ? (
          <div className="state-loading">
            <div className="state-loading-icon">⟳</div>
            <div className="state-loading-label">Loading shipments…</div>
          </div>
        ) : error ? (
          <div className="state-error">{error}</div>
        ) : filtered.length === 0 ? (
          <div className="state-empty">
            <div className="state-empty-icon">📭</div>
            <div className="state-empty-text">
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
                onExpand={(id) =>
                  setExpandedId((prev) => (prev === id ? null : id))
                }
                expanded={expandedId === s.trackingId}
              />
            ))}
          </div>
        )}
      </div>

      {/* Create modal */}
      {showCreate && (
        <CreateModal onClose={() => setShowCreate(false)} onCreate={handleCreate} />
      )}

      {/* Toast */}
      {toast && (
        <div className={`toast toast--${toast.type}`}>{toast.msg}</div>
      )}
    </div>
  );
}