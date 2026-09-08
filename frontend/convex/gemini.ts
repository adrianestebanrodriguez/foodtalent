// Shared Gemini helpers (REST). Port of backend/app/services/gemini_service.py
// Models: gemini-2.0-flash (chat) + gemini-embedding-001 @768d (vectors).

const EMBED_MODEL = "gemini-embedding-001";
const CHAT_MODEL = "gemini-3.6-flash";

function keyPool(): string[] {
  const raw = process.env.GEMINI_API_KEY ?? "";
  return raw
    .replace(/\n/g, ",")
    .split(",")
    .map((k) => k.trim())
    .filter(Boolean);
}

export async function embedContent(
  text: string,
  taskType: "retrieval_query" | "retrieval_document",
): Promise<number[] | null> {
  const keys = keyPool();
  for (const key of keys.length ? keys : [""]) {
    try {
      const resp = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${EMBED_MODEL}:embedContent?key=${key}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            model: `models/${EMBED_MODEL}`,
            content: { parts: [{ text }] },
            taskType,
            outputDimensionality: 768,
          }),
        },
      );
      if (resp.status === 429 && keys.length > 1) continue; // rotate key
      if (!resp.ok) continue;
      const data = await resp.json();
      const values = data?.embedding?.values;
      if (Array.isArray(values) && values.length === 768) return values;
    } catch {
      continue;
    }
  }
  return null;
}

export async function generateContent(
  prompt: string,
  maxOutputTokens = 8192,
): Promise<string | null> {
  const keys = keyPool();
  for (const key of keys.length ? keys : [""]) {
    try {
      const resp = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${CHAT_MODEL}:generateContent?key=${key}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: { temperature: 0.2, maxOutputTokens },
          }),
        },
      );
      if (resp.status === 429 && keys.length > 1) continue;
      if (!resp.ok) continue;
      const data = await resp.json();
      const text = data?.candidates?.[0]?.content?.parts
        ?.map((p: { text?: string }) => p.text ?? "")
        .join("");
      if (text) return text;
    } catch {
      continue;
    }
  }
  return null;
}

export function stripCodeFences(text: string): string {
  const clean = text.trim();
  if (clean.startsWith("```")) {
    const firstNewline = clean.indexOf("\n");
    const lastFence = clean.lastIndexOf("```");
    if (firstNewline !== -1 && lastFence > firstNewline) {
      return clean.slice(firstNewline + 1, lastFence).trim();
    }
  }
  return clean;
}

export function nivelMatch(p: number): string {
  if (p >= 80) return "Match alto";
  if (p >= 60) return "Match relevante";
  return "Match posible";
}

// ---------------------------------------------------------------------------
// Rerank prompt (same METAPROMPT as the FastAPI backend)
// ---------------------------------------------------------------------------

export function buildRerankPrompt(maxResults: number): string {
  return `Eres el motor de busqueda de FoodTalent, plataforma que conecta empresas de alimentos con expertos.

## CONTEXTO
Sectores: Carnicos, lacteos, panaderia, snacks, bebidas, congelados, alimentos funcionales, suplementos, ingredientes.
Areas: Formulacion, procesos, calidad/inocuidad (HACCP/BPM/ISO), regulatorio, I+D, innovacion, sostenibilidad, transformacion digital.

## PROCESO DE RAZONAMIENTO (Paso a Paso)

### Paso 1: Diagnosticar la raiz tecnica del reto
Identifica el problema de fondo (ej. reformular un aderezo bajo en grasa -> reologia de emulsiones).

### Paso 2: Analizar cada candidato contra la raiz del problema
Evalua especialidades, anos de experiencia, resumen, productos de I+D, ultima experiencia, ubicacion/disponibilidad.

### Paso 3: Asignar Puntaje de Match (escala 70%-100%)
95-100 experiencia DIRECTA Y DEMOSTRABLE | 85-94 muy solida | 75-84 relevante | 70-74 parcial.
Usa todo el rango. El porcentaje debe reflejar la afinidad REAL.

### Paso 4: Redactar la explanation
2-3 oraciones en espanol, especificas y accionables.

## REGLAS FINALES
- Selecciona solo los ${maxResults} MEJORES candidatos
- Si un candidato no tiene relacion con el reto, NO lo incluyas
- match_percentage SOLO entre 70 y 100
- Responde SOLO JSON valido, sin markdown, sin backticks, sin texto adicional
- El campo professional_id debe ser EXACTAMENTE el ID entre parentesis "(ID: ...)" de cada candidato, no el numero de la lista

Formato: {"results":[{"professional_id":"<id_exacto>","match_percentage":92,"explanation":"..."}]}`;
}

