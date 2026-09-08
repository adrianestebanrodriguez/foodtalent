import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const dumpPath = join(__dirname, "..", "..", "foodtalent_backup.sql");
const profOutPath = join(__dirname, "professionals-import.json");
const embOutPath = join(__dirname, "professionalEmbeddings-import.json");

const sql = readFileSync(dumpPath, "utf8");
const lines = sql.split("\n");

function unescapeField(field) {
  if (field === "\\N") return null;
  let out = "";
  for (let i = 0; i < field.length; i++) {
    const ch = field[i];
    if (ch !== "\\") {
      out += ch;
      continue;
    }
    const next = field[i + 1];
    switch (next) {
      case "N":
        out += "\\N";
        i++;
        break;
      case "\\":
        out += "\\";
        i++;
        break;
      case "b":
        out += "\b";
        i++;
        break;
      case "f":
        out += "\f";
        i++;
        break;
      case "n":
        out += "\n";
        i++;
        break;
      case "r":
        out += "\r";
        i++;
        break;
      case "t":
        out += "\t";
        i++;
        break;
      case "v":
        out += "\v";
        i++;
        break;
      case "x": {
        const hex = field.slice(i + 2, i + 4);
        out += String.fromCharCode(parseInt(hex, 16));
        i += 3;
        break;
      }
      default:
        out += "\\";
    }
  }
  return out;
}

function parseJson(raw) {
  if (raw == null) return undefined;
  try {
    return JSON.parse(raw);
  } catch {
    return undefined;
  }
}

function parseEmbedding(raw) {
  if (raw == null) return undefined;
  const text = raw.trim();
  if (!text || text === "[]") return undefined;
  try {
    const arr = JSON.parse(text);
    return Array.isArray(arr) ? arr : undefined;
  } catch {
    return undefined;
  }
}

// Find the professionals COPY section
const copyIdx = lines.findIndex((l) =>
  l.startsWith("COPY public.professionals "),
);
if (copyIdx === -1) throw new Error("professionals COPY not found");

const rows = [];
const embeddings = [];
let i = copyIdx + 1;
while (i < lines.length && lines[i].trim() !== "\\.") {
  const parts = lines[i].split("\t");
  const col = parts.map(unescapeField);
  const f = (idx) => (idx < col.length ? col[idx] : null);

  const specialties = parseJson(f(5)) ?? [];
  const sources = parseJson(f(13)) ?? [];
  const researchProducts = parseJson(f(20)) ?? [];
  const lastExperience = parseJson(f(21));
  const embedding = parseEmbedding(f(14));

  const doc = {
    _id: "professionals:" + encodeId(Number(f(0))),
    name: f(2) ?? "",
    email: f(3) ?? undefined,
    avatarUrl: f(4) ?? undefined,
    whatsapp: f(22) ?? undefined,
    specialties,
    experienceYears: Number(f(6)) || 0,
    availability: f(7) ?? "inmediata",
    hourlyRate: f(8) ?? undefined,
    location: f(9) ?? undefined,
    summary: f(10) ?? "",
    markdownContent: f(11) ?? "",
    source: f(12) ?? "registered",
    sources,
    isVerified: (f(15) ?? "f") === "t",
    rating: Number(f(16)) || 0,
    projectsCompleted: Number(f(17)) || 0,
    researchProducts,
    lastExperience,
    embeddingId: embedding
      ? "professionalEmbeddings:" + encodeId(Number(f(0)))
      : undefined,
  };
  rows.push(doc);
  if (embedding) {
    embeddings.push({
      _id: "professionalEmbeddings:" + encodeId(Number(f(0))),
      professionalId: "professionals:" + encodeId(Number(f(0))),
      embedding,
    });
  }
  i++;
}

writeFileSync(profOutPath, JSON.stringify(rows, null, 2), "utf8");
writeFileSync(embOutPath, JSON.stringify(embeddings, null, 2), "utf8");
console.log(
  `Parsed ${rows.length} professionals (${embeddings.length} with embeddings)`,
);

// Build a valid 24-char Convex-style id from the int id.
function encodeId(n) {
  const chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let out = "";
  let v = n;
  for (let k = 0; k < 8; k++) {
    out = chars[v % chars.length] + out;
    v = Math.floor(v / chars.length);
  }
  return out.padStart(24, "a");
}