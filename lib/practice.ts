import { isValidObjectId, type Types } from "mongoose";
import { connectDB } from "@/lib/mongodb";
import { getScenario } from "@/lib/scenarios";
import { ConversationModel } from "@/models/Conversation";

// 找出「這個使用者自己的」某場練習中的一則使用者訊息，以及它在回應的上一句 AI 問句
// 不是本人的練習一律當作找不到，回傳可直接 return 的錯誤 Response
export async function loadUserMessage(
  userId: Types.ObjectId,
  conversationId: string,
  messageId: string
) {
  const notFound = Response.json({ error: "找不到這則訊息" }, { status: 404 });
  if (!isValidObjectId(conversationId) || !isValidObjectId(messageId)) {
    return { error: notFound };
  }

  await connectDB();
  const conversation = await ConversationModel.findOne({ _id: conversationId, userId }).lean();
  const scenario = conversation && getScenario(conversation.topic);
  if (!conversation || !scenario) return { error: notFound };

  const index = conversation.messages.findIndex((m) => m._id.toString() === messageId);
  const message = conversation.messages[index];
  if (!message || message.role !== "user") return { error: notFound };

  const previous = conversation.messages
    .slice(0, index)
    .findLast((m) => m.role === "assistant");

  return {
    conversation,
    scenario,
    message,
    previousQuestion: previous?.content ?? "",
  };
}
