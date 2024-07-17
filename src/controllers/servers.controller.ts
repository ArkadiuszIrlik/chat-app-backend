import { IServer } from '@models/Server.js';
import { NextFunction, Request, Response } from 'express';
import { HydratedDocument } from 'mongoose';
import * as serversService from '@services/servers.service.js';
import * as usersService from '@services/users.service.js';
import * as imagesService from '@services/images.service.js';
import * as socketService from '@services/socket.service.js';
import * as patchService from '@services/patch.service.js';
import * as uploadedFilesService from '@services/uploadedFiles.service.js';
import fileUpload from 'express-fileupload';
import { ImageObject } from '@src/typesModule.js';

export async function getServer(req: Request, res: Response) {
  const serverId = req.params.serverId;
  const server = await serversService.getServer(serverId, {
    populateMembers: true,
  });

  if (server) {
    return res.status(200).json(server);
  } else {
    return res.status(404).json({ message: 'Server not found' });
  }
}

export async function createServer(req: Request, res: Response) {
  const accessingUserId = req.decodedAuth?.userId;
  if (!accessingUserId) {
    return res.status(401).json({ message: 'Missing user credentials' });
  }
  const userPromise = usersService.getUser(accessingUserId);
  const serverImgFile = req.files?.image as fileUpload.UploadedFile;
  const serverImgObj = await imagesService.saveServerImage(serverImgFile);
  const serverName = req.body.name;
  const user = await userPromise;

  if (user === null) {
    return res.status(401).json({ message: 'User not found' });
  }

  const newServer = await serversService.createServer(
    { serverName, serverImg: serverImgObj, ownerId: user._id },
    { populateMembers: true },
  );

  await usersService.addServerAsMember(user, newServer._id);

  return res
    .status(201)
    .json({ message: 'Server created.', data: { server: newServer } });
}

export async function generateInviteLink(req: Request, res: Response) {
  // transformed to number by validation middleware
  const expTime = req.query.expTime as unknown as number;
  const inviteExpDate = new Date(Date.now() + expTime);

  const serverId = req.params.serverId;
  const serverPromise =
    req.context.requestedServer ?? serversService.getServer(serverId);
  const server = await serverPromise;
  if (server === null) {
    return res.status(404).json({ message: 'Server not found' });
  }

  const invite = await serversService.createInvite(server._id, inviteExpDate);
  if (invite === null) {
    return res.status(500).json({
      message: "Couldn't generate invite",
    });
  }
  const inviteUrl = serversService.getInviteUrlFromCode(invite.inviteCode);

  return res
    .status(201)
    .json({ message: 'Invite generated successfully', data: { inviteUrl } });
}

export async function processInviteCode(req: Request, res: Response) {
  const inviteCode = req.body.inviteCode;
  const invite = await serversService.findInvite(inviteCode);
  if (!invite) {
    return res.status(404).json({ message: 'Invalid invite code' });
  }

  const serverId = invite.server;
  const serverPromise = serversService.getServer(serverId.toString());
  const userPromise = usersService.getUser(req.decodedAuth?.userId ?? '');
  const server = await serverPromise;
  const user = await userPromise;
  if (!server || !user) {
    return res.status(500).json({ message: 'Server error' });
  }

  const isAlreadyInServerObj = await serversService.checkIfUserIsMember(
    server,
    user._id.toString(),
  );
  const isAlreadyInUserObj = await usersService.checkIfIsInServer(
    user,
    server._id.toString(),
  );

  // in case the two became desynced by accident, only throw 404 when both objects
  // already have each other listed
  if (isAlreadyInServerObj && isAlreadyInUserObj) {
    return res
      .status(404)
      .json({ message: 'You are already a member in this server' });
  }

  if (!isAlreadyInServerObj) {
    await serversService.addMember(server, user._id.toString());
  }
  if (!isAlreadyInUserObj) {
    await usersService.addServerAsMember(user, server._id);
  }

  socketService.emitUserJoinedServer(req.socketIo, user, server);

  return res
    .status(200)
    .json({ message: 'Successfully joined server', data: { server } });
}

export async function createChannel(req: Request, res: Response) {
  const serverId = req.params.serverId;
  const { channelName, channelCategoryId, channelCategoryName, isNewCategory } =
    req.body;

  let server: HydratedDocument<IServer>;
  let responseMessage = '';
  if (isNewCategory) {
    const nextServer = await serversService.createChannelAndCategory(
      serverId,
      channelName,
      channelCategoryName,
    );
    server = nextServer;
    responseMessage = 'Channel and channel group created';
  } else {
    const nextServer = await serversService.createChannel(
      serverId,
      channelName,
      channelCategoryId,
    );
    server = nextServer;
    responseMessage = 'Channel created';
  }

  socketService.emitServerUpdated(req.socketIo, server);

  return res.status(201).json({ message: responseMessage });
}

