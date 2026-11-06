import re

from app.ai.llm_provider import LLMProvider
from app.ai.prompts import VERIFY_PROMPT, VERIFY_SYSTEM
from app.schemas.generation import (
    ClaimCheck,
    GeneratedArticle,
    VerificationReport,
    VerificationResult,
)


def _norm(text: str) -> str:
    return re.sub(r"\s+", " ", text).strip().lower()


def _numbers(text: str) -> set[str]:
    return set(re.findall(r"\d+(?:[.,]\d+)*", text))


def article_to_text(article: GeneratedArticle) -> str:
    return "\n".join(
        [article.headline, article.subheadline, article.lead, *article.body]
    )


async def verify_article(
    llm: LLMProvider, source_text: str, article: GeneratedArticle
) -> VerificationReport:
    article_text = article_to_text(article)

    result = await llm.generate_structured(
        VERIFY_PROMPT.format(source_text=source_text, article_text=article_text),
        VerificationResult,
        system=VERIFY_SYSTEM,
    )

    source_norm = _norm(source_text)
    source_nums = _numbers(source_text)
    claims: list[ClaimCheck] = []

    for c in result.claims:
        # Check 1: "supported" needs evidence that really exists in the source
        if c.status == "supported":
            if not c.source_evidence or _norm(c.source_evidence) not in source_norm:
                c.status = "uncertain"
                c.explanation = (
                    "Evidence snippet not found verbatim in source. "
                    + c.explanation
                )

        # Check 2: numbers are compared in code, not by the LLM
        missing = _numbers(c.claim) - source_nums
        if missing:
            c.status = "unsupported"
            c.explanation = (
                f"Number(s) {sorted(missing)} do not appear in the source. "
                + c.explanation
            )
        claims.append(c)

    # Check 3: every number in the article text must exist in the source
    stray = _numbers(article_text) - source_nums
    already_flagged = " ".join(c.claim + c.article_sentence for c in claims)
    for n in sorted(stray):
        if n not in already_flagged:
            claims.append(
                ClaimCheck(
                    claim=f"The article contains the number {n}",
                    article_sentence="",
                    status="unsupported",
                    source_evidence="",
                    explanation="Number not found in the source (programmatic check).",
                )
            )

    supported = sum(c.status == "supported" for c in claims)
    unsupported = sum(c.status == "unsupported" for c in claims)
    uncertain = sum(c.status == "uncertain" for c in claims)

    return VerificationReport(
        status="verified" if unsupported == 0 and uncertain == 0 else "review_required",
        supported=supported,
        unsupported=unsupported,
        uncertain=uncertain,
        claims=claims,
    )