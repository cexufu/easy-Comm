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

function outputRules(skill: Skill) {
  const shared = [
    "输出必须像专业公关顾问的工作稿，而不是通用 AI 建议。",
    "每条建议都要可执行，避免空泛词，例如“提升品牌影响力”“打造行业标杆”“增强用户认知”。",
    "如果缺少实时新闻源，不得假装已经检索到真实热点；必须把需要人工补源的地方写清楚。",
    "不要输出模型内部推理链路；可以输出可审计的工作过程、筛选依据、取舍理由和证据需求。",
  ];

  const rules: Record<Skill, string[]> = {
    topics: [
      "热点选题必须体现当下感，围绕未来 3-5 天可以发出的内容机会。",
      "必须输出 5 个具体选题，每个选题都要包含：当下触发点、为什么现在发、企业切入角度、第一条内容怎么做、可用平台、风险边界。",
      "选题标题必须具体到事件、场景、人群、平台或时间窗口，禁止只写宽泛方向。",
      "优先选择能被用户马上执行的角度：短视频、公众号、媒体稿、小红书、CEO 观点、客户案例、行业评论、公益或联名动作。",
      "每个选题要说明需要补充核验的实时来源，例如行业新闻、平台热榜、政策公告、品牌自有数据或用户案例。",
      "必须包含一个“筛选与舍弃”部分，说明为什么保留这 5 个，以及哪些过宽方向被舍弃。",
      "必须包含一个“未来五天落地节奏”部分，给出 Day 1 到 Day 5 的动作。",
    ],
    sentiment: [
      "舆情分析必须拆分事实、情绪、利益相关方、扩散路径和回应窗口。",
      "必须给出优先级动作，区分 2 小时内、24 小时内、72 小时内。",
    ],
    audience: [
      "受众分析必须输出不同群体的接受点、质疑点、转发理由和反感触发点。",
      "必须把受众反馈转化为标题、证据、表达语气和内容结构建议。",
    ],
    planning: [
      "内容策划必须给出主题、核心叙事、栏目结构、素材清单、发布节奏和复盘指标。",
      "必须包含第一条内容的可直接执行脚本或大纲。",
    ],
  };

  return [...shared, ...rules[skill]].join("\n");
}

export async function runSkill({
  skill,
  profile,
  input,
  onProgress,
}: RunSkillInput): Promise<SkillResponse> {
  const currentDate = new Date().toISOString().slice(0, 10);
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
    outputRules(skill),
  ].join("\n");

  const user = JSON.stringify({
    task: skill,
    currentDate,
    freshnessWindow: skill === "topics" ? "未来 3-5 天可落地传播窗口" : undefined,
    profile,
    input,
    qualityBar:
      skill === "topics"
        ? "宁可少而具体，不要宽泛方向；每个选题必须能让用户马上知道今天要发什么、在哪发、凭什么发、怎么避险。"
        : "输出必须具体、分层、可执行。",
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
