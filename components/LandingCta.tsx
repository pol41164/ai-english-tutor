"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

// landing page 的行動按鈕：已登入的人直接顯示「進入練習」
// 這裡用原生 fetch，未登入時不會被 apiFetch 導去登入頁
function useLoggedIn() {
  const [loggedIn, setLoggedIn] = useState(false);
  useEffect(() => {
    fetch("/api/auth/me")
      .then((res) => setLoggedIn(res.ok))
      .catch(() => {});
  }, []);
  return loggedIn;
}

export function HeroCta() {
  const loggedIn = useLoggedIn();
  return (
    <div className="flex flex-wrap items-center gap-3">
      {loggedIn ? (
        <PrimaryLink href="/practice">進入練習</PrimaryLink>
      ) : (
        <>
          <PrimaryLink href="/signup">免費註冊，開始練習</PrimaryLink>
          <Link
            href="/login"
            className="rounded-full px-5 py-3 text-sm font-medium text-ink underline-offset-4 hover:underline"
          >
            我已經有帳號
          </Link>
        </>
      )}
    </div>
  );
}

export function NavCta() {
  const loggedIn = useLoggedIn();
  if (loggedIn) {
    return (
      <Link
        href="/practice"
        className="rounded-full bg-ink px-4 py-2 text-sm font-medium text-paper transition hover:opacity-90"
      >
        進入練習
      </Link>
    );
  }
  return (
    <div className="flex items-center gap-1">
      <Link href="/login" className="rounded-full px-4 py-2 text-sm font-medium text-muted hover:text-ink">
        登入
      </Link>
      <Link
        href="/signup"
        className="rounded-full bg-ink px-4 py-2 text-sm font-medium text-paper transition hover:opacity-90"
      >
        免費註冊
      </Link>
    </div>
  );
}

function PrimaryLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      className="group inline-flex items-center gap-2 rounded-full bg-accent px-6 py-3 text-sm font-semibold text-accent-ink shadow-soft transition hover:bg-accent-strong hover:shadow-lift"
    >
      {children}
      <span aria-hidden className="transition-transform group-hover:translate-x-0.5">
        →
      </span>
    </Link>
  );
}
