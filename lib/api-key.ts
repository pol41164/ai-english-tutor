import { createCipheriv, createDecipheriv, createHash, randomBytes } from "node:crypto";
import type { Types } from "mongoose";
import { UserModel } from "@/models/User";

// 使用者的 OpenAI API key 以 AES-256-GCM 加密後才存進資料庫，前端永遠拿不到完整的 key

function getEncryptionKey() {
  const secret = process.env.API_KEY_ENCRYPTION_SECRET;
  if (!secret) throw new Error("請在 .env.local 設定 API_KEY_ENCRYPTION_SECRET");
  return createHash("sha256").update(secret).digest();
}

export function encryptSecret(plain: string) {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", getEncryptionKey(), iv);
  const encrypted = Buffer.concat([cipher.update(plain, "utf8"), cipher.final()]);
  return [iv, cipher.getAuthTag(), encrypted].map((b) => b.toString("base64")).join(".");
}

export function decryptSecret(payload: string) {
  const [iv, tag, encrypted] = payload.split(".").map((s) => Buffer.from(s, "base64"));
  const decipher = createDecipheriv("aes-256-gcm", getEncryptionKey(), iv);
  decipher.setAuthTag(tag);
  return Buffer.concat([decipher.update(encrypted), decipher.final()]).toString("utf8");
}

// 只顯示頭尾，例如 sk-proj-…a1b2
export function maskApiKey(apiKey: string) {
  return `${apiKey.slice(0, 8)}…${apiKey.slice(-4)}`;
}

// API 用：取出使用者的 key，沒設定時回傳可直接 return 的錯誤 Response
export async function requireApiKey(
  userId: Types.ObjectId
): Promise<{ apiKey: string; error?: never } | { apiKey?: never; error: Response }> {
  const noKey = Response.json(
    { error: "請先設定你的 OpenAI API key", code: "NO_API_KEY" },
    { status: 400 }
  );

  const user = await UserModel.findById(userId).select("openaiKeyEncrypted").lean();
  if (!user?.openaiKeyEncrypted) return { error: noKey };

  try {
    return { apiKey: decryptSecret(user.openaiKeyEncrypted) };
  } catch {
    // 加密金鑰被換掉等情況，請使用者重新設定
    return { error: noKey };
  }
}
