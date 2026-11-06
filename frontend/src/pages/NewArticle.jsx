import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { generateArticle } from "../services/api.js";
import FileDropzone from "../components/FileDropzone.jsx";
import Segmented from "../components/Segmented.jsx";
import Icon from "../components/Icon.jsx";

const SOURCE_TYPES = [
  ["interview_transcript", "Interview transcript"],
  ["interview_notes", "Interview notes"],
  ["draft", "Draft"],
  ["news_brief", "News brief"],
];
const LANGUAGES = ["Malayalam", "English", "Hindi", "Tamil"].map((l) => [l, l]);
const STYLES = [["professional_news", "News report"], ["feature", "Feature"], ["brief", "Short brief"]];
const TONES = [["neutral", "Neutral"], ["formal", "Formal"], ["conversational", "Conversational"]];

// After the upload finishes the backend works in one call, so these steps advance on a timer.
const PIPELINE = ["Reading your files", "Extracting facts", "Structuring the story", "Writing the article", "Checking claims"];

const SAMPLE =
  "Collector Anita Menon said the flood relief camp at Erattupetta school opened on 14 October. " +
  "About 320 families are staying there. She said the district has set aside 45 lakh rupees for food and medicine. " +
  '"No family will be turned away," she told reporters. Power is expected to be restored by Friday.';

const input = "w-full rounded-xl border border-line bg-paper/60 px-3 py-2.5 text-sm";
const label = "block text-sm font-medium mb-1.5";

