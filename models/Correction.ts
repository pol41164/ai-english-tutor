import { Schema, deleteModel, model, models, type InferSchemaType } from "mongoose";

// 一筆糾錯／建議：針對某場練習中的某一則使用者訊息
const correctionSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    conversation: {
      type: Schema.Types.ObjectId,
      ref: "Conversation",
      required: true,
      index: true,
    },
    messageId: { type: Schema.Types.ObjectId, required: true }, // 被糾錯的訊息（Conversation.messages 裡的 _id）
    type: {
      type: String,
      enum: ["grammar", "vocabulary", "spelling", "expression", "fluency", "other"],
      default: "grammar",
    },
    original: { type: String, required: true }, // 原句或有問題的片段
    suggestion: { type: String, required: true }, // 建議的寫法
    explanation: { type: String, default: "" }, // 為什麼要這樣改
    correctedSentence: { type: String, default: "" }, // 文法糾錯：修正後的整句
    keyPhrases: {
      // 更好的回答：值得學的片語
      type: [{ phrase: String, meaning: String, _id: false }],
      default: [],
    },
    severity: {
      type: String,
      enum: ["minor", "moderate", "major"],
      default: "moderate",
    },
    // 使用者對這筆建議的處理
    status: {
      type: String,
      enum: ["pending", "applied", "dismissed"],
      default: "pending",
    },
    appliedAt: { type: Date, default: null },
    appliedMessageId: { type: Schema.Types.ObjectId, default: null }, // 套用後重新送出的那則訊息
  },
  { timestamps: true }
);

correctionSchema.index({ conversation: 1, status: 1 });
correctionSchema.index({ userId: 1, createdAt: -1 });

export type Correction = InferSchemaType<typeof correctionSchema>;

// 開發時 hot reload 會重新執行此檔，先移除舊 model，確保修改過的 schema 會生效
if (models.Correction) deleteModel("Correction");
export const CorrectionModel = model<Correction>("Correction", correctionSchema);