export async function deleteServer(req: Request, res: Response) {
  const serverId = req.params.serverId;
  const server =
    req.context.requestedServer ?? (await serversService.getServer(serverId));
  if (!server) {
    return res.status(404).json({ message: 'Server not found' });
  }

  await serversService.deleteServer(serverId);

  socketService.emitServerDeleted(req.socketIo, server);
  socketService.disconnectAllFromServer(req.socketIo, server);

  return res.status(200).json({ message: 'Server deleted' });
}

export async function updateServer(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  const serverId = req.params.serverId;
  // type tested by validation middleware
  const tempPatch = req.files?.patch as fileUpload.UploadedFile;

  const patchBuffer = await uploadedFilesService.readTempFile(tempPatch);
  uploadedFilesService.removeTempFile(tempPatch);

  const patch = JSON.parse(patchBuffer.toString());
  if (!Array.isArray(patch)) {
    return res.status(404).json({ message: 'Invalid PATCH data' });
  }

  const isServerImgUpdate = patchService.checkIfPatchHasProperty(
    patch,
    '/serverImg',
  );

  let serverImgObj: ImageObject | null = null;
  if (isServerImgUpdate) {
    // type tested by validation middleware
    const serverImgFile = req.files?.serverImg as fileUpload.UploadedFile;
    if (!serverImgFile) {
      return res.status(404).json({ message: 'Missing serverImg upload' });
    }
    serverImgObj = await imagesService.saveServerImage(serverImgFile);
    patchService.updateCommandValue(patch, '/serverImg', serverImgObj);
  }

  const server =
    req.context.requestedServer ?? (await serversService.getServer(serverId));
  if (!server) {
    return res.status(404).json({ message: 'Server not found' });
  }

  try {
    await serversService.patchServer(server, patch);
  } catch (err) {
    if (isServerImgUpdate && serverImgObj) {
      await imagesService.removeImage(serverImgObj);
    }
    return next(err);
  }
  socketService.emitServerUpdated(req.socketIo, server);

  return res.status(200).json({ message: 'Server updated' });
}

export async function updateChannelCategory(req: Request, res: Response) {
  const serverId = req.params.serverId;
  const categoryId = req.params.categoryId;

  const server =
    req.context.requestedServer ?? (await serversService.getServer(serverId));
  if (!server) {
    return res.status(404).json({ message: 'Server not found' });
  }

  // type tested by validation middleware
  const tempPatch = req.files?.patch as fileUpload.UploadedFile;

  const patchBuffer = await uploadedFilesService.readTempFile(tempPatch);
  uploadedFilesService.removeTempFile(tempPatch);

  const patch = JSON.parse(patchBuffer.toString());
  if (!Array.isArray(patch)) {
    return res.status(404).json({ message: 'Invalid PATCH data' });
  }

  await serversService.patchChannelCategory(server, categoryId, patch);
  socketService.emitServerUpdated(req.socketIo, server);

  return res.status(200).json({ message: 'Channel group updated' });
}

export async function deleteChannelCategory(req: Request, res: Response) {
  const serverId = req.params.serverId;
  const categoryId = req.params.categoryId;

  const server =
    req.context.requestedServer ?? (await serversService.getServer(serverId));
  if (!server) {
    return res.status(404).json({ message: 'Server not found' });
  }

  await serversService.deleteChannelCategory(server, categoryId);
  socketService.emitServerUpdated(req.socketIo, server);

  return res.status(200).json({ message: 'Channel group deleted' });
}

export async function updateChannel(req: Request, res: Response) {
  const serverId = req.params.serverId;
  const channelId = req.params.channelId;

  // type tested by validation middleware
  const tempPatch = req.files?.patch as fileUpload.UploadedFile;

  const patchBuffer = await uploadedFilesService.readTempFile(tempPatch);
  uploadedFilesService.removeTempFile(tempPatch);

  const patch = JSON.parse(patchBuffer.toString());
  if (!Array.isArray(patch)) {
    return res.status(404).json({ message: 'Invalid PATCH data' });
  }

  const server =
    req.context.requestedServer ?? (await serversService.getServer(serverId));
  if (!server) {
    return res.status(404).json({ message: 'Server not found' });
  }

  await serversService.patchChannel(server, channelId, patch);
  socketService.emitServerUpdated(req.socketIo, server);

  return res.status(200).json({ message: 'Channel updated' });
}

export async function deleteChannel(req: Request, res: Response) {
  const serverId = req.params.serverId;
  const channelId = req.params.channelId;

  const server =
    req.context.requestedServer ?? (await serversService.getServer(serverId));
  if (!server) {
    return res.status(404).json({ message: 'Server not found' });
  }

  await serversService.deleteChannel(server, channelId);
  socketService.emitServerUpdated(req.socketIo, server);

  return res.status(200).json({ message: 'Channel deleted' });
}
