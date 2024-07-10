import { NextFunction, Request, Response } from 'express';
import * as serversService from '@services/servers.service.js';

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

