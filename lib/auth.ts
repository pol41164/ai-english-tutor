import { cookies } from "next/headers";
import { createHash, randomBytes, scrypt, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";
import type { Types } from "mongoose";
import { connectDB } from "@/lib/mongodb";
import { SESSION_COOKIE } from "@/lib/session-cookie";
import { SessionModel } from "@/models/Session";
import { UserModel } from "@/models/User";

const SESSION_DAYS = 30;
const scryptAsync = promisify(scrypt) as (
  password: string,
  salt: string,
  keylen: number
) => Promise<Buffer>;

export type CurrentUser = {
  _id: Types.ObjectId;
  email: string;
  name: string;
};

export async function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const key = await scryptAsync(password, salt, 64);
  return `${salt}:${key.toString("hex")}`;
}

export async function verifyPassword(password: string, stored: string) {
  const [salt, hash] = stored.split(":");
  if (!salt || !hash) return false;
  const key = await scryptAsync(password, salt, 64);
  const expected = Buffer.from(hash, "hex");
  return key.length === expected.length && timingSafeEqual(key, expected);
}

function hashToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

// 登入成功後呼叫：建立 session 並設定 cookie
export async function createSession(userId: Types.ObjectId) {
  const token = randomBytes(32).toString("base64url");
  const expiresAt = new Date(Date.now() + SESSION_DAYS * 24 * 60 * 60 * 1000);

  await connectDB();
  await SessionModel.create({ tokenHash: hashToken(token), userId, expiresAt });

  (await cookies()).set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    expires: expiresAt,
  });
}

export async function destroySession() {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  if (token) {
    await connectDB();
    await SessionModel.deleteOne({ tokenHash: hashToken(token) });
  }
  cookieStore.delete(SESSION_COOKIE);
}

// 從 cookie 找出目前登入的使用者，每次都到資料庫驗證
export async function getCurrentUser(): Promise<CurrentUser | null> {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!token) return null;

  await connectDB();
  const session = await SessionModel.findOne({
    tokenHash: hashToken(token),
    expiresAt: { $gt: new Date() },
  }).lean();
  if (!session) return null;

  const user = await UserModel.findById(session.userId).select("email name").lean();
  return user ? { _id: user._id, email: user.email, name: user.name } : null;
}

// API 用：沒登入時回傳 401 Response
export async function requireUser(): Promise<
  { user: CurrentUser; error?: never } | { user?: never; error: Response }
> {
  const user = await getCurrentUser();
  if (!user) {
    return { error: Response.json({ error: "請先登入" }, { status: 401 }) };
  }
  return { user };
}
