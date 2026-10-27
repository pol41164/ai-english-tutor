import { Suspense } from "react";
import AuthForm from "@/components/AuthForm";

// 讀取網址參數的部分需包在 Suspense 裡（next.config 開啟了 cacheComponents）
export default function SignupPage({ searchParams }: PageProps<"/signup">) {
  return (
    <Suspense>
      <SignupForm searchParams={searchParams} />
    </Suspense>
  );
}

async function SignupForm({ searchParams }: Pick<PageProps<"/signup">, "searchParams">) {
  const { next } = await searchParams;
  return <AuthForm mode="signup" next={typeof next === "string" ? next : undefined} />;
}
