import { createSession, hashPassword, verifyPassword } from "@/lib/auth";
import { connectDB } from "@/lib/mongodb";
import { UserModel } from "@/models/User";

// 帳號不存在時也做一次雜湊比對，讓回應時間差不多，避免被用來探測哪些 Email 有註冊
const dummyHash = hashPassword("dummy-password");

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const email = typeof body?.email === "string" ? body.email.trim().toLowerCase() : "";
  const password = typeof body?.password === "string" ? body.password : "";

  if (!email || !password) {
    return Response.json({ error: "請輸入 Email 和密碼" }, { status: 400 });
  }

  await connectDB();
  const user = await UserModel.findOne({ email });
  const valid = await verifyPassword(password, user?.passwordHash ?? (await dummyHash));

  if (!user || !valid) {
    return Response.json({ error: "Email 或密碼錯誤" }, { status: 401 });
  }

  await createSession(user._id);
  return Response.json({ user: { email: user.email, name: user.name } });
}
