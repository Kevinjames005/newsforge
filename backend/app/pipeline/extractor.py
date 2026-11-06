import re

from app.ai.llm_provider import LLMProvider
from app.ai.prompts import EXTRACT_PROMPT, EXTRACT_SYSTEM
from app.schemas.generation import ExtractionResult


def _norm(text: str) -> str:
    return re.sub(r"\s+", " ", text).strip().lower()


async def extract_facts(llm: LLMProvider, source_text: str) -> ExtractionResult:
    result = await llm.generate_structured(
        EXTRACT_PROMPT.format(source_text=source_text),
        ExtractionResult,
        system=EXTRACT_SYSTEM,
    )

    # Programmatic provenance check: a fact's source snippet must really
    # appear in the source. Facts that fail are dropped as likely hallucinations.
    source_norm = _norm(source_text)
    result.facts = [
        f for f in result.facts if _norm(f.source_text) in source_norm
    ]
    result.quotes = [q for q in result.quotes if _norm(q) in source_norm]
    return result