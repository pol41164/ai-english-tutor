import { Schema, deleteModel, model, models, type InferSchemaType } from "mongoose";

const userSchema = new Schema(
  {
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    name: { type: String, required: true, trim: true },
    passwordHash: { type: String, required: true }, // scrypt 雜湊，格式為 salt:hash
    openaiKeyEncrypted: { type: String, default: null }, // 使用者自己的 OpenAI API key（加密後）
    openaiKeyHint: { type: String, default: null }, // 遮罩後的 key，給畫面顯示用
  },
  { timestamps: true }
);

export type User = InferSchemaType<typeof userSchema>;

// 開發時 hot reload 會重新執行此檔，先移除舊 model，確保修改過的 schema 會生效
if (models.User) deleteModel("User");
export const UserModel = model<User>("User", userSchema);
