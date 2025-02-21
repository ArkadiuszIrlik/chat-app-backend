import mongoose from 'mongoose';

export interface IServerInvite {
  inviteCode: string;
  server: mongoose.Types.ObjectId;
  expDate: Date;
}

const ServerInviteSchema = new mongoose.Schema<IServerInvite>({
  inviteCode: { type: String, unique: true, required: true },
  server: { type: mongoose.Schema.Types.ObjectId, required: true },
  expDate: {
    type: Date,
    required: true,
    default: () => new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
  },
});

export default mongoose.model<IServerInvite>(
  'ServerInvite',
  ServerInviteSchema,
);
