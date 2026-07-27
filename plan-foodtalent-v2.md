# Plan Detallado: FoodTalent - Matching de Talento en Alimentos (v2)

**Versión actualizada** — Sin Facebook ni LinkedIn, usando YouTube + blogs/web como fuentes externas.

---

## 1. Resumen Ejecutivo

**FoodTalent** es una plataforma que conecta empresarios de alimentos con profesionales expertos usando **Gemini AI** para analizar necesidades y recomendar los 5 perfiles más idóneos.

### Fuentes de datos (sin Facebook ni LinkedIn)

| Fuente | Tipo | Cómo se obtiene |
|--------|------|-----------------|
| Base propia de profesionales | Estructurada | Registro directo vía formulario |
| YouTube | No estructurada | YouTube Data API v3 + scraping de transcripciones |
| Blogs/Web de la industria | No estructurada | Google Custom Search API + web scraping ético |

---

## 2. Arquitectura Técnica

### 2.1 Stack tecnológico

| Capa | Tecnología | Justificación |
|------|------------|---------------|
| **Frontend** | Next.js 14+ (App Router) | SSR para SEO, React Server Components, optimizado para Vercel |
| **UI** | Tailwind CSS + shadcn/ui | Accesibilidad built-in, responsive, design system consistente |
| **Backend** | FastAPI (Python) | Async nativo, ideal para llamadas a Gemini, Pydantic para validación |
| **Base de datos** | PostgreSQL + pgvector | Relacional para datos estructurados + búsqueda semántica vectorial |
| **Cola de tareas** | Celery + Redis | Procesamiento asíncrono de ingesta de datos y generación de embeddings |
| **IA** | Google Gemini API | Reranking, generación de explicaciones, análisis semántico |
| **Almacenamiento** | Google Cloud Storage | Perfiles Markdown, transcripciones, datos procesados |

### 2.2 Diagrama de arquitectura

```
┌─────────────────────────────────────────────────────────────────┐
│                        FRONTEND (Next.js)                       │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐             │
│  │   Búsqueda  │  │   Perfiles  │  │  Dashboard  │             │
│  │   (barra)   │  │  (resultados│  │  (empresario│             │
│  └─────────────┘  └─────────────┘  └─────────────┘             │
└──────────────────────────┬──────────────────────────────────────┘
                           │ HTTP/REST API
                           ▼
┌──────────────────────────────────────────────────────────────────┐
│                     BACKEND (FastAPI)                            │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐             │
│  │  Auth API   │  │ Search API  │  │ Profile API │             │
│  └─────────────┘  └─────────────┘  └─────────────┘             │
│                           │                                      │
│                           ▼                                      │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │              GEMINI AI INTEGRATION                          ││
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐        ││
│  │  │  Embeddings │  │  Reranking  │  │ Explicación │        ││
│  │  │  (búsqueda  │  │  (ranking   │  │  (por qué   │        ││
│  │  │  semántica) │  │  final)     │  │  este match)│        ││
│  │  └─────────────┘  └─────────────┘  └─────────────┘        ││
│  └─────────────────────────────────────────────────────────────┘│
└──────────────────────────┬──────────────────────────────────────┘
                           │
                           ▼
┌──────────────────────────────────────────────────────────────────┐
│                    CELERY WORKERS                                │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐             │
│  │  YouTube    │  │  Web/Blog   │  │  Profile    │             │
│  │  Ingestion  │  │  Ingestion  │  │  Processing │             │
│  └─────────────┘  └─────────────┘  └─────────────┘             │
└──────────────────────────┬──────────────────────────────────────┘
                           │
                           ▼
┌──────────────────────────────────────────────────────────────────┐
│                    FUENTES EXTERNAS                               │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐             │
│  │  YouTube    │  │  Google     │  │  Blogs/     │             │
│  │  Data API   │  │  Custom     │  │  Web de la  │             │
│  │  v3         │  │  Search     │  │  industria  │             │
│  └─────────────┘  └─────────────┘  └─────────────┘             │
└─────────────────────────────────────────────────────────────────┘
```

---

## 3. Flujo Principal de Búsqueda

### 3.1 Flujo del empresario

