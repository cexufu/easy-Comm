import { demoSkillResult } from "@/lib/demo-data";
import { retrieveKnowledge } from "@/lib/knowledge";
import { getModelProvider, withTimeout } from "@/lib/model-provider";
import { skillResponseSchema, type CompanyProfile, type SkillResponse } from "@/lib/schemas";

type Skill = "topics" | "sentiment" | "audience" | "planning";

export type SkillProgress = SkillResponse["process"][number];

type RunSkillInput = {
  skill: Skill;
  profile: CompanyProfile;
  input: string;
  onProgress?: (step: SkillProgress) => void | Promise<void>;
};

const skillNames: Record<Skill, string> = {
  topics: "热点选题",
  sentiment: "舆情分析",
  audience: "受众分析",
  planning: "内容策划",
};

function plannedSteps(skill: Skill, profile: CompanyProfile, input: string): SkillProgress[] {
  const request = input.trim() || profile.goal;
  const shared = [
    {
      title: "理解本次任务",
      detail: `识别企业「${profile.companyName}」的行业、目标和本次需求：${request}`,
      status: "completed" as const,
    },
    {
      title: "召回相关知识",
      detail: "只读取与当前任务相关的知识片段，避免把整套知识库直接塞给模型。",
      status: "completed" as const,
    },
  ];

  const specific: Record<Skill, SkillProgress[]> = {
    topics: [
      {
        title: "整理热点与传播入口",
        detail: "从行业趋势、企业目标、内容可执行性中整理可用传播入口。",
        status: "completed",
      },
      {
        title: "生成候选选题",
        detail: "先扩展多个候选方向，再按企业相关性、证据强度、传播温度和风险进行收敛。",
        status: "completed",
      },
      {
        title: "筛选 TOP5",
        detail: "保留最适合落地的五个选题，并补充执行要点与风险提示。",
        status: "completed",
      },
    ],
    sentiment: [
      {
        title: "拆解舆情对象",
        detail: "区分事实、争议、利益相关方、潜在误读和情绪触发点。",
        status: "completed",
      },
      {
        title: "评估风险路径",
        detail: "判断传播阶段、扩散条件、回应窗口和可能的二次风险。",
        status: "completed",
      },
      {
        title: "形成应对建议",
        detail: "输出可执行口径、优先动作和需要避免的表达。",
        status: "completed",
      },
    ],
    audience: [
      {
        title: "构建受众画像",
        detail: "模拟目标群体的关注点、质疑点、情绪反应和转发动机。",
        status: "completed",
      },
      {
        title: "预测内容反馈",
        detail: "评估内容被接受、被忽视、被误解或被传播的可能路径。",
        status: "completed",
      },
      {
        title: "给出优化方向",
        detail: "把受众反应转化为标题、结构、证据和表达方式建议。",
        status: "completed",
      },
    ],
    planning: [
      {
        title: "确定传播目标",
        detail: "把目标拆成主题、受众、平台、素材和节奏。",
        status: "completed",
      },
      {
        title: "组织策划结构",
        detail: "生成主叙事、内容栏目、执行动作和复盘指标。",
        status: "completed",
      },
      {
        title: "完善落地细节",
        detail: "补充时间节奏、分发建议、风险提醒和人工审核点。",
        status: "completed",
      },
    ],
  };

  return [...shared, ...specific[skill]];
}

export async function runSkill({
  skill,
  profile,
  input,
  onProgress,
}: RunSkillInput): Promise<SkillResponse> {
  const process = plannedSteps(skill, profile, input);
  await onProgress?.({ title: "开始分析", detail: `启动「${skillNames[skill]}」完整工作流。`, status: "running" });
  await onProgress?.(process[0]);

  const knowledge = await retrieveKnowledge(
    skill,
    `${profile.industry} ${profile.goal} ${input}`,
  );
  const citations = knowledge.map(({ path, heading }) => ({ path, heading }));
  await onProgress?.({
    ...process[1],
    detail: citations.length
      ? `已召回 ${citations.length} 个相关知识片段：${citations
          .slice(0, 3)
          .map((item) => item.heading)
          .join("、")}${citations.length > 3 ? "等" : ""}。`
      : "未找到强相关知识片段，将主要依据企业资料和本次输入生成。",
  });

  for (const step of process.slice(2)) {
    await onProgress?.({ ...step, status: "running" });
    await new Promise((resolve) => setTimeout(resolve, 180));
    await onProgress?.(step);
  }

  const provider = getModelProvider();
  if (!provider) {
    return skillResponseSchema.parse(demoSkillResult(skill, profile, input, citations, process));
  }

  await onProgress?.({
    title: "生成完整结果",
    detail: "正在调用大模型形成结构化输出，完成后会替换为完整结果页。",
    status: "running",
  });

  const system = [
    "你是“简单传播”企业传播助手。",
    "必须完整执行对应技能，不要省略候选生成、评估、风险提示和落地建议。",
    "只输出 JSON，字段为 title、summary、sections、warnings。",
    "sections 是由 heading 和 items 组成的数组；每个 items 项应具体、可执行。",
    "区分事实、知识规律与推断，不得编造当前热点或来源。",
    "不要输出模型内部推理链路；可以输出可审计的工作结论、筛选依据和取舍理由。",
  ].join("\n");

  const user = JSON.stringify({
    task: skill,
    profile,
    input,
    requiredProcess: process.map(({ title, detail }) => ({ title, detail })),
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
      "requestId" | "status" | "knowledge" | "process"
    >;
    return skillResponseSchema.parse({
      requestId: crypto.randomUUID(),
      status: "completed",
      ...modelData,
      process,
      knowledge: citations,
    });
  } catch (error) {
    console.error("skill generation failed", error);
    return skillResponseSchema.parse({
      ...demoSkillResult(skill, profile, input, citations, process),
      status: "degraded",
      warnings: ["模型调用失败，已返回可识别的降级结果。"],
    });
  }
}
