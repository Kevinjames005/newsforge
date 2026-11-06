from typing import Literal

from pydantic import BaseModel, Field


class Fact(BaseModel):
    fact: str
    fact_type: Literal[
        "person", "place", "date", "number", "event", "statement", "quote"
    ]
    source_text: str


class Entities(BaseModel):
    people: list[str]
    places: list[str]
    organizations: list[str]


class ExtractionResult(BaseModel):
    topic: str
    facts: list[Fact]
    entities: Entities
    quotes: list[str]


class GeneratedArticle(BaseModel):
    headline: str
    subheadline: str
    lead: str
    body: list[str]
    keywords: list[str]


class GenerateRequest(BaseModel):
    source_text: str = Field(min_length=20, max_length=20000)
    source_type: Literal[
        "interview_transcript", "interview_notes", "draft", "news_brief"
    ] = "interview_notes"
    target_language: Literal["English", "Malayalam"] = "English"
    style: str = "professional_news"
    tone: str = "neutral"


class ClaimCheck(BaseModel):
    claim: str
    article_sentence: str
    status: Literal["supported", "unsupported", "uncertain"]
    source_evidence: str
    explanation: str


class VerificationResult(BaseModel):
    claims: list[ClaimCheck]


class VerificationReport(BaseModel):
    status: Literal["verified", "review_required"]
    supported: int
    unsupported: int
    uncertain: int
    claims: list[ClaimCheck]


class GenerateResponse(BaseModel):
    article_id: str
    article: GeneratedArticle
    facts: list[Fact]
    verification: VerificationReport
    model_name: str
    prompt_version: str
