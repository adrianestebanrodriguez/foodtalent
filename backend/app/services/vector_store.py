from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, text
from app.db.session import Professional


class VectorStore:
    def __init__(self, session: AsyncSession):
        self.session = session

    async def search_similar(
        self,
        embedding: list[float],
        limit: int = 20,
        filters: dict = None,
    ) -> list[dict]:
        query = select(
            Professional.id,
            Professional.name,
            Professional.email,
            Professional.avatar_url,
            Professional.summary,
            Professional.specialties,
            Professional.experience_years,
            Professional.availability,
            Professional.location,
            Professional.source,
            Professional.sources,
            Professional.markdown_content,
            Professional.is_verified,
            Professional.rating,
            (1 - Professional.embedding.cosine_distance(embedding)).label("similarity"),
        )

        if filters:
            if "category" in filters and filters["category"]:
                query = query.where(
                    Professional.specialties.contains([filters["category"]])
                )
            if "availability" in filters and filters["availability"]:
                query = query.where(
                    Professional.availability == filters["availability"]
                )

        query = query.where(Professional.embedding.isnot(None))
        query = query.order_by(text("similarity DESC")).limit(limit)

        result = await self.session.execute(query)
        rows = result.all()

        return [
            {
                "id": row.id,
                "name": row.name,
                "email": row.email,
                "avatar_url": row.avatar_url,
                "summary": row.summary,
                "specialties": row.specialties or [],
                "experience_years": row.experience_years,
                "availability": row.availability,
                "location": row.location,
                "source": row.source,
                "sources": row.sources or [],
                "markdown_content": row.markdown_content,
                "is_verified": row.is_verified,
                "rating": row.rating,
                "similarity": float(row.similarity),
            }
            for row in rows
        ]
