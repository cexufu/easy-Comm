"use client";

import { useEffect, useState } from "react";
import { Dashboard } from "@/components/dashboard";
import { Onboarding } from "@/components/onboarding";
import { companyProfileSchema, type CompanyProfile } from "@/lib/schemas";

export default function HomePage() {
  const [profile, setProfile] = useState<CompanyProfile | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem("simple-pr-profile");
    if (stored) {
      try {
        const parsed = companyProfileSchema.safeParse(JSON.parse(stored));
        if (parsed.success) {
          setProfile(parsed.data);
        } else {
          localStorage.removeItem("simple-pr-profile");
        }
      } catch {
        localStorage.removeItem("simple-pr-profile");
      }
    }
    setReady(true);
  }, []);

  if (!ready) return <div className="loading form-panel">正在打开简单传播...</div>;
  if (!profile) return <Onboarding onComplete={setProfile} />;

  return (
    <Dashboard
      profile={profile}
      onUpdate={(nextProfile) => {
        localStorage.setItem("simple-pr-profile", JSON.stringify(nextProfile));
        setProfile(nextProfile);
      }}
    />
  );
}
