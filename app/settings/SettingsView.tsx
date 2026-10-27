"use client";

import { use, useEffect, useState } from "react";
import { apiFetch, safeNext } from "@/lib/api-client";

type KeyStatus = { hasKey: boolean; hint: string | null };

export default function SettingsView({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = use(searchParams);
  const welcome = params.welcome === "1";
  const next = typeof params.next === "string" ? params.next : null;

  const [status, setStatus] = useState<KeyStatus | null>(null);
  const [apiKey, setApiKey] = useState("");
  const [showKey, setShowKey] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    apiFetch<KeyStatus>("/api/user/api-key")
      .then(setStatus)
      .catch((err) => setError(err.message));
  }, []);

  async function handleSave(e: React.SubmitEvent<HTMLFormElement>) {
    e.preventDefault();
    setSaving(true);
    setError("");
    setMessage("");
    try {
      const data = await apiFetch<KeyStatus>("/api/user/api-key", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ apiKey }),
      });
      setStatus(data);
      setApiKey("");
      if (next) {
        window.location.href = safeNext(next);
        return;
      }
      setMessage("已儲存，可以開始練習了！");
    } catch (err) {
      setError(err instanceof Error ? err.message : "儲存失敗");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!confirm("確定要刪除已儲存的 API key 嗎？刪除後就無法練習，直到重新設定。")) return;
    setError("");
    setMessage("");
    try {
      setStatus(await apiFetch<KeyStatus>("/api/user/api-key", { method: "DELETE" }));
      setMessage("已刪除");
    } catch (err) {
      setError(err instanceof Error ? err.message : "刪除失敗");
    }
  }

  return (
    <main className="mx-auto w-full max-w-2xl px-4 py-8">
      {welcome && (
        <div className="mb-6 rounded-xl bg-accent-soft p-4 text-sm text-ink">
          🎉 註冊完成！最後一步：設定你自己的 OpenAI API key，AI 家教就是透過它跟你對話的。
          還沒有的話，照著下方的教學申請即可。
        </div>
      )}
      {!welcome && next && status && !status.hasKey && (
        <div className="mb-6 rounded-xl bg-amber-50 p-4 text-sm text-amber-900 dark:bg-amber-950 dark:text-amber-100">
          需要先設定 OpenAI API key 才能開始練習。
        </div>
      )}

      <h1 className="text-3xl font-bold tracking-tight">API 設定</h1>
      <p className="mt-1 text-sm text-muted">
        AI 家教使用你自己的 OpenAI API key，費用由你的 OpenAI 帳戶支付。
      </p>

      <section className="mt-6 rounded-2xl border border-line bg-card shadow-soft p-5">
        <h2 className="font-semibold">OpenAI API key</h2>
        <p className="mt-2 text-sm">
          目前狀態：
          {!status ? (
            <span className="text-muted">讀取中…</span>
          ) : status.hasKey ? (
            <>
              <span className="text-green-700 dark:text-green-400">已設定</span>
              <code className="ml-2 rounded bg-subtle px-1.5 py-0.5 text-xs">
                {status.hint}
              </code>
            </>
          ) : (
            <span className="text-amber-700 dark:text-amber-400">尚未設定</span>
          )}
        </p>

        <form onSubmit={handleSave} className="mt-4 space-y-3">
          <label className="block text-sm">
            {status?.hasKey ? "更換成新的 key" : "貼上你的 key"}
            <div className="mt-1 flex gap-2">
              <input
                type={showKey ? "text" : "password"}
                required
                autoComplete="off"
                spellCheck={false}
                placeholder="sk-..."
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                className="flex-1 rounded-lg border border-line bg-transparent px-3 py-2 font-mono text-sm outline-none focus:border-accent focus:ring-4 focus:ring-accent/10"
              />
              <button
                type="button"
                onClick={() => setShowKey((v) => !v)}
                className="rounded-lg border border-line px-3 text-sm text-muted"
              >
                {showKey ? "隱藏" : "顯示"}
              </button>
            </div>
          </label>

          {error && (
            <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600 dark:bg-red-950 dark:text-red-300">
              {error}
            </p>
          )}
          {message && (
            <p className="rounded-lg bg-green-50 px-3 py-2 text-sm text-green-700 dark:bg-green-950 dark:text-green-300">
              {message}
            </p>
          )}

          <div className="flex items-center gap-3">
            <button
              type="submit"
              disabled={saving || !apiKey.trim()}
              className="rounded-lg bg-accent text-accent-ink px-4 py-2 text-sm font-medium disabled:opacity-50"
            >
              {saving ? "驗證中…" : "驗證並儲存"}
            </button>
            {status?.hasKey && (
              <button
                type="button"
                onClick={handleDelete}
                className="text-sm text-red-600 hover:underline"
              >
                刪除已存的 key
              </button>
            )}
          </div>
        </form>

        <p className="mt-4 text-xs text-muted">
          🔒 儲存前會先向 OpenAI 確認這組 key 有效。key 會加密後存放，畫面上只會顯示頭尾幾個字，不會再完整顯示。
        </p>
      </section>

      <ApiKeyGuide defaultOpen={status !== null && !status.hasKey} />
    </main>
  );
}

