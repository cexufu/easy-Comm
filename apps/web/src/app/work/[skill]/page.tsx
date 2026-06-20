"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import {
  companyProfileSchema,
  skillResponseSchema,
  type CompanyProfile,
  type SkillResponse,
} from "@/lib/schemas";

const config = {
  topics: {
    title: "热点选题",
    eyebrow: "Trend + PR",
    placeholder: "可选：输入希望重点关注的关键词，例如 AI 应用、品牌信任、城市产业、未来五天传播主题...",
    button: "生成 TOP5",
  },
  sentiment: {
    title: "舆情分析",
    eyebrow: "Public Opinion",
    placeholder: "输入需要分析的事件、话题或舆情线索...",
    button: "开始研判",
  },
  audience: {
    title: "受众分析",
    eyebrow: "Chameleon",
    placeholder: "粘贴待评估的文案、策划案，或描述目标受众...",
    button: "模拟受众反馈",
  },
  planning: {
    title: "内容策划",
    eyebrow: "Content Planning",
    placeholder: "描述传播主题、平台、内容形式和具体要求...",
    button: "生成策划案",
  },
} as const;

type SkillKey = keyof typeof config;
type ProcessStep = SkillResponse["process"][number];
type StreamEvent =
  | { type: "step"; step: ProcessStep }
  | { type: "final"; result: SkillResponse }
  | { type: "error"; message: string };

