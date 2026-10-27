import { requireApiKey } from "@/lib/api-key";
import { requireUser } from "@/lib/auth";
import { toGrammarFeedback } from "@/lib/feedback";
import { getJSONCompletion, openAIErrorResponse } from "@/lib/openai";
import { loadUserMessage } from "@/lib/practice";
import { CorrectionModel } from "@/models/Correction";

const ISSUE_TYPES = ["grammar", "vocabulary", "spelling", "other"] as const;

type GrammarResult = {
  isCorrect?: boolean;
  correctedSentence?: string;
  issues?: { type?: string; original?: string; suggestion?: string; explanation?: string }[];
};

const SYSTEM_PROMPT = `You are an English teacher helping a Taiwanese learner.
Check the learner's sentence for grammar, vocabulary and spelling mistakes.
Pay close attention to verb tense (e.g. "for three years" needs the present perfect), articles, plurals, prepositions and word forms.
The corrected sentence must be fully grammatical: re-read it and make sure no mistakes remain.
Only fix real mistakes; do not rewrite a sentence that is already correct just to make it fancier.
Write every explanation in Traditional Chinese (繁體中文), short and easy to understand.
Respond with a JSON object in exactly this form:
{
  "isCorrect": boolean,
  "correctedSentence": "the full sentence with only the mistakes fixed (same as the original if correct)",
  "issues": [
    {
      "type": "grammar" | "vocabulary" | "spelling" | "other",
      "original": "the wrong part",
      "suggestion": "the fixed part",
      "explanation": "為什麼要這樣改（繁體中文）"
    }
  ]
}
If the sentence is correct, "issues" must be an empty array.`;

// 糾正文法：檢查使用者的一句話並回傳錯誤與修正
export async function POST(
  _request: Request,
  ctx: RouteContext<"/api/conversations/[id]/messages/[messageId]/grammar">
) {
  const { user, error } = await requireUser();
  if (error) return error;

  const { id, messageId } = await ctx.params;
  const loaded = await loadUserMessage(user._id, id, messageId);
  if ("error" in loaded) return loaded.error;
  const { conversation, scenario, message, previousQuestion } = loaded;

  // 已經檢查過（且有錯誤紀錄）就直接回傳，不重複呼叫 OpenAI
  const existing = await CorrectionModel.find({
    userId: user._id,
    messageId: message._id,
    type: { $ne: "expression" },
  }).lean();
  if (existing.length > 0) {
    return Response.json({ original: message.content, ...toGrammarFeedback(existing) });
  }

  const { apiKey, error: keyError } = await requireApiKey(user._id);
  if (keyError) return keyError;

  let result: GrammarResult;
  try {
    result = await getJSONCompletion<GrammarResult>(
      apiKey,
      [
        { role: "system", content: SYSTEM_PROMPT },
        {
          role: "user",
          content: [
            `Scenario: ${scenario.label}`,
            previousQuestion && `The learner was replying to: "${previousQuestion}"`,
            `Learner's sentence: "${message.content}"`,
          ]
            .filter(Boolean)
            .join("\n"),
        },
      ],
      0.2
    );
  } catch (err) {
    return openAIErrorResponse(err, "AI 暫時無法檢查，請稍後再試");
  }

  const correctedSentence = result.correctedSentence?.trim() || message.content;
  const issues = (result.issues ?? [])
    .filter((i) => i.original && i.suggestion)
    .map((i) => ({
      type: ISSUE_TYPES.includes(i.type as never) ? (i.type as string) : "other",
      original: i.original!,
      suggestion: i.suggestion!,
      explanation: i.explanation ?? "",
    }));

  // 每個錯誤存成一筆糾錯紀錄
  if (issues.length > 0) {
    await CorrectionModel.insertMany(
      issues.map((i) => ({
        ...i,
        correctedSentence,
        userId: user._id,
        conversation: conversation._id,
        messageId: message._id,
      }))
    );
  }

  return Response.json({
    isCorrect: issues.length === 0,
    original: message.content,
    correctedSentence,
    issues,
  });
}
