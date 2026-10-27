import { requireApiKey } from "@/lib/api-key";
import { requireUser } from "@/lib/auth";
import { connectDB } from "@/lib/mongodb";
import { getTutorReply, openAIErrorResponse } from "@/lib/openai";
import { buildSystemPrompt, getScenario } from "@/lib/scenarios";
import { ConversationModel } from "@/models/Conversation";
import { CorrectionModel } from "@/models/Correction";

// 列出目前使用者自己的練習紀錄
export async function GET() {
  const { user, error } = await requireUser();
  if (error) return error;

  const conversations = await ConversationModel.aggregate<{
    _id: string;
    topic: string;
    startedAt: Date;
    updatedAt: Date;
    messageCount: number;
    lastMessage: string | null;
  }>([
    { $match: { userId: user._id } },
    { $sort: { updatedAt: -1 } },
    { $limit: 100 },
    {
      $project: {
        topic: 1,
        startedAt: 1,
        updatedAt: 1,
        messageCount: { $size: "$messages" },
        lastMessage: { $arrayElemAt: ["$messages.content", -1] },
      },
    },
  ]);

  const correctionCounts = await CorrectionModel.aggregate<{ _id: string; count: number }>([
    { $match: { userId: user._id } },
    { $group: { _id: "$conversation", count: { $sum: 1 } } },
  ]);
  const countMap = new Map(correctionCounts.map((c) => [c._id.toString(), c.count]));

  return Response.json({
    conversations: conversations.map((c) => {
      const scenario = getScenario(c.topic);
      return {
        id: c._id.toString(),
        scenario: scenario ? { label: scenario.label, emoji: scenario.emoji } : null,
        messageCount: c.messageCount,
        lastMessage: c.lastMessage ?? "",
        correctionCount: countMap.get(c._id.toString()) ?? 0,
        startedAt: c.startedAt,
        updatedAt: c.updatedAt,
      };
    }),
  });
}

// 開始一場新練習：建立對話，並讓 AI 先問第一句
export async function POST(request: Request) {
  const { user, error } = await requireUser();
  if (error) return error;

  const body = await request.json().catch(() => null);
  const scenario = getScenario(body?.scenario ?? "");
  if (!scenario) {
    return Response.json({ error: "找不到這個練習場景" }, { status: 400 });
  }

  const { apiKey, error: keyError } = await requireApiKey(user._id);
  if (keyError) return keyError;

  try {
    const opening = await getTutorReply(apiKey, [
      { role: "system", content: buildSystemPrompt(scenario) },
      {
        role: "user",
        content: "(The conversation is just starting. Greet me in character and ask me an opening question.)",
      },
    ]);

    await connectDB();
    const conversation = await ConversationModel.create({
      userId: user._id,
      title: scenario.label,
      topic: scenario.id,
      messages: [{ role: "assistant", content: opening }],
    });

    return Response.json({ conversationId: conversation._id.toString() });
  } catch (err) {
    return openAIErrorResponse(err, "建立練習失敗，請稍後再試");
  }
}
