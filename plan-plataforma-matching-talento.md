# Plan completo: Plataforma de matching de talento experto en alimentos

**Versión 2** — Backend en FastAPI + Celery, autenticación simplificada, perfiles almacenados en Markdown, despliegue de pruebas en Vercel.

---

## 1. Resumen de decisiones técnicas de esta versión

| Decisión | Elección | Razón |
|---|---|---|
| Backend | FastAPI (Python) | Async nativo, tipado con Pydantic, integración directa con librerías de IA |
| Tareas en segundo plano | Celery + Redis como broker | Necesario para conversión a Markdown, generación de embeddings e ingestión de YouTube sin bloquear la API |
| Autenticación | FastAPI-Users (JWT) | La opción más simple que no te obliga a construir login desde cero ni a integrar un servicio externo de pago |
| Almacenamiento de perfiles | Archivos Markdown con frontmatter YAML | Procesamiento rápido, legible por humanos y máquinas, ideal para alimentar directamente a Gemini sin transformar estructuras complejas |
| Frontend / pruebas | Next.js desplegado en Vercel | Rápido de iterar; **nota importante abajo sobre los límites de Vercel para el backend** |

### Nota crítica sobre Vercel

Vercel es excelente para el **frontend** (Next.js) y para funciones serverless cortas, pero **no es apto para correr Celery workers ni FastAPI con procesos persistentes** — las funciones serverless de Vercel tienen límites de tiempo de ejecución y no mantienen procesos en segundo plano como requiere Celery.

**Recomendación para el entorno de pruebas:**
- **Frontend** → Vercel (tal como quieres)
- **Backend FastAPI + Celery + Redis** → un servicio que soporte procesos persistentes, por ejemplo Railway o Render (ambos tienen planes gratuitos/económicos para pruebas y despliegan Python + Celery sin fricción)

Esto no cambia tu experiencia de desarrollo — solo significa que el backend vive en otra URL (ej. `api.tuapp.com` en Railway) y el frontend en Vercel lo consume vía HTTP, como cualquier arquitectura desacoplada.

---

## 2. Arquitectura general

*(Ver diagrama compartido arriba en la conversación)*

Flujo resumido:
1. El profesional se registra desde el frontend → completa un formulario estructurado
2. El backend (FastAPI) recibe los datos y encola una tarea en Celery
3. Celery **convierte los datos estructurados a un archivo Markdown** con frontmatter YAML (metadatos) + cuerpo narrativo (experiencia, proyectos)
4. Ese Markdown se guarda y, en paralelo, se genera su embedding (vector) que se indexa en pgvector
5. Cuando el empresario busca, su consulta se convierte en embedding, se comparan contra los vectores indexados, y los Markdown de los candidatos más cercanos se pasan a Gemini para el reranking y la explicación final

---

## 3. Backend — FastAPI + Celery en detalle

### 3.1 Estructura de carpetas sugerida

```
backend/
├── app/
│   ├── main.py                 # instancia FastAPI
│   ├── api/
│   │   ├── routes/
│   │   │   ├── auth.py
│   │   │   ├── professionals.py
│   │   │   └── search.py
│   ├── core/
│   │   ├── config.py
│   │   └── security.py
│   ├── models/                 # modelos Pydantic + SQLAlchemy
│   ├── services/
│   │   ├── markdown_converter.py   # conversor estructurado → Markdown
│   │   ├── embeddings.py            # llamadas a Gemini para embeddings
│   │   └── matching_engine.py       # lógica de reranking
│   ├── tasks/
│   │   ├── celery_app.py
│   │   ├── convert_profile.py       # tarea Celery: JSON → Markdown
│   │   ├── generate_embedding.py    # tarea Celery: Markdown → vector
│   │   └── youtube_ingestion.py     # tarea Celery: búsqueda periódica en YouTube
│   └── db/
│       ├── session.py
│       └── vector_store.py
├── storage/
│   └── profiles/                # aquí viven los .md de cada profesional
├── requirements.txt
└── docker-compose.yml           # útil incluso en pruebas: Redis + Postgres locales
```

### 3.2 Endpoints clave

| Método | Ruta | Función |
|---|---|---|
| `POST` | `/auth/register` | Registro de empresario o profesional |
| `POST` | `/auth/login` | Login, devuelve JWT |
| `POST` | `/professionals` | Crea perfil (dispara conversión a Markdown vía Celery) |
| `GET` | `/professionals/{id}/markdown` | Devuelve el Markdown crudo del perfil (útil para depuración) |
| `POST` | `/search` | Recibe la necesidad del empresario, devuelve top 5 perfiles |
| `GET` | `/search/{search_id}/status` | Si el matching se procesa async, permite consultar progreso |

