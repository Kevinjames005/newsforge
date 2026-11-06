const STYLES = {
  draft: ["Draft", "bg-line text-muted", "bg-muted"],
  review_required: ["Needs review", "bg-maybe/12 text-maybe", "bg-maybe"],
  verified: ["Verified", "bg-ok/12 text-ok", "bg-ok"],
  exported: ["Exported", "bg-press/12 text-press", "bg-press"],
  supported: ["Supported", "bg-ok/12 text-ok", "bg-ok"],
  unsupported: ["Unsupported", "bg-bad/12 text-bad", "bg-bad"],
  uncertain: ["Uncertain", "bg-maybe/12 text-maybe", "bg-maybe"],
};

export default function StatusBadge({ status }) {
  const [label, cls, dot] = STYLES[status] ?? [status, "bg-line text-muted", "bg-muted"];
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${cls}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${dot}`} />
      {label}
    </span>
  );
}
