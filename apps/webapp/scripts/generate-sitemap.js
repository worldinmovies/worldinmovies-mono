/**
 * generate-sitemap.js
 *
 * Generates the sitemap for worldinmovies.com at build time.
 *
 * - Connects to MongoDB (the same database the Django backend uses) and
 *   fetches every movie ID.
 * - Writes split movie sitemaps (sitemap-movies-001.xml, ... — at most
 *   ~1000 URLs per file, Google's recommended cap) to apps/webapp/public/.
 * - Writes a sitemap.xml INDEX that points to the split movie sitemaps
 *   and the sitemap-static.xml (static routes).
 *
 * If MongoDB is unreachable the script falls back to a static-only sitemap
 * (existing behaviour) so `pnpm build` never breaks.
 *
 * Env vars (same ones used by the Django backend in services/tmdb):
 *   MONGO_URL      host of the Mongo server (default: localhost)
 *   MONGO_PORT     port (default: 27017)
 *   MONGO_USER     username (default: seppa)
 *   MONGO_PASSWORD password (no default — build fails soft without it)
 *   MONGO_DB       database name (default: tmdb)
 *   SITE_URL       origin used in <loc> (default: https://worldinmovies.com)
 *
 * Usage: node scripts/generate-sitemap.js
 */

import { MongoClient } from "mongodb";
import { mkdirSync, writeFileSync, rmSync, readdirSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PUBLIC_DIR = path.resolve(__dirname, "../public");

const SITE_URL = (process.env.SITE_URL || "https://worldinmovies.com").replace(/\/+$/, "");
const MONGO_PORT = Number(process.env.MONGO_PORT || "27017");
const MONGO_DB = process.env.MONGO_DB || "tmdb";
const MOVIES_PER_FILE = 1000; // Google's recommended max URLs per sitemap file

// Static routes that are always included in the sitemap.
const STATIC_ROUTES = [
  { path: "", changefreq: "daily", priority: "1.0" },
  { path: "/watchlist", changefreq: "weekly", priority: "0.8" },
  { path: "/analytics", changefreq: "weekly", priority: "0.6" },
  { path: "/privacy", changefreq: "monthly", priority: "0.4" },
  { path: "/about", changefreq: "monthly", priority: "0.5" },
  { path: "/faq", changefreq: "monthly", priority: "0.5" },
  { path: "/import", changefreq: "monthly", priority: "0.5" },
];

const today = new Date().toISOString().slice(0, 10);

const escapeXml = (value) =>
  String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");

/**
 * Build the MongoDB connection string from the same env vars the Django
 * backend uses (services/tmdb/settings/settings.py):
 *   MONGO_URL (host) + MONGO_PORT + MONGO_USER + MONGO_PASSWORD
 * A full connection string (mongodb://...) in MONGO_URL is used as-is.
 */
function buildMongoUri() {
  const rawUrl = process.env.MONGO_URL;
  if (!rawUrl) return null;
  const user = process.env.MONGO_USER || "seppa";
  const pass = process.env.MONGO_PASSWORD;

  if (rawUrl.startsWith("mongodb://") || rawUrl.startsWith("mongodb+srv://")) {
    // Full URI — use as-is (may already contain credentials).
    return rawUrl;
  }

  const auth = pass ? `${encodeURIComponent(user)}:${encodeURIComponent(pass)}@` : "";
  const host = rawUrl.includes(":") ? rawUrl : `${rawUrl}:${MONGO_PORT}`;
  return `mongodb://${auth}${host}/${MONGO_DB}?authSource=admin&serverSelectionTimeoutMS=5000`;
}

function fetchMovieIds(uri) {
  return MongoClient.connect(uri, { maxPoolSize: 5 }).then(async (client) => {
    const db = client.db(MONGO_DB);
    const cursor = db.collection("movie").find({}, { projection: { _id: 1 } });
    const ids = [];
    for await (const doc of cursor) {
      const id = Number(doc._id);
      if (Number.isInteger(id) && id > 0) ids.push(id);
    }
    ids.sort((a, b) => a - b);
    return ids;
  });
}

function urlXml(loc, changefreq, priority) {
  return [
    "  <url>",
    `    <loc>${escapeXml(loc)}</loc>`,
    `    <lastmod>${today}</lastmod>`,
    `    <changefreq>${changefreq}</changefreq>`,
    `    <priority>${priority}</priority>`,
    "  </url>",
  ].join("\n");
}

function writeFile(name, xml) {
  writeFileSync(path.join(PUBLIC_DIR, name), `<?xml version="1.0" encoding="UTF-8"?>\n${xml}\n`);
}

function removeStaleMovieSitemaps() {
  // Remove any previous generated sitemap-movies-*.xml so deleted files
  // don't linger and break the index.
  for (const entry of readdirSync(PUBLIC_DIR)) {
    if (/^sitemap-movies-\d{3}\.xml$/.test(entry)) {
      rmSync(path.join(PUBLIC_DIR, entry));
    }
  }
}

async function main() {
  mkdirSync(PUBLIC_DIR, { recursive: true });
  removeStaleMovieSitemaps();

  const movieIds = [];
  const uri = buildMongoUri();

  if (uri) {
    try {
      const ids = await fetchMovieIds(uri);
      movieIds.push(...ids);
      console.log(`[sitemap] Fetched ${ids.length} movie IDs from MongoDB.`);
    } catch (err) {
      // Degrade gracefully: static-only sitemap, build keeps working.
      console.warn(`[sitemap] WARNING: MongoDB unavailable (${err.message}). Generating static-only sitemap.`);
    }
  } else {
    console.warn("[sitemap] WARNING: MONGO_URL not set. Generating static-only sitemap.");
  }

  // --- Movie sitemaps (split) ---
  const movieSitemapFiles = [];
  for (let i = 0; i < movieIds.length; i += MOVIES_PER_FILE) {
    const chunk = movieIds.slice(i, i + MOVIES_PER_FILE);
    const num = String(Math.floor(i / MOVIES_PER_FILE) + 1).padStart(3, "0");
    const file = `sitemap-movies-${num}.xml`;
    const body = [
      `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">`,
      ...chunk.map((id) => urlXml(`${SITE_URL}/movie/${id}`, "weekly", "0.7")),
      `</urlset>`,
    ].join("\n");
    writeFile(file, body);
    movieSitemapFiles.push(file);
  }

  // --- Static routes sitemap ---
  const staticBody = [
    `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">`,
    ...STATIC_ROUTES.map((r) => urlXml(`${SITE_URL}${r.path}`, r.changefreq, r.priority)),
    `</urlset>`,
  ].join("\n");
  writeFile("sitemap-static.xml", staticBody);

  // --- Sitemap index ---
  const childSitemaps = [
    ...movieSitemapFiles.map((f) => ({ file: f })),
    { file: "sitemap-static.xml" },
  ];
  const indexBody = [
    `<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">`,
    ...childSitemaps.map(
      (s) =>
        [
          "  <sitemap>",
          `    <loc>${SITE_URL}/${s.file}</loc>`,
          `    <lastmod>${today}</lastmod>`,
          "  </sitemap>",
        ].join("\n"),
    ),
    `</sitemapindex>`,
  ].join("\n");
  writeFile("sitemap.xml", indexBody);

  console.log(
    `[sitemap] Wrote sitemap.xml (index, ${childSitemaps.length} child sitemaps), ` +
      `${movieSitemapFiles.length} movie sitemap(s), 1 static sitemap.`,
  );
}

main().catch((err) => {
  console.error(`[sitemap] ERROR: ${err.message}`);
  process.exit(1);
});
