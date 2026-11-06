import asyncio
from pydantic import BaseModel
from app.ai.llm_provider import get_provider


class Hello(BaseModel):
    greeting_english: str
    greeting_malayalam: str


async def main():
    llm = get_provider()
    result = await llm.generate_structured(
        "Greet a newspaper reader in English and Malayalam.", Hello
    )
    print(result)


asyncio.run(main())