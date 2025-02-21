import express from 'express';
import {
  approveAccountStatus,
  getUserFromAuth,
  updateUser,
} from '@controllers/users.controller.js';
import { validate } from '@middleware/validation.middleware.js';
import { ExtendedYup } from '@src/extendedYup.js';
import {
  AuthRole,
  restrictAccess,
} from '@middleware/authorization.middleware.js';
import { idParam, patch, userSchema } from '@src/validationSchema.js';

const router = express.Router();

router.get('/self', getUserFromAuth);
router.patch(
  '/:userId',
  restrictAccess([AuthRole.Self]),
  validate({
    params: {
      userId: ExtendedYup.string().mongooseId().required(),
    },
    body: {
      patch: patch.required('PATCH data missing'),
    },
  }),
  updateUser,
);

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
