import { isValidObjectId } from "mongoose";
import { requireUser } from "@/lib/auth";
import {
  isBetterAnswer,
  toBetterFeedback,
  toGrammarFeedback,
  type BetterFeedback,
  type GrammarFeedback,
} from "@/lib/feedback";
import { getScenario } from "@/lib/scenarios";
import { ConversationModel } from "@/models/Conversation";
import { CorrectionModel, type Correction } from "@/models/Correction";

// 取得一場練習的完整對話，以及每則訊息已存的糾錯紀錄（只限本人）
export async function GET(_request: Request, ctx: RouteContext<"/api/conversations/[id]">) {
  const { user, error } = await requireUser();
  if (error) return error;

  const { id } = await ctx.params;
  if (!isValidObjectId(id)) {
    return Response.json({ error: "找不到這場練習" }, { status: 404 });
  }

  const conversation = await ConversationModel.findOne({ _id: id, userId: user._id }).lean();
  if (!conversation) {
    return Response.json({ error: "找不到這場練習" }, { status: 404 });
  }

  const corrections = await CorrectionModel.find({
    conversation: conversation._id,
    userId: user._id,
  })
    .sort({ createdAt: 1 })
    .lean();

  // 依訊息分組：文法錯誤（可能多筆）和更好的回答（取最新一筆）
  const grouped = new Map<string, { grammar: Correction[]; better: Correction | null }>();
  for (const c of corrections) {
    const key = c.messageId.toString();
    const entry = grouped.get(key) ?? { grammar: [], better: null };
    if (isBetterAnswer(c)) entry.better = c;
    else entry.grammar.push(c);
    grouped.set(key, entry);
  }

  const feedback: Record<string, { grammar: GrammarFeedback | null; better: BetterFeedback | null }> = {};
  for (const [messageId, entry] of grouped) {
    feedback[messageId] = {
      grammar: entry.grammar.length > 0 ? toGrammarFeedback(entry.grammar) : null,
      better: entry.better ? toBetterFeedback(entry.better) : null,
    };
  }

  const scenario = getScenario(conversation.topic);

  return Response.json({
    id: conversation._id.toString(),
    scenario: scenario
      ? { id: scenario.id, label: scenario.label, emoji: scenario.emoji }
      : null,
    messages: conversation.messages.map((m) => ({
      id: m._id.toString(),
      role: m.role,
      content: m.content,
    })),
    feedback,
  });
}
