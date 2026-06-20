import { NextResponse } from "next/server";
import { demoSkillResult } from "@/lib/demo-data";
import { retrieveKnowledge } from "@/lib/knowledge";
import { getModelProvider, withTimeout } from "@/lib/model-provider";
import { skillRequestSchema, skillResponseSchema } from "@/lib/schemas";

export async function POST(request: Request) {
  const parsed = skillRequestSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "请求格式不正确" }, { status: 400 });
  }

  const { skill, profile, input } = parsed.data;
  const knowledge = await retrieveKnowledge(
    skill,
    `${profile.industry} ${profile.goal} ${input}`,
  );
  const citations = knowledge.map(({ path, heading }) => ({ path, heading }));
  const provider = getModelProvider();

  if (!provider) {
    return NextResponse.json(
      skillResponseSchema.parse(demoSkillResult(skill, profile, input, citations)),
    );
  }

  const system = [
    "你是“简单传播”企业传播助手。",
    "只输出 JSON，字段为 title、summary、sections、warnings。",
    "sections 是由 heading 和 items 组成的数组。",
    "区分事实、知识规律与推断，不得编造当前热点或来源。",
  ].join("\n");

  const user = JSON.stringify({
    task: skill,
    profile,
    input,
    knowledge: knowledge.map(({ path, heading, content }) => ({
      path,
      heading,
      content,
    })),
  });

  try {
    const raw = await withTimeout((signal) => provider.generate({ system, user, signal }));
    const modelData = JSON.parse(raw) as Omit<
      ReturnType<typeof demoSkillResult>,
      "requestId" | "status" | "knowledge"
    >;
    return NextResponse.json(
      skillResponseSchema.parse({
        requestId: crypto.randomUUID(),
        status: "completed",
        ...modelData,
        knowledge: citations,
      }),
    );
  } catch (error) {
    console.error("skill generation failed", error);
    return NextResponse.json(
      skillResponseSchema.parse({
        ...demoSkillResult(skill, profile, input, citations),
        status: "degraded",
        warnings: ["模型调用失败，已返回可识别的降级结果。"],
      }),
    );
  }
}
