import express from 'express';
import {
  approveAccountStatus,
  getUserFromAuth,
} from '@controllers/users.controller.js';
import { validate } from '@middleware/validation.middleware.js';
import {
  AuthRole,
  restrictAccess,
} from '@middleware/authorization.middleware.js';
import { idParam, userSchema } from '@src/validationSchema.js';

const router = express.Router();

router.get('/self', getUserFromAuth);

router.post(
  '/:userId/account-status',
  restrictAccess([AuthRole.Self]),
  validate({
    params: {
      userId: idParam.required('Missing user id'),
    },
    body: {
      username: userSchema.username.required('Missing username'),
      profileImg: userSchema.profileImg.required('Missing profile image'),
    },
  }),
  approveAccountStatus,
);

export default router;
