import Server, { IServer } from '@models/Server.js';
import { HydratedDocument } from 'mongoose';

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
    await server.populate({
      path: 'members',
      select: 'username profileImg',
    });
  }

  return server;
}

export { getServer };
