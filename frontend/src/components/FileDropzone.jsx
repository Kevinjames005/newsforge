import { useRef, useState } from "react";
import Icon from "./Icon.jsx";

export const ALLOWED = [".pdf", ".docx", ".txt", ".md"];
export const MAX_FILES = 5;
export const MAX_MB = 10;

export function formatSize(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

export default function FileDropzone({ files, onChange, disabled }) {
  const input = useRef(null);
  const [over, setOver] = useState(false);
  const [problems, setProblems] = useState([]);

  function add(list) {
    const next = [...files];
    const issues = [];
    for (const f of Array.from(list)) {
      const ext = f.name.slice(f.name.lastIndexOf(".")).toLowerCase();
      if (!ALLOWED.includes(ext)) issues.push(`${f.name} is not a supported type.`);
      else if (f.size > MAX_MB * 1024 * 1024) issues.push(`${f.name} is larger than ${MAX_MB} MB.`);
      else if (next.some((x) => x.name === f.name && x.size === f.size)) issues.push(`${f.name} is already added.`);
      else if (next.length >= MAX_FILES) issues.push(`Only ${MAX_FILES} files can be added at once.`);
      else next.push(f);
    }
    setProblems(issues);
    onChange(next);
  }

  return (
    <div>
      <div
        onDragOver={(e) => { e.preventDefault(); if (!disabled) setOver(true); }}
        onDragLeave={() => setOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setOver(false);
          if (!disabled) add(e.dataTransfer.files);
        }}
        className={`rounded-2xl border-2 border-dashed px-6 py-8 text-center ${
          over ? "border-press bg-soft" : "border-line bg-paper/50"
        }`}
      >
        <span className="mx-auto grid place-items-center w-12 h-12 rounded-full bg-soft text-press">
          <Icon name="upload" className="w-6 h-6" />
        </span>
        <p className="mt-3 font-medium">Drop interview files here</p>
        <p className="text-sm text-muted mt-1">
          PDF, Word or text files. Up to {MAX_FILES} files, {MAX_MB} MB each.
        </p>
        <button
          type="button"
          disabled={disabled}
          onClick={() => input.current?.click()}
          className="mt-4 rounded-xl border border-line bg-sheet px-4 py-2 text-sm font-semibold hover:border-press disabled:opacity-50"
        >
          Choose files
        </button>
        <input
          ref={input}
          type="file"
          multiple
          accept={ALLOWED.join(",")}
          className="sr-only"
          tabIndex={-1}
          onChange={(e) => {
            add(e.target.files);
            e.target.value = "";
          }}
        />
      </div>

      {problems.length > 0 && (
        <ul role="alert" className="mt-3 space-y-1 text-sm text-bad">
          {problems.map((p) => <li key={p}>{p}</li>)}
        </ul>
      )}

      {files.length > 0 && (
        <ul className="mt-4 space-y-2">
          {files.map((f) => (
            <li key={f.name + f.size} className="flex items-center gap-3 rounded-xl border border-line bg-sheet px-3 py-2.5">
              <span className="grid place-items-center w-9 h-9 rounded-lg bg-soft text-press">
                <Icon name="file" className="w-4 h-4" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium truncate">{f.name}</p>
                <p className="text-xs text-muted">{formatSize(f.size)}</p>
              </div>
              <button
                type="button"
                disabled={disabled}
                aria-label={`Remove ${f.name}`}
                onClick={() => onChange(files.filter((x) => x !== f))}
                className="p-1.5 rounded-lg text-muted hover:text-bad hover:bg-bad/10 disabled:opacity-50"
              >
                <Icon name="x" className="w-4 h-4" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