export default function NewArticle() {
  const nav = useNavigate();
  const [files, setFiles] = useState([]);
  const [text, setText] = useState("");
  const [meta, setMeta] = useState({
    title: "",
    source_type: "interview_notes",
    target_language: "Malayalam",
    style: "professional_news",
    tone: "neutral",
  });
  const [busy, setBusy] = useState(false);
  const [uploadPct, setUploadPct] = useState(0);
  const [stage, setStage] = useState(0); // index into PIPELINE once upload is done
  const [error, setError] = useState("");

  const set = (k) => (v) => setMeta((m) => ({ ...m, [k]: v }));
  const uploadDone = files.length === 0 || uploadPct >= 100;

  useEffect(() => {
    if (!busy || !uploadDone) return;
    const t = setInterval(() => setStage((s) => Math.min(s + 1, PIPELINE.length - 1)), 4000);
    return () => clearInterval(t);
  }, [busy, uploadDone]);

  const hasText = text.trim().length >= 40;
  const canSubmit = !busy && (files.length > 0 || hasText);

  async function submit(e) {
    e.preventDefault();
    if (!canSubmit) return;
    setError("");
    setUploadPct(0);
    setStage(files.length ? 0 : 1); // skip "Reading your files" when nothing was uploaded
    setBusy(true);
    try {
      const { article_id } = await generateArticle(
        { ...meta, title: meta.title.trim(), source_text: text.trim(), files },
        { onUploadProgress: setUploadPct }
      );
      nav(`/articles/${article_id}`);
    } catch (err) {
      setError(err.message || "Generation failed.");
      setBusy(false);
    }
  }

  const summary = [
    files.length ? `${files.length} file${files.length > 1 ? "s" : ""}` : null,
    text.trim() ? `${text.trim().length} characters of text` : null,
  ].filter(Boolean).join(" and ");

  return (
    <form onSubmit={submit}>
      <div className="mb-6">
        <h1 className="text-2xl font-semibold">New article</h1>
        <p className="text-sm text-muted mt-1 max-w-2xl">
          Add your interview files or notes. NewsForge extracts the facts, writes the article, and checks every claim against your source.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
        <div className="space-y-6">
          <section className="bg-sheet border border-line rounded-2xl shadow-sm p-6">
            <h2 className="font-semibold mb-4">Upload files</h2>
            <FileDropzone files={files} onChange={setFiles} disabled={busy} />
          </section>

          <section className="bg-sheet border border-line rounded-2xl shadow-sm p-6">
            <div className="flex items-baseline justify-between mb-3">
              <label htmlFor="src" className="font-semibold">Or paste text</label>
              <button type="button" disabled={busy} onClick={() => setText(SAMPLE)} className="text-sm text-press font-medium disabled:opacity-50">
                Use sample notes
              </button>
            </div>
            <textarea
              id="src"
              value={text}
              disabled={busy}
              onChange={(e) => setText(e.target.value)}
              rows={10}
              placeholder="Rough notes, a transcript, or a draft. If you also upload files, this text is added to them."
              className={`${input} leading-7 text-[15px] resize-y`}
            />
            <p className="text-sm text-muted mt-1.5">{text.length} characters</p>
          </section>
        </div>

        <aside className="lg:sticky lg:top-28 self-start space-y-4 bg-sheet border border-line rounded-2xl shadow-sm p-6">
          <h2 className="font-semibold">Article settings</h2>

          <div>
            <label className={label} htmlFor="title">Working title (optional)</label>
            <input id="title" value={meta.title} onChange={(e) => set("title")(e.target.value)} className={input} />
          </div>
          <div>
            <label className={label} htmlFor="stype">What are you adding?</label>
            <select id="stype" value={meta.source_type} onChange={(e) => set("source_type")(e.target.value)} className={input}>
              {SOURCE_TYPES.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
            </select>
          </div>
          <div>
            <p className={label}>Write the article in</p>
            <Segmented label="Article language" value={meta.target_language} options={LANGUAGES} onChange={set("target_language")} />
          </div>
          <div>
            <p className={label}>Format</p>
            <Segmented label="Article format" value={meta.style} options={STYLES} onChange={set("style")} />
          </div>
          <div>
            <p className={label}>Tone</p>
            <Segmented label="Tone" value={meta.tone} options={TONES} onChange={set("tone")} />
          </div>

          <button
            type="submit"
            disabled={!canSubmit}
            className="w-full rounded-xl bg-gradient-to-b from-[#5b8cff] to-press text-white font-semibold py-3 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {busy ? "Working…" : "Generate article"}
          </button>
          {!busy && (
            <p className="text-sm text-muted">
              {canSubmit
                ? `Ready with ${summary}.`
                : summary
                ? "Add a few more sentences, or upload a file."
                : "Upload a file or add a few sentences of text to continue."}
            </p>
          )}

          {busy && (
            <ol className="space-y-2.5 pt-1" aria-live="polite">
              {files.length > 0 && (
                <li>
                  <div className="flex items-center gap-2 text-sm">
                    <StepDot state={uploadDone ? "done" : "now"} />
                    <span className={uploadDone ? "text-ok" : "font-semibold"}>
                      {uploadDone ? "Files uploaded" : `Uploading files ${uploadPct}%`}
                    </span>
                  </div>
                  {!uploadDone && (
                    <div className="ml-7 mt-1.5 h-1.5 rounded-full bg-paper overflow-hidden">
                      <div className="h-full bg-press" style={{ width: `${uploadPct}%` }} />
                    </div>
                  )}
                </li>
              )}
              {PIPELINE.map((s, i) => {
                if (i === 0 && files.length === 0) return null;
                const state = !uploadDone ? "todo" : i < stage ? "done" : i === stage ? "now" : "todo";
                return (
                  <li key={s} className="flex items-center gap-2 text-sm">
                    <StepDot state={state} />
                    <span className={state === "done" ? "text-ok" : state === "now" ? "font-semibold" : "text-muted"}>{s}</span>
                  </li>
                );
              })}
            </ol>
          )}
          {error && (
            <p role="alert" className="text-sm text-bad border border-bad/30 bg-bad/5 rounded-xl p-3">{error}</p>
          )}
        </aside>
      </div>
    </form>
  );
}

function StepDot({ state }) {
  if (state === "done")
    return <span className="grid place-items-center w-5 h-5 rounded-full bg-ok text-white"><Icon name="check" className="w-3 h-3" /></span>;
  if (state === "now") return <span className="w-5 h-5 rounded-full border-2 border-press border-t-transparent animate-spin" />;
  return <span className="w-5 h-5 rounded-full border-2 border-line" />;
}
