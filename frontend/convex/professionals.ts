import {
  action,
  internalMutation,
  internalQuery,
  mutation,
  query,
} from "./_generated/server";
import { api, internal } from "./_generated/api";
import { v } from "convex/values";
import { embedContent, professionalToMarkdown } from "./gemini";
import { Scrypt } from "lucia";

const researchProduct = v.object({
  name: v.string(),
  url: v.optional(v.string()),
});
const lastExperience = v.object({
  client: v.optional(v.string()),
  description: v.optional(v.string()),
  achievement: v.optional(v.string()),
});

const professionalCreateArgs = {
  name: v.string(),
  email: v.optional(v.string()),
  whatsapp: v.optional(v.string()),
  specialties: v.optional(v.array(v.string())),
  experience_years: v.optional(v.number()),
  availability: v.optional(v.string()),
  hourly_rate: v.optional(v.string()),
  location: v.optional(v.string()),
  summary: v.optional(v.string()),
  research_products: v.optional(v.array(researchProduct)),
  last_experience: v.optional(lastExperience),
};

// --- auth helpers -----------------------------------------------------------

async function requireUserId(ctx: {
  auth: { getUserIdentity: () => Promise<{ subject: string } | null> };
  db: any;
}) {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) throw new Error("No autenticado");
  return extractUserId(identity);
}

function extractUserId(identity: { subject: string }): any {
  return identity.subject.includes("|")
    ? identity.subject.split("|")[0]
    : identity.subject;
}

async function requireProfile(
  ctx: { auth: any; db: any },
  role?: string,
) {
  const userId = await requireUserId(ctx);
  const profile = await ctx.db
    .query("profiles")
    .withIndex("by_user", (q: any) => q.eq("userId", userId))
    .unique();
  if (!profile || !profile.isActive) throw new Error("Perfil inactivo");
  if (role && profile.role !== role && !profile.isSuperuser) {
    throw new Error(`Esta acción requiere el rol '${role}'.`);
  }
  return { userId, profile };
}

// --- public API -------------------------------------------------------------

export const createProfessional = mutation({
  args: professionalCreateArgs,
  handler: async (ctx, args) => {
    const { userId } = await requireProfile(ctx, "profesional");
    const markdown = professionalToMarkdown({ ...args, source: "registered" });
    const id = await ctx.db.insert("professionals", {
      userId,
      name: args.name,
      email: args.email,
      whatsapp: args.whatsapp,
      specialties: args.specialties ?? [],
      experienceYears: args.experience_years ?? 0,
      availability: args.availability ?? "inmediata",
      hourlyRate: args.hourly_rate,
      location: args.location,
      researchProducts: args.research_products ?? [],
      lastExperience: args.last_experience,
      summary: args.summary ?? "",
      markdownContent: markdown,
      source: "registered",
      sources: [],
      isVerified: false,
      rating: 0,
      projectsCompleted: 0,
    });
    await ctx.scheduler.runAfter(0, api.professionals.embedProfessional, {
      professionalId: id,
    });
    return await ctx.db.get(id);
  },
});

export const updateProfessional = mutation({
  args: { professionalId: v.id("professionals"), ...professionalCreateArgs },
  handler: async (ctx, args) => {
    await requireProfile(ctx, "profesional");
    const { professionalId, ...data } = args;
    const doc = await ctx.db.get(professionalId);
    if (!doc) throw new Error("Profesional no encontrado");
    const markdown = professionalToMarkdown({ ...data, source: doc.source });
    await ctx.db.patch(professionalId, {
      name: data.name,
      email: data.email,
      whatsapp: data.whatsapp,
      specialties: data.specialties ?? [],
      experienceYears: data.experience_years ?? 0,
      availability: data.availability ?? "inmediata",
      hourlyRate: data.hourly_rate,
      location: data.location,
      researchProducts: data.research_products ?? [],
      lastExperience: data.last_experience,
      summary: data.summary ?? "",
      markdownContent: markdown,
    });
    await ctx.scheduler.runAfter(0, api.professionals.embedProfessional, {
      professionalId,
    });
    return await ctx.db.get(professionalId);
  },
});

export const listProfessionals = query({
  args: { skip: v.optional(v.number()), limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    const skip = args.skip ?? 0;
    const limit = args.limit ?? 20;
    return await ctx.db
      .query("professionals")
      .order("desc")
      .take(skip + limit)
      .then((rows: any[]) => rows.slice(skip));
  },
});

export const getProfessional = query({
  args: { professionalId: v.id("professionals") },
  handler: async (ctx, args) => ctx.db.get(args.professionalId),
});

export const getMyProfessional = query({
  args: {},
  handler: async (ctx) => {
    const userId = await requireUserId(ctx);
    return await ctx.db
      .query("professionals")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .first();
  },
});

