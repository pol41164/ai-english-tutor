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
    `inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium transition ${
      open === kind
        ? "border-accent bg-accent-soft text-accent"
        : "border-line bg-card text-muted hover:border-line-strong hover:text-ink"
    }`;

  return (
    <div className="mt-2 flex w-full max-w-[88%] flex-col items-end gap-2 sm:max-w-[80%]">
      <div className="flex gap-1.5">
        <button onClick={() => load("grammar")} className={buttonClass("grammar")}>
          <span aria-hidden>✓</span>
          糾正文法
          {grammar.data && open !== "grammar" && <SavedDot />}
        </button>
        <button onClick={() => load("better")} className={buttonClass("better")}>
          <span aria-hidden>✨</span>
          更好的回答
          {better.data && open !== "better" && <SavedDot />}
        </button>
      </div>

      {open === "grammar" && (
        <Panel state={grammar} loadingText="正在檢查文法…" title="文法糾正" accent="bg-amber-500">
          {(d) =>
            d.isCorrect ? (
              <p className="flex items-center gap-2 font-medium text-emerald-700 dark:text-emerald-400">
                <span className="grid size-6 place-items-center rounded-full bg-emerald-100 text-xs dark:bg-emerald-900/60">
                  ✓
                </span>
                這句文法正確，很棒！
              </p>
            ) : (
              <>
                <p className="rounded-xl bg-subtle px-3 py-2 font-medium leading-relaxed">{d.correctedSentence}</p>
                <ul className="mt-3 space-y-3">
                  {d.issues.map((issue, i) => (
                    <li key={i} className="leading-relaxed">
                      <span className="mr-2 rounded-md bg-amber-100 px-1.5 py-0.5 text-xs font-medium text-amber-800 dark:bg-amber-900/60 dark:text-amber-200">
                        {ISSUE_LABELS[issue.type] ?? issue.type}
                      </span>
                      <span className="text-red-600 line-through decoration-2 dark:text-red-400">{issue.original}</span>
                      <span className="mx-1.5 text-muted">→</span>
                      <span className="font-medium text-emerald-700 dark:text-emerald-400">{issue.suggestion}</span>
                      {issue.explanation && <p className="mt-1 text-muted">{issue.explanation}</p>}
                    </li>
                  ))}
                </ul>
              </>
            )
          }
        </Panel>
      )}

      {open === "better" && (
        <Panel state={better} loadingText="正在想更好的說法…" title="更好的回答" accent="bg-accent">
          {(d) => (
            <>
              <p className="font-display text-[17px] leading-relaxed">&ldquo;{d.betterAnswer}&rdquo;</p>
              {d.explanation && <p className="mt-2 leading-relaxed text-muted">{d.explanation}</p>}
              {d.keyPhrases.length > 0 && (
                <ul className="mt-3 space-y-1.5 border-t border-line pt-3">
                  {d.keyPhrases.map((p, i) => (
                    <li key={i} className="leading-relaxed">
                      <span className="rounded-md bg-accent-soft px-1.5 py-0.5 font-medium text-accent">{p.phrase}</span>
                      <span className="ml-1.5 text-muted">{p.meaning}</span>
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

// 已查過、有存好的結果
function SavedDot() {
  return <span className="size-1.5 rounded-full bg-accent" aria-label="已有紀錄" />;
}

function Panel<T>({
  state,
  loadingText,
  title,
  accent,
  children,
}: {
  state: PanelState<T>;
  loadingText: string;
  title: string;
  accent: string;
  children: (data: T) => React.ReactNode;
}) {
  return (
    <div className="relative w-full animate-rise overflow-hidden rounded-2xl border border-line bg-card p-4 pl-5 text-left text-sm shadow-soft">
      <span className={`absolute inset-y-0 left-0 w-1 ${accent}`} />
      <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted">{title}</p>
      {state.loading && (
        <p className="flex items-center gap-2 text-muted">
          <span className="inline-block size-3.5 animate-spin rounded-full border-2 border-line border-t-accent" />
          {loadingText}
        </p>
      )}
      {state.error && <p className="text-red-600 dark:text-red-400">{state.error}</p>}
      {state.data && children(state.data)}
    </div>
  );
}
