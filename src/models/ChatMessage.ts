import mongoose, { Date, Schema, Types } from 'mongoose';

export interface IChatMessage extends mongoose.Document {
  postedAt: Date;
  authorId: Types.ObjectId;
  text: string;
  chatId: Types.ObjectId;
}

const ChatMessageSchema = new mongoose.Schema<IChatMessage>({
  postedAt: Date,
  authorId: { type: Schema.Types.ObjectId, ref: 'User' },
  text: String,
  chatId: Schema.Types.ObjectId,
});

export default mongoose.models.ChatMessage ||
  mongoose.model<IChatMessage>('ChatMessage', ChatMessageSchema);
