import { Suspense } from "react";
import AppHeader from "@/components/AppHeader";
import SettingsView from "./SettingsView";

// 讀取網址參數的部分需包在 Suspense 裡（next.config 開啟了 cacheComponents）
export default function SettingsPage({ searchParams }: PageProps<"/settings">) {
  return (
    <>
      <AppHeader />
      <Suspense fallback={<p className="py-12 text-center text-sm text-neutral-500">載入中…</p>}>
        <SettingsView searchParams={searchParams} />
      </Suspense>
    </>
  );
}
