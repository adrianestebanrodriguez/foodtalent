# FoodTalent

Plataforma de matching de talento experto en la industria de alimentos impulsada por Gemini AI.

## Descripción

FoodTalent conecta empresarios de alimentos con profesionales expertos usando inteligencia artificial para analizar necesidades y recomendar los 5 perfiles más idóneos.

### Fuentes de datos
- **Base propia**: Profesionales que se registran directamente en la plataforma
- **YouTube**: Contenido de expertos analizado con IA
- **Blogs/Web**: Artículos de la industria alimentaria

## Stack Tecnológico

| Capa | Tecnología |
|------|------------|
| Frontend | Next.js 14, Tailwind CSS, shadcn/ui |
| Backend | FastAPI, Python 3.12 |
| Base de datos | PostgreSQL + pgvector |
| Cola de tareas | Celery + Redis |
| IA | Google Gemini API |

## Requisitos Previos

- Python 3.12+
- Node.js 18+
- PostgreSQL 16+ con extensión pgvector
- Redis 7+

## Instalación

### 1. Clonar el repositorio

```bash
git clone <repo-url>
cd foodtalent
```

### 2. Backend

```bash
cd backend
python -m venv .venv
.venv\Scripts\activate  # Windows
pip install -r requirements.txt
```

### 3. Configurar variables de entorno

```bash
cp .env.example .env
# Editar .env con tus credenciales
```

### 4. Frontend

```bash
cd frontend
npm install
```

### 5. Base de datos

```bash
# Asegurar que PostgreSQL esté corriendo con pgvector
# La BD se crea automáticamente al iniciar el backend
```

## Ejecución

### Con Docker (recomendado)

```bash
docker-compose up
```

Esto levanta:
- Backend en http://localhost:8000
- Frontend en http://localhost:3000
- PostgreSQL en localhost:5432
- Redis en localhost:6379
- Celery worker
- Celery beat

### Sin Docker

**Terminal 1 - Backend:**
```bash
cd backend
uvicorn app.main:app --reload --port 8000
```

**Terminal 2 - Celery Worker:**
```bash
cd backend
celery -A app.tasks.celery_app worker -l info
```

**Terminal 3 - Frontend:**
```bash
cd frontend
npm run dev
```

## API Endpoints

### Auth
- `POST /api/auth/register` - Registrar usuario
- `POST /api/auth/login` - Iniciar sesión
- `GET /api/auth/me` - Obtener usuario actual

### Professionals
- `POST /api/professionals` - Crear perfil
- `GET /api/professionals` - Listar profesionales
- `GET /api/professionals/{id}` - Obtener perfil

### Search
- `POST /api/search` - Buscar expertos
- `GET /api/search/history` - Historial de búsquedas

### Tasks
- `POST /api/tasks/convert-profile` - Convertir perfil a Markdown
- `POST /api/tasks/ingest-youtube` - Ingestar contenido de YouTube
- `POST /api/tasks/ingest-web` - Ingestar contenido web

## Variables de Entorno

| Variable | Descripción |
|----------|-------------|
| `DATABASE_URL` | URL de conexión a PostgreSQL |
| `REDIS_URL` | URL de conexión a Redis |
| `SECRET_KEY` | Clave secreta para JWT |
| `GEMINI_API_KEY` | API key de Google Gemini |
| `YOUTUBE_API_KEY` | API key de YouTube Data API v3 |
| `GOOGLE_CSE_API_KEY` | API key de Google Custom Search |
| `GOOGLE_CSE_ID` | ID del motor de búsqueda personalizado |

## Licencia

MIT
