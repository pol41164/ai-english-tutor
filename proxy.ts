import { NextResponse, type NextRequest } from "next/server";
import { SESSION_COOKIE } from "@/lib/session-cookie";

const PUBLIC_PAGES = ["/", "/login", "/signup"]; // "/" 是公開的 landing page

// 只做初步過濾：沒有 session cookie 就擋下。
// cookie 是否有效、資料是不是本人的，由每支 API 到資料庫驗證（見 lib/auth.ts）。
export function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
  const hasSession = request.cookies.has(SESSION_COOKIE);

  if (pathname.startsWith("/api/")) {
    if (hasSession || pathname.startsWith("/api/auth/")) return NextResponse.next();
    return NextResponse.json({ error: "請先登入" }, { status: 401 });
  }

  if (hasSession || PUBLIC_PAGES.includes(pathname)) return NextResponse.next();

  const loginUrl = new URL("/login", request.url);
  loginUrl.searchParams.set("next", pathname + search);
  return NextResponse.redirect(loginUrl);
}

export const config = {
  // 不處理靜態檔案
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.[a-zA-Z0-9]+$).*)"],
};
