import { useState } from "react";
import { Link, Outlet, useLocation, useNavigate } from "react-router-dom";
import Icon from "./Icon.jsx";

const MENU = [
  { to: "/", label: "Dashboard", icon: "dashboard", active: (l) => l.pathname === "/" },
  { to: "/new", label: "New article", icon: "plus", active: (l) => l.pathname === "/new" },
  {
    to: "/articles",
    label: "Articles",
    icon: "file",
    active: (l) =>
      (l.pathname === "/articles" && !l.search.includes("status=")) || l.pathname.startsWith("/articles/"),
  },
  {
    to: "/articles?status=review_required",
    label: "Review queue",
    icon: "inbox",
    active: (l) => l.pathname === "/articles" && l.search.includes("status=review_required"),
  },
];

function titleFor(pathname) {
  if (pathname === "/") return "Overview";
  if (pathname === "/new") return "New article";
  if (pathname === "/articles") return "Articles";
  return "Article";
}

export default function Layout() {
  const loc = useLocation();
  const nav = useNavigate();
  const [q, setQ] = useState("");

  function search(e) {
    e.preventDefault();
    nav(`/articles?q=${encodeURIComponent(q.trim())}`);
  }

  return (
    <div className="flex min-h-screen">
      <aside className="hidden lg:flex w-64 shrink-0 flex-col bg-sheet border-r border-line sticky top-0 h-screen p-4">
        <Link to="/" className="flex items-center gap-2.5 px-2 py-2 mb-6">
          <span className="grid place-items-center w-9 h-9 rounded-xl text-white bg-gradient-to-br from-[#6c93ff] to-press">
            <Icon name="sparkle" className="w-5 h-5" />
          </span>
          <span className="text-xl font-bold tracking-tight">NewsForge</span>
        </Link>

        <p className="px-3 mb-2 text-xs text-muted">Newsroom</p>
        <nav className="space-y-1">
          {MENU.map((m) => {
            const on = m.active(loc);
            return (
              <Link
                key={m.label}
                to={m.to}
                aria-current={on ? "page" : undefined}
                className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium ${
                  on ? "bg-soft text-press" : "text-muted hover:bg-paper hover:text-ink"
                }`}
              >
                <Icon name={m.icon} />
                {m.label}
              </Link>
            );
          })}
        </nav>

        <div className="mt-auto rounded-2xl p-4 bg-gradient-to-br from-soft to-white border border-line">
          <p className="font-semibold text-sm">Got notes to file?</p>
          <p className="text-sm text-muted mt-1">Paste an interview and get a draft with every claim traced to its source.</p>
          <Link to="/new" className="mt-3 block text-center rounded-xl bg-gradient-to-b from-[#5b8cff] to-press text-white text-sm font-semibold py-2.5">
            New article
          </Link>
        </div>
      </aside>

      <div className="flex-1 min-w-0">
        <header className="sticky top-0 z-10 bg-paper/90 backdrop-blur border-b border-line">
          <div className="flex items-center gap-4 px-4 lg:px-8 h-16">
            <h2 className="text-lg font-semibold">{titleFor(loc.pathname)}</h2>
            <form onSubmit={search} className="relative ml-auto lg:ml-6 w-full max-w-sm">
              <Icon name="search" className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Search articles by title"
                aria-label="Search articles"
                className="w-full rounded-xl border border-line bg-sheet pl-9 pr-3 py-2 text-sm"
              />
            </form>
          </div>
          <nav className="lg:hidden flex gap-1 overflow-x-auto px-4 pb-2">
            {MENU.map((m) => (
              <Link key={m.label} to={m.to} className={`shrink-0 rounded-lg px-3 py-1.5 text-sm ${m.active(loc) ? "bg-soft text-press font-medium" : "text-muted"}`}>
                {m.label}
              </Link>
            ))}
          </nav>
        </header>
        <main className="px-4 lg:px-8 py-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
