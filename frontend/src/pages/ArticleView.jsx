import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { exportArticle, getArticle } from "../services/api.js";
import { normalizeBody } from "../lib/body.js";
import StatusBadge from "../components/StatusBadge.jsx";
import SourcePanel from "../components/SourcePanel.jsx";
import FactChecks from "../components/FactChecks.jsx";

export default function ArticleView() {
  const { id } = useParams();
  const [data, setData] = useState(null);
  const [error, setError] = useState("");
  const [tab, setTab] = useState("source");
  const [active, setActive] = useState(null); // "p-s" key of the clicked sentence
  const [snippets, setSnippets] = useState([]);
  const [activeCheck, setActiveCheck] = useState(null);
  const [hint, setHint] = useState("Click any sentence in the article to see where it came from.");
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    getArticle(id).then(setData).catch((e) => setError(e.message));
  }, [id]);

  const paragraphs = useMemo(() => normalizeBody(data?.generated?.body), [data]);
  const factsById = useMemo(
    () => Object.fromEntries((data?.facts ?? []).map((f) => [f.id, f])),
    [data]
  );

  if (error) return <p role="alert" className="text-bad">Could not load this article: {error}</p>;
  if (!data) return <p className="text-muted">Loading article…</p>;

  const { article, generated, fact_checks = [] } = data;

  function pickSentence(key, sentence) {
    const facts = sentence.fact_ids.map((fid) => factsById[fid]).filter(Boolean);
    setActive(key);
    setActiveCheck(null);
    setTab("source");
    setSnippets(facts.map((f) => f.source_text));
    setHint(
      facts.length
        ? `This sentence is based on ${facts.length} fact${facts.length > 1 ? "s" : ""} from your source, highlighted below.`
        : "No source fact is linked to this sentence. Check it before you publish."
    );
  }

  function pickCheck(c) {
    setActiveCheck(c.id);
    setActive(null);
    setSnippets(c.source_evidence ? [c.source_evidence] : []);
    setHint(
      c.source_evidence
        ? "Evidence for this claim is highlighted in your source."
        : "The checker found no evidence for this claim in your source."
    );
    setTab("source");
  }

  async function download() {
    setExporting(true);
    try {
      const blob = await exportArticle(id, "html");
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${(article.title || "article").replace(/\s+/g, "-")}.html`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (e) {
      setError(e.message);
    } finally {
      setExporting(false);
    }
  }

  const tabBtn = (name, label) => (
    <button
      role="tab"
      aria-selected={tab === name}
      onClick={() => setTab(name)}
      className={`px-4 py-2 text-sm font-medium border-b-2 ${
        tab === name ? "border-press text-ink" : "border-transparent text-muted hover:text-ink"
      }`}
    >
      {label}
    </button>
  );

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <Link to="/articles" className="text-sm text-press underline">Back to history</Link>
        <div className="flex items-center gap-3">
          <StatusBadge status={article.status} />
          <button
            onClick={download}
            disabled={exporting}
            className="rounded-xl bg-press text-white text-sm font-semibold px-4 py-2 hover:bg-press-dark disabled:opacity-50"
          >
            {exporting ? "Preparing…" : "Export as HTML"}
          </button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_420px]">
        <article lang={article.target_language === "Malayalam" ? "ml" : undefined} className="font-article bg-sheet border border-line rounded-2xl shadow-sm p-8">
          <h1 className="text-3xl font-semibold leading-tight">{generated.headline}</h1>
          {generated.subheadline && (
            <p className="text-lg text-muted mt-2 leading-snug">{generated.subheadline}</p>
          )}
          <div className="mt-6 space-y-4 text-[17px] leading-8 max-w-[68ch]">
            {paragraphs.map((p, pi) => (
              <p key={pi}>
                {p.map((s, si) => {
                  const key = `${pi}-${si}`;
                  const unlinked = s.fact_ids.length === 0;
                  return (
                    <span
                      key={key}
                      role="button"
                      tabIndex={0}
                      onClick={() => pickSentence(key, s)}
                      onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && pickSentence(key, s)}
                      className={`cursor-pointer rounded-sm ${
                        active === key
                          ? "bg-marker"
                          : unlinked
                          ? "underline decoration-dotted decoration-maybe underline-offset-4"
                          : "hover:bg-marker/40"
                      }`}
                    >
                      {s.text}{" "}
                    </span>
                  );
                })}
              </p>
            ))}
          </div>
          <p className="mt-8 text-sm text-muted font-ui">
            Dotted underline means no source fact is linked to that sentence.
          </p>
        </article>

        <aside className="lg:sticky lg:top-6 self-start bg-sheet border border-line rounded-2xl shadow-sm">
          <div role="tablist" className="flex border-b border-line px-2">
            {tabBtn("source", "Source")}
            {tabBtn("checks", `Fact check (${fact_checks.length})`)}
          </div>
          {tab === "source" && article.source_files?.length > 0 && (
            <p className="px-4 pt-3 text-sm text-muted">
              From: {article.source_files.map((f) => f.name).join(", ")}
            </p>
          )}
          <div className="p-4 max-h-[70vh] overflow-y-auto">
            {tab === "source" ? (
              <SourcePanel sourceText={article.source_text} snippets={snippets} hint={hint} />
            ) : (
              <FactChecks checks={fact_checks} activeId={activeCheck} onSelect={pickCheck} />
            )}
          </div>
        </aside>
      </div>
    </div>
  );
}