```
Empresario escribe necesidad
         │
         ▼
┌─────────────────────────┐
│ 1. Frontend envía query │
│    POST /api/search     │
└─────────────────────────┘
         │
         ▼
┌─────────────────────────┐
│ 2. Backend convierte    │
│    query a embedding    │
│    (Gemini Embedding)   │
└─────────────────────────┘
         │
         ▼
┌─────────────────────────┐
│ 3. pgvector busca los   │
│    20 perfiles más      │
│    cercanos (similitud) │
└─────────────────────────┘
         │
         ▼
┌─────────────────────────┐
│ 4. Filtrado por front-  │
│    matter (disponibi-   │
│    lidad, sector, etc.) │
└─────────────────────────┘
         │
         ▼
┌─────────────────────────┐
│ 5. Gemini Reranking     │
│    - Top 5 perfiles     │
│    - Genera explicación │
│    de cada match        │
└─────────────────────────┘
         │
         ▼
┌─────────────────────────┐
│ 6. Frontend muestra     │
│    resultados con %     │
│    match + explicación  │
└─────────────────────────┘
```

### 3.2 Código del endpoint de búsqueda

```python
# backend/app/api/routes/search.py
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from app.services.gemini_service import GeminiService
from app.services.vector_store import VectorStore
from app.core.auth import get_current_user

router = APIRouter()

class SearchRequest(BaseModel):
    query: str
    category: str | None = None
    max_results: int = 5

class MatchResult(BaseModel):
    professional_id: str
    name: str
    match_percentage: float
    explanation: str
    source: str  # "registered" | "youtube" | "web"
    avatar_url: str | None = None

@router.post("/search", response_model=list[MatchResult])
async def search_professionals(
    request: SearchRequest,
    user = Depends(get_current_user),
    gemini = Depends(GeminiService),
    vector_store = Depends(VectorStore)
):
    # 1. Generar embedding de la query
    query_embedding = await gemini.generate_embedding(request.query)
    
    # 2. Búsqueda semántica en pgvector
    candidates = await vector_store.search(
        embedding=query_embedding,
        limit=20,
        filters={"category": request.category} if request.category else None
    )
    
    # 3. Reranking con Gemini
    results = await gemini.rerank_and_explain(
        query=request.query,
        candidates=candidates,
        max_results=request.max_results
    )
    
    return results
```

---

## 4. Gemini AI - Integración Detallada

### 4.1 Servicio de Gemini

```python
# backend/app/services/gemini_service.py
import google.generativeai as genai
from app.core.config import settings

genai.configure(api_key=settings.GEMINI_API_KEY)

class GeminiService:
    def __init__(self):
        self.model = genai.GenerativeModel('gemini-pro')
        self.embedding_model = 'models/text-embedding-004'
    
    async def generate_embedding(self, text: str) -> list[float]:
        """Genera embedding para búsqueda semántica"""
        result = genai.embed_content(
            model=self.embedding_model,
            content=text,
            task_type="retrieval_query"
        )
        return result['embedding']
    
    async def generate_profile_embedding(self, markdown_content: str) -> list[float]:
        """Genera embedding para un perfil completo"""
        result = genai.embed_content(
            model=self.embedding_model,
            content=markdown_content,
            task_type="retrieval_document"
        )
        return result['embedding']
    
    async def rerank_and_explain(
        self,
        query: str,
        candidates: list[dict],
        max_results: int = 5
    ) -> list[dict]:
        """
        Reranking semántico + generación de explicaciones
        """
        # Preparar contexto para Gemini
        context = self._build_reranking_context(query, candidates)
        
        prompt = f"""
        Eres un experto en recursos humanos para la industria de alimentos.
        
        Un empresario busca: "{query}"
        
        Estos son los candidatos potenciales:
        {context}
        
        Tu tarea:
        1. Selecciona los {max_results} candidatos MÁS relevantes
        2. Para cada uno, genera:
           - match_percentage (0-100)
           - explanation (2-3 oraciones explicando POR QUÉ es buen match)
        
        Responde en JSON:
        {{
            "results": [
                {{
                    "professional_id": "id",
                    "match_percentage": 95,
                    "explanation": "María tiene 8 años reformulando productos..."
                }}
            ]
        }}
        """
        
        response = await self.model.generate_content_async(prompt)
        return self._parse_response(response.text, candidates)
    
    def _build_reranking_context(self, query: str, candidates: list[dict]) -> str:
        """Construye contexto legible para Gemini"""
        context_parts = []
        for i, candidate in enumerate(candidates, 1):
            context_parts.append(f"""
            Candidato {i}:
            - ID: {candidate['id']}
            - Nombre: {candidate['name']}
            - Experiencia: {candidate.get('experience_years', 'N/A')} años
            - Especialidades: {', '.join(candidate.get('specialties', []))}
            - Fuentes: {', '.join(candidate.get('sources', []))}
            - Resumen: {candidate.get('summary', 'N/A')}
            """)
        return "\n".join(context_parts)
```

