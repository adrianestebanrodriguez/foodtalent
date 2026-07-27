import httpx
from bs4 import BeautifulSoup
from urllib.parse import urlparse
import asyncio


class WebScraper:
    ALLOWED_DOMAINS = [
        "foodnavigator.com",
        "fooddive.com",
        "foodprocessing.com",
        "supermarketperimeter.com",
        "meatpoultry.com",
        "dairyprocessing.com",
        "bakeryandsnacks.com",
        "elquestions.com",
        "alcadiaalimentaria.com",
        "infobae.com",
        "expertoalimentario.com",
        "alimentosargentinos.gob.ar",
        "fiagro.com.ar",
        "elalimentario.com",
        "alimenta-magazine.com",
        "procesalimentario.com",
        "nutritienda.com",
        "diaadia.com.ar",
        "lahuerta.com.ar",
        "cocinerosargentinos.com",
        "foodqualityandsafety.com",
        "newfoodmagazine.com",
        "foodmanufacture.co.uk",
        "just-food.com",
        "confectionerynews.com",
        "beveragedaily.com",
        "dairyreporter.com",
        "meatpoultry.com",
    ]

    def __init__(self):
        self.client = httpx.AsyncClient(
            headers={"User-Agent": "Mozilla/5.0 (compatible; FoodTalentBot/1.0)"},
            follow_redirects=True,
            timeout=15.0,
        )

    async def search_articles(self, query: str, limit: int = 20) -> list[dict]:
        from app.core.config import get_settings

        settings = get_settings()

        if not settings.GOOGLE_CSE_API_KEY or not settings.GOOGLE_CSE_ID:
            print("[Web] No hay API key o CSE ID configurado", flush=True)
            return []

        try:
            url = "https://www.googleapis.com/customsearch/v1"
            params = {
                "key": settings.GOOGLE_CSE_API_KEY,
                "cx": settings.GOOGLE_CSE_ID,
                "q": f"expertos industria alimentos {query}",
                "num": min(limit, 10),
            }
            print(f"[Web] Llamando a Google CSE con query: {params['q']}", flush=True)
            response = await self.client.get(url, params=params)
            data = response.json()

            if "error" in data:
                print(f"[Web] Error de Google CSE: {data['error']}", flush=True)
                return []

            items = data.get("items", [])
            print(f"[Web] Google CSE returned {len(items)} items", flush=True)

            return [
                {
                    "title": item.get("title", ""),
                    "url": item.get("link", ""),
                    "snippet": item.get("snippet", ""),
                }
                for item in items
            ]
        except Exception as e:
            print(f"[Web] Error en busqueda: {e}", flush=True)
            return []

    async def extract_content(self, url: str) -> str | None:
        parsed_url = urlparse(url)
        domain = parsed_url.netloc.replace("www.", "")

        try:
            response = await self.client.get(url)
            response.raise_for_status()

            soup = BeautifulSoup(response.text, "html.parser")

            article = soup.find("article") or soup.find("main") or soup.find("body")

            if article:
                for element in article.find_all(["script", "style", "nav", "footer", "aside"]):
                    element.decompose()

                text = article.get_text(separator="\n", strip=True)[:5000]
                if len(text) > 100:
                    return text

            return None
        except Exception:
            return None
        finally:
            await asyncio.sleep(0.3)
