import asyncio
import html
import pathlib
import webbrowser

from app.ai.llm_provider import get_provider
from app.pipeline.extractor import extract_facts
from app.pipeline.generator import generate_article
from app.pipeline.verifier import verify_article
from app.schemas.generation import GenerateRequest

SOURCE = """Kochi, November 5:
The district collector announced a new road safety campaign.

Campaign starts November 15.
It will cover 25 schools.
Students will receive road safety awareness classes.

Collector said the initiative aims to reduce road accidents among young people."""


def print_report(title, report):
    print(f"\n--- {title}: {report.status} "
          f"(supported={report.supported}, unsupported={report.unsupported}, "
          f"uncertain={report.uncertain})")
    for c in report.claims:
        if c.status != "supported":
            print(f"  [{c.status.upper()}] {c.claim}")
            print(f"      {c.explanation}")

def save_preview(items, path="output/preview.html"):
    parts = []
    for lang, article, report in items:
        body = "".join(f"<p>{html.escape(p)}</p>" for p in article.body)
        parts.append(
            f"<section><small>{lang} · {report.status}</small>"
            f"<h2>{html.escape(article.headline)}</h2>"
            f"<h4>{html.escape(article.subheadline)}</h4>"
            f"<p><b>{html.escape(article.lead)}</b></p>{body}</section><hr>"
        )
    doc = (
        '<!DOCTYPE html><html><head><meta charset="UTF-8"><style>'
        "body{max-width:800px;margin:40px auto;line-height:1.8;"
        "font-family:'Noto Sans Malayalam','Nirmala UI',Georgia,serif}"
        "</style></head><body>" + "".join(parts) + "</body></html>"
    )
    p = pathlib.Path(path)
    p.parent.mkdir(exist_ok=True)
    p.write_text(doc, encoding="utf-8")
    webbrowser.open(p.resolve().as_uri())

async def main():
    llm = get_provider()

    for lang in ["English", "Malayalam"]:
        req = GenerateRequest(source_text=SOURCE, target_language=lang)
        extraction = await extract_facts(llm, req.source_text)

        print("=" * 60)
        print("FACTS:")
        for f in extraction.facts:
            print(f"  [{f.fact_type}] {f.fact}  <-  '{f.source_text}'")

        article = await generate_article(llm, req, extraction)
        print(f"\n{lang.upper()} ARTICLE")
        print("Headline:   ", article.headline)
        print("Subheadline:", article.subheadline)
        print("Lead:       ", article.lead)
        for p in article.body:
            print("  -", p)

        # Verification (must come after the article exists)
        report = await verify_article(llm, req.source_text, article)
        print_report(f"{lang} verification", report)

        if lang == "English":
            bad = article.model_copy(deep=True)
            bad.body.append(
                "About 10,000 students are expected to participate, officials said."
            )
            bad_report = await verify_article(llm, req.source_text, bad)
            print_report("TAMPERED English article", bad_report)


asyncio.run(main())