export const getProfessionalMarkdown = query({
  args: { professionalId: v.id("professionals") },
  handler: async (ctx, args) => {
    const doc = await ctx.db.get(args.professionalId);
    if (!doc?.markdownContent) throw new Error("Markdown no disponible");
    return { markdown: doc.markdownContent };
  },
});

export const exportProfessionalsJson = query({
  args: {},
  handler: async (ctx) => {
    const { profile } = await requireProfile(ctx);
    if (!profile.isSuperuser) throw new Error("Solo administradores");
    return await ctx.db.query("professionals").order("asc").collect();
  },
});

// --- embedding pipeline -----------------------------------------------------

export const embedProfessional = action({
  args: { professionalId: v.id("professionals") },
  handler: async (ctx, args) => {
    const doc: any = await ctx.runQuery(
      internal.professionals.getProfessionalInternal,
      { professionalId: args.professionalId },
    );
    if (!doc) return null;
    const embedding = await embedContent(
      doc.markdownContent,
      "retrieval_document",
    );
    if (embedding) {
      await ctx.runMutation(internal.professionals.saveEmbedding, {
        professionalId: args.professionalId,
        embedding,
      });
    }
    // Keep a .md copy in File Storage (replaces storage/profiles/*.md)
    const blob = new Blob(
      [doc.markdownContent],
      { type: "text/markdown" },
    );
    const storageId = await ctx.storage.store(blob);
    await ctx.runMutation(internal.professionals.saveMarkdownFile, {
      professionalId: args.professionalId,
      storageId,
    });
    return { embedding_generated: embedding !== null };
  },
});

// --- internal helpers (used by actions/crons/migrations) --------------------

export const getProfessionalInternal = internalQuery({
  args: { professionalId: v.id("professionals") },
  handler: async (ctx, args) => ctx.db.get(args.professionalId),
});

export const saveEmbedding = internalMutation({
  args: {
    professionalId: v.id("professionals"),
    embedding: v.array(v.float64()),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("professionalEmbeddings")
      .withIndex("by_professional", (q) =>
        q.eq("professionalId", args.professionalId),
      )
      .unique();
    if (existing) {
      await ctx.db.patch(existing._id, { embedding: args.embedding });
      return existing._id;
    }
    const id = await ctx.db.insert("professionalEmbeddings", {
      professionalId: args.professionalId,
      embedding: args.embedding,
    });
    await ctx.db.patch(args.professionalId, { embeddingId: id });
    return id;
  },
});

export const saveMarkdownFile = internalMutation({
  args: {
    professionalId: v.id("professionals"),
    storageId: v.id("_storage"),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.professionalId, {
      markdownFileId: args.storageId,
    });
  },
});

export const insertProfessionalInternal = internalMutation({
  args: {
    name: v.string(),
    email: v.optional(v.string()),
    specialties: v.optional(v.array(v.string())),
    experience_years: v.optional(v.number()),
    availability: v.optional(v.string()),
    location: v.optional(v.string()),
    summary: v.optional(v.string()),
    source: v.string(),
    sources: v.optional(v.array(v.string())),
    markdown_content: v.optional(v.string()),
    research_products: v.optional(v.array(researchProduct)),
    last_experience: v.optional(lastExperience),
  },
  handler: async (ctx, args) => {
    const markdown =
      args.markdown_content ??
      professionalToMarkdown({ ...args, source: args.source });
    const id = await ctx.db.insert("professionals", {
      userId: undefined,
      name: args.name,
      email: args.email,
      specialties: args.specialties ?? [],
      experienceYears: args.experience_years ?? 0,
      availability: args.availability ?? "a coordinar",
      hourlyRate: undefined,
      location: args.location,
      researchProducts: args.research_products ?? [],
      lastExperience: args.last_experience,
      summary: args.summary ?? "",
      markdownContent: markdown,
      source: args.source,
      sources: args.sources ?? [args.source],
      isVerified: false,
      rating: 0,
      projectsCompleted: 0,
    });
    await ctx.scheduler.runAfter(0, api.professionals.embedProfessional, {
      professionalId: id,
    });
    return id;
  },
});

export const professionalsByEmbeddingIds = internalQuery({
  args: { ids: v.array(v.id("professionalEmbeddings")) },
  handler: async (ctx, args) => {
    const out = [];
    for (const id of args.ids) {
      const emb = await ctx.db.get(id);
      if (!emb) continue;
      const doc = await ctx.db.get(emb.professionalId);
      if (doc) out.push(doc);
    }
    return out;
  },
});

export const listProfessionalsForSearch = internalQuery({
  args: { limit: v.optional(v.number()) },
  handler: async (ctx, args) =>
    ctx.db
      .query("professionals")
      .order("desc")
      .take(args.limit ?? 50),
});

export const logSearch = internalMutation({
  args: {
    query: v.string(),
    resultsCount: v.number(),
    topMatchName: v.optional(v.string()),
    topMatchPercentage: v.optional(v.number()),
    ipAddress: v.optional(v.string()),
    userAgent: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await ctx.db.insert("searchLogs", args);
  },
});

