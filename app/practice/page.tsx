"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import AppHeader from "@/components/AppHeader";
import { apiFetch, postJSON } from "@/lib/api-client";
import { SCENARIOS } from "@/lib/scenarios";

export default function ScenarioPicker() {
  const router = useRouter();
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [hasKey, setHasKey] = useState<boolean | null>(null);

  useEffect(() => {
    apiFetch<{ hasKey: boolean }>("/api/user/api-key")
      .then((data) => setHasKey(data.hasKey))
      .catch(() => {});
  }, []);

  async function startPractice(scenarioId: string) {
    setLoadingId(scenarioId);
    setError("");
    try {
      const data = await postJSON<{ conversationId: string }>("/api/conversations", {
        scenario: scenarioId,
      });
      router.push(`/practice/${data.conversationId}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "建立練習失敗");
      setLoadingId(null);
    }
  }

  return (
    <>
      <AppHeader />
      <main className="mx-auto w-full max-w-5xl px-5 py-12 sm:py-16">
        <div className="animate-rise">
          <p className="font-display text-lg italic text-accent">Let&rsquo;s practice</p>
          <h1 className="mt-1 text-3xl font-bold tracking-tight sm:text-4xl">今天想練習哪個情境？</h1>
          <p className="mt-3 text-muted">選一個場景，AI 會扮演對應的角色先開口，你只要用英文回應就好。</p>
        </div>

        {hasKey === false && (
          <div className="mt-8 flex flex-col gap-4 rounded-2xl border border-accent/30 bg-accent-soft p-5 sm:flex-row sm:items-center">
            <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-card text-xl">🔑</span>
            <div className="flex-1">
              <p className="font-semibold">還差一步：設定你的 OpenAI API key</p>
              <p className="mt-0.5 text-sm text-muted">設定完就能開始練習。不知道怎麼申請？設定頁有一步步的教學。</p>
            </div>
            <Link
              href="/settings?next=/practice"
              className="rounded-full bg-accent px-5 py-2.5 text-center text-sm font-semibold text-accent-ink transition hover:bg-accent-strong"
            >
              前往設定 →
            </Link>
          </div>
        )}

        {error && (
          <p className="mt-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/50 dark:text-red-300">
            {error}
          </p>
        )}

        <div className="mt-10 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {SCENARIOS.map((s, i) => {
            const isLoading = loadingId === s.id;
            return (
              <button
                key={s.id}
                onClick={() => startPractice(s.id)}
                disabled={loadingId !== null || hasKey === false}
                style={{ animationDelay: `${i * 40}ms` }}
                className="group relative flex animate-rise flex-col items-start rounded-2xl border border-line bg-card p-5 text-left shadow-soft transition hover:-translate-y-1 hover:border-line-strong hover:shadow-lift disabled:pointer-events-none disabled:opacity-50"
              >
                <span className="grid size-14 place-items-center rounded-2xl bg-subtle text-3xl transition group-hover:scale-105 group-hover:bg-accent-soft">
                  {s.emoji}
                </span>
                <span className="mt-5 text-lg font-semibold">{s.label}</span>
                <span className="mt-1 text-sm leading-relaxed text-muted">{s.description}</span>
                <span className="mt-auto inline-flex items-center gap-1.5 pt-5 text-sm font-medium text-accent">
                  {isLoading ? (
                    <>
                      <Spinner /> AI 正在準備開場…
                    </>
                  ) : (
                    <>
                      開始對話
                      <span aria-hidden className="transition-transform group-hover:translate-x-1">
                        →
                      </span>
                    </>
                  )}
                </span>
              </button>
            );
          })}
        </div>
      </main>
    </>
  );
}

function Spinner() {
  return (
    <span className="inline-block size-3.5 animate-spin rounded-full border-2 border-accent/30 border-t-accent" />
  );
}
