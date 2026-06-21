import type { CompanyProfile, DashboardData } from "@/lib/schemas";

export type LiveHotspot = {
  title: string;
  summary: string;
  sourceType: "google-news-rss" | "gdelt";
  publisher: string;
  url?: string;
  publishedAt: string;
  query: string;
  confidence: "high" | "medium" | "low";
};

const CACHE_TTL_MS = 15 * 60 * 1000;
const cache = new Map<string, { expiresAt: number; data: LiveHotspot[] }>();

function stripTags(value: string) {
  return value
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1")
    .replace(/<[^>]+>/g, "")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .trim();
}

function decodeGoogleNewsUrl(rawUrl: string) {
  try {
    const url = new URL(stripTags(rawUrl));
    return url.searchParams.get("url") ?? url.toString();
  } catch {
    return stripTags(rawUrl);
  }
}

function normalizeTitle(title: string) {
  return title
    .toLowerCase()
    .replace(/\s+/g, "")
    .replace(/[^\p{L}\p{N}]/gu, "")
    .slice(0, 80);
}

function isValidUrl(value: string | undefined) {
  if (!value) return false;
  try {
    new URL(value);
    return true;
  } catch {
    return false;
  }
}

function isRecent(dateText: string) {
  const time = Date.parse(dateText);
  if (Number.isNaN(time)) return true;
  return Date.now() - time <= 4 * 24 * 60 * 60 * 1000;
}

function queryTerms(profile: CompanyProfile, input: string) {
  const base = [
    input,
    `${profile.industry} ${profile.city}`,
    `${profile.industry} 热点`,
    `${profile.companyName} ${profile.industry}`,
  ];

  const compactInput = input.replace(/\s+/g, " ").trim();
  if (compactInput.length > 8) base.unshift(compactInput.slice(0, 80));

  return Array.from(
    new Set(
      base
        .map((item) => item.trim())
        .filter(Boolean)
        .slice(0, 5),
    ),
  );
}

async function fetchWithBudget(url: string, signal: AbortSignal) {
  return fetch(url, {
    headers: {
      "User-Agent": "easy-comm-beta/0.1 (+https://github.com/cexufu/easy-Comm)",
      Accept: "application/rss+xml, application/json, text/xml;q=0.9, */*;q=0.8",
    },
    signal,
  });
}

async function fetchGoogleNews(query: string, signal: AbortSignal): Promise<LiveHotspot[]> {
  const params = new URLSearchParams({
    q: `${query} when:3d`,
    hl: "zh-CN",
    gl: "CN",
    ceid: "CN:zh-Hans",
  });
  const response = await fetchWithBudget(
    `https://news.google.com/rss/search?${params.toString()}`,
    signal,
  );
  if (!response.ok) return [];

  const xml = await response.text();
  const items = Array.from(xml.matchAll(/<item>([\s\S]*?)<\/item>/g)).slice(0, 8);
  return items
    .map((match) => {
      const item = match[1] ?? "";
      const title = stripTags(item.match(/<title>([\s\S]*?)<\/title>/)?.[1] ?? "");
      const link = decodeGoogleNewsUrl(item.match(/<link>([\s\S]*?)<\/link>/)?.[1] ?? "");
      const source = stripTags(item.match(/<source[^>]*>([\s\S]*?)<\/source>/)?.[1] ?? "Google News");
      const publishedAt = stripTags(item.match(/<pubDate>([\s\S]*?)<\/pubDate>/)?.[1] ?? "");
      const summary = stripTags(item.match(/<description>([\s\S]*?)<\/description>/)?.[1] ?? title);
      return {
        title,
        summary: summary || title,
        sourceType: "google-news-rss" as const,
        publisher: source,
        url: link,
        publishedAt,
        query,
        confidence: isRecent(publishedAt) ? ("high" as const) : ("medium" as const),
      };
    })
    .filter((item) => item.title && isValidUrl(item.url));
}

async function fetchGdelt(query: string, signal: AbortSignal): Promise<LiveHotspot[]> {
  const params = new URLSearchParams({
    query: `${query} sourcelang:Chinese`,
    mode: "artlist",
    format: "json",
    maxrecords: "8",
    sort: "HybridRel",
    timespan: "3d",
  });
  const response = await fetchWithBudget(
    `https://api.gdeltproject.org/api/v2/doc/doc?${params.toString()}`,
    signal,
  );
  if (!response.ok) return [];

  const data = (await response.json()) as {
    articles?: Array<{
      title?: string;
      url?: string;
      sourceCountry?: string;
      sourceCollectionIdentifier?: string;
      domain?: string;
      seendate?: string;
    }>;
  };

  return (data.articles ?? [])
    .map((article) => ({
      title: article.title?.trim() ?? "",
      summary: article.title?.trim() ?? "",
      sourceType: "gdelt" as const,
      publisher: article.domain ?? article.sourceCollectionIdentifier ?? "GDELT",
      url: article.url,
      publishedAt: article.seendate ?? "",
      query,
      confidence: "medium" as const,
    }))
    .filter((item) => item.title && isValidUrl(item.url));
}

export async function collectLiveHotspots(
  profile: CompanyProfile,
  input = "",
  maxItems = 8,
): Promise<LiveHotspot[]> {
  const queries = queryTerms(profile, input);
  const cacheKey = JSON.stringify({ profile, input, maxItems });
  const cached = cache.get(cacheKey);
  if (cached && cached.expiresAt > Date.now()) return cached.data;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 8000);
  try {
    const batches = await Promise.allSettled(
      queries.flatMap((query) => [
        fetchGoogleNews(query, controller.signal),
        fetchGdelt(query, controller.signal),
      ]),
    );
    const merged = batches
      .flatMap((result) => (result.status === "fulfilled" ? result.value : []))
      .filter((item) => isRecent(item.publishedAt));

    const seen = new Set<string>();
    const data = merged
      .filter((item) => {
        const key = normalizeTitle(item.title);
        if (!key || seen.has(key)) return false;
        seen.add(key);
        return true;
      })
      .slice(0, maxItems);

    cache.set(cacheKey, { expiresAt: Date.now() + CACHE_TTL_MS, data });
    return data;
  } finally {
    clearTimeout(timer);
  }
}

export function hotspotsToDashboard(
  profile: CompanyProfile,
  hotspots: LiveHotspot[],
): DashboardData {
  return {
    status: hotspots.length ? "fresh" : "degraded",
    generatedAt: new Date().toISOString(),
    risks: [],
    hotTopics: hotspots.map((item) => ({
      title: item.title,
      summary: item.summary || item.title,
      fitReason: `与“${profile.industry} / ${profile.goal}”相关；来源查询：${item.query}`,
      risk: "medium",
      tags: [item.sourceType, item.confidence, profile.industry].slice(0, 5),
      sources: [
        {
          title: item.title,
          url: item.url,
          publisher: item.publisher,
          publishedAt: item.publishedAt || new Date().toISOString(),
        },
      ],
    })),
  };
}
