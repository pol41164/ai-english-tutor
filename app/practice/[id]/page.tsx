import { Suspense } from "react";
import PracticeChat from "./PracticeChat";

// 讀取網址參數的部分需包在 Suspense 裡（next.config 開啟了 cacheComponents）
export default function PracticePage({ params }: PageProps<"/practice/[id]">) {
  return (
    <Suspense fallback={<p className="py-12 text-center text-sm text-neutral-500">載入中…</p>}>
      <PracticeChat params={params} />
    </Suspense>
  );
}
