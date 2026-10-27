"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import AppHeader from "@/components/AppHeader";
import { apiFetch, postJSON } from "@/lib/api-client";
import { SCENARIOS } from "@/lib/scenarios";

export default function Home() {
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
      <main className="mx-auto w-full max-w-3xl px-4 py-12">
        <h1 className="text-3xl font-bold">開始練習</h1>
        <p className="mt-2 text-neutral-500">選一個場景，開始用英文對話練習</p>

        {hasKey === false && (
          <div className="mt-6 flex flex-wrap items-center gap-3 rounded-xl bg-amber-50 p-4 text-sm text-amber-900 dark:bg-amber-950 dark:text-amber-100">
            <span>🔑 開始練習前，請先設定你的 OpenAI API key。</span>
            <Link
              href="/settings?next=/"
              className="rounded-lg bg-amber-600 px-3 py-1.5 font-medium text-white hover:bg-amber-700"
            >
              前往設定（含申請教學）
            </Link>
          </div>
        )}

        {error && (
          <p className="mt-6 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600 dark:bg-red-950 dark:text-red-300">
            {error}
          </p>
        )}

        <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-4">
          {SCENARIOS.map((s) => (
            <button
              key={s.id}
              onClick={() => startPractice(s.id)}
              disabled={loadingId !== null || hasKey === false}
              className="flex flex-col items-start rounded-xl border border-neutral-200 p-4 text-left transition hover:border-blue-500 hover:shadow-md disabled:cursor-not-allowed disabled:opacity-50 dark:border-neutral-800"
            >
              <span className="text-3xl">{s.emoji}</span>
              <span className="mt-2 font-semibold">
                {loadingId === s.id ? "準備中…" : s.label}
              </span>
              <span className="mt-1 text-xs text-neutral-500">{s.description}</span>
            </button>
          ))}
        </div>
      </main>
    </>
  );
}
