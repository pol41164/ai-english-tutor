import { requireUser } from "@/lib/auth";
import { getScenario } from "@/lib/scenarios";
import { CorrectionModel } from "@/models/Correction";
import { ConversationModel } from "@/models/Conversation";

// 列出目前使用者自己的所有糾錯紀錄（新的在前）
export async function GET() {
  const { user, error } = await requireUser();
  if (error) return error;

  const corrections = await CorrectionModel.find({ userId: user._id })
    .sort({ createdAt: -1 })
    .limit(300)
    .lean();

  // 一樣只查本人的練習，用來顯示場景名稱
  const conversations = await ConversationModel.find({
    _id: { $in: [...new Set(corrections.map((c) => c.conversation.toString()))] },
    userId: user._id,
  })
    .select("topic")
    .lean();
  const topicMap = new Map(conversations.map((c) => [c._id.toString(), c.topic]));

  return Response.json({
    corrections: corrections.map((c) => {
      const scenario = getScenario(topicMap.get(c.conversation.toString()) ?? "");
      return {
        id: c._id.toString(),
        conversationId: c.conversation.toString(),
        scenario: scenario ? { label: scenario.label, emoji: scenario.emoji } : null,
        type: c.type,
        original: c.original,
        suggestion: c.suggestion,
        explanation: c.explanation,
        correctedSentence: c.correctedSentence,
        keyPhrases: c.keyPhrases,
        createdAt: c.createdAt,
      };
    }),
  });
}
