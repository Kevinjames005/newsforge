# NewsForge AI

NewsForge AI is an AI-assisted newsroom tool. It turns interview notes, transcripts, drafts, or news briefs into a structured news article, then fact-checks every claim in that article against the original source.

The goal is not just to generate text, but to generate **source-grounded** text that an editor can trust: every fact is extracted from the input, the article is written only from those facts, and each claim is verified against the source before publishing.

---

## Table of contents

- [What this project is](#what-this-project-is)
- [How it works](#how-it-works)
- [Tech stack](#tech-stack)
- [Repository structure](#repository-structure)
- [Prerequisites](#prerequisites)
- [Setup](#setup)
  - [1. Backend](#1-backend)
  - [2. Database (Supabase)](#2-database-supabase)
  - [3. Frontend](#3-frontend)
- [Running the app](#running-the-app)
- [Using the app](#using-the-app)
- [API reference](#api-reference)
- [Configuration reference](#configuration-reference)
- [Tests and manual scripts](#tests-and-manual-scripts)
- [Current limitations](#current-limitations)
- [Troubleshooting](#troubleshooting)
- [Security notes](#security-notes)

---

## What this project is

NewsForge AI is a small, self-hostable "AI newsroom" with two parts:

- A **FastAPI backend** that runs a four-stage pipeline: fact extraction → article generation → verification → persistence.
- A **React dashboard** where a journalist uploads source material, generates an article, reviews the fact-check report, clicks any sentence to see its supporting evidence, and exports the result.

Key ideas behind the project:

1. **Extract before you write.** The model first lists the facts explicitly present in the source. Facts whose quoted source snippet does not actually appear in the source are dropped in code.
2. **Write only from extracted facts.** The writer prompt forbids inventing names, dates, numbers, quotes, or context.
3. **Verify in code as well as with the LLM.** The verifier checks that evidence appears verbatim in the source and that every number in the article exists in the source.
4. **Keep humans in the loop.** Articles are marked either `verified` or `review_required`, and the UI highlights unsupported claims for an editor.
5. **Support local-language journalism.** The pipeline currently targets English and Malayalam, including Malayalam typography in the UI.

---

## How it works

The backend runs this pipeline for every generation request:

1. **Input merging** — pasted text is combined with text extracted from uploaded `.txt` / `.md` files.
2. **Fact extraction** (`pipeline/extractor.py`) — Gemini returns structured facts and quotes. Any fact or quote whose `source_text` cannot be found in the source is discarded as a probable hallucination.
3. **Article generation** (`pipeline/generator.py`) — the writer receives the extracted facts, approved quotes, style, tone, and target language, and returns a headline, subheadline, lead, body paragraphs, and keywords.
4. **Verification** (`pipeline/verifier.py`) — the LLM breaks the article into atomic claims and labels each one `supported`, `unsupported`, or `uncertain`. Code then enforces extra rules:
   - a claim marked `supported` must include evidence copied from the source;
   - numbers in a claim must appear in the source;
   - any number in the article text that is absent from the source is flagged.
5. **Persistence** — the article, extracted facts, generated version, and fact checks are stored in Supabase. The article status becomes `verified` if there are no unsupported or uncertain claims, otherwise `review_required`.
6. **Review** — the frontend shows the article next to its source. Clicking a sentence highlights the source snippets it came from; the fact-check tab lists claims and evidence. Articles can be exported as a standalone HTML file.

---

## Tech stack

| Layer | Technologies |
| --- | --- |
| Backend | Python, FastAPI, Pydantic v2, Uvicorn |
| AI | Google Gemini via `google-genai` (structured JSON output) |
| Database | Supabase (PostgreSQL) |
| Frontend | React 19, Vite 8, React Router 7, Tailwind CSS 4 |
| Testing | pytest, plus manual pipeline scripts |

---

## Repository structure

```text
newsforge-ai/
├── backend/
│   ├── app/
│   │   ├── api/routes/       # /generate, /articles, /articles/:id/export
│   │   ├── ai/               # LLM provider abstraction, prompts, Gemini provider
│   │   ├── pipeline/         # extractor, generator, verifier
│   │   ├── database/         # Supabase client and repository functions
│   │   ├── schemas/          # Pydantic request/response models
│   │   ├── services/         # reserved for export helpers
│   │   ├── templates/        # reserved for HTML templates
│   │   ├── config.py         # environment settings
│   │   └── main.py           # FastAPI application entry point
│   ├── tests/                # manual LLM and pipeline scripts
│   ├── requirements.txt
│   └── .env.example
├── frontend/
│   ├── src/
│   │   ├── pages/            # Dashboard, NewArticle, History, ArticleView
│   │   ├── components/       # layout, tables, fact checks, source panel, etc.
│   │   └── services/         # API client and mock data
│   ├── public/
│   ├── vite.config.js        # /api proxy to localhost:8000
│   └── package.json
├── supabase/                 # intended for database migrations / SQL
└── sample_data/              # intended for sample interviews
```

> `supabase/` and `sample_data/` are currently empty. The SQL needed to create the database tables is included below.

---

## Prerequisites

- **Python 3.11+** (the existing local virtual environment uses Python 3.13)
- **Node.js 20+** (required by Vite 8)
- A **Supabase** project (free tier is fine)
- A **Gemini API key** from [Google AI Studio](https://aistudio.google.com/apikey)

---

## Setup

### 1. Backend

From the project root:

```powershell
cd backend
python -m venv venv
.\venv\Scripts\Activate.ps1
pip install -r requirements.txt
Copy-Item .env.example .env
```

On macOS/Linux:

```bash
cd backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
```

Edit `backend/.env` and fill in the values:

```dotenv
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_KEY=your-service-role-key
GEMINI_API_KEY=your-gemini-api-key
LLM_PROVIDER=gemini
GEMINI_MODEL=gemini-2.5-flash
```

Then start the API **from the `backend/` directory** so the `app` package and `.env` file resolve correctly:

```bash
uvicorn app.main:app --reload
```

Backend URLs:

- API: <http://localhost:8000>
- Health check: <http://localhost:8000/health>
- Interactive API docs: <http://localhost:8000/docs>

### 2. Database (Supabase)

1. Create a project at [supabase.com](https://supabase.com).
2. Open **SQL Editor** and run the schema below.
3. Copy the project URL and the **service_role** key from **Project Settings → API** into `backend/.env`.

```sql
-- Required extension for gen_random_uuid()
create extension if not exists "pgcrypto";

create table if not exists articles (
  id uuid primary key default gen_random_uuid(),
  title text,
  source_text text not null,
  source_type text not null default 'interview_notes',
  target_language text not null default 'English',
  style text not null default 'professional_news',
  tone text not null default 'neutral',
  status text not null default 'draft',
  created_at timestamptz not null default now()
);

create table if not exists extracted_facts (
  id uuid primary key default gen_random_uuid(),
  article_id uuid not null references articles(id) on delete cascade,
  fact text not null,
  fact_type text not null,
  source_text text not null,
  created_at timestamptz not null default now()
);

create table if not exists generated_articles (
  id uuid primary key default gen_random_uuid(),
  article_id uuid not null references articles(id) on delete cascade,
  version integer not null default 1,
  headline text,
  subheadline text,
  lead text,
  body text,
  keywords text,
  model_name text,
  prompt_version text,
  created_at timestamptz not null default now()
);

create table if not exists fact_checks (
  id uuid primary key default gen_random_uuid(),
  generated_article_id uuid not null references generated_articles(id) on delete cascade,
  claim text not null,
  article_sentence text,
  status text not null,
  source_evidence text,
  explanation text,
  created_at timestamptz not null default now()
);

create index if not exists idx_extracted_facts_article
  on extracted_facts (article_id);

create index if not exists idx_generated_articles_article
  on generated_articles (article_id, version desc);

create index if not exists idx_fact_checks_generated_article
  on fact_checks (generated_article_id);
```

Notes:

- The backend uses the **service_role** key, which bypasses Row Level Security. Keep that key server-side only.
- `generated_articles.body` and `generated_articles.keywords` are stored as JSON strings, matching the backend code. They are parsed back into arrays by the API before being sent to the frontend.

### 3. Frontend

```bash
cd frontend
npm install
npm run dev
```

The dev server runs at <http://localhost:5173>.

Vite proxies `/api/*` to `http://localhost:8000` and strips the `/api` prefix, so the frontend and backend work together without CORS changes during development. See `frontend/vite.config.js`.

Optional frontend environment variables (create `frontend/.env.local`):

```dotenv
# Point at a different backend. Defaults to /api (the Vite proxy).
VITE_API_URL=http://localhost:8000

# Run the UI without a backend, using demo data.
VITE_USE_MOCK=true
```

With `VITE_USE_MOCK=true`, the dashboard, article view, and fact checks all use `frontend/src/services/mock.js`.

---

## Running the app

Use two terminals.

**Terminal 1 — backend**

```bash
cd backend
# activate the virtual environment first
uvicorn app.main:app --reload
```

**Terminal 2 — frontend**

```bash
cd frontend
npm run dev
```

Open <http://localhost:5173>.

---

## Using the app

1. Open **New article**.
2. Upload `.txt` / `.md` files, paste notes, or click **Use sample notes**.
3. Choose the source type, article language, format, tone, and an optional working title.
4. Click **Generate article**. The backend runs extraction, generation, and verification in one request, then redirects to the article page.
5. On the article page:
   - Click any sentence to highlight the source evidence it was built from.
   - Dotted-underlined sentences have no linked source fact and should be reviewed.
   - Open the **Fact check** tab to see supported, unsupported, and uncertain claims.
6. Click **Export as HTML** to download a standalone article file.

Dashboard and history views provide status counts, a review queue, search, language filters, sorting, and grid/table layouts.

---

## API reference

The frontend expects the following contract (also documented at the top of `frontend/src/services/api.js`):

| Method | Endpoint | Description |
| --- | --- | --- |
| `GET` | `/health` | Health check. |
| `POST` | `/generate` | Multipart form: `source_text`, `source_type`, `target_language`, `style`, `tone`, optional `title`, and zero or more `files` parts. Returns `{ "article_id": "..." }`. |
| `GET` | `/articles` | List articles, newest first, with an `unsupported_count` per article. |
| `GET` | `/articles/{id}` | Full article: `article`, `generated`, `facts`, and `fact_checks`. |
| `GET` | `/articles/{id}/export?format=html` | Download the generated article as standalone HTML. |

FastAPI also exposes Swagger UI at `/docs` and the OpenAPI schema at `/openapi.json`.

Example generation request with `curl`:

```bash
curl -X POST http://localhost:8000/generate \
  -F "source_text=Collector Anita Menon said the flood relief camp opened on 14 October. About 320 families are staying there." \
  -F "source_type=interview_notes" \
  -F "target_language=English" \
  -F "style=professional_news" \
  -F "tone=neutral"
```

---

## Configuration reference

### Backend (`backend/.env`)

| Variable | Required | Default | Purpose |
| --- | --- | --- | --- |
| `SUPABASE_URL` | Yes | empty | Supabase project URL. |
| `SUPABASE_SERVICE_KEY` | Yes | empty | Supabase service_role key (server-side only). |
| `GEMINI_API_KEY` | Yes | empty | Gemini API key. |
| `LLM_PROVIDER` | No | `gemini` | LLM provider. Only `gemini` is implemented. |
| `GEMINI_MODEL` | No | `gemini-2.5-flash` | Gemini model name. |
| `CORS_ORIGINS` | No | `["http://localhost:5173"]` | Allowed frontend origins. |

### Frontend (`frontend/.env.local`)

| Variable | Required | Default | Purpose |
| --- | --- | --- | --- |
| `VITE_API_URL` | No | `/api` | Backend base URL. |
| `VITE_USE_MOCK` | No | `false` | Use demo data instead of the backend. |

---

## Tests and manual scripts

The backend includes two manual scripts rather than a full automated test suite:

```bash
cd backend
# activate the virtual environment first

# Check that the configured LLM provider works
python -m tests.test_llm

# Run the full pipeline in English and Malayalam and open an HTML preview
python -m tests.run_pipeline
```

`python -m tests.run_pipeline` needs a working `.env`, Gemini key, and network access. It writes `output/preview.html` under the `backend/` directory.

`pytest` is listed in the requirements, but the current `tests/test_pipeline.py` is empty, so pytest has no tests to run yet.

---

## Current limitations

These are intentional gaps or known rough edges in the current codebase:

- **Only English and Malayalam are accepted by the backend.** The frontend language selector also shows Hindi and Tamil, but the backend schema rejects them with a `422` validation error.
- **Only `.txt` and `.md` files are parsed.** The upload widget accepts PDF and DOCX and the backend accepts the upload, but file text is only read for `.txt` / `.md`. PDF/DOCX extraction is marked as future work in `generation.py`.
- **Only Gemini is wired up.** `LLM_PROVIDER` mentions `openai` and `ollama`, and provider files exist, but only `gemini_provider.py` is implemented.
- **Generation is synchronous.** One `POST /generate` runs the whole pipeline, so long inputs can make the request slow. The progress steps in the UI are timer-based, not real backend events.
- **No authentication or multi-tenancy.** Anyone who can reach the backend can use it.
- **HTML export only.** The `format` query parameter exists, but only HTML is produced.
- **No database migration files.** Use the SQL in this README to create the schema; the `supabase/` folder is a placeholder.

---

## Troubleshooting

**`Please provide at least 20 characters of source text.`**
The backend requires at least 20 characters after merging pasted text and uploaded files. Add more text or upload a `.txt` / `.md` file.

**`Could not reach the server. Is the backend running?`**
Start FastAPI on port 8000, or set `VITE_API_URL` to the correct backend URL. Also check the Vite proxy target in `frontend/vite.config.js`.

**Supabase errors such as "relation does not exist" or "Could not find the table"**
Run the SQL schema above in the Supabase SQL Editor and confirm `SUPABASE_URL` and `SUPABASE_SERVICE_KEY` in `backend/.env`.

**Gemini `429` rate-limit errors**
Gemini rate limits are retried automatically (up to 5 attempts). If it still fails, wait for your quota to reset or switch `GEMINI_MODEL`.

**Hindi or Tamil article generation fails with `422`**
Not supported by the backend yet. Use English or Malayalam.

**A PDF or DOCX upload produces no text**
Only `.txt` and `.md` are parsed server-side. Convert the document to text first.

**Frontend shows demo data**
Check `frontend/.env.local`: set `VITE_USE_MOCK=false` and restart `npm run dev`.

---

## Security notes

- Never commit `backend/.env` or expose the Supabase **service_role** key in frontend code. The service role key bypasses Row Level Security.
- `.env` files are not currently covered by a root `.gitignore`. Add one before committing if this project will be version-controlled.
- The app has no authentication. Do not deploy it publicly as-is.
- AI output is a draft, not a published fact. Always review `review_required` articles and the fact-check tab before publishing.
