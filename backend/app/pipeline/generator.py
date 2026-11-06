from app.ai.llm_provider import LLMProvider
from app.ai.prompts import (
    GENERATE_PROMPT,
    GENERATE_SYSTEM,
    LANGUAGE_GUIDE,
)
from app.schemas.generation import (
    ExtractionResult,
    GeneratedArticle,
    GenerateRequest,
)


async def generate_article(
    llm: LLMProvider,
    req: GenerateRequest,
    extraction: ExtractionResult,
) -> GeneratedArticle:
    facts_text = "\n".join(
        f"- [{f.fact_type}] {f.fact}" for f in extraction.facts
    )
    quotes_text = (
        "\n".join(f'- "{q}"' for q in extraction.quotes) or "(none)"
    )

    prompt = GENERATE_PROMPT.format(
        target_language=req.target_language,
        language_notes=LANGUAGE_GUIDE.get(
            req.target_language, "Standard newspaper conventions."
        ),
        style=req.style,
        tone=req.tone,
        facts=facts_text,
        quotes=quotes_text,
        source_text=req.source_text,
    )
    return await llm.generate_structured(
        prompt, GeneratedArticle, system=GENERATE_SYSTEM
    )