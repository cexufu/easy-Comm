import type { CompanyProfile, DashboardData } from "@/lib/schemas";

export type LiveHotspot = {
  title: string;
  summary: string;
  sourceType:
    | "google-news-rss"
    | "gdelt"
    | "tophub"
    | "toutiao-hot-board"
    | "baidu-hot-board"
    | "rsshub";
  publisher: string;
  url?: string;
  publishedAt: string;
  query: string;
  heatSignal?: string;
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

function decodeHtml(value: string) {
  return stripTags(value)
    .replace(/\\u([0-9a-fA-F]{4})/g, (_, hex: string) =>
      String.fromCharCode(Number.parseInt(hex, 16)),
    )
    .replace(/\\\//g, "/");
}

function normalizeTitle(title: string) {
  return title
    .toLowerCase()
    .replace(/\s+/g, "")
    .replace(/&#x[0-9a-f]+;?/gi, "")
    .replace(/[^\p{L}\p{N}]/gu, "")
    .slice(0, 80);
}

const NOISE_TITLES = new Set([
  "今日热榜",
  "榜中榜",
  "热文库",
  "公众号",
  "小部件",
  "自定义分组",
  "更多",
  "首页",
  "登录",
  "注册",
  "关于",
  "广告",
  "查看",
  "客户端",
  "api",
  "app",
]);

function isNoiseTitle(title: string) {
  const compact = title.replace(/\s+/g, "").toLowerCase();
  return (
    !compact ||
    NOISE_TITLES.has(compact) ||
    /&#x[0-9a-f]+;?/i.test(title) ||
    /^更多/.test(compact) ||
    /^top\s*hub$/i.test(title)
  );
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

function isVerifiableHotspot(item: LiveHotspot) {
  return Boolean(item.title && !isNoiseTitle(item.title) && isValidUrl(item.url));
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
    .filter(isVerifiableHotspot);
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
    .filter(isVerifiableHotspot);
}

async function fetchToutiaoHotBoard(signal: AbortSignal): Promise<LiveHotspot[]> {
  const response = await fetchWithBudget(
    "https://www.toutiao.com/hot-event/hot-board/?origin=toutiao_pc",
    signal,
  );
  if (!response.ok) return [];

  const data = (await response.json()) as {
    data?: Array<{
      Title?: string;
      QueryWord?: string;
      Url?: string;
      HotValue?: string;
      Label?: string;
      LabelDesc?: string;
      InterestCategory?: string[];
    }>;
  };

  const now = new Date().toISOString();
  return (data.data ?? [])
    .slice(0, 30)
    .map((item, index) => {
      const title = item.Title || item.QueryWord || "";
      const heatSignal = item.HotValue ? `热度 ${item.HotValue}` : `排名 ${index + 1}`;
      return {
        title,
        summary: [item.LabelDesc, item.InterestCategory?.join("/")].filter(Boolean).join("；") || title,
        sourceType: "toutiao-hot-board" as const,
        publisher: "今日头条热榜",
        url: item.Url,
        publishedAt: now,
        query: "今日头条热榜",
        heatSignal,
        confidence: "high" as const,
      };
    })
    .filter(isVerifiableHotspot);
}

async function fetchBaiduHotBoard(signal: AbortSignal): Promise<LiveHotspot[]> {
  const response = await fetchWithBudget("https://top.baidu.com/board?tab=realtime", signal);
  if (!response.ok) return [];

  const html = await response.text();
  const blocks = Array.from(html.matchAll(/<div class="category-wrap[\s\S]*?(?=<div class="category-wrap|<\/main>)/g))
    .slice(0, 30)
    .map((match) => match[0] ?? "");
  const now = new Date().toISOString();

  return blocks
    .map((block, index) => {
      const href = block.match(/href="(https:\/\/www\.baidu\.com\/s\?wd=[^"]+)"/)?.[1];
      const titleMatch = block.match(/<div class="c-single-text-ellipsis">\s*([\s\S]*?)\s*<\/div>/);
      const hotMatch = block.match(/<div class="hot-index_[^"]*">\s*([\d,]+)\s*<\/div>/);
      const descMatch = block.match(/<div class="hot-desc_[^"]*[\s\S]*?">\s*([\s\S]*?)<a /);
      const title = decodeHtml(titleMatch?.[1] ?? "");
      const summary = decodeHtml(descMatch?.[1] ?? title);
      const heatSignal = hotMatch?.[1] ? `热搜指数 ${hotMatch[1]}` : `排名 ${index + 1}`;
      return {
        title,
        summary: summary || title,
        sourceType: "baidu-hot-board" as const,
        publisher: "百度热搜",
        url: href?.replaceAll("&amp;", "&"),
        publishedAt: now,
        query: "百度热搜",
        heatSignal,
        confidence: "high" as const,
      };
    })
    .filter(isVerifiableHotspot);
}

function parseTopHubItems(html: string, publisher = "TopHub"): LiveHotspot[] {
  const now = new Date().toISOString();
  const anchors = Array.from(html.matchAll(/<a[^>]+href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/g));
  const seen = new Set<string>();
  const items: LiveHotspot[] = [];
  const baseUrl = process.env.TOPHUB_BASE_URL || "https://tophub.today";

  for (const [index, match] of anchors.entries()) {
    const href = decodeHtml(match[1] ?? "");
    const rawText = decodeHtml(match[2] ?? "");
    const title = rawText
      .replace(/\s+/g, " ")
      .replace(/^\d+\s*/, "")
      .trim();
    if (!title || title.length < 3 || title.length > 80) continue;
    if (isNoiseTitle(title)) continue;

    let url: string | undefined;
    try {
      const parsed = new URL(href, baseUrl);
      const sameSite = parsed.hostname === new URL(baseUrl).hostname;
      const isDirectoryPage =
        parsed.pathname === "/" ||
        parsed.pathname.startsWith("/c/") ||
        parsed.pathname.startsWith("/sites") ||
        parsed.pathname.startsWith("/about") ||
        parsed.pathname.startsWith("/app");
      if (sameSite && isDirectoryPage) continue;
      url = parsed.toString();
    } catch {
      url = undefined;
    }
    if (!isValidUrl(url)) continue;

    const key = normalizeTitle(title);
    if (!key || seen.has(key)) continue;
    seen.add(key);

    items.push({
      title,
      summary: title,
      sourceType: "tophub",
      publisher,
      url,
      publishedAt: now,
      query: publisher,
      heatSignal: `TopHub 排名 ${index + 1}`,
      confidence: "medium",
    });
    if (items.length >= 30) break;
  }

  return items.filter(isVerifiableHotspot);
}

async function fetchTopHub(signal: AbortSignal): Promise<LiveHotspot[]> {
  const baseUrl = (process.env.TOPHUB_BASE_URL || "https://tophub.today").replace(/\/$/, "");
  const configuredNodes = (process.env.TOPHUB_NODE_PATHS || "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);

  // TopHub's home page contains navigation/category links that look like
  // content. Only crawl explicitly configured board paths.
  const paths = configuredNodes;
  if (!paths.length) return [];

  const batches = await Promise.allSettled(
    paths.map(async (path) => {
      const target = path.startsWith("http") ? path : `${baseUrl}${path.startsWith("/") ? "" : "/"}${path}`;
      const response = await fetchWithBudget(target, signal);
      if (!response.ok) return [];
      const html = await response.text();
      if (/503 Service Temporarily Unavailable/i.test(html)) return [];
      return parseTopHubItems(html, `TopHub${path === "/" ? "" : ` ${path}`}`);
    }),
  );

  return batches.flatMap((result) => (result.status === "fulfilled" ? result.value : []));
}

async function fetchRssHubHotRoutes(signal: AbortSignal): Promise<LiveHotspot[]> {
  const baseUrl = process.env.RSSHUB_BASE_URL?.replace(/\/$/, "");
  if (!baseUrl) return [];

  const routes = [
    { route: "/weibo/search/hot", publisher: "微博热搜/RSSHub" },
    { route: "/zhihu/hotlist", publisher: "知乎热榜/RSSHub" },
    { route: "/bilibili/ranking/0/3", publisher: "B站排行榜/RSSHub" },
  ];

  const batches = await Promise.allSettled(
    routes.map(async ({ route, publisher }) => {
      const response = await fetchWithBudget(`${baseUrl}${route}`, signal);
      if (!response.ok) return [];
      const xml = await response.text();
      const now = new Date().toISOString();
      return Array.from(xml.matchAll(/<item>([\s\S]*?)<\/item>/g))
        .slice(0, 10)
        .map((match, index) => {
          const item = match[1] ?? "";
          const title = stripTags(item.match(/<title>([\s\S]*?)<\/title>/)?.[1] ?? "");
          const link = stripTags(item.match(/<link>([\s\S]*?)<\/link>/)?.[1] ?? "");
          const publishedAt = stripTags(item.match(/<pubDate>([\s\S]*?)<\/pubDate>/)?.[1] ?? now);
          const summary = stripTags(item.match(/<description>([\s\S]*?)<\/description>/)?.[1] ?? title);
          return {
            title,
            summary: summary || title,
            sourceType: "rsshub" as const,
            publisher,
            url: link,
            publishedAt,
            query: publisher,
            heatSignal: `RSSHub 排名 ${index + 1}`,
            confidence: "medium" as const,
          };
        })
        .filter(isVerifiableHotspot);
    }),
  );

  return batches.flatMap((result) => (result.status === "fulfilled" ? result.value : []));
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
      [
        fetchTopHub(controller.signal),
        fetchToutiaoHotBoard(controller.signal),
        fetchBaiduHotBoard(controller.signal),
        fetchRssHubHotRoutes(controller.signal),
        ...queries.flatMap((query) => [
          fetchGoogleNews(query, controller.signal),
          fetchGdelt(query, controller.signal),
        ]),
      ],
    );
    const merged = batches
      .flatMap((result) => (result.status === "fulfilled" ? result.value : []))
      .filter(isVerifiableHotspot)
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
  const verifiedHotspots = hotspots.filter(isVerifiableHotspot);

  return {
    status: verifiedHotspots.length ? "fresh" : "degraded",
    generatedAt: new Date().toISOString(),
    risks: [],
    hotTopics: verifiedHotspots.map((item) => ({
      title: item.title,
      summary: item.summary || item.title,
      fitReason: `来源：${item.publisher}${item.heatSignal ? `；${item.heatSignal}` : ""}。这是可点击核验的公开线索，后续再判断与“${profile.industry} / ${profile.goal}”的自然连接。`,
      risk: "medium",
      tags: [item.sourceType, item.heatSignal ?? item.confidence, profile.industry].slice(0, 5),
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
