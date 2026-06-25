"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useAuth } from "@clerk/nextjs";

import type { Shipment, ShipmentStatus, Pagination, StatusCounts } from "./types";
import { STATUS_LABELS } from "./constants";
import { ShipmentRow } from "./ShipmentRow";
import { CreateModal, type CreateShipmentData } from "./CreateModal";

import "./dashboard.css";

// ─── Types ────────────────────────────────────────────────────────────────────

type ToastType = "success" | "error" | "warning";
interface Toast { msg: string; type: ToastType; }

const EMPTY_COUNTS: StatusCounts = { ALL: 0, LABEL_CREATED: 0, IN_TRANSIT: 0, DELIVERED: 0 };

// ─── Pagination bar ───────────────────────────────────────────────────────────

function PaginationBar({
  pagination,
  onPage,
}: {
  pagination: Pagination;
  onPage: (p: number) => void;
}) {
  const { page, limit, totalPages, total } = pagination;
  if (totalPages <= 1) return null;

  const from = (page - 1) * limit + 1;
  const to   = Math.min(page * limit, total);

  const pages: (number | "…")[] = [];
  const add = (n: number) => { if (!pages.includes(n)) pages.push(n); };

  add(1);
  if (page > 3) pages.push("…");
  if (page > 2) add(page - 1);
  add(page);
  if (page < totalPages - 1) add(page + 1);
  if (page < totalPages - 2) pages.push("…");
  add(totalPages);

  return (
    <div className="pagination">
      <span className="pagination-info">
        {from}–{to} of {total}
      </span>
      <div className="pagination-controls">
        <button
          className="pagination-btn"
          disabled={page === 1}
          onClick={() => onPage(page - 1)}
        >
          ←
        </button>

        {pages.map((p, i) =>
          p === "…" ? (
            <span key={`ellipsis-${i}`} className="pagination-ellipsis">…</span>
          ) : (
            <button
              key={p}
              className={`pagination-btn${p === page ? " pagination-btn--active" : ""}`}
              onClick={() => onPage(p as number)}
            >
              {p}
            </button>
          )
        )}

        <button
          className="pagination-btn"
          disabled={page === totalPages}
          onClick={() => onPage(page + 1)}
        >
          →
        </button>
      </div>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function AdminDashboardClient({ displayName }: { displayName: string }) {
  const { signOut } = useAuth();

  useEffect(() => {
    fetch("/api/admin/sync-profile", { method: "POST" }).catch(() => {});
  }, []);

  const [shipments, setShipments]   = useState<Shipment[]>([]);
  const [pagination, setPagination] = useState<Pagination>({ page: 1, limit: 10, total: 0, totalPages: 0 });
  const [counts, setCounts]         = useState<StatusCounts>(EMPTY_COUNTS);
  const [loading, setLoading]       = useState(true);
  const [error, setError]           = useState("");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [filter, setFilter]         = useState<ShipmentStatus | "ALL">("ALL");
  const [search, setSearch]         = useState("");
  const [page, setPage]             = useState(1);
  const [toast, setToast]           = useState<Toast | null>(null);

  // Debounce search so we don't fire on every keystroke
  const searchDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  function showToast(msg: string, type: ToastType = "success") {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 4000);
  }

  const loadShipments = useCallback(async (options?: { page?: number; status?: ShipmentStatus | "ALL"; q?: string }) => {
    const p      = options?.page   ?? page;
    const status = options?.status ?? filter;
    const q      = options?.q      ?? search;

    try {
      setLoading(true);
      const params = new URLSearchParams({ page: String(p) });
      if (status !== "ALL") params.set("status", status);
      if (q) params.set("q", q);

      const res = await fetch(`/api/shipments?${params}`, {
        headers: {
          "x-api-key": process.env.NEXT_PUBLIC_SHIPPING_API_KEY ?? "",
        },
      });
      if (!res.ok) throw new Error("Failed to load");
      const data = await res.json();

      setShipments(data.shipments);
      setPagination(data.pagination);
      setCounts(data.counts);
    } catch {
      setError("Could not load shipments. Check your database connection.");
    } finally {
      setLoading(false);
    }
  }, [page, filter, search]);

  // Initial load
  useEffect(() => { loadShipments(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Reload when page changes
  useEffect(() => { loadShipments({ page }); }, [page]); // eslint-disable-line react-hooks/exhaustive-deps

  function handleFilterChange(f: ShipmentStatus | "ALL") {
    setFilter(f);
    setPage(1);
    loadShipments({ page: 1, status: f });
  }

  function handleSearchChange(q: string) {
    setSearch(q);
    if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current);
    searchDebounceRef.current = setTimeout(() => {
      setPage(1);
      loadShipments({ page: 1, q });
    }, 350);
  }

  function handlePageChange(p: number) {
    setPage(p);
    // loadShipments fires via the page useEffect above
  }

  // ─── Handlers ──────────────────────────────────────────────────────────────

  async function handleAdvance(trackingId: string) {
    const shipment = shipments.find((s) => s.trackingId === trackingId);
    const location = shipment?.status === "IN_TRANSIT" ? shipment.destinationAddress : "En camino";

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
      setShipments((prev) => prev.map((s) => (s.trackingId === trackingId ? updated : s)));
      showToast(`Status advanced → ${STATUS_LABELS[updated.status]}`);
      // Refresh counts (a status changed)
      loadShipments({ page });
    } catch {
      showToast("Network error", "error");
    }
  }

async function handleDelete(trackingId: string) {
  if (!confirm(`Delete shipment ${trackingId}? This cannot be undone.`)) return;
  try {
    const res = await fetch(`/api/shipments/${trackingId}`, {
      method: "DELETE",
      headers: {
        "x-api-key": process.env.NEXT_PUBLIC_SHIPPING_API_KEY ?? "",
      },
    });
    if (!res.ok) { showToast("Failed to delete shipment", "error"); return; }

    showToast(`Shipment ${trackingId} deleted`);
    const newPage = shipments.length === 1 && page > 1 ? page - 1 : page;
    setPage(newPage);
    loadShipments({ page: newPage });
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
      // New shipments land on page 1 (newest first)
      setPage(1);
      loadShipments({ page: 1 });
    } catch {
      showToast("Network error", "error");
    }
  }

  // ─── Derived ────────────────────────────────────────────────────────────────

  const STAT_TABS = [
    { key: "ALL"           as const, label: "All Shipments",            color: "#f8fafc" },
    { key: "LABEL_CREATED" as const, label: STATUS_LABELS.LABEL_CREATED, color: "#f59e0b" },
    { key: "IN_TRANSIT"    as const, label: STATUS_LABELS.IN_TRANSIT,    color: "#3b82f6" },
    { key: "DELIVERED"     as const, label: STATUS_LABELS.DELIVERED,     color: "#10b981" },
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
            <button className="btn-signout" onClick={() => signOut({ redirectUrl: "/sign-in" })}>
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
              onClick={() => handleFilterChange(key)}
            >
              <div className="stat-number" style={{ color }}>{counts[key]}</div>
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
            onChange={(e) => handleSearchChange(e.target.value)}
          />
          <button className="btn-new" onClick={() => setShowCreate(true)}>
            + New Shipment
          </button>
          <button className="btn-refresh" onClick={() => loadShipments({ page })} title="Refresh">
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
        ) : shipments.length === 0 ? (
          <div className="state-empty">
            <div className="state-empty-icon">📭</div>
            <div className="state-empty-text">
              {counts.ALL === 0
                ? "No shipments yet. Create one to get started."
                : "No shipments match your search or filter."}
            </div>
          </div>
        ) : (
          <>
            <div>
              {shipments.map((s) => (
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
            <PaginationBar pagination={pagination} onPage={handlePageChange} />
          </>
        )}
      </div>

      {showCreate && <CreateModal onClose={() => setShowCreate(false)} onCreate={handleCreate} />}

      {toast && <div className={`toast toast--${toast.type}`}>{toast.msg}</div>}
    </div>
  );
}