import { isValidObjectId } from "mongoose";
import { requireApiKey } from "@/lib/api-key";
import { requireUser } from "@/lib/auth";
import { connectDB } from "@/lib/mongodb";
import { getTutorReply, openAIErrorResponse, type ChatMessage } from "@/lib/openai";
import { buildSystemPrompt, getScenario } from "@/lib/scenarios";
import { ConversationModel } from "@/models/Conversation";

const MAX_LENGTH = 500;

// 使用者送出一句英文 → 存起來 → 請 AI 以場景人設回應 → 回傳 AI 的回覆
export async function POST(request: Request, ctx: RouteContext<"/api/conversations/[id]/messages">) {
  const { user, error } = await requireUser();
  if (error) return error;

  const { id } = await ctx.params;
  if (!isValidObjectId(id)) {
    return Response.json({ error: "找不到這場練習" }, { status: 404 });
  }

  const body = await request.json().catch(() => null);
  const content = typeof body?.content === "string" ? body.content.trim() : "";
  if (!content) {
    return Response.json({ error: "請輸入內容" }, { status: 400 });
  }
  if (content.length > MAX_LENGTH) {
    return Response.json({ error: `內容請在 ${MAX_LENGTH} 字以內` }, { status: 400 });
  }

  await connectDB();
  const conversation = await ConversationModel.findOne({ _id: id, userId: user._id });
  const scenario = conversation && getScenario(conversation.topic);
  if (!conversation || !scenario) {
    return Response.json({ error: "找不到這場練習" }, { status: 404 });
  }

  const history: ChatMessage[] = [
    { role: "system", content: buildSystemPrompt(scenario) },
    ...conversation.messages
      .filter((m) => m.role !== "system")
      .map((m) => ({ role: m.role, content: m.content })),
    { role: "user", content },
  ];

  const { apiKey, error: keyError } = await requireApiKey(user._id);
  if (keyError) return keyError;

  let reply: string;
  try {
    reply = await getTutorReply(apiKey, history);
  } catch (err) {
    return openAIErrorResponse(err, "AI 暫時無法回應，請稍後再試");
  }

  // AI 成功回覆後才一起存，避免留下沒有回應的訊息
  conversation.messages.push({ role: "user", content }, { role: "assistant", content: reply });
  await conversation.save();

  const [userMsg, assistantMsg] = conversation.messages.slice(-2);
  return Response.json({
    userMessage: { id: userMsg._id.toString(), role: "user", content },
    reply: { id: assistantMsg._id.toString(), role: "assistant", content: reply },
  });
}
