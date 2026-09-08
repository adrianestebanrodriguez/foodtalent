import { action, internalQuery } from "./_generated/server";
import { internal } from "./_generated/api";
import { v } from "convex/values";
import { identifyExpertsFromContent } from "./gemini";

const DEFAULT_YOUTUBE_QUERIES = [
  "formulacion alimentos",
  "procesos alimentarios",
  "normativa INVIMA",
  "HACCP alimentos",
  "innovacion alimentos",
];

const DEFAULT_WEB_QUERIES = [
  "experto alimentos Colombia",
  "consultor alimentos funcionales",
  "especialista regulacion INVIMA",
];

export const findByNameAndSource = internalQuery({
  args: { name: v.string(), source: v.string() },
  handler: async (ctx, args) => {
    const rows = await ctx.db
      .query("professionals")
      .filter((q) =>
        q.and(
          q.eq(q.field("name"), args.name),
          q.eq(q.field("source"), args.source),
        ),
      )
      .take(1);
    return rows[0] ?? null;
  },
});

async function fetchTranscript(videoId: string): Promise<string | null> {
  try {
    const listResp = await fetch(
      `https://video.google.com/timedtext?type=list&v=${videoId}`,
    );
    if (!listResp.ok) return null;
    const listXml = await listResp.text();
    const track =
      listXml.match(/<track[^>]*lang="es[^"]*"[^>]*>/)?.[0] ??
      listXml.match(/<track[^>]*>/)?.[0];
    if (!track) return null;
    const lang = track.match(/lang="([^"]+)"/)?.[1] ?? "es";
    const name = track.match(/name="([^"]+)"/)?.[1] ?? "";
    const capResp = await fetch(
      `https://video.google.com/timedtext?lang=${lang}&v=${videoId}&name=${encodeURIComponent(name)}`,
    );
    if (!capResp.ok) return null;
    const xml = await capResp.text();
    const text = xml
      .replace(/<[^>]+>/g, " ")
      .replace(/&#39;/g, "'")
      .replace(/&quot;/g, '"')
      .replace(/&amp;/g, "&")
      .replace(/\s+/g, " ")
      .trim();
    return text.length > 200 ? text : null;
  } catch {
    return null;
  }
}

export const ingestYoutube = action({
  args: { queries: v.optional(v.array(v.string())) },
  handler: async (ctx, args) => {
    const apiKey = process.env.YOUTUBE_API_KEY ?? "";
    if (!apiKey) return { status: "skipped", reason: "no YOUTUBE_API_KEY" };
    const queries = args.queries?.length ? args.queries : DEFAULT_YOUTUBE_QUERIES;
    let found = 0;
    for (const q of queries) {
      const url =
        `https://www.googleapis.com/youtube/v3/search?part=snippet&type=video` +
        `&order=relevance&maxResults=5&relevanceLanguage=es` +
        `&q=${encodeURIComponent(`experto industria alimentaria ${q}`)}&key=${apiKey}`;
      try {
        const resp = await fetch(url);
        if (!resp.ok) continue;
        const data = await resp.json();
        for (const item of data.items ?? []) {
          const videoId = item?.id?.videoId;
          if (!videoId) continue;
          const transcript = await fetchTranscript(videoId);
          const content =
            transcript ??
            `${item.snippet?.title ?? ""}\n${item.snippet?.description ?? ""}`;
          const experts = await identifyExpertsFromContent(content);
          for (const expert of experts) {
            const dup: any = await ctx.runQuery(
              internal.ingest.findByNameAndSource,
              { name: expert.name, source: "youtube" },
            );
            if (dup) continue;
            await ctx.runMutation(
              internal.professionals.insertProfessionalInternal,
              {
                name: expert.name,
                specialties: expert.specialties,
                summary: expert.summary,
                source: "youtube",
                sources: ["youtube"],
                markdown_content:
                  `Canal de YouTube: ${item.snippet?.channelTitle ?? ""}\n` +
                  `Video: ${item.snippet?.title ?? ""}\n` +
                  `URL: https://youtube.com/watch?v=${videoId}`,
              },
            );
            found++;
          }
        }
      } catch {
        continue;
      }
    }
    return { status: "completed", experts_found: found };
  },
});

function stripHtml(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export const ingestWeb = action({
  args: { queries: v.optional(v.array(v.string())) },
  handler: async (ctx, args) => {
    const apiKey = process.env.GOOGLE_CSE_API_KEY ?? "";
    const cseId = process.env.GOOGLE_CSE_ID ?? "";
    if (!apiKey || !cseId)
      return { status: "skipped", reason: "no GOOGLE_CSE credentials" };
    const queries = args.queries?.length ? args.queries : DEFAULT_WEB_QUERIES;
    let found = 0;
    for (const q of queries) {
      try {
        const url =
          `https://www.googleapis.com/customsearch/v1?num=5` +
          `&q=${encodeURIComponent(q)}&key=${apiKey}&cx=${cseId}`;
        const resp = await fetch(url);
        if (!resp.ok) continue;
        const data = await resp.json();
        for (const item of data.items ?? []) {
          if (!item.link) continue;
          let content = item.snippet ?? "";
          try {
            const page = await fetch(item.link, {
              headers: { "User-Agent": "FoodTalentBot/1.0" },
            });
            if (page.ok) {
              const html = await page.text();
              const clean = stripHtml(html).slice(0, 4000);
              if (clean.length > 200) content = clean;
            }
          } catch {
            // fall back to snippet
          }
          const experts = await identifyExpertsFromContent(content);
          for (const expert of experts) {
            const dup: any = await ctx.runQuery(
              internal.ingest.findByNameAndSource,
              { name: expert.name, source: "web" },
            );
            if (dup) continue;
            await ctx.runMutation(
              internal.professionals.insertProfessionalInternal,
              {
                name: expert.name,
                specialties: expert.specialties,
                summary: expert.summary,
                source: "web",
                sources: ["web"],
                markdown_content:
                  `Articulo: ${item.title ?? ""}\nURL: ${item.link}`,
              },
            );
            found++;
          }
        }
      } catch {
        continue;
      }
    }
    return { status: "completed", experts_found: found };
  },
});
