from app.core.config import get_settings
from datetime import datetime

settings = get_settings()


class MarkdownConverter:
    @staticmethod
    def convert_professional_to_markdown(data: dict) -> str:
        specialties = data.get("specialties", [])
        research_products = data.get("research_products", [])
        last_experience = data.get("last_experience")

        frontmatter = f"""---
id: {data.get('id', 'pending')}
nombre: "{data.get('name', '')}"
email: "{data.get('email', '')}"
sectores: [{', '.join(f'"{s}"' for s in specialties)}]
anios_experiencia: {data.get('experience_years', 0)}
disponibilidad: "{data.get('availability', 'inmediata')}"
tarifa: "{data.get('hourly_rate', 'no especificada')}"
ubicacion: "{data.get('location', 'no especificada')}"
fuente: "{data.get('source', 'registro directo')}"
fecha_registro: "{datetime.now().strftime('%Y-%m-%d')}"
verificado: {str(data.get('is_verified', False)).lower()}
---"""

        research_text = ""
        if research_products:
            items = "\n".join(
                f"- {p.get('name', '')} ({p.get('url', 'sin enlace')})"
                for p in research_products
            )
            research_text = f"\n## Productos de investigacion / desarrollo\n\n{items}"

        experience_text = ""
        if last_experience and (last_experience.get("client") or last_experience.get("description")):
            parts = []
            if last_experience.get("client"):
                parts.append(f"**Cliente:** {last_experience['client']}")
            if last_experience.get("description"):
                parts.append(f"**Que hizo:** {last_experience['description']}")
            if last_experience.get("achievement"):
                parts.append(f"**Logro:** {last_experience['achievement']}")
            experience_text = f"\n## Ultima experiencia\n\n" + "\n\n".join(parts)

        markdown = f"""{frontmatter}

## Experiencia

{data.get('summary', 'Sin descripcion')}

{research_text}

{experience_text}

## Disponibilidad

{data.get('availability', 'No especificada')}
"""
        return markdown.strip()