### 3.3 Celery — tareas y colas

Usa **Redis** como broker (simple de levantar, incluso en Docker local para pruebas).

Tres colas separadas evitan que una tarea lenta bloquee a otra:
- `queue=profile_processing` → conversión a Markdown + generación de embedding cuando un profesional se registra o actualiza su perfil
- `queue=search_processing` → si decides que el matching complejo (con Gemini) se procese async y notifiques al usuario cuando esté listo (recomendado si tienes muchos perfiles y el reranking tarda)
- `queue=youtube_ingestion` → tarea periódica (Celery beat) que busca contenido nuevo en YouTube y genera invitaciones

```python
# tasks/celery_app.py
from celery import Celery

celery_app = Celery(
    "matching_platform",
    broker="redis://localhost:6379/0",
    backend="redis://localhost:6379/1",
)

celery_app.conf.task_routes = {
    "tasks.convert_profile.*": {"queue": "profile_processing"},
    "tasks.generate_embedding.*": {"queue": "profile_processing"},
    "tasks.youtube_ingestion.*": {"queue": "youtube_ingestion"},
}
```

---

## 4. Autenticación — la opción más simple

**Recomendación: FastAPI-Users** (librería open source diseñada específicamente para FastAPI).

### Por qué es la opción más simple:
- Te da registro, login, JWT, recuperación de contraseña y verificación de email **ya construidos** — no reinventas nada
- Se integra directamente con SQLAlchemy (tu modelo de usuario)
- No depende de un servicio externo de pago (a diferencia de Auth0), lo cual es ideal para un entorno de pruebas
- Migrar después a un proveedor externo (si creces y necesitas SSO, login social, etc.) es un cambio acotado, no una reescritura completa

### Configuración mínima

```python
# core/security.py
from fastapi_users import FastAPIUsers
from fastapi_users.authentication import JWTStrategy, AuthenticationBackend, BearerTransport

SECRET = "tu-secreto-en-variable-de-entorno"

bearer_transport = BearerTransport(tokenUrl="auth/login")

def get_jwt_strategy() -> JWTStrategy:
    return JWTStrategy(secret=SECRET, lifetime_seconds=3600 * 24 * 7)

auth_backend = AuthenticationBackend(
    name="jwt",
    transport=bearer_transport,
    get_strategy=get_jwt_strategy,
)
```

Con esto tienes login funcional en minutos, sin tocar lógica de hashing de contraseñas, expiración de tokens, ni endpoints de reseteo — todo viene resuelto.

**Dos tipos de usuario a diferenciar** (campo `role` en el modelo de usuario):
- `empresario` → puede buscar y contactar
- `profesional` → puede registrar/editar su perfil

---

## 5. Almacenamiento en Markdown — el corazón del sistema

Esta es la parte más particular de tu arquitectura, así que vale la pena detallarla bien.

### 5.1 Por qué Markdown funciona muy bien aquí

- Es liviano y rápido de leer/escribir (sin overhead de parseo de JSON anidado o filas de SQL con joins)
- Es **directamente consumible por Gemini** — puedes pasar el contenido completo del `.md` como contexto sin transformación adicional
- El frontmatter YAML te da campos estructurados (para filtros rápidos) y el cuerpo te da texto narrativo (para el embedding semántico)
- Es legible por humanos — si algún día necesitas revisar perfiles manualmente, no necesitas herramientas especiales

### 5.2 Estructura del archivo Markdown de un perfil

```markdown
---
id: prof_00234
nombre: "María Torres"
sector: ["cárnicos", "lácteos"]
categorias: ["formulación", "regulatorio"]
años_experiencia: 8
disponibilidad: "inmediata"
tarifa_referencia: "media"
calificacion_promedio: 4.8
fuente: "registro directo"
fecha_registro: "2026-07-20"
verificado: true
---

## Experiencia

María es ingeniera de alimentos con 8 años de experiencia especializada en
reformulación de productos cárnicos y lácteos para reducir sodio y grasas
saturadas sin comprometer vida útil ni textura.

## Proyectos destacados

- Reformulación de línea de embutidos para reducir sodio en 30% manteniendo
  vida útil de 45 días (empresa mediana, sector cárnico, 2024)
- Rediseño de proceso de pasteurización para una planta láctea, logrando
  reducción de 15% en tiempo de ciclo (2023)

## Certificaciones y conocimientos técnicos

- HACCP certificado
- Manejo de normativa INVIMA para etiquetado nutricional
- Experiencia con Six Sigma (nivel Green Belt)

## Disponibilidad

Disponible para proyectos de consultoría de 2 a 12 semanas, modalidad remota
o presencial en Colombia.
```

