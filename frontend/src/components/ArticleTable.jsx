import { Link } from "react-router-dom";
import StatusBadge from "./StatusBadge.jsx";

const TYPES = {
  interview_transcript: "Interview transcript",
  interview_notes: "Interview notes",
  draft: "Draft",
  news_brief: "News brief",
};

export default function ArticleTable({ items, empty }) {
  if (!items.length) return <p className="p-6 text-sm text-muted">{empty}</p>;
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm min-w-[720px]">
        <thead>
          <tr className="text-left text-muted">
            <th className="font-medium px-5 py-3">Title</th>
            <th className="font-medium px-3 py-3">Source</th>
            <th className="font-medium px-3 py-3">Language</th>
            <th className="font-medium px-3 py-3">Status</th>
            <th className="font-medium px-3 py-3">Created</th>
            <th className="px-5 py-3"><span className="sr-only">Open</span></th>
          </tr>
        </thead>
        <tbody>
          {items.map((a) => (
            <tr key={a.id} className="border-t border-line hover:bg-paper/60">
              <td className="px-5 py-3.5 font-medium max-w-[320px] truncate">
                <Link to={`/articles/${a.id}`}>{a.title || "Untitled article"}</Link>
              </td>
              <td className="px-3 py-3.5 text-muted">{TYPES[a.source_type] ?? "—"}</td>
              <td className="px-3 py-3.5">{a.target_language}</td>
              <td className="px-3 py-3.5"><StatusBadge status={a.status} /></td>
              <td className="px-3 py-3.5 text-muted whitespace-nowrap">
                {new Date(a.created_at).toLocaleDateString("en", { day: "numeric", month: "short", year: "numeric" })}
              </td>
              <td className="px-5 py-3.5 text-right">
                <Link to={`/articles/${a.id}`} className="text-press font-medium">Open</Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
