import ChatMessage, { IChatMessage } from '@models/ChatMessage.js';
import { HydratedDocument } from 'mongoose';

function getMessages(
  chatId: string,
  { populateAuthor = false }: { populateAuthor?: boolean } = {},
) {
  if (populateAuthor) {
    return ChatMessage.find({ chatId })
      .sort({ postedAt: -1 })
      .limit(20)
      .populate('author', 'username profileImg')
      .exec();
  } else {
    return ChatMessage.find({ chatId }).sort({ postedAt: -1 }).limit(20).exec();
  }
}

function checkIfIsServerMessage(message: HydratedDocument<IChatMessage>) {
  const isServerMessage = !!message.serverId;

  return isServerMessage;
}

function getMessageServerId(message: HydratedDocument<IChatMessage>) {
  return message.serverId;
}

export { getMessages, checkIfIsServerMessage, getMessageServerId };
