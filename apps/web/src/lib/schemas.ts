import { z } from "zod";

export const companyProfileSchema = z.object({
  companyName: z.string().trim().min(1).max(80),
  industry: z.string().trim().min(1).max(80),
  city: z.string().trim().min(1).max(80),
  goal: z.string().trim().min(1).max(300),
});

export type CompanyProfile = z.infer<typeof companyProfileSchema>;

export const sourceSchema = z.object({
  title: z.string(),
  url: z.string().url().optional(),
  publisher: z.string(),
  publishedAt: z.string(),
});

export const topicSchema = z.object({
  title: z.string(),
  summary: z.string(),
  fitReason: z.string(),
  risk: z.enum(["low", "medium", "high"]),
  tags: z.array(z.string()).max(5),
  sources: z.array(sourceSchema),
});

export const dashboardSchema = z.object({
  status: z.enum(["fresh", "cached", "demo", "degraded"]),
  generatedAt: z.string(),
  risks: z
    .array(
      z.object({
        level: z.enum(["low", "medium", "high"]),
        title: z.string(),
        description: z.string(),
      }),
    )
    .max(3),
  hotTopics: z.array(topicSchema).max(8),
});

export type DashboardData = z.infer<typeof dashboardSchema>;

export const skillRequestSchema = z.object({
  skill: z.enum(["topics", "sentiment", "audience", "planning"]),
  profile: companyProfileSchema,
  input: z.string().trim().max(5000).default(""),
});

export const skillResponseSchema = z.object({
  requestId: z.string(),
  status: z.enum(["completed", "degraded"]),
  title: z.string(),
  summary: z.string(),
  sections: z.array(
    z.object({
      heading: z.string(),
      items: z.array(z.string()),
    }),
  ),
  knowledge: z.array(
    z.object({
      path: z.string(),
      heading: z.string(),
    }),
  ),
  warnings: z.array(z.string()),
});

export type SkillResponse = z.infer<typeof skillResponseSchema>;
