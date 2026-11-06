import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { listArticles } from "../services/api.js";
import StatCard from "../components/StatCard.jsx";
import ActivityChart from "../components/ActivityChart.jsx";
import VerifyGauge from "../components/VerifyGauge.jsx";
import ArticleTable from "../components/ArticleTable.jsx";

const DAY = 86400000;

function inRange(a, range) {
  const t = new Date(a.created_at);
  const now = new Date();
  if (range === "month") return t.getMonth() === now.getMonth() && t.getFullYear() === now.getFullYear();
  if (range === "30") return now - t <= 30 * DAY;
  return true;
}

export default function Dashboard() {
  const [items, setItems] = useState(null);
  const [error, setError] = useState("");
  const [range, setRange] = useState("all");

  useEffect(() => {
    listArticles().then(setItems).catch((e) => setError(e.message));
  }, []);

  const stats = useMemo(() => {
    if (!items) return null;
    const scoped = items.filter((a) => inRange(a, range));
    const count = (s) => scoped.filter((a) => a.status === s || (s === "verified" && a.status === "exported")).length;
    const now = new Date();
    const last = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const same = (a, d) => {
      const t = new Date(a.created_at);
      return t.getFullYear() === d.getFullYear() && t.getMonth() === d.getMonth();
    };
    return {
      total: scoped.length,
      verified: count("verified"),
      review: count("review_required"),
      flagged: scoped.reduce((n, a) => n + (a.unsupported_count ?? 0), 0),
      delta: items.filter((a) => same(a, now)).length - items.filter((a) => same(a, last)).length,
    };
  }, [items, range]);

  if (error) return <p role="alert" className="text-bad">Could not load the dashboard: {error}</p>;
  if (!items || !stats) return <p className="text-muted">Loading dashboard…</p>;

  const pct = (n) => (stats.total ? `${Math.round((n / stats.total) * 100)}% of articles` : "No articles yet");
  const recent = [...items].sort((a, b) => new Date(b.created_at) - new Date(a.created_at)).slice(0, 6);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">Welcome back</h1>
          <p className="text-sm text-muted mt-1">
            {new Date().toLocaleDateString("en", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <label className="sr-only" htmlFor="range">Time range</label>
          <select id="range" value={range} onChange={(e) => setRange(e.target.value)} className="rounded-xl border border-line bg-sheet px-3 py-2 text-sm">
            <option value="all">All time</option>
            <option value="month">This month</option>
            <option value="30">Last 30 days</option>
          </select>
          <Link to="/new" className="rounded-xl bg-press text-white text-sm font-semibold px-4 py-2 hover:bg-press-dark">New article</Link>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard icon="file" label="Articles" value={stats.total}
          note={`${stats.delta >= 0 ? "+" : ""}${stats.delta} vs last month`} tone={stats.delta >= 0 ? "good" : "bad"} />
        <StatCard icon="shield" label="Verified" value={stats.verified} note={pct(stats.verified)} tone="good" />
        <StatCard icon="clock" label="Needs review" value={stats.review} note={stats.review ? "Waiting for an editor" : "Nothing waiting"} tone={stats.review ? "warn" : "neutral"} />
        <StatCard icon="flag" label="Flagged claims" value={stats.flagged} note={stats.flagged ? "Unsupported by source" : "No flags"} tone={stats.flagged ? "bad" : "neutral"} />
      </div>

      <div className="grid gap-4 xl:grid-cols-[1fr_340px]">
        <ActivityChart items={items} />
        <VerifyGauge verified={stats.verified} review={stats.review} total={stats.total} />
      </div>

      <section className="bg-sheet border border-line rounded-2xl shadow-sm">
        <div className="flex items-center justify-between px-5 py-4">
          <h3 className="font-semibold">Recent articles</h3>
          <Link to="/articles" className="text-sm text-press font-medium">View all</Link>
        </div>
        <ArticleTable items={recent} empty="No articles yet. Paste interview notes to generate your first one." />
      </section>
    </div>
  );
}
