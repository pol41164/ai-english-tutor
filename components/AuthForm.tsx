"use client";

import { useState } from "react";
import Link from "next/link";
import Logo from "@/components/Logo";
import { postJSON, safeNext } from "@/lib/api-client";

export default function AuthForm({ mode, next }: { mode: "login" | "signup"; next?: string }) {
  const isSignup = mode === "signup";
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.SubmitEvent<HTMLFormElement>) {
    e.preventDefault();
    setSubmitting(true);
    setError("");
    try {
      await postJSON(`/api/auth/${mode}`, isSignup ? { email, name, password } : { email, password });
      // 新註冊的使用者先去設定 API key
      window.location.href = isSignup
        ? `/settings?welcome=1&next=${encodeURIComponent(safeNext(next))}`
        : safeNext(next);
    } catch (err) {
      setError(err instanceof Error ? err.message : "發生錯誤");
      setSubmitting(false);
    }
  }

  const inputClass =
    "mt-1.5 w-full rounded-xl border border-line bg-paper px-3.5 py-2.5 outline-none transition placeholder:text-muted/60 focus:border-accent focus:ring-4 focus:ring-accent/10";
  const otherHref = `${isSignup ? "/login" : "/signup"}${next ? `?next=${encodeURIComponent(next)}` : ""}`;

  return (
    <div className="grid flex-1 lg:grid-cols-2">
      {/* 左側：品牌與介紹（大螢幕才顯示） */}
      <aside className="relative hidden overflow-hidden bg-ink p-12 text-paper lg:flex lg:flex-col">
        <div className="paper-grain absolute inset-0 opacity-25" />
        <div className="relative">
          <Logo inverted />
        </div>
        <div className="relative mt-auto max-w-md">
          <p className="font-display text-4xl italic leading-tight">
            &ldquo;The best way to learn a language is to speak it.&rdquo;
          </p>
          <ul className="mt-10 space-y-3 text-sm opacity-80">
            <li>🎭　八種真實情境，AI 角色陪你對話</li>
            <li>✍️　每句話都能糾正文法，附中文解釋</li>
            <li>✨　學會母語者更道地的說法</li>
          </ul>
        </div>
      </aside>

      {/* 右側：表單 */}
      <main className="flex flex-col px-5 py-8 sm:px-10">
        <div className="flex items-center justify-between lg:justify-end">
          <span className="lg:hidden">
            <Logo />
          </span>
          <Link href="/" className="text-sm text-muted hover:text-ink">
            ← 回首頁
          </Link>
        </div>

        <div className="mx-auto my-auto w-full max-w-sm animate-rise py-12">
          <p className="font-display text-lg italic text-accent">{isSignup ? "Welcome aboard" : "Welcome back"}</p>
          <h1 className="mt-1 text-3xl font-bold tracking-tight">{isSignup ? "建立你的帳號" : "登入繼續練習"}</h1>
          <p className="mt-2 text-sm text-muted">
            {isSignup ? "30 秒完成註冊，馬上開始用英文對話。" : "歡迎回來，今天也來說幾句英文吧。"}
          </p>

          <form onSubmit={handleSubmit} className="mt-8 space-y-4">
            <label className="block text-sm font-medium">
              Email
              <input
                type="email"
                required
                autoComplete="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={inputClass}
              />
            </label>

            {isSignup && (
              <label className="block text-sm font-medium">
                暱稱
                <input
                  required
                  maxLength={50}
                  autoComplete="nickname"
                  placeholder="想要怎麼稱呼你？"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className={inputClass}
                />
              </label>
            )}

            <label className="block text-sm font-medium">
              密碼
              {isSignup && <span className="ml-1 font-normal text-muted">（至少 8 個字元）</span>}
              <input
                type="password"
                required
                minLength={isSignup ? 8 : undefined}
                maxLength={128}
                autoComplete={isSignup ? "new-password" : "current-password"}
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className={inputClass}
              />
            </label>

            {error && (
              <p className="animate-fade rounded-xl border border-red-200 bg-red-50 px-3.5 py-2.5 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/50 dark:text-red-300">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="w-full rounded-xl bg-ink py-3 font-semibold text-paper transition hover:opacity-90 disabled:opacity-50"
            >
              {submitting ? "處理中…" : isSignup ? "建立帳號" : "登入"}
            </button>
          </form>

          <p className="mt-8 text-center text-sm text-muted">
            {isSignup ? "已經有帳號了？" : "還沒有帳號？"}
            <Link href={otherHref} className="ml-1 font-medium text-accent hover:underline">
              {isSignup ? "登入" : "免費註冊"}
            </Link>
          </p>
        </div>
      </main>
    </div>
  );
}
