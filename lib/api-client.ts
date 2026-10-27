// 只允許站內相對路徑，避免 ?next= 被用來導到外部網站
export function safeNext(next: string | undefined | null) {
  return next && next.startsWith("/") && !next.startsWith("//") ? next : "/";
}

// 前端呼叫自家 API 用：統一處理錯誤訊息，401 時導向登入頁，沒設定 API key 時導向設定頁
export async function apiFetch<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, init);

  if (res.status === 401 && !url.startsWith("/api/auth/")) {
    const next = window.location.pathname + window.location.search;
    // 這裡不在 React 元件內，無法用 router；整頁導向也能清掉前端快取
    // eslint-disable-next-line @next/next/no-location-assign-relative-destination
    window.location.href = `/login?next=${encodeURIComponent(next)}`;
    throw new Error("請先登入");
  }

  const data = await res.json().catch(() => ({}));

  if (data.code === "NO_API_KEY") {
    const next = window.location.pathname + window.location.search;
    // eslint-disable-next-line @next/next/no-location-assign-relative-destination
    window.location.href = `/settings?next=${encodeURIComponent(next)}`;
    throw new Error(data.error);
  }

  if (!res.ok) throw new Error(data.error || "發生錯誤，請稍後再試");
  return data as T;
}

export function postJSON<T>(url: string, body?: unknown) {
  return apiFetch<T>(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
}
