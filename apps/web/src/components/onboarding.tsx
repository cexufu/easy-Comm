"use client";

import { useState } from "react";
import { companyProfileSchema, type CompanyProfile } from "@/lib/schemas";

export function Onboarding({ onComplete }: { onComplete: (profile: CompanyProfile) => void }) {
  const [profile, setProfile] = useState<CompanyProfile>({
    companyName: "",
    industry: "",
    city: "",
    goal: "",
  });
  const [error, setError] = useState("");

  const update = (key: keyof CompanyProfile, value: string) => {
    setProfile((current) => ({ ...current, [key]: value }));
  };

  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    const parsed = companyProfileSchema.safeParse(profile);
    if (!parsed.success) {
      setError("请完整填写企业名称、行业、城市和传播目标。");
      return;
    }
    localStorage.setItem("simple-pr-profile", JSON.stringify(parsed.data));
    onComplete(parsed.data);
  };

  const fillDemo = () => {
    setProfile({
      companyName: "星桥科技",
      industry: "人工智能企业服务",
      city: "北京",
      goal: "建立可信的行业影响力，并获取更多企业客户",
    });
  };

  return (
    <main className="form-panel panel">
      <p className="eyebrow">Simple PR</p>
      <h1 style={{ fontSize: "clamp(38px, 8vw, 58px)" }}>让传播更简单。</h1>
      <p className="lead" style={{ marginBottom: 30 }}>
        先告诉我们你的企业背景。系统会用它筛选热点、判断风险、模拟受众并生成策划案。
      </p>

      <form className="form-grid" onSubmit={submit}>
        <div className="field">
          <label htmlFor="companyName">公司名称</label>
          <input
            className="input"
            id="companyName"
            required
            value={profile.companyName}
            onChange={(event) => update("companyName", event.target.value)}
            placeholder="例如：星桥科技"
          />
        </div>
        <div className="field">
          <label htmlFor="industry">所属行业</label>
          <input
            className="input"
            id="industry"
            required
            value={profile.industry}
            onChange={(event) => update("industry", event.target.value)}
            placeholder="例如：人工智能企业服务"
          />
        </div>
        <div className="field">
          <label htmlFor="city">所在城市</label>
          <input
            className="input"
            id="city"
            required
            value={profile.city}
            onChange={(event) => update("city", event.target.value)}
            placeholder="例如：北京"
          />
        </div>
        <div className="field">
          <label htmlFor="goal">主要传播目标</label>
          <input
            className="input"
            id="goal"
            required
            value={profile.goal}
            onChange={(event) => update("goal", event.target.value)}
            placeholder="例如：提升品牌可信度"
          />
        </div>
        {error && <div className="error compact field full">{error}</div>}
        <div className="field full">
          <div className="button-row">
            <button className="button" type="submit">
              进入工作台
            </button>
            <button className="button secondary" type="button" onClick={fillDemo}>
              填入演示资料
            </button>
          </div>
        </div>
      </form>
    </main>
  );
}
