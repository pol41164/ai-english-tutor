import type { Correction } from "@/models/Correction";

// 把資料庫裡的糾錯紀錄整理成前端要的格式（API 回傳與重新載入時共用）

export const ISSUE_LABELS: Record<string, string> = {
  grammar: "文法",
  vocabulary: "用字",
  spelling: "拼字",
  expression: "更好的說法",
  other: "其他",
};

export type GrammarFeedback = {
  isCorrect: boolean;
  correctedSentence: string;
  issues: { type: string; original: string; suggestion: string; explanation: string }[];
};

export type BetterFeedback = {
  betterAnswer: string;
  explanation: string;
  keyPhrases: { phrase: string; meaning: string }[];
};

export function isBetterAnswer(c: Pick<Correction, "type">) {
  return c.type === "expression";
}

export function toGrammarFeedback(issues: Correction[]): GrammarFeedback {
  return {
    isCorrect: issues.length === 0,
    correctedSentence: issues[0]?.correctedSentence ?? "",
    issues: issues.map((i) => ({
      type: i.type,
      original: i.original,
      suggestion: i.suggestion,
      explanation: i.explanation,
    })),
  };
}

export function toBetterFeedback(c: Correction): BetterFeedback {
  return {
    betterAnswer: c.suggestion,
    explanation: c.explanation,
    keyPhrases: c.keyPhrases.map((p) => ({ phrase: p.phrase ?? "", meaning: p.meaning ?? "" })),
  };
}
