import { Schema, deleteModel, model, models, type InferSchemaType } from "mongoose";

// 一則訊息：一場練習中的一句話
const messageSchema = new Schema(
  {
    role: {
      type: String,
      enum: ["user", "assistant", "system"],
      required: true,
    },
    content: { type: String, required: true },
    // 這則使用者訊息是否套用了先前的糾錯建議後重新送出
    usedCorrection: { type: Schema.Types.ObjectId, ref: "Correction", default: null },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

// 一場練習：包含完整對話紀錄
const conversationSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    title: { type: String, default: "" },
    topic: { type: String, default: "" }, // 例如「點餐」、「面試」
    level: {
      type: String,
      enum: ["beginner", "intermediate", "advanced"],
      default: "intermediate",
    },
    status: {
      type: String,
      enum: ["active", "completed", "abandoned"],
      default: "active",
    },
    messages: { type: [messageSchema], default: [] },
    startedAt: { type: Date, default: Date.now },
    endedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

conversationSchema.index({ userId: 1, updatedAt: -1 });

export type Message = InferSchemaType<typeof messageSchema>;
export type Conversation = InferSchemaType<typeof conversationSchema>;

// 開發時 hot reload 會重新執行此檔，先移除舊 model，確保修改過的 schema 會生效
if (models.Conversation) deleteModel("Conversation");
export const ConversationModel = model<Conversation>("Conversation", conversationSchema);
