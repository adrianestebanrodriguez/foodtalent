import google.generativeai as genai
from google.api_core import exceptions as google_exceptions
from app.core.config import get_settings
import json
import re
import random

settings = get_settings()


def _build_key_pool() -> list[str]:
    raw = settings.GEMINI_API_KEY
    if not raw:
        return []
    keys = [k.strip() for k in raw.replace("\n", ",").split(",") if k.strip()]
    random.shuffle(keys)
    return keys


KEY_POOL = _build_key_pool()
_KEY_INDEX = 0


def _get_next_key() -> str:
    global _KEY_INDEX
    if not KEY_POOL:
        return ""
    key = KEY_POOL[_KEY_INDEX % len(KEY_POOL)]
    _KEY_INDEX += 1
    return key


def _configure_genai(key: str):
    genai.configure(api_key=key)


if KEY_POOL:
    _configure_genai(KEY_POOL[0])


METAPROMPT = """Eres el motor de busqueda de FoodTalent, plataforma que conecta empresas de alimentos con expertos.

## CONTEXTO
Sectores: Carnicos, lacteos, panaderia, snacks, bebidas, congelados, alimentos funcionales, suplementos, ingredientes.
Areas: Formulacion, procesos, calidad/inocuidad (HACCP/BPM/ISO), regulatorio, I+D, innovacion, sostenibilidad, transformacion digital.

## BLOQUES DE ENTRADA

Recibiras dos bloques:

1. `<reto_empresa>` — Descripcion del problema tecnico, formulacion, regulacion o proceso que necesita resolver la empresa.
2. `<candidatos_recuperados>` — Informacion detallada de 1 a 5 profesionales encontrados en la base de datos, incluyendo:
   - Especialidades
   - Anos de experiencia
   - Resumen de experiencia
   - Productos de investigacion / desarrollo (con enlaces cuando existen)
   - Ultima experiencia laboral (cliente, descripcion, logro obtenido)
   - Disponibilidad, ubicacion, tarifa

## PROCESO DE RAZONAMIENTO (Paso a Paso)

Antes de dar tu respuesta final, analiza internamente siguiendo estos pasos:

### Paso 1: Diagnosticar la raiz tecnica del reto
Identifica cual es el problema de fondo. Ejemplos:
- "El cliente necesita reformular un aderezo para reducir grasa sin perder textura ni vida util" → raiz: reologia de emulsiones y estabilidad microbiologica.
- "Requiere cumplir con el nuevo rotulado Nutriscore para exportar a Europa" → raiz: regulatorio y calculo nutritional.
- "Tiene problemas de productividad en linea de envasado" → raiz: ingenieria de procesos y layout industrial.
- "Busca un sustituto de gelatina animal por una opcion vegetal" → raiz: formulacion con hidrocoloides alternativos y textura.

### Paso 2: Analizar cada candidato contra la raiz del problema
Para cada profesional en `<candidatos_recuperados>`, evalua:

| Campo del perfil | Que buscar |
|---|---|
| **Especialidades** | Coincidencia directa con la raiz tecnica (ej. "hidrocoloides" para textura, "HACCP" para inocuidad) |
| **Anos de experiencia** | Anos relevantes en el area especifica, no solo en industria en general |
| **Resumen** | Evidencia de haber resuelto problemas similares |
| **Productos de investigacion/desarrollo** | Proyectos, patentes o publicaciones concretas relacionados al reto |
| **Ultima experiencia** | Cliente, descripcion de trabajo y logro obtenido que demuestre impacto real |
| **Ubicacion / disponibilidad** | Facilidad para trabajar juntos (presencial vs remoto) |

### Paso 3: Asignar Puntaje de Match (escala 70%-100%)
Usa esta escala afinada para matches viables:

| Rango | Significado |
|---|---|
| 95-100 | Experiencia DIRECTA Y DEMOSTRABLE: tiene productos de I+D, especialidades y logros exactamente en este nicho |
| 85-94 | Experiencia muy solida: ha trabajado en problemas casi identicos, le falta tal vez un detalle menor |
| 75-84 | Experiencia relevante: areas cercanas, con capacidad clara de resolverlo pero sin evidencia exacta |
| 70-74 | Experiencia parcial: toca areas relacionadas pero necesitaria contexto adicional |

Usa todo el rango (70-100), no te quedes solo en 70 u 80. Si la evidencia es solida y directa, asigna 90+.
El porcentaje debe reflejar la afinidad REAL entre el perfil completo del profesional y el reto.

### Paso 4: Redactar la explanation
Escribe 2-3 oraciones en espanol que sean:
- **Especificas:** Menciona las especialidades, productos o logros concretos que justifican el match.
- **Accionables:** Explica POR QUE ese profesional en particular puede resolver el reto.
- Ejemplo: "Maria tiene 12 anos de experiencia en formulacion de aderezos y desarrollo una linea de mayonesas reducidas en grasa con hidrocoloides (producto: 'MayoFit'). Su ultimo logro fue reducir en un 30% los costos de materia prima en Aderezos SA optimizando la emulsion, lo que se alinea directamente con tu necesidad de reformular sin perder textura."

## CRITERIOS DE PONDERACION (resumen)
1. **Alineacion con la raiz tecnica del reto (40%)**
2. **Evidencia concreta en productos de I+D y ultima experiencia (30%)**
3. **Profundidad de especialidades y anos relevantes (20%)**
4. **Disponibilidad y ubicacion (10%)**

## REGLAS FINALES
- Selecciona solo los {max_results} MEJORES candidatos
- Si un candidato no tiene relacion con el reto, NO lo incluyas en los resultados
- Asigna match_percentage SOLO entre 70 y 100
- Responde SOLO JSON valido, sin markdown, sin backticks, sin texto adicional

Formato de respuesta:
{{"results":[{{"professional_id":1,"match_percentage":92,"explanation":"Maria tiene 12 anos en formulacion de aderezos y desarrollo MayoFit, una mayonesa reducida en grasa. Su logro en Aderezos SA (30% menos costo) demuestra que puede resolver tu reto de reformulacion sin perder textura."}}]}}
"""


