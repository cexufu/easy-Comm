import { NextResponse } from "next/server";
import { getKnowledgeHealth } from "@/lib/knowledge";

export async function GET() {
  try {
    return NextResponse.json({
      status: "ok",
      modelProvider: process.env.MODEL_PROVIDER ?? "demo",
      knowledge: await getKnowledgeHealth(),
    });
  } catch (error) {
    return NextResponse.json(
      {
        status: "error",
        message: error instanceof Error ? error.message : "Health check failed",
      },
      { status: 500 },
    );
  }
}
