import { NextFunction, Request, Response } from 'express';
import * as serversService from '@services/servers.service.js';
import * as usersService from '@services/users.service.js';
import * as imagesService from '@services/images.service.js';
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

