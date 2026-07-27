import httpx
from bs4 import BeautifulSoup
import asyncio
import re


class FoodIndustryScraper:
    """Busca expertos directamente en sitios web de la industria alimentaria."""

    FOOD_INDUSTRY_SITES = [
        {
            "name": "Food Navigator",
            "url": "https://www.foodnavigator.com",
            "search_url": "https://www.foodnavigator.com/Search?query={query}",
            "expert_paths": ["/Authors", "/Experts"],
        },
        {
            "name": "Food Dive",
            "url": "https://www.fooddive.com",
            "search_url": "https://www.fooddive.com/search/?query={query}",
            "expert_paths": ["/news", "/people"],
        },
        {
            "name": "Food Processing",
            "url": "https://www.foodprocessing.com",
            "search_url": "https://www.foodprocessing.com/search?query={query}",
            "expert_paths": ["/authors", "/experts"],
        },
        {
            "name": "New Food Magazine",
            "url": "https://www.newfoodmagazine.com",
            "search_url": "https://www.newfoodmagazine.com/?s={query}",
            "expert_paths": ["/author", "/contributors"],
        },
        {
            "name": "Just Food",
            "url": "https://www.just-food.com",
            "search_url": "https://www.just-food.com/search/?query={query}",
            "expert_paths": ["/authors"],
        },
        {
            "name": "Food Quality & Safety",
            "url": "https://www.foodqualityandsafety.com",
            "search_url": "https://www.foodqualityandsafety.com/?s={query}",
            "expert_paths": ["/author", "/contributors"],
        },
        {
            "name": "Bakery & Snacks",
            "url": "https://www.bakeryandsnacks.com",
            "search_url": "https://www.bakeryandsnacks.com/Search?query={query}",
            "expert_paths": ["/Authors"],
        },
        {
            "name": "Dairy Reporter",
            "url": "https://www.dairyreporter.com",
            "search_url": "https://www.dairyreporter.com/search/?query={query}",
            "expert_paths": ["/authors"],
        },
        {
            "name": "Confectionery News",
            "url": "https://www.confectionerynews.com",
            "search_url": "https://www.confectionerynews.com/Search?query={query}",
            "expert_paths": ["/Authors"],
        },
        {
            "name": "Meat Poultry",
            "url": "https://www.meatpoultry.com",
            "search_url": "https://www.meatpoultry.com/search?query={query}",
            "expert_paths": ["/authors"],
        },
    ]

    def __init__(self):
        self.client = httpx.AsyncClient(
            headers={
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
                "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
                "Accept-Language": "en-US,en;q=0.9,es;q=0.8",
            },
            follow_redirects=True,
            timeout=15.0,
        )

    async def search_experts(self, query: str) -> list[dict]:
        """Busca expertos en sitios web de la industria alimentaria."""
        all_experts = []

        tasks = []
        for site in self.FOOD_INDUSTRY_SITES[:6]:
            tasks.append(self._search_site(site, query))

        results = await asyncio.gather(*tasks, return_exceptions=True)

        for result in results:
            if isinstance(result, list):
                all_experts.extend(result)

        return all_experts

    async def _search_site(self, site: dict, query: str) -> list[dict]:
        """Busca en un sitio web especifico."""
        try:
            search_url = site["search_url"].format(query=query.replace(" ", "+"))
            print(f"[Web] Buscando en {site['name']}: {search_url}", flush=True)

            response = await self.client.get(search_url, timeout=10.0)
            if response.status_code != 200:
                print(f"[Web] {site['name']}: HTTP {response.status_code}", flush=True)
                return []

            soup = BeautifulSoup(response.text, "html.parser")
            experts = []

            articles = soup.find_all("article", limit=5)
            if not articles:
                articles = soup.find_all("div", class_=re.compile(r"article|post|story|card", re.I), limit=5)

            for article in articles:
                author_info = self._extract_author_from_article(article, site)
                if author_info:
                    experts.append(author_info)

            author_links = soup.find_all("a", href=re.compile(r"/author|/expert|/contributors|/people", re.I), limit=5)
            for link in author_links:
                author_name = link.get_text(strip=True)
                href = link.get("href", "")
                if href and not href.startswith("http"):
                    href = site["url"].rstrip("/") + href
                if author_name and len(author_name) > 3 and len(author_name) < 60:
                    experts.append({
                        "id": hash(author_name + site["name"]) % 100000 + 70000,
                        "name": author_name,
                        "email": None,
                        "avatar_url": None,
                        "summary": f"Experto en {site['name']} - {query}",
                        "specialties": ["industria alimentaria"],
                        "experience_years": 0,
                        "availability": "a coordinar",
                        "location": None,
                        "source": "web",
                        "sources": ["web"],
                        "markdown_content": f"Fuente: {site['name']}\nBusqueda: {query}\nURL: {href}",
                        "is_verified": False,
                        "rating": 0.0,
                        "similarity": 0.35,
                        "article_url": href,
                        "site_name": site["name"],
                    })

            print(f"[Web] {site['name']}: {len(experts)} expertos encontrados", flush=True)
            return experts

        except Exception as e:
            print(f"[Web] Error en {site['name']}: {e}", flush=True)
            return []

    def _extract_author_from_article(self, article, site: dict) -> dict | None:
        """Extrae informacion del autor de un articulo."""
        article_url = ""
        article_link = article.find("a", href=True)
        if article_link:
            href = article_link.get("href", "")
            if href and not href.startswith("http"):
                href = site["url"].rstrip("/") + href
            article_url = href

        author_meta = article.find("meta", attrs={"name": "author"})
        if author_meta:
            name = author_meta.get("content", "")
            if name and len(name) > 3:
                return {
                    "id": hash(name + site["name"]) % 100000 + 70000,
                    "name": name,
                    "email": None,
                    "avatar_url": None,
                    "summary": f"Autor en {site['name']}",
                    "specialties": ["industria alimentaria"],
                    "experience_years": 0,
                    "availability": "a coordinar",
                    "location": None,
                    "source": "web",
                    "sources": ["web"],
                    "markdown_content": f"Fuente: {site['name']}\nURL: {article_url or site['url']}",
                    "is_verified": False,
                    "rating": 0.0,
                    "similarity": 0.35,
                    "article_url": article_url or site["url"],
                    "site_name": site["name"],
                }

        author_link = article.find("a", href=re.compile(r"/author|/expert|/contributors", re.I))
        if author_link:
            name = author_link.get_text(strip=True)
            if name and len(name) > 3 and len(name) < 60:
                return {
                    "id": hash(name + site["name"]) % 100000 + 70000,
                    "name": name,
                    "email": None,
                    "avatar_url": None,
                    "summary": f"Autor en {site['name']}",
                    "specialties": ["industria alimentaria"],
                    "experience_years": 0,
                    "availability": "a coordinar",
                    "location": None,
                    "source": "web",
                    "sources": ["web"],
                    "markdown_content": f"Fuente: {site['name']}\nURL: {article_url or site['url']}",
                    "is_verified": False,
                    "rating": 0.0,
                    "similarity": 0.35,
                    "article_url": article_url or site["url"],
                    "site_name": site["name"],
                }

        return None

    async def close(self):
        await self.client.aclose()
