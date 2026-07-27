import google.generativeai as genai
from app.core.config import get_settings
import json
import re

settings = get_settings()

if settings.GEMINI_API_KEY:
    genai.configure(api_key=settings.GEMINI_API_KEY)


METAPROMPT = """Eres el motor de busqueda de FoodTalent, plataforma que conecta empresas de alimentos con expertos.

## CONTEXTO
Sectores: Carnicos, lacteos, panaderia, snacks, bebidas, congelados, alimentos funcionales, suplementos, ingredientes.
Areas: Formulacion, procesos, calidad/inocuidad (HACCP/BPM/ISO), regulatorio, I+D, innovacion, sostenibilidad, transformacion digital.

## CRITERIOS DE EVALUACION (orden de prioridad)
1. **Alineacion con desafio (40%):** Que tan directamente resuelve el problema exacto del cliente?
2. **Profundidad experiencia (25%):** Anos relevantes + productos de investigacion + ultima experiencia activa.
3. **Resultados demostrables (20%):** Productos con enlace = trabajo concreto. Logros claros = impacto real.
4. **Disponibilidad (10%):** Inmediata > corta > larga. Ubicacion si presencial.
5. **Fuente (5%):** Registrados > YouTube/Web.

## ESCALA
- 85-100: Experiencia directa demostrada en EXACTAMENTE este desafio
- 70-84: Experiencia muy relevante en areas cercanas
- 55-69: Experiencia parcialmente relevante
- 40-54: En industria pero no directamente relacionado
- 20-39: Experiencia tangencial
- 0-19: Sin relacion

## INSTRUCCIONES
1. Identifica que problema exacto busca resolver el cliente
2. Para cada candidato: que tan relevante es su experiencia para ESTE desafio? Tiene evidencia concreta?
3. Selecciona los {max_results} MEJORES
4. Para cada uno, escribe explanation (2-3 oraciones en espanol) que sea ESPECIFICA y ACCIONABLE

Responde SOLO JSON (sin markdown):
{{"results":[{{"professional_id":1,"match_percentage":92,"explanation":"...explique por que es buen match con evidencia concreta..."}}]}}
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

        try:
            response = await self.model.generate_content_async(
                full_prompt,
                generation_config=genai.types.GenerationConfig(
                    temperature=0.2,
                    max_output_tokens=2048,
                ),
            )
            return self._parse_response(response.text, candidates)
        except Exception as e:
            print(f"[Gemini] Reranking error: {e}", flush=True)
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