const linkClass = "text-accent underline underline-offset-2 hover:text-accent";

function ApiKeyGuide({ defaultOpen }: { defaultOpen: boolean }) {
  return (
    <details
      key={String(defaultOpen)} // 讀到狀態後，沒設定過 key 的人預設展開
      open={defaultOpen}
      className="mt-6 rounded-2xl border border-line bg-card shadow-soft p-5"
    >
      <summary className="cursor-pointer font-semibold">📖 不知道怎麼申請？跟著這 4 步做</summary>

      <ol className="mt-4 space-y-5 text-sm leading-relaxed">
        <li>
          <h3 className="font-semibold">1. 註冊或登入 OpenAI 開發者平台</h3>
          <p className="mt-1 text-muted">
            前往{" "}
            <a href="https://platform.openai.com/signup" target="_blank" rel="noreferrer" className={linkClass}>
              platform.openai.com
            </a>
            ，可以直接用 ChatGPT 的帳號登入。
          </p>
          <p className="mt-1 text-muted">
            ⚠️ 注意：ChatGPT Plus 的月費<strong>不包含</strong> API 額度，兩者是分開計費的。
          </p>
        </li>

        <li>
          <h3 className="font-semibold">2. 儲值（加入付款方式）</h3>
          <p className="mt-1 text-muted">
            到{" "}
            <a
              href="https://platform.openai.com/settings/organization/billing/overview"
              target="_blank"
              rel="noreferrer"
              className={linkClass}
            >
              Billing 頁面
            </a>
            ，點「Add payment details」綁定信用卡，再用「Add to credit balance」儲值，最低 US$5 起。
          </p>
          <p className="mt-1 text-muted">
            💡 練習用的模型很便宜，一場對話通常花不到新台幣 1 元，US$5 可以練很久。
            建議關閉自動儲值（Auto recharge），用多少儲多少比較安心。
          </p>
        </li>

        <li>
          <h3 className="font-semibold">3. 建立 API key</h3>
          <p className="mt-1 text-muted">
            到{" "}
            <a href="https://platform.openai.com/api-keys" target="_blank" rel="noreferrer" className={linkClass}>
              API keys 頁面
            </a>
            ，點右上角「Create new secret key」，名稱可以取「AI English Tutor」，其他維持預設，按「Create secret key」。
          </p>
          <p className="mt-1 text-muted">
            ⚠️ 產生的 key（以 <code className="rounded bg-subtle px-1">sk-</code>{" "}
            開頭的一長串字）<strong>只會顯示這一次</strong>，請馬上按複製。如果不小心關掉了，刪掉再建一組新的就好。
          </p>
        </li>

        <li>
          <h3 className="font-semibold">4. 貼到上方欄位，按「驗證並儲存」</h3>
          <p className="mt-1 text-muted">驗證通過就完成了，回到首頁選個場景開始練習吧！</p>
        </li>
      </ol>

      <div className="mt-6 rounded-lg bg-subtle p-4 text-sm text-muted">
        <p className="font-semibold text-foreground">安全小提醒</p>
        <ul className="mt-2 list-disc space-y-1 pl-5">
          <li>API key 就像密碼，不要貼給別人或放到公開的地方。</li>
          <li>
            可以在{" "}
            <a href="https://platform.openai.com/settings/organization/limits" target="_blank" rel="noreferrer" className={linkClass}>
              Limits 頁面
            </a>{" "}
            設定每月用量上限，避免意外花費。
          </li>
          <li>如果懷疑 key 外洩，到 API keys 頁面把它刪除，再建一組新的貼到這裡即可。</li>
          <li>OpenAI 網站的介面偶爾會改版，按鈕名稱可能略有不同。</li>
        </ul>
      </div>
    </details>
  );
}
