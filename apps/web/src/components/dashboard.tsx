"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ProfileEditor } from "@/components/profile-editor";
import type { CompanyProfile, DashboardData } from "@/lib/schemas";

const skills = [
  {
    href: "/work/topics",
    icon: "01",
    title: "热点选题",
    description: "将近三日真实热点与企业公关策略结合，筛选最适配的 TOP5。",
  },
  {
    href: "/work/sentiment",
    icon: "02",
    title: "舆情分析",
    description: "判断传播阶段、风险路径和利益相关方，并给出合规应对建议。",
  },
  {
    href: "/work/audience",
    icon: "03",
    title: "受众分析",
    description: "使用 Chameleon 模拟目标群体对内容的接受、质疑和传播反应。",
  },
  {
    href: "/work/planning",
    icon: "04",
    title: "内容策划",
    description: "根据目标、受众和平台生成结构清晰的传播策划与执行节奏。",
  },
];

export function Dashboard({
  profile,
  onUpdate,
}: {
  profile: CompanyProfile;
  onUpdate: (profile: CompanyProfile) => void;
}) {
  const [data, setData] = useState<DashboardData | null>(null);
  const [error, setError] = useState("");
  const [editingProfile, setEditingProfile] = useState(false);

  useEffect(() => {
    const controller = new AbortController();
    fetch("/api/dashboard", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(profile),
      signal: controller.signal,
    })
      .then(async (response) => {
        if (!response.ok) throw new Error("首页数据加载失败");
        setData((await response.json()) as DashboardData);
      })
      .catch((reason: Error) => {
        if (reason.name !== "AbortError") setError(reason.message);
      });
    return () => controller.abort();
  }, [profile]);

  return (
    <>
      <header className="topbar">
        <div className="shell topbar-inner">
          <Link href="/" className="brand">
            <span className="brand-mark">简</span>
            简单传播
          </Link>
          <div className="profile-chip">
            <span>
              {profile.companyName} · {profile.industry}
            </span>
            <button
              className="button secondary"
              type="button"
              onClick={() => setEditingProfile(true)}
            >
              修改资料
            </button>
          </div>
        </div>
      </header>

      <main className="shell main">
        <section className="hero">
          <div className="panel hero-copy">
            <p className="eyebrow">传播工作台</p>
            <h1>今天，值得说什么？</h1>
            <p className="lead">
              围绕 {profile.companyName} 的目标，先识别风险，再选择话题，最后形成可执行内容。
            </p>
          </div>
          <div className="panel status-card">
            <span className="status-pill">
              <span className="status-dot" />
              独立运行模式
            </span>
            <div>
              <div className="metric">4</div>
              <p className="muted">项核心传播能力已接入统一架构</p>
            </div>
          </div>
        </section>

        {error && <div className="error section">{error}</div>}

        {data?.risks.length ? (
          <section className="section">
            <div className="section-header">
              <div>
                <h2>今日风险提示</h2>
                <p className="muted">最多展示三条；没有显著风险时自动隐藏。</p>
              </div>
            </div>
            <div className="grid grid-2">
              {data.risks.map((risk) => (
                <article className="card risk-card" key={risk.title}>
                  <span className={`risk-badge ${risk.level}`}>{risk.level}</span>
                  <h3 style={{ marginTop: 16 }}>{risk.title}</h3>
                  <p className="muted">{risk.description}</p>
                </article>
              ))}
            </div>
          </section>
        ) : null}

        <section className="section">
          <div className="section-header">
            <div>
              <h2>核心能力</h2>
              <p className="muted">每项能力都有独立页面和结构化输出。</p>
            </div>
          </div>
          <div className="grid grid-2">
            {skills.map((skill) => (
              <Link className="card skill-card" href={skill.href} key={skill.href}>
                <span className="skill-icon">{skill.icon}</span>
                <h3>{skill.title}</h3>
                <p>{skill.description}</p>
                <span className="skill-link">开始分析 →</span>
              </Link>
            ))}
          </div>
        </section>

        <section className="section">
          <div className="section-header">
            <div>
              <h2>近三日行业热点</h2>
              <p className="muted">
                当前为演示数据；接入实时数据源后将显示来源、日期与可信度。
              </p>
            </div>
            {data && <span className="status-pill">{data.status}</span>}
          </div>
          {!data ? (
            <div className="loading">正在准备工作台...</div>
          ) : (
            <div className="grid grid-3">
              {data.hotTopics.map((topic) => (
                <article className="card topic-card" key={topic.title}>
                  <div className="tags">
                    {topic.tags.map((tag) => (
                      <span className="tag" key={tag}>
                        {tag}
                      </span>
                    ))}
                  </div>
                  <h3 style={{ marginTop: 18 }}>{topic.title}</h3>
                  <p className="muted">{topic.summary}</p>
                  <p>{topic.fitReason}</p>
                </article>
              ))}
            </div>
          )}
        </section>
      </main>
      <ProfileEditor
        open={editingProfile}
        profile={profile}
        onClose={() => setEditingProfile(false)}
        onSave={onUpdate}
      />
    </>
  );
}
