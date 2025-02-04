import express from 'express';
import {
  getServerFromInviteCode,
} from '@controllers/servers.controller.js';
import { ExtendedYup } from '@src/extendedYup.js';
import { validate } from '@middleware/validation.middleware.js';

const router = express.Router();


router.get(
  '/invites/:inviteCode/server',
  validate({
    params: {
      inviteCode: ExtendedYup.string().required(),
    },
  }),
  getServerFromInviteCode,
);
export default router;
