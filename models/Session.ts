import { Schema, deleteModel, model, models, type InferSchemaType } from "mongoose";

// 登入狀態：cookie 裡放隨機 token，資料庫只存 token 的 SHA-256 雜湊
const sessionSchema = new Schema(
  {
    tokenHash: { type: String, required: true, unique: true },
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    expiresAt: { type: Date, required: true },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

// 過期後由 MongoDB 自動刪除
sessionSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export type Session = InferSchemaType<typeof sessionSchema>;

// 開發時 hot reload 會重新執行此檔，先移除舊 model，確保修改過的 schema 會生效
if (models.Session) deleteModel("Session");
export const SessionModel = model<Session>("Session", sessionSchema);
