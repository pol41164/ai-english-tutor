import { createSession, hashPassword } from "@/lib/auth";
import { connectDB } from "@/lib/mongodb";
import { UserModel } from "@/models/User";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const email = typeof body?.email === "string" ? body.email.trim().toLowerCase() : "";
  const name = typeof body?.name === "string" ? body.name.trim() : "";
  const password = typeof body?.password === "string" ? body.password : "";

  if (!EMAIL_RE.test(email)) {
    return Response.json({ error: "請輸入有效的 Email" }, { status: 400 });
  }
  if (!name || name.length > 50) {
    return Response.json({ error: "請輸入暱稱（50 字以內）" }, { status: 400 });
  }
  if (password.length < 8 || password.length > 128) {
    return Response.json({ error: "密碼長度需為 8–128 個字元" }, { status: 400 });
  }

  await connectDB();
  if (await UserModel.exists({ email })) {
    return Response.json({ error: "這個 Email 已經註冊過了" }, { status: 409 });
  }

  let user;
  try {
    user = await UserModel.create({ email, name, passwordHash: await hashPassword(password) });
  } catch (err) {
    // 兩個請求同時註冊同一個 Email 時，由 unique index 擋下
    if ((err as { code?: number }).code === 11000) {
      return Response.json({ error: "這個 Email 已經註冊過了" }, { status: 409 });
    }
    throw err;
  }
  await createSession(user._id);

  return Response.json({ user: { email: user.email, name: user.name } }, { status: 201 });
}
