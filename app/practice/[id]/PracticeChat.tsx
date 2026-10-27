"use client";

import { use, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { apiFetch, postJSON } from "@/lib/api-client";
import type { BetterFeedback, GrammarFeedback } from "@/lib/feedback";
import MessageFeedback from "./MessageFeedback";

type Message = {
  id: string;
  role: "user" | "assistant";
  content: string;
};

type ScenarioInfo = { id: string; label: string; emoji: string } | null;

type SavedFeedback = Record<string, { grammar: GrammarFeedback | null; better: BetterFeedback | null }>;

export default function PracticeChat({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [scenario, setScenario] = useState<ScenarioInfo>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [feedback, setFeedback] = useState<SavedFeedback>({});
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    apiFetch<{ scenario: ScenarioInfo; messages: Message[]; feedback: SavedFeedback }>(
      `/api/conversations/${id}`
    )
      .then((data) => {
        setScenario(data.scenario);
        setMessages(data.messages);
        setFeedback(data.feedback);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [id]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, sending]);

  async function handleSubmit(e: React.SubmitEvent<HTMLFormElement>) {
    e.preventDefault();
    const content = input.trim();
    if (!content || sending) return;

    const tempId = `temp-${Date.now()}`;
    setMessages((prev) => [...prev, { id: tempId, role: "user", content }]);
    setInput("");
    setSending(true);
    setError("");

    try {
      const data = await postJSON<{ userMessage: Message; reply: Message }>(
        `/api/conversations/${id}/messages`,
        { content }
      );
      setMessages((prev) => [
        ...prev.filter((m) => m.id !== tempId),
        data.userMessage,
        data.reply,
      ]);
    } catch (err) {
      // 失敗時把訊息拿掉，放回輸入框讓使用者重送
      setMessages((prev) => prev.filter((m) => m.id !== tempId));
      setInput(content);
      setError(err instanceof Error ? err.message : "送出失敗");
    } finally {
      setSending(false);
    }
  }

  return (
    <main className="mx-auto flex h-dvh w-full max-w-2xl flex-col">
      <header className="flex items-center gap-3 border-b border-neutral-200 px-4 py-3 dark:border-neutral-800">
        <Link href="/" className="text-sm text-neutral-500 hover:text-foreground">
          ← 換場景
        </Link>
        <h1 className="font-semibold">
          {scenario ? `${scenario.emoji} ${scenario.label}` : "練習"}
        </h1>
        <Link href="/history" className="ml-auto text-sm text-neutral-500 hover:text-foreground">
          我的紀錄
        </Link>
      </header>

      <div className="flex-1 space-y-3 overflow-y-auto px-4 py-6">
        {loading && <p className="text-center text-sm text-neutral-500">載入中…</p>}

        {messages.map((m) => (
          <div
            key={m.id}
            className={`flex flex-col ${m.role === "user" ? "items-end" : "items-start"}`}
          >
            <div
              className={`max-w-[80%] whitespace-pre-wrap rounded-2xl px-4 py-2 ${
                m.role === "user"
                  ? "bg-blue-600 text-white"
                  : "bg-neutral-100 dark:bg-neutral-800"
              }`}
            >
              {m.content}
            </div>
            {m.role === "user" && !m.id.startsWith("temp-") && (
              <MessageFeedback
                conversationId={id}
                messageId={m.id}
                initialGrammar={feedback[m.id]?.grammar ?? null}
                initialBetter={feedback[m.id]?.better ?? null}
              />
            )}
          </div>
        ))}

        {sending && (
          <div className="flex justify-start">
            <div className="rounded-2xl bg-neutral-100 px-4 py-2 text-neutral-500 dark:bg-neutral-800">
              …
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {error && (
        <p className="mx-4 mb-2 rounded-lg bg-red-50 px-4 py-2 text-sm text-red-600 dark:bg-red-950 dark:text-red-300">
          {error}
        </p>
      )}

      <form onSubmit={handleSubmit} className="flex gap-2 border-t border-neutral-200 p-4 dark:border-neutral-800">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Type your reply in English…"
          maxLength={500}
          disabled={loading || !scenario}
          className="flex-1 rounded-full border border-neutral-300 bg-transparent px-4 py-2 outline-none focus:border-blue-500 dark:border-neutral-700"
        />
        <button
          type="submit"
          disabled={!input.trim() || sending || loading || !scenario}
          className="rounded-full bg-blue-600 px-5 py-2 font-medium text-white disabled:opacity-40"
        >
          送出
        </button>
      </form>
    </main>
  );
}
