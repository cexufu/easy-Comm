"use client";

import { useEffect, useState } from "react";
import { companyProfileSchema, type CompanyProfile } from "@/lib/schemas";

export function ProfileEditor({
  open,
  profile,
  onClose,
  onSave,
}: {
  open: boolean;
  profile: CompanyProfile;
  onClose: () => void;
  onSave: (profile: CompanyProfile) => void;
}) {
  const [draft, setDraft] = useState(profile);
  const [error, setError] = useState("");

  useEffect(() => {
    if (open) {
      setDraft(profile);
      setError("");
    }
  }, [open, profile]);

  useEffect(() => {
    if (!open) return;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [onClose, open]);

  if (!open) return null;

  const update = (key: keyof CompanyProfile, value: string) => {
    setDraft((current) => ({ ...current, [key]: value }));
  };

  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    const parsed = companyProfileSchema.safeParse(draft);
    if (!parsed.success) {
      setError("请完整填写企业名称、行业、城市和传播目标。");
      return;
    }
    onSave(parsed.data);
    onClose();
  };

  return (
    <div className="modal-backdrop" role="presentation" onMouseDown={onClose}>
      <section
        aria-labelledby="profile-editor-title"
        aria-modal="true"
        className="modal panel"
        role="dialog"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className="modal-header">
          <div>
            <p className="eyebrow">Company Profile</p>
            <h2 id="profile-editor-title">修改企业资料</h2>
          </div>
          <button aria-label="关闭" className="icon-button" onClick={onClose} type="button">
            ×
          </button>
        </div>

        <form className="form-grid" onSubmit={submit}>
          <div className="field">
            <label htmlFor="edit-company-name">公司名称</label>
            <input
              autoFocus
              className="input"
              id="edit-company-name"
              value={draft.companyName}
              onChange={(event) => update("companyName", event.target.value)}
            />
          </div>
          <div className="field">
            <label htmlFor="edit-industry">所属行业</label>
            <input
              className="input"
              id="edit-industry"
              value={draft.industry}
              onChange={(event) => update("industry", event.target.value)}
            />
          </div>
          <div className="field">
            <label htmlFor="edit-city">所在城市</label>
            <input
              className="input"
              id="edit-city"
              value={draft.city}
              onChange={(event) => update("city", event.target.value)}
            />
          </div>
          <div className="field">
            <label htmlFor="edit-goal">主要传播目标</label>
            <input
              className="input"
              id="edit-goal"
              value={draft.goal}
              onChange={(event) => update("goal", event.target.value)}
            />
          </div>
          {error && <div className="error compact field full">{error}</div>}
          <div className="button-row field full modal-actions">
            <button className="button" type="submit">
              保存资料
            </button>
            <button className="button secondary" onClick={onClose} type="button">
              取消
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}
