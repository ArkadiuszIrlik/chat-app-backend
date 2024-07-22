import { SERVER_INVITE_PATH } from '@config/client.config.js';
import { getClientUrl } from '@helpers/fetch.helpers.js';
import Server, { IServer } from '@models/Server.js';
import ServerInvite, { IServerInvite } from '@models/ServerInvite.js';
import mongoose, { HydratedDocument } from 'mongoose';
import ShortUniqueId from 'short-unique-id';
import * as patchService from '@services/patch.service.js';
import { getChannelsFromCategories } from '@helpers/servers.helpers.js';
import path from 'path';

function _populateServerMembers(server: HydratedDocument<IServer>) {
  return server.populate({
    path: 'members',
    select: 'username profileImg',
  });
}

async function _getServerFromParam(
  serverParam: HydratedDocument<IServer> | string,
) {
  if (typeof serverParam === 'string') {
    const server = await getServer(serverParam);
    if (!server) {
      throw Error('Server not found');
    }
    return server;
  } else {
    return serverParam;
  }
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
    await _populateServerMembers(server);
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
    await _populateServerMembers(newServer as HydratedDocument<IServer>);
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
  return getClientUrl(path.join(SERVER_INVITE_PATH, inviteCode));
}

function findInvite(inviteCode: string) {
  return ServerInvite.findOne({ inviteCode }).exec();
}

async function checkIfUserIsMember(
  server: HydratedDocument<IServer>,
  userId: string,
): Promise<boolean>;
async function checkIfUserIsMember(
  serverId: string,
  userId: string,
): Promise<boolean>;
async function checkIfUserIsMember(
  server: HydratedDocument<IServer> | string,
  userId: string,
) {
  const serverToCheck = await _getServerFromParam(server);
  const isMember = !!serverToCheck.members.find((id) => id.equals(userId));

  return isMember;
}

async function addMember(
  server: HydratedDocument<IServer>,
  userId: string,
): Promise<HydratedDocument<IServer>>;
async function addMember(
  serverId: string,
  userId: string,
): Promise<HydratedDocument<IServer>>;
async function addMember(
  server: HydratedDocument<IServer> | string,
  userId: string,
) {
  const serverToModify = await _getServerFromParam(server);

  serverToModify.members.push(new mongoose.Types.ObjectId(userId));
  await serverToModify.save();

  return serverToModify;
}

async function createChannelCategory(
  server: HydratedDocument<IServer> | string,
  categoryName: string,
  { saveDocument = true }: { saveDocument?: boolean } = {},
) {
  const serverToModify = await _getServerFromParam(server);

  serverToModify.channelCategories.push({
    _id: new mongoose.Types.ObjectId(),
    name: categoryName,
    channels: [],
  });

  if (saveDocument) {
    await serverToModify.save();
  }

  return serverToModify;
}

async function createChannel(
  server: HydratedDocument<IServer> | string,
  channelName: string,
  categoryId: string,
  { saveDocument = true }: { saveDocument?: boolean } = {},
) {
  const serverToModify = await _getServerFromParam(server);

  const categoryToModify = serverToModify.channelCategories.find((category) =>
    category._id.equals(categoryId),
  );
  if (!categoryToModify) {
    throw Error('Category not found');
  }

  categoryToModify.channels.push({
    _id: new mongoose.Types.ObjectId(),
    name: channelName,
    type: 'text',
    socketId: new mongoose.Types.ObjectId(),
  });

  if (saveDocument) {
    await serverToModify.save();
  }

  return serverToModify;
}

async function createChannelAndCategory(
  server: HydratedDocument<IServer> | string,
  channelName: string,
  channelCategoryName: string,
  { saveDocument = true }: { saveDocument?: boolean } = {},
) {
  const serverToModify = await _getServerFromParam(server);

  const categoryId = new mongoose.Types.ObjectId();
  serverToModify.channelCategories.push({
    _id: categoryId,
    name: channelCategoryName,
    channels: [],
  });

  await createChannel(serverToModify, channelName, categoryId.toString(), {
    saveDocument: false,
  });

  if (saveDocument) {
    await serverToModify.save();
  }

  return serverToModify;
}

function deleteServer(serverId: string) {
  return Server.deleteOne({ _id: serverId }).exec();
}

async function patchServer(
  server: HydratedDocument<IServer> | string,
  patch: string | any[],
  { saveDocument = true }: { saveDocument?: boolean } = {},
) {
  const serverToPatch = await _getServerFromParam(server);
  const patchableServer = patchService.getPatchableServer(serverToPatch);
  const patchedServer = patchService.patchDoc(
    serverToPatch,
    patchableServer,
    patch,
  );

  if (saveDocument) {
    await patchedServer.save();
  }

  return patchedServer;
}

