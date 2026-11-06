const N = 14;
const GAP = 2.5;

function polar(cx, cy, r, deg) {
  const a = (deg * Math.PI) / 180;
  return [cx + r * Math.cos(a), cy + r * Math.sin(a)];
}
function segment(cx, cy, r1, r2, a0, a1) {
  const [x0, y0] = polar(cx, cy, r2, a0);
  const [x1, y1] = polar(cx, cy, r2, a1);
  const [x2, y2] = polar(cx, cy, r1, a1);
  const [x3, y3] = polar(cx, cy, r1, a0);
  return `M${x0} ${y0} A${r2} ${r2} 0 0 1 ${x1} ${y1} L${x2} ${y2} A${r1} ${r1} 0 0 0 ${x3} ${y3} Z`;
}

export default function VerifyGauge({ verified, review, total }) {
  const pct = total ? (verified / total) * 100 : 0;
  const lit = Math.round((pct / 100) * N);
  const step = 180 / N;

  return (
    <section className="bg-sheet border border-line rounded-2xl shadow-sm p-5">
      <h3 className="font-semibold">Verification rate</h3>
      <div className="relative mt-4">
        <svg viewBox="0 0 240 128" className="w-full" role="img" aria-label={`${pct.toFixed(1)} percent of articles verified`}>
          {Array.from({ length: N }, (_, i) => (
            <path
              key={i}
              d={segment(120, 120, 64, 112, 180 + i * step + GAP / 2, 180 + (i + 1) * step - GAP / 2)}
              fill={i < lit ? "#3563e9" : "#e6ecf8"}
              fillOpacity={i < lit ? 0.35 + (0.65 * (i + 1)) / Math.max(lit, 1) : 1}
            />
          ))}
        </svg>
        <div className="absolute inset-x-0 bottom-1 text-center">
          <p className="text-3xl font-semibold">{pct.toFixed(1)}%</p>
          <p className="text-xs text-muted">of articles verified</p>
        </div>
      </div>
      <div className="mt-5 flex items-center justify-between text-sm">
        <span><span className="font-semibold">{verified}</span> <span className="text-muted">verified</span></span>
        <span><span className="font-semibold">{review}</span> <span className="text-muted">need review</span></span>
      </div>
      <div className="mt-2 h-2 rounded-full bg-paper overflow-hidden">
        <div className="h-full rounded-full bg-gradient-to-r from-[#6c93ff] to-press" style={{ width: `${pct}%` }} />
      </div>
    </section>
  );
}