export interface Candidate {
  id: number | string;
  name: string;
  source: string;
  experience_years: number;
  specialties: string[];
  location?: string | null;
  availability?: string | null;
  hourly_rate?: string | null;
  is_verified?: boolean;
  summary?: string | null;
  research_products?: { name?: string; url?: string }[];
  last_experience?: {
    client?: string;
    description?: string;
    achievement?: string;
  } | null;
  similarity?: number;
  avatar_url?: string | null;
  video_url?: string;
  article_url?: string;
  channel_name?: string;
  site_name?: string;
}

export function buildRerankingContext(candidates: Candidate[]): string {
  return candidates
    .map((c, i) => {
      const specialties = (c.specialties ?? []).join(", ");
      const research = (c.research_products ?? []).slice(0, 3);
      const researchText =
        research.length > 0
          ? "\n" +
            research
              .map((p) => `  - ${p.name ?? ""}${p.url ? ` (${p.url})` : ""}`)
              .join("\n")
          : "Ninguno";
      const le = c.last_experience;
      const experienceText =
        le && (le.client || le.description)
          ? [
              le.client ? `Cliente: ${le.client}` : null,
              le.description ? `Que hizo: ${le.description.slice(0, 150)}` : null,
              le.achievement ? `Logro: ${le.achievement.slice(0, 150)}` : null,
            ]
              .filter(Boolean)
              .join(" | ")
          : "No especificada";
      const summary = (c.summary ?? "N/A").slice(0, 400);
      return `--- CANDIDATO ${i + 1} (ID: ${c.id}) ---
Nombre: ${c.name}
Fuente: ${c.source}
Experiencia: ${c.experience_years} anos
Especialidades: ${specialties}
Ubicacion: ${c.location ?? "No especificada"}
Disponibilidad: ${c.availability ?? "No especificada"}
Tarifa: ${c.hourly_rate ?? "No especificada"} USD/hr
Verificado: ${c.is_verified ? "Si" : "No"}

Resumen de experiencia:
${summary}

Productos de investigacion / desarrollo:
${researchText}

Ultima experiencia laboral:
${experienceText}`;
    })
    .join("\n\n");
}

export interface MatchResult {
  professional_id: number | string;
  name: string;
  match_percentage: number;
  nivel_match: string;
  explanation: string;
  source: string;
  avatar_url?: string | null;
  specialties: string[];
  experience_years: number;
  location?: string | null;
  video_url?: string;
  article_url?: string;
  channel_name?: string;
  site_name?: string;
}

function toMatch(
  id: number | string,
  pct: number,
  explanation: string,
  c: Candidate,
): MatchResult {
  return {
    professional_id: id,
    name: c.name ?? "N/A",
    match_percentage: pct,
    nivel_match: nivelMatch(pct),
    explanation,
    source: c.source ?? "registered",
    avatar_url: c.avatar_url ?? null,
    specialties: c.specialties ?? [],
    experience_years: c.experience_years ?? 0,
    location: c.location ?? null,
    video_url: c.video_url,
    article_url: c.article_url,
    channel_name: c.channel_name,
    site_name: c.site_name,
  };
}

export function fallbackMatches(
  candidates: Candidate[],
  maxResults: number,
): MatchResult[] {
  return [...candidates]
    .sort((a, b) => (b.similarity ?? 0) - (a.similarity ?? 0))
    .slice(0, maxResults)
    .map((c) =>
      toMatch(
        c.id,
        Math.round((c.similarity ?? 0) * 100),
        `Perfil relevante por experiencia en ${(c.specialties ?? []).join(", ")}`,
        c,
      ),
    );
}

