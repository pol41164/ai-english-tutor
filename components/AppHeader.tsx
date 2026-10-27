"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import Logo from "@/components/Logo";
import { apiFetch, postJSON } from "@/lib/api-client";

const NAV = [
  { href: "/practice", label: "開始練習" },
  { href: "/history", label: "我的紀錄" },
  { href: "/settings", label: "API 設定" },
];

export default function AppHeader() {
  const pathname = usePathname();
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
    <header className="sticky top-0 z-20 border-b border-line/70 bg-paper/80 backdrop-blur-md">
      <div className="mx-auto flex w-full max-w-5xl items-center gap-6 px-5 py-3">
        <Logo href="/practice" />

        <nav className="hidden items-center gap-1 sm:flex">
          {NAV.map((item) => {
            const active = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`rounded-full px-3.5 py-1.5 text-sm transition ${
                  active ? "bg-ink font-medium text-paper" : "text-muted hover:bg-subtle hover:text-ink"
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="ml-auto flex items-center gap-3">
          {name && (
            <span className="flex items-center gap-2 text-sm">
              <span className="grid size-8 place-items-center rounded-full bg-accent-soft font-semibold text-accent">
                {name.slice(0, 1).toUpperCase()}
              </span>
              <span className="hidden text-muted md:inline">{name}</span>
            </span>
          )}
          <button
            onClick={logout}
            className="rounded-full border border-line px-3.5 py-1.5 text-sm text-muted transition hover:border-line-strong hover:text-ink"
          >
            登出
          </button>
        </div>
      </div>

      {/* 手機版導覽 */}
      <nav className="flex gap-1 overflow-x-auto px-5 pb-2.5 sm:hidden">
        {NAV.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={`shrink-0 rounded-full px-3 py-1 text-sm ${
              pathname === item.href ? "bg-ink text-paper" : "text-muted"
            }`}
          >
            {item.label}
          </Link>
        ))}
      </nav>
    </header>
  );
}
