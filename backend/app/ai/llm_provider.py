from abc import ABC, abstractmethod
from typing import Type, TypeVar

from pydantic import BaseModel

T = TypeVar("T", bound=BaseModel)


class LLMProvider(ABC):
    name: str = "base"
    model: str = ""

    @abstractmethod
    async def generate(self, prompt: str, system: str | None = None) -> str:
        """Free-text generation."""

    @abstractmethod
    async def generate_structured(
        self, prompt: str, schema: Type[T], system: str | None = None
    ) -> T:
        """Return output validated against a Pydantic model."""


def get_provider() -> LLMProvider:
    from app.config import settings

    if settings.llm_provider == "gemini":
        from app.ai.providers.gemini_provider import GeminiProvider
        return GeminiProvider()
    raise ValueError(f"Unsupported LLM provider: {settings.llm_provider}")