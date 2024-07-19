import { Request, Response } from 'express';
import * as usersService from '@services/users.service.js';
import * as chatService from '@services/chat.service.js';

export async function getMessages(req: Request, res: Response) {
  const chatId = req.params.chatId;

  const accessingUserId = req.decodedAuth?.userId;
  if (!accessingUserId) {
    return res.status(401).json({ message: 'Missing user credentials' });
  }

  const user = await usersService.getUser(accessingUserId);
  if (user === null) {
    return res.status(404).json({ message: 'User not found' });
  }

  const messages = await chatService.getMessages(chatId, {
    populateAuthor: true,
  });

  // No messages found
  if (messages.length === 0) {
    return res.status(404).json({ message: 'Messages not found' });
  }

  const isServerMessage = chatService.checkIfIsServerMessage(messages[0]);
  if (isServerMessage) {
    // assert as not undefined because of the isServerMessage check
    const serverId = chatService.getMessageServerId(messages[0])!;

    const isUserInServer = await usersService.checkIfIsInServer(
      user,
      serverId.toString(),
    );

    if (!isUserInServer) {
      return res
        .status(403)
        .json({ message: 'Unauthorized to access messages' });
    }

    return res
      .status(200)
      .json({ message: 'Messages returned', data: { messages } });
  } else {
    return res.status(404).json({ message: 'Invalid message format' });
  }
}
