import { useMemo, useState } from "react";

const DAY = 86400000;

function buckets(items, mode) {
  const now = new Date();
  if (mode === "weekly") {
    const out = [];
    for (let i = 7; i >= 0; i--) {
      const end = now.getTime() - i * 7 * DAY;
      const start = end - 7 * DAY;
      out.push({
        label: new Date(start + DAY).toLocaleDateString("en", { day: "numeric", month: "short" }),
        count: items.filter((a) => {
          const t = new Date(a.created_at).getTime();
          return t > start && t <= end;
        }).length,
      });
    }
    return out;
  }
  const out = [];
  for (let i = 11; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    out.push({
      label: d.toLocaleString("en", { month: "short" }),
      count: items.filter((a) => {
        const t = new Date(a.created_at);
        return t.getFullYear() === d.getFullYear() && t.getMonth() === d.getMonth();
      }).length,
    });
  }
  return out;
}

export default function ActivityChart({ items }) {
  const [mode, setMode] = useState("monthly");
  const data = useMemo(() => buckets(items, mode), [items, mode]);
  const [hover, setHover] = useState(null);

  const max = Math.max(...data.map((d) => d.count), 1);
  const top = Math.max(4, Math.ceil(max / 4) * 4);
  const ticks = [top, (top * 3) / 4, top / 2, top / 4, 0];
  const focus = hover ?? data.length - 1;
  const total = data.reduce((n, d) => n + d.count, 0);

  const toggle = (m, label) => (
    <button
      onClick={() => { setMode(m); setHover(null); }}
      className={`px-3 py-1.5 text-sm rounded-full ${mode === m ? "bg-ink text-white" : "text-muted"}`}
    >
      {label}
    </button>
  );

  return (
    <section className="bg-sheet border border-line rounded-2xl shadow-sm p-5">
      <div className="flex items-start justify-between">
        <div>
          <h3 className="font-semibold">Articles generated</h3>
          <p className="text-3xl font-semibold mt-3">{total}</p>
          <p className="text-sm text-muted">{mode === "monthly" ? "in the last 12 months" : "in the last 8 weeks"}</p>
        </div>
        <div className="flex rounded-full bg-paper p-1">
          {toggle("monthly", "Monthly")}
          {toggle("weekly", "Weekly")}
        </div>
      </div>

      <div className="mt-6 flex gap-3">
        <div className="flex flex-col justify-between h-[200px] text-xs text-muted text-right w-6">
          {ticks.map((t) => <span key={t}>{t}</span>)}
        </div>
        <div className="flex-1">
          <div className="h-[200px] flex items-end gap-2 border-b border-line" onMouseLeave={() => setHover(null)}>
            {data.map((d, i) => {
              const h = Math.max((d.count / top) * 100, d.count ? 4 : 2);
              const on = i === focus;
              return (
                <div key={i} className="flex-1 h-full flex flex-col justify-end items-center relative" onMouseEnter={() => setHover(i)}>
                  {on && (
                    <span className="absolute -translate-y-1 rounded-md bg-press text-white text-xs font-semibold px-2 py-1" style={{ bottom: `calc(${h}% + 6px)` }}>
                      {d.count}
                    </span>
                  )}
                  <div
                    className="w-full max-w-9 rounded-t-full"
                    style={{
                      height: `${h}%`,
                      background: on
                        ? "linear-gradient(#6c93ff, #3563e9)"
                        : "repeating-linear-gradient(135deg, #dde4f2 0 3px, #eef2fa 3px 7px)",
                    }}
                    role="img"
                    aria-label={`${d.label}: ${d.count} articles`}
                  />
                </div>
              );
            })}
          </div>
          <div className="flex gap-2 mt-2">
            {data.map((d, i) => (
              <span key={i} className="flex-1 text-center text-xs text-muted truncate">{d.label}</span>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
