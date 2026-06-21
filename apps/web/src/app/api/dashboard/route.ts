import { NextResponse } from "next/server";
import { collectLiveHotspots, hotspotsToDashboard } from "@/lib/live-hotspots";
import { companyProfileSchema, dashboardSchema } from "@/lib/schemas";

export async function POST(request: Request) {
  const parsed = companyProfileSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "企业资料不完整" }, { status: 400 });
  }

  const hotspots = await collectLiveHotspots(parsed.data, parsed.data.goal);
  return NextResponse.json(dashboardSchema.parse(hotspotsToDashboard(parsed.data, hotspots)));
}
