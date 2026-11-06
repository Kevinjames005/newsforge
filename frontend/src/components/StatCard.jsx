import Icon from "./Icon.jsx";

const TONES = {
  neutral: "bg-paper text-muted",
  good: "bg-ok/12 text-ok",
  warn: "bg-maybe/12 text-maybe",
  bad: "bg-bad/12 text-bad",
};

export default function StatCard({ icon, label, value, note, tone = "neutral" }) {
  return (
    <div className="bg-sheet border border-line rounded-2xl p-5 shadow-sm">
      <div className="flex items-center gap-2.5 text-sm font-medium">
        <span className="grid place-items-center w-8 h-8 rounded-full bg-soft text-press">
          <Icon name={icon} className="w-4 h-4" />
        </span>
        {label}
      </div>
      <p className="text-3xl font-semibold mt-4">{value}</p>
      <span className={`inline-block mt-3 rounded-md px-2 py-1 text-xs font-medium ${TONES[tone]}`}>{note}</span>
    </div>
  );
}
