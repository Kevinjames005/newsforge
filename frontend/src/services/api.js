// ---------------------------------------------------------------------------
// API contract the frontend expects. Change it here if your backend differs.
//
// POST /generate            multipart/form-data
//        fields: title?, source_text?, source_type, target_language, style, tone
//        files:  zero or more parts named "files" (.pdf .docx .txt .md)
//        At least one of source_text / files is sent. The backend extracts text
//        from the files, merges it with source_text and runs the pipeline.
//        -> { article_id }
// GET  /articles            -> [{ id, title, source_type, target_language, status,
//                                   created_at, unsupported_count? }]
//        unsupported_count (optional) = fact checks with status "unsupported";
//        it feeds the "Flagged claims" card on the dashboard.
// GET  /articles/:id        -> { article, generated, facts, fact_checks }
//        article.source_text = the merged text the AI saw (pasted text + text
//        extracted from files); the UI highlights evidence inside it.
//        article.source_files? = [{ name, size }] shown on the article page.
//        generated.body = array of paragraphs; each paragraph = array of
//        { text, fact_ids: [uuid] }  (plain strings are also accepted)
// GET  /articles/:id/export?format=html  -> file (blob)
// ---------------------------------------------------------------------------
import { mockArticle, mockList } from "./mock.js";

const BASE = import.meta.env.VITE_API_URL ?? "/api";
const MOCK = import.meta.env.VITE_USE_MOCK === "true";

async function request(path, options = {}) {
  const res = await fetch(`${BASE}${path}`, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });
  if (!res.ok) {
    let detail = res.statusText;
    try {
      const body = await res.json();
      detail = body.detail ?? detail;
    } catch {
      /* body was not JSON */
    }
    throw new Error(typeof detail === "string" ? detail : JSON.stringify(detail));
  }
  return res;
}

const wait = (ms) => new Promise((r) => setTimeout(r, ms));

export function generateArticle({ files = [], ...fields }, { onUploadProgress } = {}) {
  if (MOCK) return mockGenerate(files, onUploadProgress);

  return new Promise((resolve, reject) => {
    const fd = new FormData();
    Object.entries(fields).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== "") fd.append(k, v);
    });
    files.forEach((f) => fd.append("files", f));

    const xhr = new XMLHttpRequest();
    xhr.open("POST", `${BASE}/generate`);
    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable) onUploadProgress?.(Math.round((e.loaded / e.total) * 100));
    };
    xhr.onerror = () => reject(new Error("Could not reach the server. Is the backend running?"));
    xhr.onload = () => {
      let body = null;
      try {
        body = JSON.parse(xhr.responseText);
      } catch {
        /* not JSON */
      }
      if (xhr.status >= 200 && xhr.status < 300) return resolve(body);
      let detail = body?.detail ?? xhr.statusText;
      if (Array.isArray(detail)) detail = detail.map((d) => d.msg).join("; ");
      reject(new Error(typeof detail === "string" ? detail : "Generation failed."));
    };
    xhr.send(fd);
  });
}

async function mockGenerate(files, onUploadProgress) {
  for (let p = 0; p <= 100; p += 20) {
    onUploadProgress?.(p);
    await wait(files.length ? 200 : 0);
  }
  await wait(2500);
  return { article_id: "demo" };
}

export async function listArticles() {
  if (MOCK) return mockList;
  return (await request("/articles")).json();
}

export async function getArticle(id) {
  if (MOCK) return mockArticle;
  return (await request(`/articles/${id}`)).json();
}

export async function exportArticle(id, format = "html") {
  if (MOCK) {
    return new Blob(["<h1>Mock export</h1>"], { type: "text/html" });
  }
  return (await request(`/articles/${id}/export?format=${format}`)).blob();
}
