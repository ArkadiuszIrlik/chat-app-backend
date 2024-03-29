import ChatMessage from '@models/ChatMessage.js';
import { NextFunction, Request, Response } from 'express';

export async function getMessages(
  req: Request,
  res: Response,
  _next: NextFunction,
) {
  const chatId = req.params.chatId;
  const messages = await ChatMessage.find({ chatId })
    .sort({ postedAt: -1 })
    .limit(20);
  return res.json(messages);
}