export async function rerankAndExplain(
  query: string,
  candidates: Candidate[],
  maxResults = 5,
): Promise<MatchResult[]> {
  const prompt =
    `${buildRerankPrompt(maxResults)}\n\n## DESAFIO DEL CLIENTE\n"${query}"\n\n` +
    `## CANDIDATOS DISPONIBLES\n\n${buildRerankingContext(candidates)}`;
  const text = await generateContent(prompt);
  if (!text) return fallbackMatches(candidates, maxResults);
  try {
    const data = JSON.parse(stripCodeFences(text));
    const results = (data.results ?? []) as {
      professional_id: number | string;
      match_percentage: number;
      explanation: string;
    }[];
    const byId = new Map(candidates.map((c) => [c.id, c]));
    const enriched = results
      .map((r) => {
        // The model may return the exact id ("k17...") or the 1-based
        // positional index of the candidate ("1", "2", ...). Accept both.
        let c = byId.get(r.professional_id) as Candidate | undefined;
        if (!c && typeof r.professional_id === "number") {
          c = candidates[r.professional_id - 1];
        } else if (!c && /^\d+$/.test(String(r.professional_id))) {
          c = candidates[Number(r.professional_id) - 1];
        }
        if (!c) return null;
        return toMatch(
          c.id,
          r.match_percentage ?? 0,
          r.explanation ?? "",
          c,
        );
      })
      .filter((r): r is MatchResult => r !== null);
    return enriched.length ? enriched : fallbackMatches(candidates, maxResults);
  } catch {
    return fallbackMatches(candidates, maxResults);
  }
}

export async function identifyExpertsFromContent(
  content: string,
): Promise<{ name: string; specialties: string[]; summary: string }[]> {
  const prompt = `Analiza el siguiente contenido sobre la industria de alimentos e identifica profesionales o expertos mencionados.

Contenido:
${content.slice(0, 3000)}

Para cada experto encontrado, extrae:
- name: nombre completo
- specialties: areas de especializacion (array)
- summary: resumen de su experiencia (2-3 oraciones)

Responde UNICAMENTE con JSON valido (sin markdown, sin backticks):
{"experts": [{"name": "Juan Perez", "specialties": ["formulacion", "procesos"], "summary": "..."}]}`;
  const text = await generateContent(prompt, 1024);
  if (!text) return [];
  try {
    return JSON.parse(stripCodeFences(text)).experts ?? [];
  } catch {
    return [];
  }
}

// ---------------------------------------------------------------------------
// Markdown profile (port of MarkdownConverter)
// ---------------------------------------------------------------------------

export function professionalToMarkdown(data: {
  id?: number | string;
  name?: string;
  email?: string;
  specialties?: string[];
  experience_years?: number;
  availability?: string;
  hourly_rate?: string | null;
  location?: string | null;
  summary?: string | null;
  research_products?: { name?: string; url?: string }[];
  last_experience?: {
    client?: string;
    description?: string;
    achievement?: string;
  } | null;
  source?: string;
  is_verified?: boolean;
}): string {
  const specialties = data.specialties ?? [];
  const research = data.research_products ?? [];
  const le = data.last_experience;
  const frontmatter = `---
id: ${data.id ?? "pending"}
nombre: "${data.name ?? ""}"
email: "${data.email ?? ""}"
sectores: [${specialties.map((s) => `"${s}"`).join(", ")}]
anios_experiencia: ${data.experience_years ?? 0}
disponibilidad: "${data.availability ?? "inmediata"}"
tarifa: "${data.hourly_rate ?? "no especificada"}"
ubicacion: "${data.location ?? "no especificada"}"
fuente: "${data.source ?? "registro directo"}"
fecha_registro: "${new Date().toISOString().slice(0, 10)}"
verificado: ${String(data.is_verified ?? false).toLowerCase()}
---`;
  const researchText = research.length
    ? `\n## Productos de investigacion / desarrollo\n\n${research
        .map((p) => `- ${p.name ?? ""} (${p.url ?? "sin enlace"})`)
        .join("\n")}`
    : "";
  const expText =
    le && (le.client || le.description)
      ? `\n## Ultima experiencia\n\n${[
          le.client ? `**Cliente:** ${le.client}` : null,
          le.description ? `**Que hizo:** ${le.description}` : null,
          le.achievement ? `**Logro:** ${le.achievement}` : null,
        ]
          .filter(Boolean)
          .join("\n\n")}`
      : "";
  return `${frontmatter}

## Experiencia

${data.summary ?? "Sin descripcion"}

${researchText}

${expText}

## Disponibilidad

${data.availability ?? "No especificada"}
`.trim();
}
