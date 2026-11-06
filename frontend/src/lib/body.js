// Turns whatever the backend stores in generated.body into
// paragraphs -> sentences: [[{ text, fact_ids }]]
export function normalizeBody(body) {
  if (!Array.isArray(body)) return [];
  return body.map((p) => {
    if (typeof p === "string") return [{ text: p, fact_ids: [] }];
    if (Array.isArray(p)) {
      return p.map((s) =>
        typeof s === "string" ? { text: s, fact_ids: [] } : { text: s.text, fact_ids: s.fact_ids ?? [] }
      );
    }
    if (p?.sentences) return normalizeBody([p.sentences])[0];
    return [{ text: p?.text ?? "", fact_ids: p?.fact_ids ?? [] }];
  });
}

// Splits `text` into plain / highlighted segments for each evidence snippet found.
export function buildSegments(text, snippets) {
  const lower = text.toLowerCase();
  const ranges = [];
  for (const raw of snippets) {
    const s = raw?.trim();
    if (!s) continue;
    const i = lower.indexOf(s.toLowerCase());
    if (i >= 0) ranges.push([i, i + s.length]);
  }
  ranges.sort((a, b) => a[0] - b[0]);
  const merged = [];
  for (const r of ranges) {
    const last = merged[merged.length - 1];
    if (last && r[0] <= last[1]) last[1] = Math.max(last[1], r[1]);
    else merged.push([...r]);
  }
  const out = [];
  let pos = 0;
  for (const [a, b] of merged) {
    if (a > pos) out.push({ t: text.slice(pos, a), hit: false });
    out.push({ t: text.slice(a, b), hit: true });
    pos = b;
  }
  if (pos < text.length) out.push({ t: text.slice(pos), hit: false });
  return out;
}