### 4.2 Pipeline de procesamiento de fuentes externas

```python
# backend/app/tasks/external_ingestion.py
from celery import Celery
from app.services.youtube_service import YouTubeService
from app.services.web_scraper import WebScraper
from app.services.gemini_service import GeminiService

celery_app = Celery('foodtalent')

@celery_app.task(name="tasks.ingest_youtube")
def ingest_youtube_content(channel_ids: list[str]):
    """
    Ingesta contenido de YouTube:
    1. Busca videos recientes de canales de la industria
    2. Extrae transcripciones
    3. Identifica expertos mencionados
    4. Crea perfiles preliminares
    """
    youtube = YouTubeService()
    gemini = GeminiService()
    
    for channel_id in channel_ids:
        videos = youtube.get_recent_videos(channel_id, limit=10)
        
        for video in videos:
            # Obtener transcripción
            transcript = youtube.get_transcript(video['id'])
            
            if transcript:
                # Analizar con Gemini para identificar expertos
                experts = gemini.identify_experts_from_content(transcript)
                
                for expert in experts:
                    # Crear perfil preliminar
                    create_pending_profile(expert, source="youtube")
                    
                    # Generar embedding
                    embedding = gemini.generate_profile_embedding(expert['summary'])
                    store_embedding(expert['id'], embedding)

@celery_app.task(name="tasks.ingest_web_content")
def ingest_web_content(search_queries: list[str]):
    """
    Ingesta contenido de blogs y sitios web:
    1. Usa Google Custom Search para encontrar artículos relevantes
    2. Scraping ético de contenido
    3. Identifica autores y expertos
    4. Crea perfiles preliminares
    """
    scraper = WebScraper()
    gemini = GeminiService()
    
    for query in search_queries:
        articles = scraper.search_articles(query, limit=20)
        
        for article in articles:
            content = scraper.extract_content(article['url'])
            
            if content:
                # Analizar contenido para identificar expertos
                experts = gemini.identify_experts_from_content(content)
                
                for expert in experts:
                    create_pending_profile(expert, source="web")
                    embedding = gemini.generate_profile_embedding(expert['summary'])
                    store_embedding(expert['id'], embedding)
```

---

## 5. Fuentes de Datos - Implementación

### 5.1 YouTube Data API v3

```python
# backend/app/services/youtube_service.py
from googleapiclient.discovery import build
from youtube_transcript_api import YouTubeTranscriptApi
from app.core.config import settings

class YouTubeService:
    def __init__(self):
        self.youtube = build('youtube', 'v3', developerKey=settings.YOUTUBE_API_KEY)
    
    def search_food_experts(self, query: str, max_results: int = 50) -> list[dict]:
        """Busca videos de expertos en alimentos"""
        request = self.youtube.search().list(
            part="snippet",
            q=f"alimentos experto {query}",
            type="video",
            videoDuration="medium",  # 4-20 minutos
            order="relevance",
            maxResults=max_results,
            regionCode="CO",  # Ajustar según mercado objetivo
            relevanceLanguage="es"
        )
        response = request.execute()
        
        return [{
            'video_id': item['id']['videoId'],
            'title': item['snippet']['title'],
            'channel_id': item['snippet']['channelId'],
            'channel_title': item['snippet']['channelTitle'],
            'description': item['snippet']['description'],
            'published_at': item['snippet']['publishedAt']
        } for item in response['items']]
    
    def get_transcript(self, video_id: str) -> str | None:
        """Obtiene transcripción del video"""
        try:
            transcript_list = YouTubeTranscriptApi.get_transcript(
                video_id, 
                languages=['es', 'en']
            )
            return ' '.join([t['text'] for t in transcript_list])
        except Exception:
            return None
    
    def get_channel_videos(self, channel_id: str, max_results: int = 10) -> list[dict]:
        """Obtiene videos recientes de un canal específico"""
        request = self.youtube.channels().list(
            part="contentDetails",
            id=channel_id
        )
        response = request.execute()
        
        if not response['items']:
            return []
        
        uploads_playlist = response['items'][0]['contentDetails']['relatedPlaylists']['uploads']
        
        request = self.youtube.playlistItems().list(
            part="snippet",
            playlistId=uploads_playlist,
            maxResults=max_results
        )
        response = request.execute()
        
        return [{
            'video_id': item['snippet']['resourceId']['videoId'],
            'title': item['snippet']['title'],
            'published_at': item['snippet']['publishedAt']
        } for item in response['items']]
```

