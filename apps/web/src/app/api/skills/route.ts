import { NextResponse } from "next/server";
import { runSkill } from "@/lib/skill-runner";
import { skillRequestSchema, skillResponseSchema } from "@/lib/schemas";

export async function POST(request: Request) {
  const parsed = skillRequestSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "请求格式不正确" }, { status: 400 });
  }

  return NextResponse.json(skillResponseSchema.parse(await runSkill(parsed.data)));
}
