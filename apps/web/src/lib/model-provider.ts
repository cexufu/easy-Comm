type GenerateInput = {
  system: string;
  user: string;
  signal?: AbortSignal;
};

export interface ModelProvider {
  name: string;
  generate(input: GenerateInput): Promise<string>;
}

class OpenAICompatibleProvider implements ModelProvider {
  name: string;

  constructor(
    private baseUrl: string,
    private apiKey: string,
    private model: string,
  ) {
    this.name = model;
  }

  async generate({ system, user, signal }: GenerateInput): Promise<string> {
    const response = await fetch(`${this.baseUrl.replace(/\/$/, "")}/chat/completions`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: this.model,
        temperature: 0.3,
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: system },
          { role: "user", content: user },
        ],
      }),
      signal,
    });

    if (!response.ok) {
      throw new Error(`Model request failed with ${response.status}`);
    }

    const data = (await response.json()) as {
      choices?: Array<{ message?: { content?: string } }>;
    };
    const content = data.choices?.[0]?.message?.content;
    if (!content) throw new Error("Model returned no content");
    return content;
  }
}

export function getModelProvider(): ModelProvider | null {
  const provider = process.env.MODEL_PROVIDER ?? "demo";
  if (provider === "demo") return null;

  const baseUrl = process.env.MODEL_BASE_URL;
  const apiKey = process.env.MODEL_API_KEY;
  const model = process.env.MODEL_NAME;
  if (!baseUrl || !apiKey || !model) {
    throw new Error("MODEL_BASE_URL, MODEL_API_KEY and MODEL_NAME are required");
  }

  return new OpenAICompatibleProvider(baseUrl, apiKey, model);
}

export async function withTimeout<T>(
  operation: (signal: AbortSignal) => Promise<T>,
  timeoutMs = Number(process.env.MODEL_TIMEOUT_MS ?? 45000),
): Promise<T> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await operation(controller.signal);
  } finally {
    clearTimeout(timer);
  }
}
