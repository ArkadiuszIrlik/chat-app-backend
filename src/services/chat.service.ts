import ChatMessage, { IChatMessage } from '@models/ChatMessage.js';
import { HydratedDocument, Types } from 'mongoose';

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

enum ChatMessageAuthLevel {
  Authorized = 'AUTHORIZED',
}

interface ClientSafeIChatMessage {
  postedAt: Date;
  author: Types.ObjectId;
  text: string;
  chatId: Types.ObjectId;
  serverId?: Types.ObjectId;
}

const authorizedAuthProperties = [
  'postedAt',
  'author',
  'text',
  'chatId',
  'serverId',
] as const;

/** Returns plain object subset of the provided chatMessage document
 * with resolved getters. The subset of properties returned is
 * determined by the provided authLevel.
 *
 * @param chatMessage ChatMessage document to subset
 * @param authLevel authorization level, determines which properties
 * of the ChatMessage doc are considered safe to return
 * @returns plain object with resolved getters
 */
function getClientSafeSubset(
  chatMessage: HydratedDocument<IChatMessage>,
  authLevel: ChatMessageAuthLevel.Authorized,
): Pick<ClientSafeIChatMessage, (typeof authorizedAuthProperties)[number]>;
function getClientSafeSubset(
  chatMessage: HydratedDocument<IChatMessage>,
  authLevel: ChatMessageAuthLevel,
): ClientSafeIChatMessage {
  let safeProperties: (keyof ClientSafeIChatMessage)[] = [];
  switch (authLevel) {
    case ChatMessageAuthLevel.Authorized:
      {
        safeProperties = [...authorizedAuthProperties];
      }
      break;
    default: {
      safeProperties = [...authorizedAuthProperties];
    }
  }

  const plainObjectMessage = chatMessage.toObject({ getters: true });

  // type assertion is necessary since mongoose disregards
  // getter return types
  const clientSubset = Object.fromEntries(
    safeProperties
      .filter((key) => key in plainObjectMessage)
      .map((key) => [key, plainObjectMessage[key]]),
  ) as unknown as ClientSafeIChatMessage;

  return clientSubset;
}

export {
  getMessages,
  checkIfIsServerMessage,
  getMessageServerId,
  getClientSafeSubset,
  ChatMessageAuthLevel,
};
