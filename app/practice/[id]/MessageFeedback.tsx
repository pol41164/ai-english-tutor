"use client";

import { useState } from "react";
import { postJSON } from "@/lib/api-client";
import { ISSUE_LABELS, type BetterFeedback, type GrammarFeedback } from "@/lib/feedback";

type Kind = "grammar" | "better";

type PanelState<T> = { loading: boolean; error: string; data: T | null };

// 使用者訊息下方的「糾正文法」與「更好的回答」按鈕及結果
export default function MessageFeedback({
  conversationId,
  messageId,
  initialGrammar,
  initialBetter,
}: {
  conversationId: string;
  messageId: string;
  initialGrammar: GrammarFeedback | null; // 之前查過、存在資料庫的結果
  initialBetter: BetterFeedback | null;
}) {
  const [grammar, setGrammar] = useState<PanelState<GrammarFeedback>>({
    loading: false,
    error: "",
    data: initialGrammar,
  });
  const [better, setBetter] = useState<PanelState<BetterFeedback>>({
    loading: false,
    error: "",
    data: initialBetter,
  });
  const [open, setOpen] = useState<Kind | null>(null);

  async function load(kind: Kind) {
    // 再按一次同一個按鈕就收合
    if (open === kind) {
      setOpen(null);
      return;
    }
    setOpen(kind);

    const [state, setState] = kind === "grammar" ? [grammar, setGrammar] : [better, setBetter];
    if (state.data || state.loading) return; // 已經查過就直接顯示

    setState({ loading: true, error: "", data: null });
    try {
      const data = await postJSON<GrammarFeedback & BetterFeedback>(
        `/api/conversations/${conversationId}/messages/${messageId}/${kind}`
      );
      setState({ loading: false, error: "", data });
    } catch (err) {
      setState({
        loading: false,
        error: err instanceof Error ? err.message : "發生錯誤",
        data: null,
      });
    }
  }

  const buttonClass = (kind: Kind) =>
    `rounded-full border px-3 py-1 text-xs transition ${
      open === kind
        ? "border-blue-600 bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300"
        : "border-neutral-300 text-neutral-600 hover:border-blue-500 dark:border-neutral-700 dark:text-neutral-400"
    }`;

  return (
    <div className="mt-1 flex w-full max-w-[80%] flex-col items-end gap-2">
      <div className="flex gap-2">
        <button onClick={() => load("grammar")} className={buttonClass("grammar")}>
          糾正文法
        </button>
        <button onClick={() => load("better")} className={buttonClass("better")}>
          更好的回答
        </button>
      </div>

      {open === "grammar" && (
        <Panel state={grammar} loadingText="檢查文法中…">
          {(d) =>
            d.isCorrect ? (
              <p className="text-green-700 dark:text-green-400">✓ 這句文法正確，很棒！</p>
            ) : (
              <>
                <p className="font-medium">{d.correctedSentence}</p>
                <ul className="mt-2 space-y-2">
                  {d.issues.map((issue, i) => (
                    <li key={i}>
                      <span className="mr-2 rounded bg-amber-100 px-1.5 py-0.5 text-xs text-amber-800 dark:bg-amber-900 dark:text-amber-200">
                        {ISSUE_LABELS[issue.type] ?? issue.type}
                      </span>
                      <span className="text-red-600 line-through dark:text-red-400">{issue.original}</span>
                      {" → "}
                      <span className="text-green-700 dark:text-green-400">{issue.suggestion}</span>
                      {issue.explanation && (
                        <p className="mt-0.5 text-neutral-600 dark:text-neutral-400">{issue.explanation}</p>
                      )}
                    </li>
                  ))}
                </ul>
              </>
            )
          }
        </Panel>
      )}

      {open === "better" && (
        <Panel state={better} loadingText="產生更好的說法中…">
          {(d) => (
            <>
              <p className="font-medium">{d.betterAnswer}</p>
              {d.explanation && (
                <p className="mt-2 text-neutral-600 dark:text-neutral-400">{d.explanation}</p>
              )}
              {d.keyPhrases.length > 0 && (
                <ul className="mt-2 space-y-1">
                  {d.keyPhrases.map((p, i) => (
                    <li key={i}>
                      <span className="font-medium text-blue-700 dark:text-blue-300">{p.phrase}</span>
                      <span className="text-neutral-600 dark:text-neutral-400">：{p.meaning}</span>
                    </li>
                  ))}
                </ul>
              )}
            </>
          )}
        </Panel>
      )}
    </div>
  );
}

function Panel<T>({
  state,
  loadingText,
  children,
}: {
  state: PanelState<T>;
  loadingText: string;
  children: (data: T) => React.ReactNode;
}) {
  return (
    <div className="w-full rounded-xl border border-neutral-200 bg-white p-3 text-left text-sm dark:border-neutral-800 dark:bg-neutral-900">
      {state.loading && <p className="text-neutral-500">{loadingText}</p>}
      {state.error && <p className="text-red-600 dark:text-red-400">{state.error}</p>}
      {state.data && children(state.data)}
    </div>
  );
}
