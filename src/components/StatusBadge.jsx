const LABELS = {
  queued: "Queued",
  running: "Running",
  waiting_confirmation: "Awaiting approval",
  completed: "Completed",
  failed: "Failed",
  cancelled: "Cancelled",
  timed_out: "Timed out",
  active: "Active",
  quarantined: "Quarantined",
};

export function StatusBadge({ status }) {
  return <span className={`status-badge status-${status}`}>{LABELS[status] || status || "Unknown"}</span>;
}