### 5.2 Web Scraping Ético

```python
# backend/app/services/web_scraper.py
import httpx
from bs4 import BeautifulSoup
from urllib.parse import urlparse
import time

class WebScraper:
    # Dominios permitidos (blogs de la industria alimentaria)
    ALLOWED_DOMAINS = [
        'foodnavigator.com',
        'fooddive.com',
        'foodprocessing.com',
        'supermarketperimeter.com',
        'meatpoultry.com',
        'dairyprocessing.com',
        'bakeryandsnacks.com'
    ]
    
    def __init__(self):
        self.client = httpx.AsyncClient(
            headers={
                'User-Agent': 'FoodTalentBot/1.0 (busqueda de expertos)'
            },
            follow_redirects=True,
            timeout=30.0
        )
    
    async def search_articles(self, query: str, limit: int = 20) -> list[dict]:
        """Busca artículos usando Google Custom Search"""
        # Implementación con Google Custom Search API
        # (requiere API key de Google)
        pass
    
    async def extract_content(self, url: str) -> str | None:
        """Extrae contenido de artículo de forma ética"""
        parsed_url = urlparse(url)
        
        # Verificar si el dominio está permitido
        if parsed_url.netloc not in self.ALLOWED_DOMAINS:
            return None
        
        try:
            response = await self.client.get(url)
            response.raise_for_status()
            
            soup = BeautifulSoup(response.text, 'html.parser')
            
            # Extraer contenido principal
            article = soup.find('article') or soup.find('main')
            
            if article:
                # Eliminar elementos no deseados
                for element in article.find_all(['script', 'style', 'nav', 'footer']):
                    element.decompose()
                
                return article.get_text(separator='\n', strip=True)
            
            return None
            
        except Exception:
            return None
        
        finally:
            # Respetar rate limits
            await asyncio.sleep(1)
```

---

## 6. UX, Accesibilidad y Neuroweb Design

### 6.1 Principios de UX

| Principio | Implementación |
|-----------|----------------|
| **Búsqueda central** | Barra prominente con placeholder rotativo que muestra ejemplos reales |
| **Feedback inmediato** | Estados de carga con mensajes progresivos (no "Cargando...") |
| **Máximo 5 resultados** | Evita sobrecarga cognitiva, facilita decisión |
| **Fuente visible** | Badge claro: "Perfil verificado" / "YouTube" / "Web" |
| **Acción clara** | CTA "Conversar con [nombre]" personalizado |

### 6.2 Neuroweb Design

