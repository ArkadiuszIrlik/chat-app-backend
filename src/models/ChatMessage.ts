import mongoose, { Schema, Types } from 'mongoose';

export interface IChatMessage {
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

export default mongoose.model<IChatMessage>('ChatMessage', ChatMessageSchema);
