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
        title: "建立用户画像与资源假设",
        detail: "根据企业资料、行业、地域和本次需求，先推断体量、可用素材、适合的平台和不能硬蹭的边界。",
        status: "completed",
      },
      {
        title: "整理信息来源与热点依据",
        detail: "先识别具体来源锚点：日期、节日、节气、政策窗口、平台热榜、争议事件、行业新闻或同类案例，再判断是否能成为选题依据。",
        status: "completed",
      },
      {
        title: "五维评分筛选",
        detail: "按价值契合、用户匹配、业务关联、品牌安全、新闻性评分；新闻性权重最高，品牌安全保留但不压制传播机会。",
        status: "completed",
      },
      {
        title: "生成 TOP5 与舍弃理由",
        detail: "只保留当下可发、自然相关、平台动作明确的选题，并说明舍弃哪些宽泛或硬蹭方向。",
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

function topicOutputRules() {
  return [
    "热点选题功能必须复刻“信息来源 -> 热点池 -> 品牌匹配 -> 五维评分 -> TOP5 -> 舍弃理由”的工作链路。",
    "不要要求用户填一大堆字段。若信息不足，先基于企业名称、行业、城市、传播目标、用户输入和知识库做合理推断，并在输出中写明“画像假设”。最多提出 3 个补充问题，不得中断本次输出。",
    "必须使用行业案例、同类品牌打法、平台内容规律和行业对比来补足上下文。不能只凭抽象概念生成选题。",
    "选题必须有“信息来源依据”。依据可以是具体日期、节日、节气、季节生产生活场景、政策窗口、平台热榜、热点事件、争议事件、行业新闻、竞品动作、媒体报道或历史案例。没有依据的常青主题不得进入 TOP5。",
    "如果没有实时搜索/热榜数据，不得假装已经检索实时热点。可以输出“待补源热点/行业参照”，但必须明确写出需要补哪类来源、去哪里核验、核验后才可发布。",
    "每个候选热点必须写清：来源类型、信息名或事件名、发布时间/适用时间窗口、当下触发点、公众为什么会关心、品牌为什么能自然接入、核验状态（已知/待补源/仅行业参照）。",
    "必须区分“新闻锚点”和“传播角度”：新闻锚点是外部发生的事或确定的时间窗口，传播角度是品牌如何切入。不得把品牌自己想说的话伪装成热点。",
    "五维评分必须出现，且权重如下：新闻性 35 分、目标用户匹配度 20 分、价值契合度 20 分、业务关联度 15 分、品牌安全度 10 分。新闻性是优先级最高的维度，新闻性低的选题即使安全也不能进入 TOP5。",
    "新闻性评分首先看依据强度：近三日真实事件/榜单/政策/争议优先，其次是一周内确定日期或节日，再次是季节/节气/行业周期。仅靠长期趋势或品牌诉求，新闻性不得高于 20/35。",
    "品牌安全度可以适度放低，但不能忽略底线：版权、虚假宣传、政治敏感、公益作秀、蹭灾难、侵犯个人权益、明显硬蹭必须降权或舍弃。",
    "必须先做“硬蹭一票否决”：1. 品牌与话题是否有真实自然连接；2. 用户看到是否觉得品牌出现得自然；3. 是否存在版权/舆论反噬/伦理风险。任一不通过，不得进入 TOP5。",
    "输出必须严格包含以下 sections，heading 名称必须一致：1. 画像假设与输入补全；2. 信息来源与新闻窗口；3. 热点池与行业参照；4. 五维评分筛选表；5. 最终 TOP5 选题；6. 采访/素材/数据线索；7. 舍弃清单；8. 未来五天落地节奏；9. 需要补充核验的信息。",
    "“信息来源与新闻窗口”至少 6 条，每条写：来源依据、时间窗口、为什么现在成立、核验状态。必须包含至少 2 类时间/事件锚点，例如日期/节日/节气/政策/平台热榜/争议事件/行业新闻。",
    "“热点池与行业参照”至少 8 条，每条写：热点/参照、来源类型、信息名或事件名、当下触发点、公众关注点、适合/不适合判断。",
    "“五维评分筛选表”至少 8 个候选，每个候选写清五项得分、总分、是否推荐，并写一句评分依据。格式例：候选A｜新闻性32/35｜用户18/20｜价值17/20｜业务12/15｜安全8/10｜总分87｜推荐｜依据：近三日平台争议+品牌有真实案例。",
    "“最终 TOP5 选题”每条必须写：选题标题、信息来源依据、发布时间/窗口、为什么现在发、公众会关心什么、品牌自然连接、第一条内容怎么发、适合平台、所需素材、风险边界。",
    "“采访/素材/数据线索”必须给每个 TOP5 选题配至少 2 条可执行线索，例如可采访对象、可找数据、可拍素材、可引用公开材料、可做小实验或用户案例。",
    "选题标题必须具体到事件、场景、人群、平台或时间窗口，禁止只写“AI赋能”“品牌升级”“行业趋势”“提升认知”这类宽泛方向。",
    "“未来五天落地节奏”必须给出 Day 1 到 Day 5，每天写明确动作和产出物。",
  ].join("\n");
}

function outputRules(skill: Skill) {
  const shared = [
    "输出必须像专业公关顾问的工作稿，而不是通用 AI 建议。",
    "每条建议都要可执行，避免空泛词，例如“提升品牌影响力”“打造行业标杆”“增强用户认知”。",
    "区分事实、案例、行业规律与推断。没有来源的内容要标为推断或待补源。",
    "不要输出模型内部推理链路；可以输出可审计的工作过程、筛选依据、取舍理由和证据需求。",
  ];

  const rules: Record<Skill, string[]> = {
    topics: [topicOutputRules()],
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
  await onProgress?.({
    title: "开始分析",
    detail: `启动「${skillNames[skill]}」完整工作流。`,
    status: "running",
  });
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
    "如果是热点选题，必须严格按照指定 section heading 输出，不得改名、合并或省略。",
    outputRules(skill),
  ].join("\n");

  const user = JSON.stringify({
    task: skill,
    currentDate,
    freshnessWindow: skill === "topics" ? "未来 3-5 天可落地传播窗口" : undefined,
    topicEvidencePolicy:
      skill === "topics"
        ? "每个选题必须先给信息来源依据和时间窗口，再给传播角度。依据可以来自日期、节日、节气、季节场景、政策窗口、平台热榜、热点/争议事件、行业新闻、竞品动作或历史案例；无法核验时必须标为待补源，不得伪装成实时事实。"
        : undefined,
    profile,
    input,
    userInputPolicy:
      skill === "topics"
        ? "不要依赖用户补充大量字段；先推断，输出假设，再给最多 3 个补充问题。"
        : "输出必须具体、分层、可执行。",
    topicScoringWeights:
      skill === "topics"
        ? {
            newsworthiness: 35,
            targetAudienceFit: 20,
            valueFit: 20,
            businessRelevance: 15,
            brandSafety: 10,
          }
        : undefined,
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
