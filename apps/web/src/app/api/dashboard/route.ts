import { NextResponse } from "next/server";
import { demoDashboard } from "@/lib/demo-data";
import { companyProfileSchema, dashboardSchema } from "@/lib/schemas";

export async function POST(request: Request) {
  const parsed = companyProfileSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "企业资料不完整" }, { status: 400 });
  }

  return NextResponse.json(dashboardSchema.parse(demoDashboard(parsed.data)));
}