```tsx
// frontend/app/page.tsx - Búsqueda principal
export default function HomePage() {
  const [query, setQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [results, setResults] = useState([]);
  
  // Placeholders rotativos (neuroweb: anclaje + concreción)
  const placeholders = [
    "Ej: necesito reducir el sodio en mi salsa sin perder vida útil",
    "Ej: busco alguien que me ayude con el etiquetado nutricional",
    "Ej: mi planta tiene problemas de productividad en la línea de envasado",
    "Ej: necesito formular un producto sin gluten que sea rentable"
  ];
  
  return (
    <main className="min-h-screen bg-gradient-to-b from-orange-50 to-white">
      {/* Hero Section */}
      <section className="pt-20 pb-16 px-4">
        <div className="max-w-3xl mx-auto text-center">
          {/* Título con anclaje cognitivo */}
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
            ¿Qué reto de tu planta necesitas resolver hoy?
          </h1>
          
          {/* Subtítulo de ayuda */}
          <p className="text-lg text-gray-600 mb-8">
            Descríbelo como se lo contarías a un colega — entre más detalle, mejor el match
          </p>
          
          {/* Barra de búsqueda prominente */}
          <SearchBar 
            query={query}
            setQuery={setQuery}
            placeholders={placeholders}
            onSearch={handleSearch}
            isSearching={isSearching}
          />
          
          {/* Chips de categoría */}
          <div className="flex flex-wrap justify-center gap-2 mt-6">
            {CATEGORIES.map(category => (
              <CategoryChip 
                key={category.id}
                category={category}
                selected={selectedCategory === category.id}
                onClick={() => setSelectedCategory(category.id)}
              />
            ))}
          </div>
        </div>
      </section>
      
      {/* Resultados */}
      {results.length > 0 && (
        <ResultsSection 
          results={results}
          query={query}
        />
      )}
    </main>
  );
}
```

### 6.3 Accesibilidad (WCAG 2.1 AA)

```tsx
// frontend/components/SearchBar.tsx
export function SearchBar({ query, setQuery, placeholders, onSearch, isSearching }) {
  const [currentPlaceholder, setCurrentPlaceholder] = useState(0);
  const inputRef = useRef(null);
  
  // Rotación de placeholders (con pausa en prefers-reduced-motion)
  useEffect(() => {
    const prefersReducedMotion = window.matchMedia(
      '(prefers-reduced-motion: reduce)'
    ).matches;
    
    if (prefersReducedMotion) return;
    
    const interval = setInterval(() => {
      setCurrentPlaceholder(prev => (prev + 1) % placeholders.length);
    }, 3000);
    
    return () => clearInterval(interval);
  }, [placeholders.length]);
  
  return (
    <div className="relative">
      <label htmlFor="search-input" className="sr-only">
        Describe tu necesidad
      </label>
      
      <input
        ref={inputRef}
        id="search-input"
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder={placeholders[currentPlaceholder]}
        className={`
          w-full px-6 py-4 text-lg rounded-xl
          border-2 border-gray-200 
          focus:border-orange-500 focus:ring-4 focus:ring-orange-100
          transition-all duration-200
          aria-invalid:border-red-500 aria-invalid:ring-red-100
        `}
        aria-describedby="search-hint"
        aria-invalid={query.length > 0 && query.length < 10}
      />
      
      <p id="search-hint" className="sr-only">
        Escribe al menos 10 caracteres para obtener mejores resultados
      </p>
      
      <button
        onClick={onSearch}
        disabled={isSearching || query.length < 10}
        className={`
          absolute right-2 top-1/2 -translate-y-1/2
          px-6 py-2 rounded-lg font-semibold
          transition-all duration-200
          ${isSearching 
            ? 'bg-orange-400 cursor-wait' 
            : 'bg-orange-500 hover:bg-orange-600 active:scale-95'
          }
          disabled:opacity-50 disabled:cursor-not-allowed
        `}
        aria-busy={isSearching}
        aria-live="polite"
      >
        {isSearching ? (
          <>
            <Spinner className="inline-block mr-2" />
            Buscando...
          </>
        ) : (
          'Buscar experto'
        )}
      </button>
    </div>
  );
}
```

### 6.4 Responsive Design (Mobile-First)

