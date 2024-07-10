import Server, { IServer } from '@models/Server.js';
import { HydratedDocument } from 'mongoose';

function populateServerMembers(server: HydratedDocument<IServer>) {
  return server.populate({
    path: 'members',
    select: 'username profileImg',
  });
}

async function getServer(
  serverId: string,
  { populateMembers = false }: { populateMembers?: boolean } = {},
) {
  let server: HydratedDocument<IServer> | null = null;

  try {
    server = await Server.findById(serverId);
  } catch (err) {
    throw err;
  }
  if (server && populateMembers) {
    await populateServerMembers(server);
  }

  return server;
}

async function createServer(
  {
    serverName,
    serverImg,
    ownerId,
  }: {
    serverName: IServer['name'];
    serverImg: Omit<IServer['serverImg'], 'get'>;
    ownerId: IServer['ownerId'];
  },
  { populateMembers = false }: { populateMembers?: boolean } = {},
) {
  const newServer = await Server.create({
    name: serverName,
    serverImg: serverImg,
    ownerId: ownerId,
    members: [ownerId],
  });

  if (newServer && populateMembers) {
    await newServer.populate({
      path: 'members',
      select: 'username profileImg',
    });
  }

  return newServer;
}

export { getServer, createServer };