class GeminiService:
    def __init__(self):
        self.model = genai.GenerativeModel("models/gemini-2.0-flash")
        self.embedding_model = "models/gemini-embedding-001"

    async def generate_embedding(self, text: str) -> list[float]:
        result = genai.embed_content(
            model=self.embedding_model,
            content=text,
            task_type="retrieval_query",
            output_dimensionality=768,
        )
        return result["embedding"]

    async def generate_profile_embedding(self, markdown_content: str) -> list[float]:
        result = genai.embed_content(
            model=self.embedding_model,
            content=markdown_content,
            task_type="retrieval_document",
            output_dimensionality=768,
        )
        return result["embedding"]

    def _nivel_match(self, porcentaje: float) -> str:
        if porcentaje >= 80:
            return "Match alto"
        if porcentaje >= 60:
            return "Match relevante"
        return "Match posible"

    async def rerank_and_explain(
        self, query: str, candidates: list[dict], max_results: int = 5
    ) -> list[dict]:
        context = self._build_reranking_context(candidates)
        prompt = METAPROMPT.format(max_results=max_results)
        full_prompt = f"{prompt}\n\n## DESAFIO DEL CLIENTE\n\"{query}\"\n\n## CANDIDATOS DISPONIBLES\n\n{context}"

        max_retries = max(len(KEY_POOL), 1)
        last_error = None

        for attempt in range(max_retries):
            try:
                if attempt > 0 and KEY_POOL:
                    new_key = _get_next_key()
                    _configure_genai(new_key)
                    self.model = genai.GenerativeModel("models/gemini-2.0-flash")
                    print(f"[Gemini] Retry {attempt + 1} with rotated key", flush=True)

                response = await self.model.generate_content_async(
                    full_prompt,
                    generation_config=genai.types.GenerationConfig(
                        temperature=0.2,
                        max_output_tokens=2048,
                    ),
                )
                return self._parse_response(response.text, candidates)
            except google_exceptions.ResourceExhausted as e:
                last_error = e
                print(f"[Gemini] Quota exceeded (attempt {attempt + 1}): {e}", flush=True)
                if attempt < max_retries - 1:
                    import asyncio
                    await asyncio.sleep(2)
                    continue
            except Exception as e:
                print(f"[Gemini] Reranking error: {e}", flush=True)
                if attempt < max_retries - 1 and KEY_POOL:
                    continue
                break

        print(f"[Gemini] All {max_retries} keys exhausted, falling back to similarity sort", flush=True)
        return [
            {
                "professional_id": c.get("id"),
                "name": c.get("name", "N/A"),
                "match_percentage": round(c.get("similarity", 0) * 100),
                "nivel_match": self._nivel_match(round(c.get("similarity", 0) * 100)),
                "explanation": f"Perfil relevante por experiencia en {', '.join(c.get('specialties', []))}",
                "source": c.get("source", "registered"),
                "avatar_url": c.get("avatar_url"),
                "specialties": c.get("specialties", []),
                "experience_years": c.get("experience_years", 0),
                "location": c.get("location"),
                "video_url": c.get("video_url"),
                "article_url": c.get("article_url"),
                "channel_name": c.get("channel_name"),
                "site_name": c.get("site_name"),
            }
            for c in sorted(candidates, key=lambda x: x.get("similarity", 0), reverse=True)[:max_results]
        ]

    async def identify_experts_from_content(self, content: str) -> list[dict]:
        prompt = f"""Analiza el siguiente contenido sobre la industria de alimentos e identifica profesionales o expertos mencionados.

Contenido:
{content[:3000]}

Para cada experto encontrado, extrae:
- name: nombre completo
- specialties: areas de especializacion (array)
- summary: resumen de su experiencia (2-3 oraciones)

Responde UNICAMENTE con JSON valido (sin markdown, sin backticks):
{{
    "experts": [
        {{
            "name": "Juan Perez",
            "specialties": ["formulacion", "procesos"],
            "summary": "Ingeniero de alimentos con 10 anos de experiencia..."
        }}
    ]
}}"""

        response = await self.model.generate_content_async(prompt)
        try:
            text = response.text.strip()
            if text.startswith("```"):
                text = text.split("\n", 1)[1].rsplit("```", 1)[0].strip()
            data = json.loads(text)
            return data.get("experts", [])
        except (json.JSONDecodeError, IndexError):
            return []

    def _build_reranking_context(self, candidates: list[dict]) -> str:
        parts = []
        for i, c in enumerate(candidates, 1):
            specialties = ", ".join(c.get("specialties", []))
            research = c.get("research_products", [])
            last_exp = c.get("last_experience")

            research_text = "Ninguno"
            if research:
                items = []
                for p in research[:3]:
                    name = p.get("name", "")
                    url = p.get("url", "")
                    if name:
                        items.append(f"  - {name}" + (f" ({url})" if url else ""))
                research_text = "\n" + "\n".join(items) if items else "Ninguno"

            experience_text = "No especificada"
            if last_exp and (last_exp.get("client") or last_exp.get("description")):
                parts_exp = []
                if last_exp.get("client"):
                    parts_exp.append(f"Cliente: {last_exp['client']}")
                if last_exp.get("description"):
                    parts_exp.append(f"Que hizo: {last_exp['description'][:150]}")
                if last_exp.get("achievement"):
                    parts_exp.append(f"Logro: {last_exp['achievement'][:150]}")
                experience_text = " | ".join(parts_exp)

            summary = c.get("summary", "N/A")
            if len(summary) > 400:
                summary = summary[:400] + "..."

            parts.append(
                f"""--- CANDIDATO {i} (ID: {c.get('id', 'N/A')}) ---
Nombre: {c.get('name', 'N/A')}
Fuente: {c.get('source', 'registered')}
Experiencia: {c.get('experience_years', 'N/A')} anos
Especialidades: {specialties}
Ubicacion: {c.get('location', 'No especificada')}
Disponibilidad: {c.get('availability', 'No especificada')}
Tarifa: {c.get('hourly_rate', 'No especificada')} USD/hr
Verificado: {"Si" if c.get('is_verified') else "No"}

Resumen de experiencia:
{summary}

Productos de investigacion / desarrollo:
{research_text}

Ultima experiencia laboral:
{experience_text}"""
            )
        return "\n\n".join(parts)

    def _parse_response(self, text: str, candidates: list[dict]) -> list[dict]:
        try:
            clean = text.strip()
            if clean.startswith("```"):
                clean = clean.split("\n", 1)[1].rsplit("```", 1)[0].strip()
            data = json.loads(clean)
            results = data.get("results", [])
            enriched = []
            for r in results:
                candidate = next(
                    (c for c in candidates if c.get("id") == r.get("professional_id")),
                    {},
                )
                enriched.append(
                    {
                        "professional_id": r.get("professional_id"),
                        "name": candidate.get("name", "N/A"),
                        "match_percentage": r.get("match_percentage", 0),
                        "nivel_match": self._nivel_match(r.get("match_percentage", 0)),
                        "explanation": r.get("explanation", ""),
                        "source": candidate.get("source", "registered"),
                        "avatar_url": candidate.get("avatar_url"),
                        "specialties": candidate.get("specialties", []),
                        "experience_years": candidate.get("experience_years", 0),
                        "location": candidate.get("location"),
                        "video_url": candidate.get("video_url"),
                        "article_url": candidate.get("article_url"),
                        "channel_name": candidate.get("channel_name"),
                        "site_name": candidate.get("site_name"),
                    }
                )
            return enriched
        except (json.JSONDecodeError, IndexError):
            return [
                {
                    "professional_id": c.get("id"),
                    "name": c.get("name", "N/A"),
                    "match_percentage": round(c.get("similarity", 0) * 100),
                    "nivel_match": self._nivel_match(round(c.get("similarity", 0) * 100)),
                    "explanation": f"Perfil relevante por experiencia en {', '.join(c.get('specialties', []))}",
                    "source": c.get("source", "registered"),
                    "avatar_url": c.get("avatar_url"),
                    "specialties": c.get("specialties", []),
                    "experience_years": c.get("experience_years", 0),
                    "location": c.get("location"),
                    "video_url": c.get("video_url"),
                    "article_url": c.get("article_url"),
                    "channel_name": c.get("channel_name"),
                    "site_name": c.get("site_name"),
                }
                for c in candidates[:5]
            ]