```tsx
// frontend/components/ResultCard.tsx
export function ResultCard({ result }) {
  return (
    <article 
      className={`
        bg-white rounded-xl shadow-md overflow-hidden
        transition-all duration-200 hover:shadow-lg
        min-w-[280px] max-w-sm
        md:min-w-[320px] md:max-w-md
      `}
      aria-labelledby={`result-name-${result.professional_id}`}
    >
      {/* Imagen + Badge de fuente */}
      <div className="relative h-32 bg-gradient-to-r from-orange-400 to-orange-600">
        {result.avatar_url ? (
          <img 
            src={result.avatar_url} 
            alt="" 
            className="w-20 h-20 rounded-full border-4 border-white absolute bottom-0 left-4 translate-y-1/2"
          />
        ) : (
          <div 
            className="w-20 h-20 rounded-full border-4 border-white absolute bottom-0 left-4 translate-y-1/2 bg-orange-200 flex items-center justify-center"
            aria-hidden="true"
          >
            <span className="text-2xl font-bold text-orange-600">
              {result.name.charAt(0)}
            </span>
          </div>
        )}
        
        {/* Badge de fuente */}
        <SourceBadge source={result.source} />
      </div>
      
      {/* Contenido */}
      <div className="p-4 pt-12">
        <h3 
          id={`result-name-${result.professional_id}`}
          className="text-lg font-semibold text-gray-900 mb-1"
        >
          {result.name}
        </h3>
        
        {/* Match percentage */}
        <div className="flex items-center gap-2 mb-3">
          <MatchPercentage percentage={result.match_percentage} />
          <span className="text-sm text-gray-500">de match</span>
        </div>
        
        {/* Explicación */}
        <p className="text-gray-600 text-sm mb-4 line-clamp-3">
          {result.explanation}
        </p>
        
        {/* CTA */}
        <button
          className={`
            w-full py-3 px-4 rounded-lg font-semibold
            bg-orange-500 text-white
            hover:bg-orange-600 
            focus:ring-4 focus:ring-orange-200
            transition-all duration-200
            active:scale-[0.98]
            min-h-[44px] min-w-[44px]
          `}
          aria-label={`Conversar con ${result.name}`}
        >
          Conversar con {result.name.split(' ')[0]}
        </button>
      </div>
    </article>
  );
}

function MatchPercentage({ percentage }) {
  // Color coding neuroweb: verde para alto, naranja para medio
  const color = percentage >= 80 ? 'text-green-600' : 
                percentage >= 60 ? 'text-orange-500' : 'text-gray-500';
  
  return (
    <div 
      className={`flex items-center gap-1 font-bold ${color}`}
      role="meter"
      aria-valuenow={percentage}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label={`${percentage}% de compatibilidad`}
    >
      <span className="text-2xl">{percentage}</span>
      <span className="text-sm">%</span>
    </div>
  );
}

function SourceBadge({ source }) {
  const badges = {
    registered: { label: 'Perfil verificado', color: 'bg-green-500' },
    youtube: { label: 'YouTube', color: 'bg-red-500' },
    web: { label: 'Web/Blog', color: 'bg-blue-500' }
  };
  
  const badge = badges[source] || badges.registered;
  
  return (
    <span 
      className={`
        absolute top-2 right-2 
        px-2 py-1 rounded-full 
        text-xs font-medium text-white
        ${badge.color}
      `}
    >
      {badge.label}
    </span>
  );
}
```

### 6.5 Estados de Carga (Neuroweb Design)

```tsx
// frontend/components/LoadingStates.tsx
export function SearchLoadingState({ progress }) {
  const messages = [
    { threshold: 0, text: "Analizando tu caso..." },
    { threshold: 3000, text: "Comparando tu reto con nuestra red de expertos..." },
    { threshold: 8000, text: "Ya casi — estamos afinando las recomendaciones" }
  ];
  
  const currentMessage = messages.reduce((prev, curr) => 
    progress >= curr.threshold ? curr : prev
  );
  
  return (
    <div 
      className="text-center py-12"
      role="status"
      aria-live="polite"
    >
      {/* Animación de carga (neuroweb: mantener atención) */}
      <div className="flex justify-center gap-2 mb-4">
        {[0, 1, 2].map(i => (
          <div
            key={i}
            className="w-3 h-3 rounded-full bg-orange-500 animate-bounce"
            style={{ animationDelay: `${i * 0.15}s` }}
            aria-hidden="true"
          />
        ))}
      </div>
      
      <p className="text-lg text-gray-700 font-medium">
        {currentMessage.text}
      </p>
      
      {/* Indicador de progreso sutil */}
      <div className="mt-4 w-48 mx-auto bg-gray-200 rounded-full h-1">
        <div 
          className="bg-orange-500 h-1 rounded-full transition-all duration-500"
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  );
}
```

---

## 7. Base de Datos y Modelos

### 7.1 Modelo de Profesional

