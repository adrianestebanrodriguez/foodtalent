from app.core.config import get_settings
from googleapiclient.discovery import build
from youtube_transcript_api import YouTubeTranscriptApi

settings = get_settings()


class YouTubeService:
    FOOD_INDUSTRY_KEYWORDS = [
        "industria alimentaria",
        "alimentos",
        "food industry",
        "food science",
        "ciencia de alimentos",
        "tecnologia de alimentos",
        "food technology",
        "formula alimentos",
        "procesamiento alimentos",
        "calidad alimentos",
        "innovacion alimentos",
        "food innovation",
        "food processing",
        "food safety",
        "seguridad alimentaria",
        "nutricion",
        "food engineering",
        "ingenieria de alimentos",
    ]

    def __init__(self):
        if settings.YOUTUBE_API_KEY:
            self.youtube = build("youtube", "v3", developerKey=settings.YOUTUBE_API_KEY)
        else:
            self.youtube = None

    def search_food_experts(self, query: str, max_results: int = 20) -> list[dict]:
        if not self.youtube:
            return []

        try:
            search_queries = [
                f"experto industria alimentaria {query}",
                f"food industry expert {query}",
                f"ciencia alimentos {query}",
                f"food scientist {query}",
            ]

            all_videos = []
            seen_ids = set()

            for sq in search_queries[:2]:
                try:
                    request = self.youtube.search().list(
                        part="snippet",
                        q=sq,
                        type="video",
                        order="relevance",
                        maxResults=min(max_results, 10),
                        relevanceLanguage="es",
                    )
                    response = request.execute()

                    for item in response.get("items", []):
                        video_id = item["id"]["videoId"]
                        if video_id not in seen_ids:
                            seen_ids.add(video_id)
                            all_videos.append({
                                "video_id": video_id,
                                "title": item["snippet"]["title"],
                                "channel_id": item["snippet"]["channelId"],
                                "channel_title": item["snippet"]["channelTitle"],
                                "description": item["snippet"]["description"],
                                "published_at": item["snippet"]["publishedAt"],
                            })
                except Exception as e:
                    print(f"[YouTube] Error en busqueda '{sq}': {e}", flush=True)
                    continue

            filtered = self._filter_food_industry_videos(all_videos)
            print(f"[YouTube] Videos filtrados: {len(filtered)} de {len(all_videos)} totales", flush=True)

            return filtered[:max_results]

        except Exception as e:
            print(f"[YouTube] Error general: {e}", flush=True)
            return []

    def _filter_food_industry_videos(self, videos: list[dict]) -> list[dict]:
        """Filtra videos para incluir solo los relacionados con la industria alimentaria."""
        filtered = []
        seen_channels = set()

        for video in videos:
            title = video.get("title", "").lower()
            desc = video.get("description", "").lower()
            channel = video.get("channel_title", "").lower()
            text = f"{title} {desc} {channel}"

            is_food_industry = any(kw in text for kw in self.FOOD_INDUSTRY_KEYWORDS)

            is_health_diet = any(kw in text for kw in [
                "perder peso", "dieta", "bajar de peso", "adelgazar",
                "receta facil", "cocina en casa", "comida rapida",
                "beneficios para la salud", "remedio natural",
                "vitamina", "suplemento", "detox",
            ])

            if is_food_industry and not is_health_diet:
                channel_id = video.get("channel_id")
                if channel_id not in seen_channels:
                    seen_channels.add(channel_id)
                    filtered.append(video)

        return filtered

    def get_transcript(self, video_id: str) -> str | None:
        try:
            transcript_list = YouTubeTranscriptApi.get_transcript(
                video_id, languages=["es", "en"]
            )
            return " ".join([t["text"] for t in transcript_list])
        except Exception:
            return None

    def get_video_content(self, video: dict) -> str:
        title = video.get("title", "")
        description = video.get("description", "")
        channel = video.get("channel_title", "")
        return f"Video: {title}\nCanal: {channel}\nDescripcion: {description}"

    def get_channel_videos(self, channel_id: str, max_results: int = 10) -> list[dict]:
        if not self.youtube:
            return []

        try:
            request = self.youtube.channels().list(
                part="contentDetails", id=channel_id
            )
            response = request.execute()

            if not response.get("items"):
                return []

            uploads_playlist = response["items"][0]["contentDetails"]["relatedPlaylists"][
                "uploads"
            ]

            request = self.youtube.playlistItems().list(
                part="snippet", playlistId=uploads_playlist, maxResults=max_results
            )
            response = request.execute()

            return [
                {
                    "video_id": item["snippet"]["resourceId"]["videoId"],
                    "title": item["snippet"]["title"],
                    "published_at": item["snippet"]["publishedAt"],
                }
                for item in response.get("items", [])
            ]
        except Exception:
            return []
