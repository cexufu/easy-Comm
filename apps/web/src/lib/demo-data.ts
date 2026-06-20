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
  process: SkillResponse["process"] = [],
): SkillResponse {
  const titles: Record<string, string> = {
    topics: "未来五天热点选题 TOP5",
    sentiment: "舆情风险研判",
    audience: "目标受众分析",
    planning: "传播策划案",
  };

  const topicInput = input || profile.goal;
  const sectionMap: Record<string, SkillResponse["sections"]> = {
    topics: [
      {
        heading: "TOP5 选题与当下触发点",
        items: [
          `选题一：${profile.companyName}把“${topicInput}”做成 5 天连续短视频实验。触发点：用户正在追问 AI 产品到底能不能落地；第一条内容拍“一个真实任务从输入到成片的全过程”。`,
          `选题二：用一组真实用户场景回应“AI 不是替代人，而是降低表达门槛”。触发点：AI 生成内容争议持续存在；切入点是人机协作边界。`,
          `选题三：发起“未来五天内容共创挑战”。触发点：平台更容易放大可参与议题；第一天发布模板，邀请用户提交需求。`,
          `选题四：拆解一个热点行业案例，说明 ${profile.industry} 企业如何避免空泛 AI 叙事。触发点：市场已经疲劳于概念包装；用反向清单建立专业感。`,
          `选题五：发布 CEO/创始人观点稿，主题是“为什么现在的传播更需要证据链”。触发点：品牌信任下降，用户更重视可验证事实。`,
        ],
      },
      {
        heading: "五天落地节奏",
        items: [
          "Day 1：确认一个最有证据的场景，发布短视频或图文开篇。",
          "Day 2：补一条过程内容，展示素材、提示词、人工审核和修改前后对比。",
          "Day 3：发布用户参与或内部试用反馈，避免只讲功能。",
          "Day 4：输出观点稿或长图，回应“AI 内容是否会同质化”的质疑。",
          "Day 5：整理成复盘帖，沉淀数据、评论问题和下一轮共创入口。",
        ],
      },
      {
        heading: "筛选与舍弃",
        items: [
          "保留标准：未来五天能执行、企业有证据、平台表达清楚、风险可控。",
          "舍弃方向：单纯喊“AI 赋能”“品牌升级”“行业趋势”的宽泛选题。",
          "需要人工补源：平台热榜、行业新闻、品牌自有案例、用户评论截图或真实试用数据。",
        ],
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
    summary:
      skill === "topics"
        ? `已围绕 ${profile.companyName} 的目标生成未来五天可执行的选题草案；实时热榜与新闻源仍需人工补充核验。`
        : `已基于 ${profile.companyName} 的企业资料和按需知识检索生成本地演示结果。`,
    process,
    sections: sectionMap[skill] ?? [],
    knowledge,
    warnings: ["当前未接入实时热榜/新闻数据源；涉及“当下热点”的判断需要人工补源确认。"],
  };
}