async function patchChannelCategory(
  server: HydratedDocument<IServer> | string,
  categoryId: string,
  patch: string | any[],
  { saveDocument = true }: { saveDocument?: boolean } = {},
) {
  const serverToPatch = await _getServerFromParam(server);
  const categoryToPatch = serverToPatch.channelCategories.find((category) =>
    category._id.equals(categoryId),
  );
  if (!categoryToPatch) {
    throw Error('Channel category not found');
  }
  const categoryIndex = serverToPatch.channelCategories.findIndex((category) =>
    category._id.equals(categoryId),
  );
  const pathToCategory = `channelCategories.${categoryIndex}`;
  const patchableCategory =
    patchService.getPatchableChannelCategory(categoryToPatch);

  const patchedServer = patchService.patchDoc(
    serverToPatch,
    patchableCategory,
    patch,
    pathToCategory,
  );

  if (saveDocument) {
    await patchedServer.save();
  }

  return patchedServer;
}

async function deleteChannelCategory(
  server: HydratedDocument<IServer> | string,
  categoryId: string,
  { saveDocument = true }: { saveDocument?: boolean } = {},
) {
  const serverToModify = await _getServerFromParam(server);

  const indexToDelete = serverToModify.channelCategories.findIndex((category) =>
    category._id.equals(categoryId),
  );
  if (indexToDelete === -1) {
    throw Error('Channel category not found');
  }

  serverToModify.channelCategories.splice(indexToDelete, 1);

  if (saveDocument) {
    await serverToModify.save();
  }

  return serverToModify;
}

async function patchChannel(
  server: HydratedDocument<IServer> | string,
  channelId: string,
  patch: string | any[],
  { saveDocument = true }: { saveDocument?: boolean } = {},
) {
  const serverToPatch = await _getServerFromParam(server);

  const channelToPatch = getChannelsFromCategories(
    serverToPatch.channelCategories,
  ).find((channel) => channel._id.equals(channelId));
  if (!channelToPatch) {
    throw Error('Channel not found');
  }

  const patchableChannel = patchService.getPatchableChannel(channelToPatch);
  let pathToChannel: string | null = null;
  for (
    let categoryIndex = 0;
    categoryIndex < serverToPatch.channelCategories.length;
    categoryIndex++
  ) {
    const category = serverToPatch.channelCategories[categoryIndex];
    const channelIndex = category.channels.findIndex((channel) =>
      channel._id.equals(channelId),
    );
    if (channelIndex === -1) {
      continue;
    } else {
      pathToChannel = `channelCategories.${categoryIndex}.channels.${channelIndex}`;
      break;
    }
  }
  if (pathToChannel === null) {
    throw Error('Channel not found');
  }
  patchService.patchDoc(serverToPatch, patchableChannel, patch, pathToChannel);

  if (saveDocument) {
    await serverToPatch.save();
  }

  return serverToPatch;
}

async function deleteChannel(
  server: HydratedDocument<IServer> | string,
  channelId: string,
  { saveDocument = true }: { saveDocument?: boolean } = {},
) {
  const serverToModify = await _getServerFromParam(server);

  const parentCategory = serverToModify.channelCategories.find(
    (category) =>
      !!category.channels.find((channel) => channel._id.equals(channelId)),
  );
  if (!parentCategory) {
    throw Error('Channel not found');
  }

  const indexToDelete = parentCategory.channels.findIndex((channel) =>
    channel._id.equals(channelId),
  );

  if (indexToDelete === -1) {
    throw Error('Channel not found');
  }

  parentCategory.channels.splice(indexToDelete, 1);

  if (saveDocument) {
    await serverToModify.save();
  }

  return serverToModify;
}

async function removeMember(
  server: HydratedDocument<IServer> | string,
  memberId: string,
  { saveDocument = true }: { saveDocument?: boolean } = {},
) {
  const serverToModify = await _getServerFromParam(server);

  serverToModify.members = serverToModify.members.filter(
    (id) => !id.equals(memberId),
  );

  if (saveDocument) {
    await serverToModify.save();
  }

  return serverToModify;
}

async function getChannelSocketIds(server: HydratedDocument<IServer> | string) {
  const serverToCheck = await _getServerFromParam(server);

  const channelSockets = getChannelsFromCategories(
    serverToCheck.channelCategories,
  ).map((channel) => channel.socketId.toString());

  return channelSockets;
}

async function getServerSocketId(server: HydratedDocument<IServer> | string) {
  const serverToCheck = await _getServerFromParam(server);

  const serverSocket = serverToCheck.socketId.toString();

  return serverSocket;
}

export {
  getServer,
  createServer,
  createInvite,
  getInviteUrlFromCode,
  findInvite,
  checkIfUserIsMember,
  addMember,
  createChannelCategory,
  createChannel,
  createChannelAndCategory,
  deleteServer,
  patchServer,
  patchChannelCategory,
  deleteChannelCategory,
  patchChannel,
  deleteChannel,
  removeMember,
  getChannelSocketIds,
  getServerSocketId,
};
