import { useEffect, useRef } from "react";
import { buildSegments } from "../lib/body.js";

export default function SourcePanel({ sourceText, snippets, hint }) {
  const firstHit = useRef(null);
  const segments = buildSegments(sourceText, snippets);

  useEffect(() => {
    firstHit.current?.scrollIntoView({ block: "center", behavior: "smooth" });
  }, [snippets]);

  const missing = snippets.length > 0 && !segments.some((s) => s.hit);
  let assigned = false;

  return (
    <div>
      {hint && <p className="text-sm text-muted mb-3">{hint}</p>}
      {missing && (
        <p className="text-sm text-bad mb-3">
          The evidence text could not be found in the source. Check that the backend stores the
          exact source text.
        </p>
      )}
      <div className="whitespace-pre-wrap leading-7 text-[15px]">
        {segments.map((s, i) => {
          if (!s.hit) return <span key={i}>{s.t}</span>;
          const ref = assigned ? undefined : firstHit;
          assigned = true;
          return (
            <mark key={i} ref={ref} className="evidence">
              {s.t}
            </mark>
          );
        })}
      </div>
    </div>
  );
}
