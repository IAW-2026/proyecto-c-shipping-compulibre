import type { ShipmentStatus } from "./types";
import { STATUS_LABELS, STATUS_COLORS } from "./constants";

export function StatusBadge({ status }: { status: ShipmentStatus }) {
  return (
    <span
      className="status-badge"
      style={{
        background: STATUS_COLORS[status] + "22",
        color: STATUS_COLORS[status],
        border: `1px solid ${STATUS_COLORS[status]}55`,
      }}
    >
      {STATUS_LABELS[status]}
    </span>
  );
}
