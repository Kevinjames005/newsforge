import { Link } from "react-router-dom";
import StatusBadge from "./StatusBadge.jsx";
import Icon from "./Icon.jsx";

const TYPES = {
  interview_transcript: "Interview transcript",
  interview_notes: "Interview notes",
  draft: "Draft",
  news_brief: "News brief",
};

export default function ArticleCard({ a }) {
  return (
    <Link
      to={`/articles/${a.id}`}
      className="group flex flex-col bg-sheet border border-line rounded-2xl shadow-sm p-5 hover:border-press"
    >
      <div className="flex items-center justify-between gap-2">
        <StatusBadge status={a.status} />
        <span className="text-xs text-muted">
          {new Date(a.created_at).toLocaleDateString("en", { day: "numeric", month: "short", year: "numeric" })}
        </span>
      </div>
      <h3 className="mt-4 font-semibold leading-snug line-clamp-2 min-h-[2.75rem]">{a.title || "Untitled article"}</h3>
      <p className="mt-2 text-sm text-muted">
        {a.target_language}
        {TYPES[a.source_type] ? ` from ${TYPES[a.source_type].toLowerCase()}` : ""}
      </p>
      <div className="mt-4 pt-4 border-t border-line flex items-center justify-between text-sm">
        {a.unsupported_count > 0 ? (
          <span className="inline-flex items-center gap-1.5 text-bad font-medium">
            <Icon name="flag" className="w-4 h-4" />
            {a.unsupported_count} flagged claim{a.unsupported_count > 1 ? "s" : ""}
          </span>
        ) : (
          <span className="text-muted">No flagged claims</span>
        )}
        <span className="text-press font-medium group-hover:underline">Open</span>
      </div>
    </Link>
  );
}
