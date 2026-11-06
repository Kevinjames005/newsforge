import json

from fastapi import APIRouter, Form, UploadFile, File, HTTPException

from app.ai.llm_provider import get_provider
from app.ai.prompts import PROMPT_VERSION
from app.database import repository as repo
from app.pipeline.extractor import extract_facts
from app.pipeline.generator import generate_article
from app.pipeline.verifier import verify_article
from app.schemas.generation import GenerateRequest

router = APIRouter()


@router.post("/generate")
async def generate(
    source_text: str = Form(""),
    source_type: str = Form("interview_notes"),
    target_language: str = Form("English"),
    style: str = Form("professional_news"),
    tone: str = Form("neutral"),
    title: str = Form(""),
    files: list[UploadFile] = File(default=[]),
):
    # Merge file contents with pasted text (basic text extraction for .txt/.md)
    parts = []
    if source_text.strip():
        parts.append(source_text.strip())
    for f in files:
        if f.filename and f.filename.lower().endswith((".txt", ".md")):
            content = await f.read()
            parts.append(content.decode("utf-8", errors="replace"))
        # PDF/DOCX extraction would go here in a future version

    merged_text = "\n\n".join(parts)
    if len(merged_text) < 20:
        raise HTTPException(status_code=422, detail="Please provide at least 20 characters of source text.")

    # Build request model
    req = GenerateRequest(
        source_text=merged_text,
        source_type=source_type,
        target_language=target_language,
        style=style,
        tone=tone,
    )

    # 1. Create article in DB
    article_row = repo.create_article({
        "title": title.strip() or None,
        "source_text": merged_text,
        "source_type": source_type,
        "target_language": target_language,
        "style": style,
        "tone": tone,
        "status": "draft",
    })
    article_id = article_row["id"]

    try:
        llm = get_provider()

        # 2. Extract facts
        extraction = await extract_facts(llm, merged_text)
        fact_dicts = [f.model_dump() for f in extraction.facts]
        repo.create_extracted_facts(article_id, fact_dicts)

        # 3. Generate article
        gen_article = await generate_article(llm, req, extraction)

        # 4. Store generated article
        gen_row = repo.create_generated_article({
            "article_id": article_id,
            "version": 1,
            "headline": gen_article.headline,
            "subheadline": gen_article.subheadline,
            "lead": gen_article.lead,
            "body": json.dumps(gen_article.body),
            "keywords": json.dumps(gen_article.keywords),
            "model_name": llm.model,
            "prompt_version": PROMPT_VERSION,
        })

        # 5. Verify
        verification = await verify_article(llm, merged_text, gen_article)
        check_dicts = [c.model_dump() for c in verification.claims]
        repo.create_fact_checks(gen_row["id"], check_dicts)

        # 6. Update article status
        repo.update_article_status(article_id, verification.status)

        return {"article_id": article_id}

    except Exception as e:
        # Update status to reflect failure but still return the article_id
        repo.update_article_status(article_id, "draft")
        raise HTTPException(status_code=500, detail=str(e))
