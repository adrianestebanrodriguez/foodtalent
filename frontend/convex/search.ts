import { action } from "./_generated/server";
import { internal } from "./_generated/api";
import { v } from "convex/values";
import {
  Candidate,
  embedContent,
  fallbackMatches,
  rerankAndExplain,
} from "./gemini";

const FOOD_KEYWORDS = [
  "industria alimentaria",
  "alimentos",
  "food industry",
  "food science",
  "ciencia de alimentos",
  "tecnologia de alimentos",
  "food technology",
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
];

function isFoodVideo(title: string, description: string): boolean {
  const text = `${title} ${description}`.toLowerCase();
  return FOOD_KEYWORDS.some((k) => text.includes(k));
}

interface YouTubeVideo {
  video_id: string;
  title: string;
  channel_title: string;
  description: string;
}

async function searchYouTube(
  query: string,
  apiKey: string,
): Promise<YouTubeVideo[]> {
  if (!apiKey) return [];
  const queries = [
    `experto industria alimentaria ${query}`,
    `food industry expert ${query}`,
  ];
  const seen = new Set<string>();
  const out: YouTubeVideo[] = [];
  for (const sq of queries) {
    try {
      const url =
        `https://www.googleapis.com/youtube/v3/search?part=snippet&type=video` +
        `&order=relevance&maxResults=10&relevanceLanguage=es` +
        `&q=${encodeURIComponent(sq)}&key=${apiKey}`;
      const resp = await fetch(url);
      if (!resp.ok) continue;
      const data = await resp.json();
      for (const item of data.items ?? []) {
        const videoId = item?.id?.videoId;
        if (!videoId || seen.has(videoId)) continue;
        seen.add(videoId);
        out.push({
          video_id: videoId,
          title: item.snippet?.title ?? "",
          channel_title: item.snippet?.channelTitle ?? "",
          description: item.snippet?.description ?? "",
        });
      }
    } catch {
      continue;
    }
  }
  return out.filter((vid) => isFoodVideo(vid.title, vid.description));
}

function youtubeExperts(query: string, videos: YouTubeVideo[]): Candidate[] {
  const seen = new Set<string>();
  const experts: Candidate[] = [];
  for (const video of videos.slice(0, 10)) {
    const channel = video.channel_title;
    if (!channel || seen.has(channel)) continue;
    seen.add(channel);
    if (experts.length >= 5) break;
    experts.push({
      id: `yt-${channel}`,
      name: channel,
      source: "youtube",
      experience_years: 0,
      specialties: ["industria alimentaria"],
      location: null,
      availability: "a coordinar",
      is_verified: false,
      summary: `Experto en industria alimentaria. Video: ${video.title}`,
      similarity: 0.4,
      avatar_url: null,
      video_url: `https://youtube.com/watch?v=${video.video_id}`,
      channel_name: channel,
    });
  }
  return experts;
}

interface WebExpert extends Candidate {
  article_url: string;
  site_name: string;
}

async function searchWeb(
  query: string,
  apiKey: string,
  cseId: string,
): Promise<WebExpert[]> {
  if (!apiKey || !cseId) return [];
  try {
    const url =
      `https://www.googleapis.com/customsearch/v1?num=5` +
      `&q=${encodeURIComponent(`experto industria alimentaria ${query}`)}` +
      `&key=${apiKey}&cx=${cseId}`;
    const resp = await fetch(url);
    if (!resp.ok) return [];
    const data = await resp.json();
    return (data.items ?? []).slice(0, 5).map((it: any) => ({
      id: `web-${it.link}`,
      name: it.title ?? "Experto web",
      source: "web",
      experience_years: 0,
      specialties: ["industria alimentaria"],
      location: null,
      availability: "a coordinar",
      is_verified: false,
      summary: it.snippet ?? "",
      similarity: 0.35,
      avatar_url: null,
      article_url: it.link,
      site_name: it.displayLink,
    }));
  } catch {
    return [];
  }
}