```sql
-- backend/app/db/models.py (SQLAlchemy)
from sqlalchemy import Column, String, Integer, Float, Boolean, JSON, DateTime
from sqlalchemy.dialects.postgresql import ARRAY, TSVECTOR
from pgvector.sqlalchemy import Vector
from datetime import datetime

class Professional(Base):
    __tablename__ = "professionals"
    
    id = Column(String, primary_key=True)
    name = Column(String, nullable=False)
    email = Column(String, unique=True)
    
    # Datos estructurados
    specialties = Column(ARRAY(String))  # ["formulación", "regulatorio"]
    experience_years = Column(Integer)
    availability = Column(String)  # "inmediata", "2 semanas", etc.
    
    # Contenido
    summary = Column(String)  # Resumen para embedding
    markdown_content = Column(String)  # Perfil completo en Markdown
    
    # Fuentes
    source = Column(String)  # "registered", "youtube", "web"
    sources = Column(JSON)  # ["youtube:abc123", "web:foodnavigator.com"]
    
    # Embedding para búsqueda semántica
    embedding = Column(Vector(768))  # Dimensión de Gemini embeddings
    
    # Metadata
    is_verified = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, onupdate=datetime.utcnow)
    
    # Índices para búsqueda eficiente
    __table_args__ = (
        Index('idx_professionals_embedding', 'embedding', postgresql_using='ivfflat'),
        Index('idx_professionals_source', 'source'),
        Index('idx_professionals_specialties', 'specialties', postgresql_using='gin'),
    )
```

### 7.2 Búsqueda Semántica con pgvector

```python
# backend/app/services/vector_store.py
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, text
from app.db.models import Professional

class VectorStore:
    def __init__(self, session: AsyncSession):
        self.session = session
    
    async def search_similar(
        self,
        embedding: list[float],
        limit: int = 20,
        filters: dict = None
    ) -> list[dict]:
        """
        Búsqueda semántica usando pgvector
        """
        # Construir query base
        query = select(
            Professional.id,
            Professional.name,
            Professional.summary,
            Professional.specialties,
            Professional.source,
            Professional.sources,
            Professional.markdown_content,
            # Calcular similitud coseno
            (1 - Professional.embedding.cosine_distance(embedding)).label('similarity')
        )
        
        # Aplicar filtros
        if filters:
            if 'category' in filters:
                query = query.where(
                    Professional.specialties.contains([filters['category']])
                )
            if 'availability' in filters:
                query = query.where(
                    Professional.availability == filters['availability']
                )
        
        # Ordenar por similitud y limitar
        query = query.order_by(text('similarity DESC')).limit(limit)
        
        result = await self.session.execute(query)
        rows = result.all()
        
        return [{
            'id': row.id,
            'name': row.name,
            'summary': row.summary,
            'specialties': row.specialties,
            'source': row.source,
            'sources': row.sources,
            'markdown_content': row.markdown_content,
            'similarity': float(row.similarity)
        } for row in rows]
```

---

## 8. Frontend - Estructura de Componentes

### 8.1 Árbol de componentes

```
frontend/
├── app/
│   ├── layout.tsx           # Layout raíz con providers
│   ├── page.tsx             # Página principal (búsqueda)
│   ├── results/
│   │   └── page.tsx         # Página de resultados
│   ├── profile/
│   │   └── [id]/
│   │       └── page.tsx     # Perfil completo
│   └── dashboard/
│       └── page.tsx         # Dashboard del empresario
├── components/
│   ├── ui/                  # shadcn/ui components
│   ├── search/
│   │   ├── SearchBar.tsx
│   │   ├── CategoryChip.tsx
│   │   └── LoadingStates.tsx
│   ├── results/
│   │   ├── ResultCard.tsx
│   │   ├── ResultsGrid.tsx
│   │   ├── MatchPercentage.tsx
│   │   └── SourceBadge.tsx
│   └── profile/
│       ├── ProfileHeader.tsx
│       ├── ProjectsList.tsx
│       └── ContactButton.tsx
├── hooks/
│   ├── useSearch.ts
│   └── useProfile.ts
├── lib/
│   ├── api.ts               # Cliente API
│   └── utils.ts
└── styles/
    └── globals.css
```

### 8.2 Cliente API

