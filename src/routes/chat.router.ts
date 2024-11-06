import express from 'express';
import { getMessages } from '@controllers/chat.controller.js';

const router = express.Router();

router.get('/:chatId/messages', getMessages);

export default router;
