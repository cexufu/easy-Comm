import { promises as fs } from "node:fs";
import path from "node:path";

type KnowledgeHit = {
  path: string;
  heading: string;
  content: string;
  score: number;
};

const collectionBySkill: Record<string, string[]> = {
  topics: ["trend-hotspot-pool", "pr-expert"],
  sentiment: ["public-opinion-analyst", "pr-expert"],
  audience: ["chameleon"],
  planning: ["content-creation-expert", "pr-expert"],
};

async function workspaceRoot() {
  const root =
    process.env.KNOWLEDGE_WORKSPACE_ROOT ??
    path.join(/* turbopackIgnore: true */ process.cwd(), "..", "..");
  await fs.access(path.join(root, "knowledge", "catalog.json"));
  return root;
}

function splitMarkdown(content: string) {
  const lines = content.split(/\r?\n/);
  const chunks: Array<{ heading: string; content: string }> = [];
  let heading = "文档摘要";
  let buffer: string[] = [];

  const flush = () => {
    const text = buffer.join("\n").trim();
    if (text) chunks.push({ heading, content: text });
    buffer = [];
  };

  for (const line of lines) {
    if (/^#{1,3}\s+/.test(line)) {
      flush();
      heading = line.replace(/^#{1,3}\s+/, "").trim();
    } else {
      buffer.push(line);
    }
  }
  flush();
  return chunks;
}

function terms(query: string) {
  const tokens = query
    .toLowerCase()
    .split(/[\s,，。；;、:：/]+/)
    .map((value) => value.trim())
    .filter((value) => value.length >= 2);
  const expanded = new Set<string>();

  for (const token of tokens) {
    expanded.add(token);
    if (/[\u3400-\u9fff]/.test(token) && token.length > 2) {
      for (let index = 0; index < token.length - 1; index += 1) {
        expanded.add(token.slice(index, index + 2));
      }
    }
  }

  return Array.from(expanded);
}

export async function retrieveKnowledge(skill: string, query: string): Promise<KnowledgeHit[]> {
  const collections = collectionBySkill[skill] ?? [];
  const root = await workspaceRoot();
  const queryTerms = terms(query);
  const hits: KnowledgeHit[] = [];

  for (const collection of collections) {
    const directory = path.join(root, "knowledge", collection);
    const files = await walkMarkdown(directory);
    for (const file of files) {
      const content = await fs.readFile(file, "utf8");
      for (const chunk of splitMarkdown(content)) {
        const haystack = `${chunk.heading}\n${chunk.content}`.toLowerCase();
        const score = queryTerms.reduce(
          (total, term) => total + (haystack.includes(term) ? 1 : 0),
          0,
        );
        if (score > 0) {
          hits.push({
            path: path.relative(root, file).replaceAll("\\", "/"),
            heading: chunk.heading,
            content: chunk.content.slice(0, 2400),
            score,
          });
        }
      }
    }
  }

  const maxChunks = Number(process.env.KNOWLEDGE_MAX_CHUNKS ?? 5);
  const maxChars = Number(process.env.KNOWLEDGE_MAX_CHARS ?? 12000);
  let usedChars = 0;

  return hits
    .sort((a, b) => b.score - a.score)
    .filter((hit) => {
      if (usedChars + hit.content.length > maxChars) return false;
      usedChars += hit.content.length;
      return true;
    })
    .slice(0, maxChunks);
}

export async function getKnowledgeHealth() {
  const root = await workspaceRoot();
  const catalog = JSON.parse(
    await fs.readFile(path.join(root, "knowledge", "catalog.json"), "utf8"),
  ) as { collections: Array<{ id: string; root: string }> };
  const fileCounts: Record<string, number> = {};

  for (const collection of catalog.collections) {
    fileCounts[collection.id] = (
      await walkMarkdown(path.join(root, collection.root))
    ).length;
  }

  const sampleHits = await retrieveKnowledge("planning", "传播 品牌 内容");
  return {
    workspaceRoot: root,
    collections: catalog.collections.length,
    fileCounts,
    sampleHits: sampleHits.length,
  };
}

async function walkMarkdown(directory: string): Promise<string[]> {
  const output: string[] = [];
  for (const entry of await fs.readdir(directory, { withFileTypes: true })) {
    const target = path.join(directory, entry.name);
    if (entry.isDirectory()) output.push(...(await walkMarkdown(target)));
    if (entry.isFile() && entry.name.endsWith(".md")) output.push(target);
  }
  return output;
}
