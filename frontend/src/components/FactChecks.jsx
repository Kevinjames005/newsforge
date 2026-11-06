import StatusBadge from "./StatusBadge.jsx";

export default function FactChecks({ checks, activeId, onSelect }) {
  if (!checks.length) {
    return <p className="text-sm text-muted">No fact checks yet for this version.</p>;
  }
  const count = (s) => checks.filter((c) => c.status === s).length;

  return (
    <div>
      <p className="text-sm text-muted mb-3">
        {count("supported")} supported, {count("uncertain")} uncertain, {count("unsupported")}{" "}
        unsupported
      </p>
      <ul className="space-y-2">
        {checks.map((c) => (
          <li key={c.id}>
            <button
              onClick={() => onSelect(c)}
              className={`w-full text-left rounded-xl border p-3 ${
                activeId === c.id ? "border-press bg-press/5" : "border-line hover:border-muted"
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <span className="text-sm font-medium">{c.claim}</span>
                <StatusBadge status={c.status} />
              </div>
              {c.explanation && <p className="text-sm text-muted mt-1.5">{c.explanation}</p>}
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
