import express from 'express';
import {
  getServer,
  createServer,
  generateInviteLink,
  createChannel,
  deleteServer,
  updateServer,
  deleteChannelCategory,
  updateChannelCategory,
  updateChannel,
  deleteChannel,
  processInviteCode,
  removeUser,
  getServerFromInviteCode,
} from '@controllers/servers.controller.js';
import {
  AuthRole,
  restrictAccess,
} from '@middleware/authorization.middleware.js';
import { ExtendedYup } from '@src/extendedYup.js';
import { validate } from '@middleware/validation.middleware.js';
import { patch, serverSchema } from '@src/validationSchema.js';

const router = express.Router();

router.get(
  '/:serverId',
  restrictAccess([AuthRole.ServerMember]),
  validate({
    params: {
      serverId: ExtendedYup.string().mongooseId().required(),
    },
  }),
  getServer,
);
router.delete(
  '/:serverId',
  restrictAccess([AuthRole.ServerOwner]),
  validate({
    params: {
      serverId: ExtendedYup.string().mongooseId().required(),
    },
  }),
  deleteServer,
);
router.patch(
  '/:serverId',
  restrictAccess([AuthRole.ServerOwner]),
  validate({
    params: {
      serverId: ExtendedYup.string().mongooseId().required(),
    },
    body: {
      patch: patch.required('PATCH data missing'),
    },
  }),
  updateServer,
);
router.get(
  '/:serverId/invites',
  restrictAccess([AuthRole.ServerMember]),
  validate({
    query: {
      expTime: ExtendedYup.number()
        .min(0, "expTime can't be a negative value")
        .required(),
    },
    params: {
      serverId: ExtendedYup.string().mongooseId().required(),
    },
  }),
  generateInviteLink,
);

router.post(
  '/invites',
  validate({
    body: {
      inviteCode: ExtendedYup.string().required(),
    },
  }),
  processInviteCode,
);

router.get(
  '/invites/:inviteCode/server',
  validate({
    params: {
      inviteCode: ExtendedYup.string().required(),
    },
  }),
  getServerFromInviteCode,
);

router.post(
  '/:serverId/channels',
  restrictAccess([AuthRole.ServerOwner]),
  validate({
    params: {
      serverId: ExtendedYup.string().mongooseId().required(),
    },
    body: {
      isNewCategory: ExtendedYup.boolean().required(),
      channelCategoryId: ExtendedYup.string().when('isNewCategory', {
        is: false,
        then: (schema) => schema.mongooseId().required(),
        otherwise: (schema) => schema.notRequired(),
      }),
      channelCategoryName: ExtendedYup.string().when('isNewCategory', {
        is: true,
        then: (schema) => schema.trim().required(),
        otherwise: (schema) => schema.notRequired(),
      }),
      channelName: ExtendedYup.string().trim().required(),
    },
  }),
  createChannel,
);
router.patch(
  '/:serverId/channelCategories/:categoryId',
  restrictAccess([AuthRole.ServerOwner]),
  validate({
    params: {
      serverId: ExtendedYup.string().mongooseId().required(),
      categoryId: ExtendedYup.string().mongooseId().required(),
    },
    files: {
      patch: ExtendedYup.mixed()
        .notArray('Single patch document expected')
        .oneOfMimeType(['application/json'], 'Unsupported patch file format')
        .notTruncated('Patch document too big')
        .required('Please provide a patch document'),
    },
  }),
  updateChannelCategory,
);

router.delete(
  '/:serverId/channelCategories/:categoryId',
  restrictAccess([AuthRole.ServerOwner]),
  validate({
    params: {
      serverId: ExtendedYup.string().mongooseId().required(),
      categoryId: ExtendedYup.string().mongooseId().required(),
    },
  }),
  deleteChannelCategory,
);

router.patch(
  '/:serverId/channels/:channelId',
  restrictAccess([AuthRole.ServerOwner]),
  validate({
    params: {
      serverId: ExtendedYup.string().mongooseId().required(),
      channelId: ExtendedYup.string().mongooseId().required(),
    },
    files: {
      patch: ExtendedYup.mixed()
        .notArray('Single patch document expected')
        .oneOfMimeType(['application/json'], 'Unsupported patch file format')
        .notTruncated('Patch document too big')
        .required('Please provide a patch document'),
    },
  }),
  updateChannel,
);
router.delete(
  '/:serverId/channels/:channelId',
  restrictAccess([AuthRole.ServerOwner]),
  validate({
    params: {
      serverId: ExtendedYup.string().mongooseId().required(),
      channelId: ExtendedYup.string().mongooseId().required(),
    },
  }),
  deleteChannel,
);
router.delete(
  '/:serverId/users/:userId',
  restrictAccess([AuthRole.ServerOwner, AuthRole.Self]),
  validate({
    params: {
      serverId: ExtendedYup.string().mongooseId().required(),
      userId: ExtendedYup.string().mongooseId().required(),
    },
  }),
  removeUser,
);
router.post(
  '/',
  validate({
    body: {
      serverName: serverSchema.name.required('Missing serverName property'),
      serverImg: serverSchema.serverImg.required('Missing serverImg property'),
    },
  }),
  createServer,
);

export default router;
