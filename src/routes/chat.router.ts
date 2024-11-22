import express from 'express';
import { deleteMessage, getMessages } from '@controllers/chat.controller.js';
import { validate } from '@middleware/validation.middleware.js';
import { ExtendedYup } from '@src/extendedYup.js';

const router = express.Router();

router.get(
  '/:chatId/messages',
  validate({
    params: {
      chatId: ExtendedYup.string().mongooseId().required(),
    },
    query: {
      cursor: ExtendedYup.date(),
      limit: ExtendedYup.number()
        .min(1, "limit can't be lower than 1")
        .max(50, "limit can't be larger than 50"),
    },
  }),
  getMessages,
);

router.delete(
  '/:chatId/messages/:messageId',
  validate({
    params: {
      chatId: ExtendedYup.string().mongooseId().required(),
      messageId: ExtendedYup.string().mongooseId().required(),
    },
  }),
  deleteMessage,
);

export default router;