### 5.3 El conversor: de formulario estructurado a Markdown

El profesional **nunca escribe Markdown directamente** — llena un formulario normal (campos de texto, selects, listas dinámicas de proyectos). El backend hace la conversión.

```python
# services/markdown_converter.py
from datetime import date
import yaml

def convertir_perfil_a_markdown(datos: dict) -> str:
    frontmatter = {
        "id": datos["id"],
        "nombre": datos["nombre"],
        "sector": datos["sectores"],
        "categorias": datos["categorias"],
        "años_experiencia": datos["años_experiencia"],
        "disponibilidad": datos["disponibilidad"],
        "tarifa_referencia": datos.get("tarifa_referencia", "no especificada"),
        "calificacion_promedio": datos.get("calificacion_promedio", None),
        "fuente": datos.get("fuente", "registro directo"),
        "fecha_registro": str(date.today()),
        "verificado": datos.get("verificado", False),
    }

    cuerpo = f"""
## Experiencia

{datos['resumen_experiencia']}

## Proyectos destacados

{formatear_lista_proyectos(datos['proyectos'])}

## Certificaciones y conocimientos técnicos

{formatear_lista(datos['certificaciones'])}

## Disponibilidad

{datos['detalle_disponibilidad']}
"""

    fm_yaml = yaml.dump(frontmatter, allow_unicode=True, sort_keys=False)
    return f"---\n{fm_yaml}---\n{cuerpo}"


def formatear_lista_proyectos(proyectos: list[dict]) -> str:
    return "\n".join(f"- {p['descripcion']} ({p['año']})" for p in proyectos)


def formatear_lista(items: list[str]) -> str:
    return "\n".join(f"- {item}" for item in items)
```

Esta función se ejecuta dentro de una tarea Celery para no bloquear la respuesta al usuario:

```python
# tasks/convert_profile.py
from tasks.celery_app import celery_app
from services.markdown_converter import convertir_perfil_a_markdown
from services.embeddings import generar_embedding
import pathlib

@celery_app.task(name="tasks.convert_profile.procesar_perfil")
def procesar_perfil(datos_perfil: dict):
    markdown = convertir_perfil_a_markdown(datos_perfil)

    ruta = pathlib.Path(f"storage/profiles/{datos_perfil['id']}.md")
    ruta.write_text(markdown, encoding="utf-8")

    # Encadena la siguiente tarea: generar embedding a partir del markdown
    from tasks.generate_embedding import generar_embedding_perfil
    generar_embedding_perfil.delay(datos_perfil["id"], markdown)

    return {"status": "convertido", "ruta": str(ruta)}
```

### 5.4 Dónde vivir los archivos `.md`

Para el entorno de **pruebas**, guardarlos en disco (`storage/profiles/`) dentro del servicio backend (Railway/Render) es suficiente y simple.

Para producción, cuando quieras persistencia más robusta y backups automáticos, la migración natural es mover esa carpeta a un bucket de almacenamiento (Google Cloud Storage o S3) — el código cambia mínimamente porque solo cambia la capa de lectura/escritura de archivos, no la lógica de conversión ni de matching.

### 5.5 Cómo se usa el Markdown en el matching

1. **Frontmatter** → se usa para filtros rápidos previos (ej. descartar perfiles sin disponibilidad, o filtrar por sector) antes incluso de tocar embeddings — esto ahorra cómputo
2. **Cuerpo completo** → se pasa a Gemini para generar el embedding semántico y, en el reranking final, se pasa el Markdown completo como contexto para que Gemini redacte la explicación de por qué ese perfil es un buen match

---

## 6. Frontend y despliegue en Vercel

- Next.js + Tailwind + shadcn/ui (sin cambios respecto al plan anterior)
- Variables de entorno en Vercel apuntando a la URL del backend (ej. `NEXT_PUBLIC_API_URL=https://api-pruebas.railway.app`)
- Para pruebas rápidas, puedes usar `NEXT_PUBLIC_API_URL` distinto por entorno (preview vs producción) — Vercel maneja esto nativamente con sus *Environment Variables* por ambiente

---

## 7. Patrones de diseño de software (actualizado)

