"""Standalone script to run database seeding."""

import asyncio

from app.database import async_session, engine
from app.seed import run_seed


async def main() -> None:
    async with async_session() as session:
        await run_seed(session)
        print("Seed data loaded successfully.")
    await engine.dispose()


if __name__ == "__main__":
    asyncio.run(main())
