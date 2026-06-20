import { runSkill, type SkillProgress } from "@/lib/skill-runner";
import { skillRequestSchema } from "@/lib/schemas";

type StreamEvent =
  | { type: "step"; step: SkillProgress }
  | { type: "final"; result: Awaited<ReturnType<typeof runSkill>> }
  | { type: "error"; message: string };

export async function POST(request: Request) {
  const parsed = skillRequestSchema.safeParse(await request.json());
  if (!parsed.success) {
    return Response.json({ error: "请求格式不正确" }, { status: 400 });
  }

  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      const send = (event: StreamEvent) => {
        controller.enqueue(encoder.encode(`${JSON.stringify(event)}\n`));
      };

      try {
        const result = await runSkill({
          ...parsed.data,
          onProgress: (step) => send({ type: "step", step }),
        });
        send({ type: "final", result });
      } catch (error) {
        send({
          type: "error",
          message: error instanceof Error ? error.message : "生成失败",
        });
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Cache-Control": "no-cache, no-transform",
      "Content-Type": "application/x-ndjson; charset=utf-8",
    },
  });
}
