import type { ShipmentEvent, ShipmentStatus } from "./types";
import { STATUS_COLORS } from "./constants";

const STEPS: ShipmentStatus[] = ["LABEL_CREATED", "IN_TRANSIT", "DELIVERED"];

export function StatusTimeline({ events }: { events: ShipmentEvent[] }) {
  const reached = new Set(events.map((e) => e.statusUpdate));

  return (
    <div className="timeline-strip">
      <div className="timeline-row">
        {STEPS.map((step, i) => (
          <div
            key={step}
            style={{ display: "flex", alignItems: "center", flex: i < STEPS.length - 1 ? 1 : "none" }}
          >
            <div
              className="timeline-dot"
              style={{
                background: reached.has(step) ? STATUS_COLORS[step] : "#334155",
                border: `2px solid ${reached.has(step) ? STATUS_COLORS[step] : "#475569"}`,
              }}
            />
            {i < STEPS.length - 1 && (
              <div
                className="timeline-line"
                style={{
                  background: reached.has(STEPS[i + 1]) ? "#3b82f6" : "#334155",
                }}
              />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
