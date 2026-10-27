import { encryptSecret, maskApiKey } from "@/lib/api-key";
import { requireUser } from "@/lib/auth";
import { openAIErrorResponse, verifyApiKey } from "@/lib/openai";
import { UserModel } from "@/models/User";

// 查詢是否已設定（只回傳遮罩後的 key）
export async function GET() {
  const { user, error } = await requireUser();
  if (error) return error;

  const doc = await UserModel.findById(user._id).select("openaiKeyHint").lean();
  return Response.json({ hasKey: Boolean(doc?.openaiKeyHint), hint: doc?.openaiKeyHint ?? null });
}

// 設定或更新：先向 OpenAI 驗證 key 有效，再加密存起來
export async function PUT(request: Request) {
  const { user, error } = await requireUser();
  if (error) return error;

  const body = await request.json().catch(() => null);
  const apiKey = typeof body?.apiKey === "string" ? body.apiKey.trim() : "";
  if (!/^sk-[A-Za-z0-9_-]{20,}$/.test(apiKey)) {
    return Response.json(
      { error: "格式不正確：OpenAI API key 應該以 sk- 開頭" },
      { status: 400 }
    );
  }

  try {
    if (!(await verifyApiKey(apiKey))) {
      return Response.json(
        { error: "這組 API key 無效，請確認有完整複製，或到 OpenAI 重新產生一組" },
        { status: 400 }
      );
    }
  } catch (err) {
    return openAIErrorResponse(err, "目前無法向 OpenAI 驗證這組 key，請稍後再試");
  }

  const hint = maskApiKey(apiKey);
  await UserModel.updateOne(
    { _id: user._id },
    { openaiKeyEncrypted: encryptSecret(apiKey), openaiKeyHint: hint }
  );
  return Response.json({ hasKey: true, hint });
}

// 刪除已存的 key
export async function DELETE() {
  const { user, error } = await requireUser();
  if (error) return error;

  await UserModel.updateOne({ _id: user._id }, { openaiKeyEncrypted: null, openaiKeyHint: null });
  return Response.json({ hasKey: false, hint: null });
}
