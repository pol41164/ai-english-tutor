import { Suspense } from "react";
import AuthForm from "@/components/AuthForm";

// 讀取網址參數的部分需包在 Suspense 裡（next.config 開啟了 cacheComponents）
export default function LoginPage({ searchParams }: PageProps<"/login">) {
  return (
    <Suspense>
      <LoginForm searchParams={searchParams} />
    </Suspense>
  );
}

async function LoginForm({ searchParams }: Pick<PageProps<"/login">, "searchParams">) {
  const { next } = await searchParams;
  return <AuthForm mode="login" next={typeof next === "string" ? next : undefined} />;
}
