import asyncio
import re
from typing import Type

from google import genai
from google.genai import errors, types

from app.ai.llm_provider import LLMProvider, T
from app.config import settings


class GeminiProvider(LLMProvider):
    name = "gemini"
    max_retries = 5

    def __init__(self):
        self.client = genai.Client(
            api_key=settings.gemini_api_key,
            http_options=types.HttpOptions(api_version="v1beta"),
        )
        self.model = settings.gemini_model

    async def _call(self, **kwargs):
        """generate_content with retry when the rate limit (429) is hit."""
        for attempt in range(self.max_retries):
            try:
                return await self.client.aio.models.generate_content(**kwargs)
            except errors.ClientError as e:
                if e.code != 429 or attempt == self.max_retries - 1:
                    raise
                match = re.search(r"retry in ([\d.]+)s", str(e))
                wait = float(match.group(1)) if match else 20.0
                print(f"[rate limited] waiting {wait + 2:.0f}s before retrying...")
                await asyncio.sleep(wait + 2)

    async def generate(self, prompt: str, system: str | None = None) -> str:
        response = await self._call(
            model=self.model,
            contents=prompt,
            config=types.GenerateContentConfig(system_instruction=system),
        )
        return response.text

    async def generate_structured(
        self, prompt: str, schema: Type[T], system: str | None = None
    ) -> T:
        response = await self._call(
            model=self.model,
            contents=prompt,
            config=types.GenerateContentConfig(
                system_instruction=system,
                response_mime_type="application/json",
                response_schema=schema,
                temperature=0.2,
            ),
        )
        return schema.model_validate_json(response.text)