- **Repository pattern**: una capa que abstrae "leer/escribir perfil" sin que el resto del código sepa si el perfil vive en disco, en un bucket, o en ambos a la vez — facilita la migración de almacenamiento sin tocar lógica de negocio
- **Pipeline de conversión encadenado**: formulario → JSON validado (Pydantic) → tarea Celery de conversión → Markdown → tarea Celery de embedding → índice vectorial. Cada paso es una tarea independiente, reintentable si falla
- **CQRS ligero**: lectura (búsqueda) y escritura (registro/edición de perfil) tienen cargas de trabajo muy distintas — mantenlas en servicios/rutas separadas desde el día uno
- **Circuit breaker en llamadas a Gemini**: si la API de Gemini falla o tarda, el sistema debe poder devolver resultados basados solo en similitud vectorial (sin la explicación generada) en vez de fallar por completo

---

## 8. UX, accesibilidad, responsive design y neuroweb design

*(Se mantienen los lineamientos ya definidos en la versión anterior del plan — resumen aquí para referencia rápida)*

- **UX**: barra de búsqueda central con placeholder rotativo, chips de categoría, tarjetas de resultado con foto + % de match + explicación breve + fuente, perfil completo con proyectos y calificaciones
- **Accesibilidad (WCAG 2.1 AA)**: contraste 4.5:1 mínimo, navegación por teclado completa, ARIA labels, nunca depender solo del color
- **Responsive**: mobile-first, breakpoints 360/768/1024px, áreas táctiles de 44x44px mínimo
- **Neuroweb design**: máximo 5-7 elementos por pantalla, el primer resultado ancla la percepción de calidad, microanimaciones durante la espera del matching, prueba social visible

---

## 9. Copywriting — guía profunda

### 9.1 Voz de marca: los 3 pilares

1. **Consultor experto, no buscador genérico** — el tono debe sentirse como hablar con alguien que entiende de alimentos, no con un motor de búsqueda frío
2. **Confianza sin exagerar** — nunca prometer "el experto perfecto", siempre "los más idóneos según tu caso" (honestidad sobre la naturaleza probabilística del matching)
3. **Respeto por el tiempo del empresario** — cada texto debe ahorrar decisiones, no generar más fricción

### 9.2 Textos por pantalla

#### Pantalla de búsqueda

| Elemento | Texto |
|---|---|
| Título principal | "¿Qué reto de tu planta necesitas resolver hoy?" |
| Placeholder de la barra | "Ej: necesito reducir el sodio en mi salsa sin perder vida útil" |
| Texto de ayuda (debajo de la barra) | "Descríbelo como se lo contarías a un colega — entre más detalle, mejor el match" |
| Chips de categoría | "Formulación" · "Procesos" · "Regulatorio" · "Productividad" · "Planta" |
| Botón de búsqueda | "Buscar experto" (no "Buscar" a secas — refuerza qué obtiene) |

#### Estado de carga

| Momento | Texto |
|---|---|
| Justo al enviar | "Analizando tu caso..." |
| Si tarda más de 3 segundos | "Comparando tu reto con nuestra red de expertos..." |
| Si tarda más de 8 segundos | "Ya casi — estamos afinando las recomendaciones" |

*Nota: nunca usar "Cargando..." genérico — cada mensaje debe reforzar que hay trabajo inteligente sucediendo, sin sonar artificial.*

#### Resultados

| Elemento | Texto |
|---|---|
| Encabezado de sección | "Estos son los perfiles más idóneos para tu caso" |
| Badge de match alto | "Match alto" (con ícono, no solo color) |
| Badge de match medio | "Match relevante" |
| Explicación de match (ejemplo generado) | "María tiene 8 años formulando productos bajos en sodio para cárnicos, con proyectos documentados en reducción de sodio similares al tuyo" |
| Badge de fuente — perfil verificado | "Perfil verificado" |
| Badge de fuente — sugerido externamente | "Sugerido · aún no registrado" |
| CTA de contacto | "Conversar con [nombre]" (personalizado, no "Contactar" genérico) |

#### Estado vacío o resultados limitados

Nunca decir que "no hay resultados" — siempre ofrecer el camino más cercano:

> "Aún no tenemos un experto exacto para este reto específico, pero estos perfiles tienen la experiencia más cercana. También puedes ampliar la búsqueda o dejarnos tu contacto para avisarte cuando aparezca alguien más afín."

#### Perfil completo del profesional

| Elemento | Texto |
|---|---|
| Encabezado de proyectos | "Proyectos que ha resuelto" |
| Encabezado de calificaciones | "Lo que dicen quienes ya trabajaron con [nombre]" |
| CTA principal | "Iniciar conversación" |
| Nota de privacidad (antes de compartir contacto directo) | "Tu conversación empieza aquí — los datos de contacto se comparten solo cuando ambas partes lo confirmen" |

