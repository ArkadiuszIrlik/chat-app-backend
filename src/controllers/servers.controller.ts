import { NextFunction, Request, Response } from 'express';
import * as serversService from '@services/servers.service.js';
import * as usersService from '@services/users.service.js';
import * as imagesService from '@services/images.service.js';
import * as socketService from '@services/socket.service.js';
import fileUpload from 'express-fileupload';

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

