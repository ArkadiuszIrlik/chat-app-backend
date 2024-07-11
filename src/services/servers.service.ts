import { SERVER_INVITE_PATH } from '@config/client.config.js';
import { getClientUrl } from '@helpers/fetch.helpers.js';
import Server, { IServer } from '@models/Server.js';
import ServerInvite, { IServerInvite } from '@models/ServerInvite.js';
import mongoose, { HydratedDocument } from 'mongoose';
import ShortUniqueId from 'short-unique-id';

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

async function createInvite(
  serverId: mongoose.Types.ObjectId,
  expirationDate: Date,
) {
  const uid = new ShortUniqueId({ dictionary: 'alphanum_upper', length: 10 });
  let inviteDoc: HydratedDocument<IServerInvite> | null = null;
  try {
    const inviteCode = uid.randomUUID();
    const doc = new ServerInvite({
      inviteCode,
      server: serverId,
      expDate: expirationDate,
    });
    await doc.save();
    inviteDoc = doc;
  } catch {
    const newInviteCode = uid.randomUUID();
    const doc = new ServerInvite({
      inviteCode: newInviteCode,
      server: serverId,
      expDate: expirationDate,
    });
    await doc.save();
    inviteDoc = doc;
  }

  return inviteDoc;
}

function getInviteUrlFromCode(inviteCode: string) {
  return getClientUrl(SERVER_INVITE_PATH + inviteCode);
}

function findInvite(inviteCode: string) {
  return ServerInvite.findOne({ inviteCode }).exec();
}

