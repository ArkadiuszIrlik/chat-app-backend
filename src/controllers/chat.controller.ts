import { Request, Response } from 'express';
import * as usersService from '@services/users.service.js';
import * as chatService from '@services/chat.service.js';
import * as serversService from '@services/servers.service.js';
import * as socketService from '@services/socket.service.js';

export async function getMessages(req: Request, res: Response) {
  const chatId = req.params.chatId;
  // checked by validation middleware
  const limit = req.query.limit as number | undefined;
  const cursor = req.query.cursor as Date | undefined;

  const accessingUserId = req.decodedAuth?.userId;
  if (!accessingUserId) {
    return res.status(401).json({ message: 'Missing user credentials' });
  }

  const user = await usersService.getUser(accessingUserId);
  if (user === null) {
    return res.status(404).json({ message: 'User not found' });
  }

  const searchResult = await chatService.getMessagesWithCursor(
    chatId,
    limit,
    cursor ?? null,
    { populateAuthor: true },
  );
  const messages = searchResult.messages;

  // No messages found
  if (messages.length === 0) {
    return res.status(404).json({ message: 'Messages not found' });
  }

  const isServerMessage = chatService.checkIfIsServerMessage(messages[0]);
  if (!isServerMessage) {
    return res.status(404).json({ message: 'Invalid message format' });
  }
  // assert as not undefined because of the isServerMessage check
  const serverId = chatService.getMessageServerId(messages[0])!;

  const isUserInServer = await usersService.checkIfIsInServer(
    user,
    serverId.toString(),
  );

  if (!isUserInServer) {
    return res.status(403).json({ message: 'Unauthorized to access messages' });
  }

  const clientSafeMessages = messages.map((message) =>
    chatService.getClientSafeSubset(
      message,
      chatService.ChatMessageAuthLevel.Authorized,
    ),
  );

  return res.status(200).json({
    message: 'Messages returned',
    data: {
      messages: clientSafeMessages,
      previousCursor: searchResult.previousCursor,
    },
  });
}

export async function deleteMessage(req: Request, res: Response) {
  const chatId = req.params.chatId;
  const messageId = req.params.messageId;

  const accessingUserId = req.decodedAuth?.userId;
  if (!accessingUserId) {
    return res.status(401).json({ message: 'Missing user credentials' });
  }
  const userPromise = usersService.getUser(accessingUserId);

  const message = await chatService.getMessageById(messageId, {
    populateAuthor: true,
  });

  if (!message) {
    return res.status(204);
  }

  const user = await userPromise;
  if (user === null) {
    return res.status(404).json({ message: 'User not found' });
  }

  const isUserAuthor = chatService
    .getMessageAuthorId(message)
    .equals(usersService.getUserId(user));

  const isServerMessage = chatService.checkIfIsServerMessage(message);
  let server: Awaited<ReturnType<typeof serversService.getServer>> | null =
    null;

  if (isServerMessage) {
    // safe assertion because of check above
    const serverId = chatService.getMessageServerId(message)!;
    server = await serversService.getServer(serverId.toString());
  }

  const isUserServerOwner =
    server && serversService.getOwnerId(server).equals(accessingUserId);
  if (!isUserAuthor && isServerMessage && !isUserServerOwner) {
    return res.status(403).json({ message: 'Not allowed to delete message' });
  }

  if (!isServerMessage) {
    return res.status(500).json({ message: 'Invalid message format' });
  }
  if (!server) {
    return res.status(500).json({ message: 'Invalid data' });
  }
  // chatId is equal to channelId in server messages
  const channelSocketId = await serversService.getChannelSocketId(
    server,
    chatId,
  );
  if (!channelSocketId) {
    return res.status(500).json({ message: 'Invalid data' });
  }

  await chatService.deleteMessage(messageId);
  socketService.emitChatMessageDeleted(
    req.socketIo,
    message.toJSON({ getters: true }),
    chatId,
    channelSocketId,
  );

  return res.status(200).json({ message: 'Message deleted' });
}
