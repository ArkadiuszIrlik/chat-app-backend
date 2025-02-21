import mongoose, { Schema, Types } from 'mongoose';

export interface IChatMessage {
  postedAt: Date;
  author: Types.ObjectId;
  text: string;
  chatId: Types.ObjectId;
  serverId?: Types.ObjectId;
  clientId: string;
}

const ChatMessageSchema = new mongoose.Schema<IChatMessage>({
  postedAt: { type: Date, required: true, default: Date.now },
  author: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  text: { type: String, required: true },
  chatId: { type: Schema.Types.ObjectId, required: true },
  serverId: { type: Schema.Types.ObjectId, ref: 'Server' },
  clientId: String,
});

export default mongoose.model<IChatMessage>('ChatMessage', ChatMessageSchema);