### 9.3 Onboarding de profesionales (registro)

El formulario de registro es también el input que se convierte en Markdown, así que el copywriting aquí debe **generar buen contenido narrativo**, no solo capturar datos.

| Campo | Label | Texto de ayuda |
|---|---|---|
| Resumen de experiencia | "Cuéntanos tu experiencia" | "Escribe como si se lo explicaras a un empresario que no te conoce — qué problemas has resuelto y en qué sectores" |
| Proyectos destacados | "Tus proyectos más relevantes" | "Incluye resultados concretos si puedes — por ejemplo, '% de reducción', 'tiempo ahorrado', 'costo reducido'. Los números generan más confianza que las descripciones generales" |
| Certificaciones | "Certificaciones y conocimientos técnicos" | "HACCP, BPM, normativa local, metodologías (Six Sigma, Lean, etc.)" |
| Disponibilidad | "¿Cuándo puedes empezar?" | — |

**Mensaje de bienvenida al completar el registro:**

> "Tu perfil ya está listo y disponible para empresas que buscan justo tu experiencia. Entre más completo esté, mejor calidad de match recibirás."

### 9.4 Emails de invitación (expertos detectados en YouTube)

Tono: invitación genuina, nunca sonar a que fueron "vigilados" o "fichados" sin su consentimiento.

**Asunto:** "Vimos tu experiencia en [tema] — podría interesarte"

**Cuerpo:**

> Hola [nombre],
>
> Encontramos tu contenido sobre [tema específico] y notamos que tienes experiencia justo en el tipo de retos que hoy enfrentan varias empresas de alimentos con las que trabajamos.
>
> Estamos construyendo una plataforma que conecta a empresarios del sector con profesionales como tú, para resolver problemas puntuales de formulación, procesos, regulación o planta.
>
> Si te interesa, crear tu perfil toma unos minutos y no tiene ningún costo. Tú decides qué compartir y cuándo estar disponible.
>
> [Crear mi perfil]
>
> Si no te interesa, puedes ignorar este mensaje sin problema.

### 9.5 Mensajes de error (tono humano, no técnico)

| Situación | Texto |
|---|---|
| Falla en la búsqueda | "Algo no salió bien buscando tu match. Ya lo sabemos y lo estamos revisando — intenta de nuevo en un momento" |
| Sesión expirada | "Tu sesión expiró por seguridad. Vuelve a iniciar sesión para continuar" |
| Formulario incompleto | "Nos falta un dato para completar tu perfil: [campo]" (específico, nunca "hay errores en el formulario") |

### 9.6 Microcopy de botones y tooltips

| Elemento | Texto |
|---|---|
| Tooltip sobre "% de match" | "Calculado según la similitud entre tu necesidad y la experiencia documentada del profesional" |
| Botón guardar perfil (empresario) | "Guardar para después" |
| Botón de refinar búsqueda | "Ajustar búsqueda" |
| Confirmación tras contactar | "Tu mensaje fue enviado — [nombre] normalmente responde en menos de 48 horas" |

---

## 10. Roadmap actualizado

1. **Fase 1**: FastAPI + auth con FastAPI-Users + formulario de registro → conversor a Markdown + almacenamiento en disco
2. **Fase 2**: Celery + Redis para procesar conversión y generación de embeddings de forma asíncrona + pgvector para búsqueda semántica básica
3. **Fase 3**: Integración de Gemini para reranking y generación de explicaciones de match
4. **Fase 4**: Ingestión periódica de YouTube (Celery beat) + flujo de invitación con consentimiento
5. **Fase 5**: Sistema de reputación, calificaciones y chat interno entre empresario y profesional
6. **Fase 6**: Migración de almacenamiento de disco local a bucket (GCS/S3) para producción

---

## 11. Checklist para arrancar el entorno de pruebas

- [ ] Repositorio backend con FastAPI + Celery + Redis (Docker Compose local)
- [ ] Deploy de backend en Railway o Render (soporta Celery workers)
- [ ] Base de datos PostgreSQL con extensión pgvector habilitada
- [ ] Repositorio frontend Next.js desplegado en Vercel
- [ ] Variables de entorno del frontend apuntando a la URL del backend de pruebas
- [ ] Cuenta y API key de Gemini configurada como variable de entorno en el backend
- [ ] Carpeta `storage/profiles/` con permisos de escritura en el entorno de backend
