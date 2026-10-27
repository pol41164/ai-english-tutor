"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { apiFetch, postJSON } from "@/lib/api-client";

export default function AppHeader() {
  const [name, setName] = useState("");

  useEffect(() => {
    apiFetch<{ user: { name: string } }>("/api/auth/me")
      .then((data) => setName(data.user.name))
      .catch(() => {}); // 401 時 apiFetch 會自動導向登入頁
  }, []);

  async function logout() {
    await postJSON("/api/auth/logout").catch(() => {});
    // 整頁重新載入，清掉前端快取的登入後畫面
    // eslint-disable-next-line @next/next/no-location-assign-relative-destination
    window.location.href = "/login";
  }

  return (
    <header className="border-b border-neutral-200 dark:border-neutral-800">
      <div className="mx-auto flex w-full max-w-3xl items-center gap-4 px-4 py-3 text-sm">
        <Link href="/" className="font-bold">
          AI 英文家教
        </Link>
        <Link href="/history" className="text-neutral-600 hover:text-foreground dark:text-neutral-400">
          我的紀錄
        </Link>
        <Link href="/settings" className="text-neutral-600 hover:text-foreground dark:text-neutral-400">
          API 設定
        </Link>
        <div className="ml-auto flex items-center gap-3">
          {name && <span className="text-neutral-500">{name}</span>}
          <button onClick={logout} className="text-neutral-600 hover:text-foreground dark:text-neutral-400">
            登出
          </button>
        </div>
      </div>
    </header>
  );
}
