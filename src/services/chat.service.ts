import ChatMessage, { IChatMessage } from '@models/ChatMessage.js';
import { HydratedDocument, Types } from 'mongoose';
import { IUser } from '@models/User.js';

interface PopulatedAuthor {
  author: {
    _id: Types.ObjectId;
    username: IUser['username'];
    profileImg: IUser['profileImg'];
  };
}

function getMessageById(
  messageId: string,
  { populateAuthor = false }: { populateAuthor?: boolean } = {},
) {
  let query = ChatMessage.findOne({ _id: messageId });

  const populatedAuthorQuery = query.populate<PopulatedAuthor>(
    'author',
    'username profileImg',
  );
  let finalQuery: typeof query | typeof populatedAuthorQuery;

  if (populateAuthor) {
    finalQuery = populatedAuthorQuery;
  } else {
    finalQuery = query;
  }

  return finalQuery.exec();
}

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

async function getMessagesWithCursor(
  chatId: string,
  limit = 20,
  cursor: Date | null,
  { populateAuthor = false }: { populateAuthor?: boolean } = {},
) {
  let safeLimit = limit;
  if (limit < 1) {
    safeLimit = 20;
  }
  if (limit > 50) {
    safeLimit = 50;
  }
  const filter: Record<string, any> = { chatId };
  if (cursor) {
    filter.postedAt = { $lte: cursor };
  }

  let query = ChatMessage.find(filter)
    .sort({ postedAt: -1 })
    .limit(safeLimit + 1);
  if (populateAuthor) {
    query = query.populate('author', 'username profileImg');
  }
  const result = await query.exec();
  let previousCursor = null;
  if (result.length > safeLimit) {
    previousCursor = result[safeLimit].postedAt;
  }
  const messages = result.slice(0, safeLimit);

  return { messages, previousCursor };
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
  _id: Types.ObjectId;
  postedAt: Date;
  author: Types.ObjectId;
  text: string;
  chatId: Types.ObjectId;
  serverId?: Types.ObjectId;
}

const authorizedAuthProperties = [
  '_id',
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
  getMessageById,
  getMessages,
  getMessagesWithCursor,
  checkIfIsServerMessage,
  getMessageServerId,
  getClientSafeSubset,
  ChatMessageAuthLevel,
};
