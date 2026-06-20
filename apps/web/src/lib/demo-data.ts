import type { CompanyProfile, DashboardData, SkillResponse } from "./schemas";

export function demoDashboard(profile: CompanyProfile): DashboardData {
  const now = new Date().toISOString();
  return {
    status: "demo",
    generatedAt: now,
    risks: [
      {
        level: "medium",
        title: "行业叙事趋同",
        description: `${profile.industry}相关传播近期容易落入同质化表达，建议突出真实业务证据。`,
      },
    ],
    hotTopics: [
      {
        title: `${profile.industry}企业开始重视可验证的 AI 应用价值`,
        summary: "市场讨论从概念转向效率、收入和客户体验等具体结果。",
        fitReason: `与“${profile.goal}”具备自然连接，可从企业实践和客户价值切入。`,
        risk: "low",
        tags: ["行业趋势", "应用价值"],
        sources: [],
      },
      {
        title: `${profile.city}企业服务生态持续升级`,
        summary: "本地产业协作、人才和企业服务成为区域传播的重要方向。",
        fitReason: "适合结合城市身份与企业成长故事，但需要真实项目支撑。",
        risk: "low",
        tags: ["城市", "企业服务"],
        sources: [],
      },
      {
        title: "品牌传播从曝光量转向可信度建设",
        summary: "用户更关注透明信息、真实案例和长期承诺。",
        fitReason: "可用于建立品牌方法论内容，降低硬广感。",
        risk: "medium",
        tags: ["品牌", "信任"],
        sources: [],
      },
    ],
  };
}

export function demoSkillResult(
  skill: string,
  profile: CompanyProfile,
  input: string,
  knowledge: Array<{ path: string; heading: string }>,
): SkillResponse {
  const titles: Record<string, string> = {
    topics: "热点选题 TOP5",
    sentiment: "舆情风险研判",
    audience: "目标受众分析",
    planning: "传播策划案",
  };

  const sectionMap: Record<string, SkillResponse["sections"]> = {
    topics: [
      {
        heading: "推荐方向",
        items: [
          `${profile.industry}真实应用案例：用具体结果回应市场关注`,
          `${profile.city}产业观察：企业如何借助本地生态成长`,
          `围绕“${profile.goal}”建立连续内容栏目`,
          "用客户问题而非产品功能作为传播起点",
          "发布行业误区与实操清单，建立专业可信度",
        ],
      },
      {
        heading: "筛选原则",
        items: ["企业关联真实", "目标受众明确", "能够提供证据", "风险可控"],
      },
    ],
    sentiment: [
      {
        heading: "当前判断",
        items: ["整体风险中低", "主要风险来自夸大承诺和缺少证据", "需要持续关注行业争议话题"],
      },
      {
        heading: "建议动作",
        items: ["建立事实清单", "预设敏感问题回应口径", "所有结论附可核验来源"],
      },
    ],
    audience: [
      {
        heading: "核心受众",
        items: ["关注投入产出和可信案例的业务决策者", "需要快速理解价值的一线执行人员"],
      },
      {
        heading: "内容反馈",
        items: [
          input ? `对“${input.slice(0, 60)}”更可能先质疑证据，再判断价值。` : "当前未提供待测内容。",
          "减少抽象概念，增加场景、数字和限制条件。",
        ],
      },
    ],
    planning: [
      {
        heading: "核心策略",
        items: [`传播主题：${input || profile.goal}`, "叙事路径：问题 → 实践 → 结果 → 方法", "品牌角色：提供帮助而非抢占故事中心"],
      },
      {
        heading: "执行节奏",
        items: ["准备期：整理证据与案例", "发布期：主内容与分发素材同步", "长尾期：回应问题并沉淀 FAQ"],
      },
    ],
  };

  return {
    requestId: crypto.randomUUID(),
    status: "completed",
    title: titles[skill] ?? "分析结果",
    summary: `已基于 ${profile.companyName} 的企业资料和按需知识检索生成本地演示结果。`,
    sections: sectionMap[skill] ?? [],
    knowledge,
    warnings: ["当前运行在 demo 模式，热点与舆情不是实时数据。"],
  };
}
