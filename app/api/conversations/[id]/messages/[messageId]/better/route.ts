import { requireApiKey } from "@/lib/api-key";
import { requireUser } from "@/lib/auth";
import { toBetterFeedback } from "@/lib/feedback";
import { getJSONCompletion, openAIErrorResponse } from "@/lib/openai";
import { loadUserMessage } from "@/lib/practice";
import { CorrectionModel } from "@/models/Correction";

type BetterResult = {
  betterAnswer?: string;
  explanation?: string;
  keyPhrases?: { phrase?: string; meaning?: string }[];
};

const SYSTEM_PROMPT = `You are an English speaking coach helping a Taiwanese learner.
Given the conversation scenario, the question the learner was answering, and the learner's reply,
write a better, more complete and natural reply that a fluent speaker would say in this situation.
Keep the learner's original meaning and intent, but add useful detail and natural expressions.
Keep it to 1 to 3 sentences and suitable for an intermediate learner to remember and reuse.
Never use placeholders in square brackets such as [Your Name] or [City].
If the question asks for information the learner did not give (for example their name), do not invent it — simply leave that part out.
Do not add greetings or self-introductions the learner did not say.
Write the explanation and meanings in Traditional Chinese (繁體中文).
Respond with a JSON object in exactly this form:
{
  "betterAnswer": "the improved reply in English",
  "explanation": "這樣說為什麼比較好（繁體中文，2-3 句）",
  "keyPhrases": [
    { "phrase": "a useful phrase used in the better answer", "meaning": "中文意思與使用時機" }
  ]
}
Include 2 to 4 key phrases.`;

// 更好的完整回答：示範同一個意思怎麼講更自然、更完整
export async function POST(
  _request: Request,
  ctx: RouteContext<"/api/conversations/[id]/messages/[messageId]/better">
) {
  const { user, error } = await requireUser();
  if (error) return error;

  const { id, messageId } = await ctx.params;
  const loaded = await loadUserMessage(user._id, id, messageId);
  if ("error" in loaded) return loaded.error;
  const { conversation, scenario, message, previousQuestion } = loaded;

  // 已經產生過就直接回傳，不重複呼叫 OpenAI
  const existing = await CorrectionModel.findOne({
    userId: user._id,
    messageId: message._id,
    type: "expression",
  }).lean();
  if (existing) {
    return Response.json({ original: message.content, ...toBetterFeedback(existing) });
  }

  const { apiKey, error: keyError } = await requireApiKey(user._id);
  if (keyError) return keyError;

  let result: BetterResult;
  try {
    result = await getJSONCompletion<BetterResult>(
      apiKey,
      [
        { role: "system", content: SYSTEM_PROMPT },
        {
          role: "user",
          content: [
            `Scenario: ${scenario.label} — the other person is ${scenario.persona}`,
            previousQuestion && `Question the learner was answering: "${previousQuestion}"`,
            `Learner's reply: "${message.content}"`,
          ]
            .filter(Boolean)
            .join("\n"),
        },
      ],
      0.7
    );
  } catch (err) {
    return openAIErrorResponse(err, "AI 暫時無法產生建議，請稍後再試");
  }

  const betterAnswer = result.betterAnswer?.trim();
  if (!betterAnswer) {
    return Response.json({ error: "AI 暫時無法產生建議，請稍後再試" }, { status: 502 });
  }

  const explanation = result.explanation ?? "";
  const keyPhrases = (result.keyPhrases ?? [])
    .filter((p) => p.phrase)
    .map((p) => ({ phrase: p.phrase!, meaning: p.meaning ?? "" }));

  await CorrectionModel.create({
    userId: user._id,
    conversation: conversation._id,
    messageId: message._id,
    type: "expression",
    original: message.content,
    suggestion: betterAnswer,
    explanation,
    keyPhrases,
  });

  return Response.json({ original: message.content, betterAnswer, explanation, keyPhrases });
}
