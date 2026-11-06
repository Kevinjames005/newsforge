import { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { listArticles } from "../services/api.js";
import ArticleTable from "../components/ArticleTable.jsx";
import ArticleCard from "../components/ArticleCard.jsx";
import Icon from "../components/Icon.jsx";

const PAGE = 12;
const TABS = [
  ["", "All"],
  ["review_required", "Needs review"],
  ["verified", "Verified"],
  ["draft", "Drafts"],
  ["exported", "Exported"],
];
const SORTS = {
  newest: (a, b) => new Date(b.created_at) - new Date(a.created_at),
  oldest: (a, b) => new Date(a.created_at) - new Date(b.created_at),
  title: (a, b) => (a.title ?? "").localeCompare(b.title ?? ""),
};
const select = "rounded-xl border border-line bg-sheet px-3 py-2 text-sm";

export default function History() {
  const [items, setItems] = useState(null);
  const [error, setError] = useState("");
  const [view, setView] = useState("grid");
  const [params, setParams] = useSearchParams();

  const q = params.get("q") ?? "";
  const status = params.get("status") ?? "";
  const lang = params.get("lang") ?? "";
  const sort = params.get("sort") ?? "newest";
  const page = Math.max(1, Number(params.get("page") ?? 1));

  useEffect(() => {
    listArticles().then(setItems).catch((e) => setError(e.message));
  }, []);

  function setParam(k, v) {
    const next = new URLSearchParams(params);
    if (v) next.set(k, v);
    else next.delete(k);
    if (k !== "page") next.delete("page");
    setParams(next, { replace: k === "q" });
  }

  // Tab counts ignore the status filter so they stay meaningful.
  const base = useMemo(
    () =>
      (items ?? [])
        .filter((a) => (a.title ?? "").toLowerCase().includes(q.toLowerCase()))
        .filter((a) => !lang || a.target_language === lang),
    [items, q, lang]
  );

  if (error) return <p role="alert" className="text-bad">Could not load articles: {error}</p>;
  if (!items) return <p className="text-muted">Loading articles…</p>;

  const counts = Object.fromEntries(TABS.map(([v]) => [v, v ? base.filter((a) => a.status === v).length : base.length]));
  const shown = base.filter((a) => !status || a.status === status).sort(SORTS[sort] ?? SORTS.newest);
  const pages = Math.max(1, Math.ceil(shown.length / PAGE));
  const current = Math.min(page, pages);
  const slice = shown.slice((current - 1) * PAGE, current * PAGE);
  const languages = [...new Set(items.map((a) => a.target_language))];
  const filtered = q || status || lang;

  const viewBtn = (v, icon, name) => (
    <button
      type="button"
      aria-label={name}
      aria-pressed={view === v}
      onClick={() => setView(v)}
      className={`p-2 rounded-lg ${view === v ? "bg-sheet text-press shadow-sm" : "text-muted"}`}
    >
      <Icon name={icon} className="w-4 h-4" />
    </button>
  );

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">Articles</h1>
          <p className="text-sm text-muted mt-1">{items.length} generated so far</p>
        </div>
        <Link to="/new" className="rounded-xl bg-press text-white text-sm font-semibold px-4 py-2 hover:bg-press-dark">
          New article
        </Link>
      </div>

      <div role="tablist" aria-label="Filter by status" className="flex gap-1 overflow-x-auto border-b border-line">
        {TABS.map(([v, l]) => (
          <button
            key={v}
            role="tab"
            aria-selected={status === v}
            onClick={() => setParam("status", v)}
            className={`shrink-0 px-4 py-2.5 text-sm font-medium border-b-2 -mb-px ${
              status === v ? "border-press text-ink" : "border-transparent text-muted hover:text-ink"
            }`}
          >
            {l} <span className="ml-1 text-xs text-muted">{counts[v]}</span>
          </button>
        ))}
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[220px] max-w-md">
          <Icon name="search" className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
          <input
            value={q}
            onChange={(e) => setParam("q", e.target.value)}
            placeholder="Search by title"
            aria-label="Search by title"
            className="w-full rounded-xl border border-line bg-sheet pl-9 pr-3 py-2 text-sm"
          />
        </div>
        <select aria-label="Filter by language" className={select} value={lang} onChange={(e) => setParam("lang", e.target.value)}>
          <option value="">All languages</option>
          {languages.map((l) => <option key={l}>{l}</option>)}
        </select>
        <select aria-label="Sort articles" className={select} value={sort} onChange={(e) => setParam("sort", e.target.value === "newest" ? "" : e.target.value)}>
          <option value="newest">Newest first</option>
          <option value="oldest">Oldest first</option>
          <option value="title">Title A to Z</option>
        </select>
        <div className="ml-auto flex rounded-xl bg-paper p-1 border border-line">
          {viewBtn("grid", "grid", "Card view")}
          {viewBtn("list", "list", "Table view")}
        </div>
      </div>

      {shown.length === 0 ? (
        <div className="bg-sheet border border-line rounded-2xl p-10 text-center">
          <p className="font-medium">{filtered ? "No articles match these filters." : "No articles yet."}</p>
          <p className="text-sm text-muted mt-1">
            {filtered ? "Try a different search or status." : "Upload interview files or paste notes to create your first one."}
          </p>
          {filtered ? (
            <button onClick={() => setParams({})} className="mt-4 text-sm font-semibold text-press">Clear filters</button>
          ) : (
            <Link to="/new" className="mt-4 inline-block text-sm font-semibold text-press">New article</Link>
          )}
        </div>
      ) : view === "grid" ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {slice.map((a, i) => <ArticleCard key={`${a.id}-${i}`} a={a} />)}
        </div>
      ) : (
        <section className="bg-sheet border border-line rounded-2xl shadow-sm">
          <ArticleTable items={slice} empty="" />
        </section>
      )}

      {pages > 1 && (
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted">
            Showing {(current - 1) * PAGE + 1} to {Math.min(current * PAGE, shown.length)} of {shown.length}
          </span>
          <div className="flex gap-2">
            <button disabled={current === 1} onClick={() => setParam("page", String(current - 1))} className={`${select} disabled:opacity-40`}>Previous</button>
            <button disabled={current === pages} onClick={() => setParam("page", String(current + 1))} className={`${select} disabled:opacity-40`}>Next</button>
          </div>
        </div>
      )}
    </div>
  );
}