export const ensureProfile = internalMutation({
  args: {
    userId: v.id("users"),
    role: v.optional(v.string()),
    fullName: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("profiles")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .unique();
    if (existing) return existing._id;
    return await ctx.db.insert("profiles", {
      userId: args.userId,
      role: args.role ?? "profesional",
      fullName: args.fullName,
      isActive: true,
    });
  },
});

// Called by the client right after sign-in/sign-up to guarantee the app
// profile exists. Returns null when not authenticated.
export const syncMyProfile = mutation({
  args: {
    role: v.optional(v.string()),
    fullName: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return null;
    const userId = extractUserId(identity);
    const existing = await ctx.db
      .query("profiles")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .unique();
    if (existing) {
      if (!existing.isActive) throw new Error("Cuenta desactivada");
      return existing;
    }
    const id = await ctx.db.insert("profiles", {
      userId,
      role: args.role ?? "profesional",
      fullName: args.fullName,
      isActive: true,
    });
    return await ctx.db.get(id);
  },
});

export const myProfile = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return null;
    const userId = extractUserId(identity);
    return await ctx.db
      .query("profiles")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .unique();
  },
});

export const exportSearchLogs = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("No autenticado");
    const userId = extractUserId(identity);
    const profile = await ctx.db
      .query("profiles")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .unique();
    if (!profile?.isSuperuser) throw new Error("Solo administradores");
    return await ctx.db
      .query("searchLogs")
      .order("desc")
      .take(5000);
  },
});

// --- admin: list registered users & reset passwords -------------------------

export const listRegisteredUsers = query({
  args: {},
  handler: async (ctx) => {
    const { profile } = await requireProfile(ctx);
    if (!profile.isSuperuser) throw new Error("Solo administradores");

    const seen = new Set<string>();
    const rows: any[] = [];

    // 1) Users that already have an auth profile.
    const profiles = await ctx.db.query("profiles").collect();
    for (const p of profiles) {
      const user = p.userId ? await ctx.db.get(p.userId) : null;
      const email = user?.email ?? null;
      if (email) seen.add(email.toLowerCase());
      rows.push({
        userId: p.userId,
        email,
        fullName: p.fullName ?? user?.name ?? null,
        role: p.role,
        isSuperuser: p.isSuperuser ?? false,
        isActive: p.isActive,
        hasAccount: true,
      });
    }

    // 2) Directory professionals that don't have an account yet.
    const pros = await ctx.db.query("professionals").collect();
    for (const pr of pros) {
      const email = pr.email;
      if (!email) continue;
      if (seen.has(email.toLowerCase())) continue;
      seen.add(email.toLowerCase());
      rows.push({
        userId: pr.userId ?? null,
        email,
        fullName: pr.name,
        role: "profesional",
        isSuperuser: false,
        isActive: true,
        hasAccount: false,
      });
    }

    return rows.sort((a, b) => (a.email ?? "").localeCompare(b.email ?? ""));
  },
});

export const resetProfessionalPassword = mutation({
  args: {
    email: v.string(),
    newPassword: v.string(),
  },
  handler: async (ctx, args) => {
    const { profile } = await requireProfile(ctx);
    if (!profile.isSuperuser) throw new Error("Solo administradores");
    if (args.newPassword.length < 8)
      throw new Error("La contraseña debe tener al menos 8 caracteres");
    const email = args.email.trim().toLowerCase();
    const secret = await new Scrypt().hash(args.newPassword);

    const user = await ctx.db
      .query("users")
      .withIndex("email", (q: any) => q.eq("email", email))
      .first();

    // Existing account -> reset its password.
    if (user) {
      const existingAccount = await ctx.db
        .query("authAccounts")
        .withIndex(
          "providerAndAccountId",
          (q: any) =>
            q.eq("provider", "password").eq("providerAccountId", email),
        )
        .unique();
      if (existingAccount) {
        await ctx.db.patch(existingAccount._id, { secret });
      } else {
        await ctx.db.insert("authAccounts", {
          userId: user._id,
          provider: "password",
          providerAccountId: email,
          secret,
        });
      }
      return { ok: true, email, created: false };
    }

    // No account yet -> create one so the professional can log in.
    const professional = await ctx.db
      .query("professionals")
      .filter((q: any) => q.eq(q.field("email"), email))
      .first();
    const fullName = professional?.name ?? email;
    const userId = await ctx.db.insert("users", { name: fullName, email });
    await ctx.db.insert("authAccounts", {
      userId,
      provider: "password",
      providerAccountId: email,
      secret,
    });
    await ctx.db.insert("profiles", {
      userId,
      role: "profesional",
      fullName,
      isActive: true,
      isSuperuser: false,
    });
    if (professional) {
      await ctx.db.patch(professional._id, { userId });
    }
    return { ok: true, email, created: true };
  },
});
