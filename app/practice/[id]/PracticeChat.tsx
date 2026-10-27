"use client";

import { use, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { apiFetch, postJSON } from "@/lib/api-client";
import type { BetterFeedback, GrammarFeedback } from "@/lib/feedback";
import { getScenario } from "@/lib/scenarios";
import MessageFeedback from "./MessageFeedback";

type Message = {
  id: string;
  role: "user" | "assistant";
  content: string;
};

type ScenarioInfo = { id: string; label: string; emoji: string } | null;

type SavedFeedback = Record<string, { grammar: GrammarFeedback | null; better: BetterFeedback | null }>;

const MAX_LENGTH = 500;

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
  const formRef = useRef<HTMLFormElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

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

  // 輸入框依內容自動長高
  useEffect(() => {
    const el = inputRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 160)}px`;
  }, [input]);

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
      inputRef.current?.focus();
    }
  }

  // Enter 送出、Shift+Enter 換行；中文輸入法選字時的 Enter 不送出
  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
      e.preventDefault();
      formRef.current?.requestSubmit();
    }
  }

  const detail = scenario ? getScenario(scenario.id) : undefined;
  const canType = !loading && Boolean(scenario);

  return (
    <div className="flex h-dvh flex-col bg-paper">
      {/* 頂部列 */}
      <header className="z-10 border-b border-line/70 bg-paper/85 backdrop-blur-md">
        <div className="mx-auto flex w-full max-w-3xl items-center gap-3 px-4 py-3">
          <Link
            href="/practice"
            aria-label="換場景"
            className="grid size-9 place-items-center rounded-full text-muted transition hover:bg-subtle hover:text-ink"
          >
            ←
          </Link>
          <span className="grid size-10 place-items-center rounded-full bg-subtle text-xl">
            {scenario?.emoji ?? "💬"}
          </span>
          <div className="min-w-0">
            <h1 className="truncate font-semibold leading-tight">{scenario?.label ?? "練習"}</h1>
            <p className="truncate text-xs text-muted">{detail?.description ?? "英文情境對話"}</p>
          </div>
          <Link
            href="/history"
            className="ml-auto shrink-0 whitespace-nowrap rounded-full border border-line px-3.5 py-1.5 text-sm text-muted transition hover:border-line-strong hover:text-ink"
          >
            我的紀錄
          </Link>
        </div>
      </header>

      {/* 對話內容 */}
      <div className="flex-1 overflow-y-auto">
        <div className="mx-auto w-full max-w-3xl space-y-6 px-4 py-8">
          {detail && (
            <div className="mx-auto max-w-md animate-fade rounded-2xl border border-dashed border-line-strong px-5 py-4 text-center text-sm text-muted">
              <p className="font-display text-base italic text-ink">Scene · {detail.label}</p>
              <p className="mt-1">{detail.description}。AI 會維持角色跟你對話，試著用英文自然回應吧！</p>
            </div>
          )}

          {loading && (
            <div className="space-y-4">
              <div className="h-14 w-2/3 animate-pulse rounded-2xl bg-subtle" />
              <div className="ml-auto h-10 w-1/2 animate-pulse rounded-2xl bg-subtle" />
            </div>
          )}

          {messages.map((m) =>
            m.role === "assistant" ? (
              <div key={m.id} className="flex animate-rise items-end gap-2.5">
                <span className="grid size-8 shrink-0 place-items-center rounded-full border border-line bg-card text-base shadow-soft">
                  {scenario?.emoji ?? "🤖"}
                </span>
                <div className="max-w-[80%] whitespace-pre-wrap rounded-2xl rounded-bl-md border border-line bg-card px-4 py-3 leading-relaxed shadow-soft">
                  {m.content}
                </div>
              </div>
            ) : (
              <div key={m.id} className="flex animate-rise flex-col items-end">
                <div
                  className={`max-w-[80%] whitespace-pre-wrap rounded-2xl rounded-br-md bg-ink px-4 py-3 leading-relaxed text-paper shadow-soft ${
                    m.id.startsWith("temp-") ? "opacity-70" : ""
                  }`}
                >
                  {m.content}
                </div>
                {!m.id.startsWith("temp-") && (
                  <MessageFeedback
                    conversationId={id}
                    messageId={m.id}
                    initialGrammar={feedback[m.id]?.grammar ?? null}
                    initialBetter={feedback[m.id]?.better ?? null}
                  />
                )}
              </div>
            )
          )}

          {sending && (
            <div className="flex animate-fade items-end gap-2.5">
              <span className="grid size-8 shrink-0 place-items-center rounded-full border border-line bg-card text-base">
                {scenario?.emoji ?? "🤖"}
              </span>
              <div className="flex items-center gap-1 rounded-2xl rounded-bl-md border border-line bg-card px-4 py-4">
                <span className="typing-dot size-1.5 rounded-full bg-muted" />
                <span className="typing-dot size-1.5 rounded-full bg-muted" />
                <span className="typing-dot size-1.5 rounded-full bg-muted" />
              </div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>
      </div>

      {/* 輸入區 */}
      <div className="border-t border-line/70 bg-paper/90 backdrop-blur-md">
        <div className="mx-auto w-full max-w-3xl px-4 pb-4 pt-3">
          {error && (
            <p className="mb-3 animate-fade rounded-xl border border-red-200 bg-red-50 px-4 py-2.5 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/50 dark:text-red-300">
              {error}
            </p>
          )}

          <form
            ref={formRef}
            onSubmit={handleSubmit}
            className="flex items-end gap-2 rounded-3xl border border-line bg-card p-2 pl-4 shadow-soft transition focus-within:border-line-strong focus-within:shadow-lift"
          >
            <textarea
              ref={inputRef}
              rows={1}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={canType ? "Type your reply in English…" : "載入中…"}
              maxLength={MAX_LENGTH}
              disabled={!canType}
              className="max-h-40 flex-1 resize-none bg-transparent py-2 leading-relaxed outline-none placeholder:text-muted/70"
            />
            <button
              type="submit"
              aria-label="送出"
              disabled={!input.trim() || sending || !canType}
              className="grid size-10 shrink-0 place-items-center rounded-full bg-accent text-accent-ink transition hover:bg-accent-strong disabled:bg-line disabled:text-muted"
            >
              <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 19V5M5 12l7-7 7 7" />
              </svg>
            </button>
          </form>

          <div className="mt-2 flex justify-between px-2 text-xs text-muted">
            <span>Enter 送出 · Shift + Enter 換行</span>
            <span className={input.length > MAX_LENGTH * 0.9 ? "text-accent" : ""}>
              {input.length}/{MAX_LENGTH}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
