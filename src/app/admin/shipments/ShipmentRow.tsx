import type { Shipment } from "./types";
import { NEXT_LABEL, STATUS_COLORS } from "./constants";
import { StatusBadge } from "./StatusBadge";
import { StatusTimeline } from "./StatusTimeline";

function fmt(dateStr: string) {
  return new Date(dateStr).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

interface ShipmentRowProps {
  shipment: Shipment;
  onAdvance: (id: string) => void;
  onDelete: (id: string) => void;
  onExpand: (id: string) => void;
  expanded: boolean;
}

export function ShipmentRow({
  shipment,
  onAdvance,
  onDelete,
  onExpand,
  expanded,
}: ShipmentRowProps) {
  const nextLabel = NEXT_LABEL[shipment.status];

  return (
    <div className="shipment-row">
      {/* Main row */}
      <div className="shipment-row-main">
        {/* Tracking IDs */}
        <div>
          <div className="col-label">Tracking ID</div>
          <div className="col-tracking-id">{shipment.trackingId}</div>
          <div className="col-tracking-ext">ext: {shipment.externalTrackingId}</div>
          <div className="col-tracking-order">Order: {shipment.externalSellerOrderId}</div>
        </div>

        {/* Courier + status */}
        <div>
          <div className="col-label">Courier</div>
          <div className="col-courier-name">{shipment.courier}</div>
          <StatusBadge status={shipment.status} />
        </div>

        {/* Addresses */}
        <div>
          <div className="col-address">
            <span className="col-address-label">From: </span>
            {shipment.originAddress}
          </div>
          <div className="col-address">
            <span className="col-address-label">To: </span>
            {shipment.destinationAddress}
          </div>
        </div>

        {/* Advance status */}
        <div>
          {nextLabel ? (
            <button className="btn-advance" onClick={() => onAdvance(shipment.trackingId)}>
              {nextLabel}
            </button>
          ) : (
            <span className="status-final">✓ Final</span>
          )}
        </div>

        {/* Expand */}
        <button
          className="btn-icon"
          onClick={() => onExpand(shipment.trackingId)}
          title="View events"
        >
          {expanded ? "▲" : "▼"}
        </button>

        {/* Delete */}
        <button
          className="btn-delete"
          onClick={() => onDelete(shipment.trackingId)}
          title="Delete shipment"
        >
          ✕
        </button>
      </div>

      {/* Timeline strip */}
      <StatusTimeline events={shipment.events} />

      {/* Expanded events */}
      {expanded && (
        <div className="events-panel">
          <div className="events-panel-title">Event History</div>
          {shipment.events.length === 0 ? (
            <p style={{ color: "#475569", fontSize: 13 }}>No events recorded.</p>
          ) : (
            <div className="events-list">
              {[...shipment.events]
                .sort(
                  (a, b) =>
                    new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
                )
                .map((ev) => (
                  <div key={ev.id} className="event-row">
                    <div
                      className="event-dot"
                      style={{ background: STATUS_COLORS[ev.statusUpdate] }}
                    />
                    <div>
                      <StatusBadge status={ev.statusUpdate} />
                      <span className="event-location">{ev.location}</span>
                      <span className="event-time">{fmt(ev.timestamp)}</span>
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