```typescript
// frontend/lib/api.ts
const API_URL = process.env.NEXT_PUBLIC_API_URL;

export async function searchProfessionals(
  query: string,
  category?: string
): Promise<SearchResult[]> {
  const response = await fetch(`${API_URL}/api/search`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${getAuthToken()}`
    },
    body: JSON.stringify({ query, category })
  });
  
  if (!response.ok) {
    throw new Error('Error en la búsqueda');
  }
  
  return response.json();
}

export async function getProfessionalProfile(
  id: string
): Promise<ProfessionalProfile> {
  const response = await fetch(`${API_URL}/api/professionals/${id}`, {
    headers: {
      'Authorization': `Bearer ${getAuthToken()}`
    }
  });
  
  if (!response.ok) {
    throw new Error('Error al obtener perfil');
  }
  
  return response.json();
}
```

---

## 9. Roadmap de Implementación

### Fase 1: MVP (4 semanas)

- [ ] Setup de proyecto Next.js + FastAPI
- [ ] Autenticación básica (FastAPI-Users)
- [ ] Formulario de registro de profesionales
- [ ] Conversor de formulario a Markdown
- [ ] Búsqueda semántica básica con pgvector
- [ ] Integración Gemini para embeddings
- [ ] Frontend: barra de búsqueda + resultados básicos

### Fase 2: Fuentes Externas (3 semanas)

- [ ] Integración YouTube Data API v3
- [ ] Scraping de transcripciones
- [ ] Google Custom Search para blogs/web
- [ ] Tareas Celery para ingesta asíncrona
- [ ] Detección automática de expertos

### Fase 3: UX y Neuroweb (2 semanas)

- [ ] Estados de carga con mensajes progresivos
- [ ] Animaciones y microinteracciones
- [ ] Responsive design completo
- [ ] Accesibilidad WCAG 2.1 AA
- [ ] Testing de usabilidad

### Fase 4: Funcionalidades Avanzadas (3 semanas)

- [ ] Sistema de reputación y calificaciones
- [ ] Chat interno empresario-profesional
- [ ] Notificaciones por email
- [ ] Dashboard de historial de búsquedas

### Fase 5: Producción (2 semanas)

- [ ] Deploy en Vercel (frontend) + Railway/Render (backend)
- [ ] Monitoreo y logging
- [ ] Optimización de rendimiento
- [ ] Documentación de API

---

## 10. Checklist de Requisitos

| Requisito | Estado | Implementación |
|-----------|--------|----------------|
| **UX** | ✅ | Barra central, 5 resultados, feedback inmediato |
| **Accesibilidad** | ✅ | WCAG 2.1 AA, ARIA labels, navegación teclado |
| **Responsive** | ✅ | Mobile-first, breakpoints 360/768/1024px |
| **Neuroweb Design** | ✅ | Máximo 5-7 elementos, anclaje cognitivo, microanimaciones |
| **Sin Facebook** | ✅ | No se usa |
| **Sin LinkedIn** | ✅ | No se usa |
| **YouTube** | ✅ | Data API v3 + transcripciones |
| **Blogs/Web** | ✅ | Google Custom Search + scraping ético |
| **Gemini AI** | ✅ | Embeddings + reranking + explicaciones |

---

## 11. Notas Adicionales

### 11.1 Costos estimados (pruebas)

| Servicio | Costo mensual estimado |
|----------|------------------------|
| Vercel (frontend) | Gratis (hobby) |
| Railway/Render (backend) | $5-20 USD |
| PostgreSQL (Neon/Supabase) | Gratis (hobby) |
| Redis (Upstash) | Gratis (hobby) |
| Gemini API | Gratis (tier gratuito) |
| YouTube Data API | Gratis (cuota generosa) |
| Google Custom Search | Gratis (100 queries/día) |

### 11.2 Seguridad

- Autenticación JWT con refresh tokens
- Rate limiting en endpoints públicos
- Validación de entrada con Pydantic
- HTTPS obligatorio en producción
- Variables de entorno para secrets (nunca en código)

### 11.3 Escalabilidad futura

- Migración de pgvector a Pinecone/Weaviate si el volumen crece
- CDN para assets estáticos
- Cache de resultados de búsqueda frecuentes
- Microservicios si la carga lo requiere
