"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import AppHeader from "@/components/AppHeader";
import { apiFetch } from "@/lib/api-client";
import { ISSUE_LABELS } from "@/lib/feedback";

type ScenarioInfo = { label: string; emoji: string } | null;

type ConversationItem = {
  id: string;
  scenario: ScenarioInfo;
  messageCount: number;
  lastMessage: string;
  correctionCount: number;
  startedAt: string;
};

type CorrectionItem = {
  id: string;
  conversationId: string;
  scenario: ScenarioInfo;
  type: string;
  original: string;
  suggestion: string;
  explanation: string;
  correctedSentence: string;
  keyPhrases: { phrase: string; meaning: string }[];
  createdAt: string;
};

type Tab = "conversations" | "corrections";

function formatDate(value: string) {
  return new Date(value).toLocaleString("zh-TW", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function HistoryPage() {
  const [tab, setTab] = useState<Tab>("conversations");
  const [conversations, setConversations] = useState<ConversationItem[] | null>(null);
  const [corrections, setCorrections] = useState<CorrectionItem[] | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    Promise.all([
      apiFetch<{ conversations: ConversationItem[] }>("/api/conversations"),
      apiFetch<{ corrections: CorrectionItem[] }>("/api/corrections"),
    ])
      .then(([a, b]) => {
        setConversations(a.conversations);
        setCorrections(b.corrections);
      })
      .catch((err) => setError(err.message));
  }, []);

  const tabClass = (t: Tab) =>
    `border-b-2 px-1 pb-2 text-sm font-medium ${
      tab === t
        ? "border-accent text-accent"
        : "border-transparent text-muted hover:text-ink"
    }`;

  return (
    <>
      <AppHeader />
      <main className="mx-auto w-full max-w-3xl px-4 py-8">
        <h1 className="text-3xl font-bold tracking-tight">我的紀錄</h1>

        <div className="mt-6 flex gap-6 border-b border-line">
          <button className={tabClass("conversations")} onClick={() => setTab("conversations")}>
            練習紀錄{conversations && `（${conversations.length}）`}
          </button>
          <button className={tabClass("corrections")} onClick={() => setTab("corrections")}>
            糾錯紀錄{corrections && `（${corrections.length}）`}
          </button>
        </div>

        {error && <p className="mt-6 text-sm text-red-600">{error}</p>}
        {!error && !conversations && <p className="mt-6 text-sm text-muted">載入中…</p>}

        {tab === "conversations" && conversations && (
          <ul className="mt-4 space-y-3">
            {conversations.length === 0 && (
              <li className="text-sm text-muted">
                還沒有練習紀錄，<Link href="/" className="text-accent hover:underline">去練習</Link>吧！
              </li>
            )}
            {conversations.map((c) => (
              <li key={c.id}>
                <Link
                  href={`/practice/${c.id}`}
                  className="block rounded-2xl border border-line bg-card shadow-soft p-4 transition hover:border-line-strong hover:shadow-lift"
                >
                  <div className="flex items-center gap-2">
                    <span className="font-semibold">
                      {c.scenario ? `${c.scenario.emoji} ${c.scenario.label}` : "練習"}
                    </span>
                    <span className="ml-auto text-xs text-muted">{formatDate(c.startedAt)}</span>
                  </div>
                  <p className="mt-1 truncate text-sm text-muted">
                    {c.lastMessage}
                  </p>
                  <p className="mt-2 text-xs text-muted">
                    {c.messageCount} 則訊息 · {c.correctionCount} 筆糾錯
                  </p>
                </Link>
              </li>
            ))}
          </ul>
        )}

        {tab === "corrections" && corrections && (
          <ul className="mt-4 space-y-3">
            {corrections.length === 0 && (
              <li className="text-sm text-muted">
                還沒有糾錯紀錄。在練習中按「糾正文法」或「更好的回答」就會記錄在這裡。
              </li>
            )}
            {corrections.map((c) => (
              <li
                key={c.id}
                className="rounded-2xl border border-line bg-card shadow-soft p-4 text-sm"
              >
                <div className="flex items-center gap-2 text-xs text-muted">
                  <span className="rounded bg-amber-100 px-1.5 py-0.5 text-amber-800 dark:bg-amber-900 dark:text-amber-200">
                    {ISSUE_LABELS[c.type] ?? c.type}
                  </span>
                  {c.scenario && <span>{`${c.scenario.emoji} ${c.scenario.label}`}</span>}
                  <span>{formatDate(c.createdAt)}</span>
                  <Link href={`/practice/${c.conversationId}`} className="ml-auto text-accent hover:underline">
                    查看對話
                  </Link>
                </div>

                {c.type === "expression" ? (
                  <>
                    <p className="mt-2 text-muted">你說：{c.original}</p>
                    <p className="mt-1 font-medium">{c.suggestion}</p>
                    {c.explanation && (
                      <p className="mt-1 text-muted">{c.explanation}</p>
                    )}
                    {c.keyPhrases.length > 0 && (
                      <ul className="mt-2 space-y-0.5">
                        {c.keyPhrases.map((p, i) => (
                          <li key={i}>
                            <span className="font-medium text-accent">{p.phrase}</span>
                            <span className="text-muted">：{p.meaning}</span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </>
                ) : (
                  <>
                    <p className="mt-2">
                      <span className="text-red-600 line-through dark:text-red-400">{c.original}</span>
                      {" → "}
                      <span className="text-green-700 dark:text-green-400">{c.suggestion}</span>
                    </p>
                    {c.explanation && (
                      <p className="mt-1 text-muted">{c.explanation}</p>
                    )}
                    {c.correctedSentence && (
                      <p className="mt-1 text-muted">整句：{c.correctedSentence}</p>
                    )}
                  </>
                )}
              </li>
            ))}
          </ul>
        )}
      </main>
    </>
  );
}