async function notifySearch(
  query: string,
  results: { name: string; match_percentage: number }[],
) {
  const brevoKey = process.env.BREVO_API_KEY;
  const to = process.env.NOTIFICATION_EMAIL ?? "alquimiafoods@proton.me";
  const from =
    process.env.BREVO_FROM_EMAIL ?? "alquimiafoods@proton.me";
  if (!brevoKey) return;
  const top = results[0];
  try {
    await fetch("https://api.brevo.com/v3/smtp/email", {
      method: "POST",
      headers: { "api-key": brevoKey, "Content-Type": "application/json" },
      body: JSON.stringify({
        sender: { email: from, name: "FoodTalent" },
        to: [{ email: to }],
        subject: `Nueva busqueda en FoodTalent: ${query.slice(0, 80)}`,
        textContent:
          `Alguien busco en FoodTalent:\n\nQuery: ${query}\n` +
          `Resultados: ${results.length}\n` +
          `Top match: ${top ? `${top.name} (${top.match_percentage}%)` : "Sin resultados"}\n\n` +
          `Fecha: ${new Date().toISOString()}`,
      }),
    });
  } catch {
    // notifications are best-effort
  }
}

function toCandidate(doc: any, similarity: number): Candidate {
  return {
    id: doc._id,
    name: doc.name,
    source: doc.source,
    experience_years: doc.experienceYears ?? 0,
    specialties: doc.specialties ?? [],
    location: doc.location ?? null,
    availability: doc.availability ?? null,
    hourly_rate: doc.hourlyRate ?? null,
    is_verified: doc.isVerified ?? false,
    summary: doc.summary ?? "",
    research_products: doc.researchProducts ?? [],
    last_experience: doc.lastExperience ?? null,
    similarity,
    avatar_url: doc.avatarUrl ?? null,
  };
}

export const search = action({
  args: {
    query: v.string(),
    category: v.optional(v.string()),
    max_results: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const maxResults = args.max_results ?? 5;

    const queryEmbedding = await embedContent(args.query, "retrieval_query");

    let localCandidates: Candidate[] = [];
    if (queryEmbedding) {
      const hits = await ctx.vectorSearch(
        "professionalEmbeddings",
        "by_embedding",
        { vector: queryEmbedding, limit: 20 },
      );
      const docs: any[] = await ctx.runQuery(
        internal.professionals.professionalsByEmbeddingIds,
        { ids: hits.map((h) => h._id) },
      );
      localCandidates = docs.map((d) => toCandidate(d, 0.9));
    }
    if (args.category) {
      localCandidates = localCandidates.filter((c) =>
        (c.specialties ?? []).includes(args.category!),
      );
    }

    const [videos, webExperts] = await Promise.all([
      searchYouTube(args.query, process.env.YOUTUBE_API_KEY ?? ""),
      searchWeb(
        args.query,
        process.env.GOOGLE_CSE_API_KEY ?? "",
        process.env.GOOGLE_CSE_ID ?? "",
      ),
    ]);
    const youtubeExpertsList = youtubeExperts(args.query, videos);

    // Fill with the rest of the DB so Gemini always has context
    // (mirrors the FastAPI backend behavior).
    const candidateIds = new Set(localCandidates.map((c) => String(c.id)));
    const allDocs: any[] = await ctx.runQuery(
      internal.professionals.listProfessionalsForSearch,
      { limit: 50 },
    );
    for (const doc of allDocs) {
      if (!candidateIds.has(String(doc._id))) {
        localCandidates.push(toCandidate(doc, 0));
      }
    }

    const allCandidates: Candidate[] = [
      ...localCandidates,
      ...youtubeExpertsList,
      ...webExperts,
    ];

    const results =
      allCandidates.length > 0
        ? await rerankAndExplain(args.query, allCandidates, maxResults)
        : [];

    const top = results[0];
    await ctx.runMutation(internal.professionals.logSearch, {
      query: args.query,
      resultsCount: results.length,
      topMatchName: top?.name,
      topMatchPercentage: top?.match_percentage,
    });
    await notifySearch(args.query, results);

    return results.length
      ? results
      : fallbackMatches(allCandidates, maxResults);
  },
});
