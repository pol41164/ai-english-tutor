const OPENAI_BASE = "https://api.openai.com/v1";
const MODEL = process.env.OPENAI_MODEL || "gpt-4o-mini";

export type ChatMessage = {
  role: "system" | "user" | "assistant";
  content: string;
};

export class OpenAIError extends Error {
  constructor(
    public status: number,
    public code: string | null,
    message: string
  ) {
    super(message);
  }
}

async function toOpenAIError(res: Response) {
  const body = await res.json().catch(() => null);
  return new OpenAIError(
    res.status,
    body?.error?.code ?? body?.error?.type ?? null,
    `OpenAI API 錯誤 (${res.status}): ${body?.error?.message ?? res.statusText}`
  );
}

// 呼叫 OpenAI 並要求回傳 JSON 物件（prompt 裡需說明要的 JSON 格式）
export async function getJSONCompletion<T>(
  apiKey: string,
  messages: ChatMessage[],
  temperature = 0.8
): Promise<T> {
  const res = await fetch(`${OPENAI_BASE}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: MODEL,
      messages,
      temperature,
      response_format: { type: "json_object" },
    }),
  });

  if (!res.ok) throw await toOpenAIError(res);

  const data = await res.json();
  const content: string = data.choices?.[0]?.message?.content ?? "";
  return JSON.parse(content) as T;
}

// 角色扮演的回覆：模型回傳 {"reply": "..."}，只取出 reply 字串
export async function getTutorReply(apiKey: string, messages: ChatMessage[]): Promise<string> {
  const { reply } = await getJSONCompletion<{ reply?: unknown }>(apiKey, messages);
  if (typeof reply !== "string" || !reply.trim()) {
    throw new Error("OpenAI 回傳格式不正確");
  }
  return reply.trim();
}

// 檢查 key 是否有效（列出模型不會產生費用）
export async function verifyApiKey(apiKey: string) {
  const res = await fetch(`${OPENAI_BASE}/models`, {
    headers: { Authorization: `Bearer ${apiKey}` },
  });
  if (res.ok) return true;
  if (res.status === 401) return false;
  throw await toOpenAIError(res);
}

// 把 OpenAI 的錯誤轉成給使用者看的訊息
export function openAIErrorResponse(err: unknown, fallback: string) {
  console.error(err);
  if (err instanceof OpenAIError) {
    if (err.status === 401) {
      return Response.json(
        { error: "你的 OpenAI API key 無效或已被刪除，請到「API 設定」更新", code: "INVALID_API_KEY" },
        { status: 400 }
      );
    }
    if (err.code === "insufficient_quota") {
      return Response.json(
        { error: "你的 OpenAI 帳戶額度不足，請到 OpenAI 網站儲值後再試", code: "INSUFFICIENT_QUOTA" },
        { status: 402 }
      );
    }
    if (err.status === 429) {
      return Response.json({ error: "請求太頻繁，請稍等一下再試" }, { status: 429 });
    }
    if (err.status === 404 || err.code === "model_not_found") {
      return Response.json(
        { error: "你的 OpenAI 帳戶無法使用這個模型，請確認帳戶狀態" },
        { status: 400 }
      );
    }
  }
  return Response.json({ error: fallback }, { status: 502 });
}
