"use client";

import { useState } from "react";
import Link from "next/link";
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
    "w-full rounded-lg border border-neutral-300 bg-transparent px-3 py-2 outline-none focus:border-blue-500 dark:border-neutral-700";
  const otherHref = `${isSignup ? "/login" : "/signup"}${next ? `?next=${encodeURIComponent(next)}` : ""}`;

  return (
    <main className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center px-4 py-12">
      <h1 className="text-2xl font-bold">{isSignup ? "註冊帳號" : "登入"}</h1>
      <p className="mt-1 text-sm text-neutral-500">AI 英文家教</p>

      <form onSubmit={handleSubmit} className="mt-6 space-y-4">
        <label className="block text-sm">
          Email
          <input
            type="email"
            required
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className={`mt-1 ${inputClass}`}
          />
        </label>

        {isSignup && (
          <label className="block text-sm">
            暱稱
            <input
              required
              maxLength={50}
              autoComplete="nickname"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className={`mt-1 ${inputClass}`}
            />
          </label>
        )}

        <label className="block text-sm">
          密碼{isSignup && <span className="text-neutral-500">（至少 8 個字元）</span>}
          <input
            type="password"
            required
            minLength={isSignup ? 8 : undefined}
            maxLength={128}
            autoComplete={isSignup ? "new-password" : "current-password"}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className={`mt-1 ${inputClass}`}
          />
        </label>

        {error && (
          <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600 dark:bg-red-950 dark:text-red-300">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={submitting}
          className="w-full rounded-lg bg-blue-600 py-2 font-medium text-white disabled:opacity-50"
        >
          {submitting ? "處理中…" : isSignup ? "註冊" : "登入"}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-neutral-500">
        {isSignup ? "已經有帳號了？" : "還沒有帳號？"}
        <Link href={otherHref} className="ml-1 text-blue-600 hover:underline">
          {isSignup ? "登入" : "註冊"}
        </Link>
      </p>
    </main>
  );
}