export default function SkillPage() {
  const params = useParams<{ skill: string }>();
  const router = useRouter();
  const skill = params.skill as SkillKey;
  const current = config[skill];
  const [profile, setProfile] = useState<CompanyProfile | null>(null);
  const [input, setInput] = useState("");
  const [result, setResult] = useState<SkillResponse | null>(null);
  const [process, setProcess] = useState<ProcessStep[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  useEffect(() => {
    const stored = localStorage.getItem("simple-pr-profile");
    if (!stored) {
      router.replace("/");
      return;
    }
    try {
      const parsed = companyProfileSchema.safeParse(JSON.parse(stored));
      if (!parsed.success) throw new Error("invalid profile");
      setProfile(parsed.data);
    } catch {
      localStorage.removeItem("simple-pr-profile");
      router.replace("/");
    }
  }, [router]);

  useEffect(() => {
    if (!current) return;
    setInput(localStorage.getItem(`simple-pr-draft-${skill}`) ?? "");
    const storedResult = localStorage.getItem(`simple-pr-result-${skill}`);
    if (!storedResult) return;
    try {
      const parsed = skillResponseSchema.safeParse(JSON.parse(storedResult));
      if (parsed.success) {
        setResult(parsed.data);
        setProcess(parsed.data.process);
      }
    } catch {
      localStorage.removeItem(`simple-pr-result-${skill}`);
    }
  }, [current, skill]);

  useEffect(() => {
    if (!current) return;
    const timer = window.setTimeout(() => {
      localStorage.setItem(`simple-pr-draft-${skill}`, input);
    }, 250);
    return () => window.clearTimeout(timer);
  }, [current, input, skill]);

  const validSkill = useMemo(() => Boolean(current), [current]);

  const run = async () => {
    if (!profile || !validSkill) return;
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 70000);
    setLoading(true);
    setError("");
    setResult(null);
    setProcess([]);

    try {
      const response = await fetch("/api/skills/stream", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ skill, profile, input }),
        signal: controller.signal,
      });
      if (!response.ok || !response.body) throw new Error("生成失败，请稍后重试");

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() ?? "";

        for (const line of lines) {
          if (!line.trim()) continue;
          const event = JSON.parse(line) as StreamEvent;
          if (event.type === "step") {
            setProcess((previous) => {
              const existingIndex = previous.findIndex((step) => step.title === event.step.title);
              if (existingIndex === -1) return [...previous, event.step];
              return previous.map((step, index) =>
                index === existingIndex ? event.step : step,
              );
            });
          }
          if (event.type === "final") {
            const parsed = skillResponseSchema.parse(event.result);
            setResult(parsed);
            setProcess(parsed.process);
            localStorage.setItem(`simple-pr-result-${skill}`, JSON.stringify(parsed));
          }
          if (event.type === "error") {
            throw new Error(event.message);
          }
        }
      }
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "生成失败");
    } finally {
      clearTimeout(timer);
      setLoading(false);
    }
  };

  const resultMarkdown = useMemo(() => {
    if (!result) return "";
    const processText = result.process.length
      ? `## 分析过程\n\n${result.process
          .map((step) => `- **${step.title}**：${step.detail}`)
          .join("\n")}\n\n`
      : "";
    const sections = result.sections
      .map(
        (section) =>
          `## ${section.heading}\n\n${section.items.map((item) => `- ${item}`).join("\n")}`,
      )
      .join("\n\n");
    const knowledge = result.knowledge.length
      ? `\n\n## 本次调用的知识\n\n${result.knowledge
          .map((item) => `- ${item.heading} · ${item.path}`)
          .join("\n")}`
      : "";
    const warnings = result.warnings.length
      ? `\n\n## 说明\n\n${result.warnings.map((item) => `- ${item}`).join("\n")}`
      : "";
    return `# ${result.title}\n\n${result.summary}\n\n${processText}${sections}${knowledge}${warnings}\n`;
  }, [result]);

  const copyResult = async () => {
    await navigator.clipboard.writeText(resultMarkdown);
    setNotice("结果已复制");
    window.setTimeout(() => setNotice(""), 1800);
  };

  const downloadResult = () => {
    if (!result) return;
    const blob = new Blob([resultMarkdown], { type: "text/markdown;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `${current.title}-${profile?.companyName ?? "分析结果"}.md`;
    anchor.click();
    URL.revokeObjectURL(url);
    setNotice("Markdown 已下载");
    window.setTimeout(() => setNotice(""), 1800);
  };

  if (!validSkill) return <main className="form-panel panel">未知功能。</main>;
  if (!profile) return <div className="loading form-panel">正在读取企业资料...</div>;

  return (
    <>
      <header className="topbar">
        <div className="shell topbar-inner">
          <Link className="brand" href="/">
            <span className="brand-mark">简</span>
            简单传播
          </Link>
          <span className="profile-chip">{profile.companyName}</span>
        </div>
      </header>

      <main className="shell main">
        <section className="panel hero-copy">
          <p className="eyebrow">{current.eyebrow}</p>
          <h1 style={{ fontSize: "clamp(38px, 7vw, 64px)" }}>{current.title}</h1>
          <p className="lead">
            企业：{profile.companyName} · 行业：{profile.industry} · 目标：{profile.goal}
          </p>
        </section>

        <section className="section grid grid-2" style={{ alignItems: "start" }}>
          <div className="card">
            <div className="field">
              <label htmlFor="skill-input">本次需求</label>
              <textarea
                className="textarea"
                id="skill-input"
                value={input}
                onChange={(event) => setInput(event.target.value)}
                placeholder={current.placeholder}
              />
            </div>
            <div className="button-row" style={{ marginTop: 16 }}>
              <button className="button" disabled={loading} onClick={run} type="button">
                {loading ? "正在分析..." : current.button}
              </button>
              <Link className="button secondary" href="/">
                返回首页
              </Link>
            </div>
            <p className="muted" style={{ marginTop: 18, marginBottom: 0, fontSize: 13 }}>
              系统会展示可审计的工作过程：需求理解、知识召回、候选整理、评估筛选和完整结果。
            </p>
          </div>

          <div>
            {(loading || process.length > 0) && (
              <article className="card process-card">
                <div className="result-toolbar">
                  <span className={`status-pill ${loading ? "running" : "completed"}`}>
                    {loading ? "分析进行中" : "过程已完成"}
                  </span>
                </div>
                <h2 style={{ marginTop: 18 }}>分析过程</h2>
                <div className="process-list">
                  {process.map((step, index) => (
                    <div className={`process-step ${step.status}`} key={`${step.title}-${index}`}>
                      <span className="process-index">{index + 1}</span>
                      <div>
                        <h3>{step.title}</h3>
                        <p>{step.detail}</p>
                      </div>
                    </div>
                  ))}
                  {loading && (
                    <div className="process-step running">
                      <span className="process-index pulse" />
                      <div>
                        <h3>等待完整结果</h3>
                        <p>模型正在形成最终结构化输出，完成后会自动显示在下方。</p>
                      </div>
                    </div>
                  )}
                </div>
              </article>
            )}

            {error && <div className="error">{error}</div>}
            {!loading && !error && !result && process.length === 0 && (
              <div className="card empty muted">填写需求后，分析过程和最终结果会在这里显示。</div>
            )}
            {result && (
              <article className="card result-card">
                <div className="result-toolbar">
                  <span className={`status-pill ${result.status}`}>
                    {result.status === "completed" ? "分析完成" : "降级结果"}
                  </span>
                  <div className="button-row">
                    <button className="text-button" onClick={copyResult} type="button">
                      复制结果
                    </button>
                    <button className="text-button" onClick={downloadResult} type="button">
                      下载 Markdown
                    </button>
                  </div>
                </div>
                {notice && <div className="notice">{notice}</div>}
                <h2 style={{ marginTop: 18 }}>{result.title}</h2>
                <p className="muted">{result.summary}</p>

                {result.sections.map((section) => (
                  <section className="result-section" key={section.heading}>
                    <h3>{section.heading}</h3>
                    <ul>
                      {section.items.map((item) => (
                        <li key={item}>{item}</li>
                      ))}
                    </ul>
                  </section>
                ))}

                {result.knowledge.length > 0 && (
                  <section className="result-section knowledge-list">
                    <h3>本次调用的知识</h3>
                    <ul>
                      {result.knowledge.map((item) => (
                        <li key={`${item.path}-${item.heading}`}>
                          {item.heading} · {item.path}
                        </li>
                      ))}
                    </ul>
                  </section>
                )}

                {result.warnings.length > 0 && (
                  <section className="result-section">
                    <h3>说明</h3>
                    <ul>
                      {result.warnings.map((warning) => (
                        <li key={warning}>{warning}</li>
                      ))}
                    </ul>
                  </section>
                )}
              </article>
            )}
          </div>
        </section>
      </main>
    </>
  );
}
