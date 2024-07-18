import { SocketEvents, SocketServer } from '@customTypes/socket.types.js';
import { IServer } from '@models/Server.js';
import { IUser } from '@models/User.js';
import { HydratedDocument, Types } from 'mongoose';

function emitUserJoinedServer(
  socketIo: SocketServer,
  user: HydratedDocument<IUser>,
  server: HydratedDocument<IServer>,
) {
  socketIo.to(server.socketId.toString()).emit(
    SocketEvents.UserJoinedServer,
    {
      _id: user._id,
      username: user.username,
      profileImg: user.profileImg,
    },
    server._id.toString(),
  );
}

function emitServerUpdated(
  socketIo: SocketServer,
  server: HydratedDocument<IServer>,
) {
  socketIo
    .to(server.socketId.toString())
    .emit(SocketEvents.ServerUpdated, server._id.toString());
}

function emitServerDeleted(
  socketIo: SocketServer,
  server: HydratedDocument<IServer>,
) {
  socketIo
    .to(server.socketId.toString())
    .emit(SocketEvents.ServerDeleted, server._id.toString());
}

function disconnectAllFromServer(
  socketIo: SocketServer,
  server: HydratedDocument<IServer>,
) {
  socketIo.socketsLeave(server.socketId.toString());
}
function disconnectSocketsFromRooms(
  socketIo: SocketServer,
  socketIds: string[],
  roomIds: string[],
) {
  socketIo.in(socketIds).socketsLeave(roomIds);
}

async function getConnectedUserSocketIds(
  socketIo: SocketServer,
  userId: string,
) {
  const sockets = await socketIo.fetchSockets();
  const userSockets = sockets
    .filter((socket) => socket.data.user._id.equals(userId))
    .map((socket) => socket.id);

  return userSockets;
}

async function getConnectedUserSockets(socketIo: SocketServer, userId: string) {
  const sockets = await socketIo.fetchSockets();
  const userSockets = sockets.filter((socket) =>
    socket.data.user._id.equals(userId),
  );

  return userSockets;
}

function emitUserLeftServer(
  socketIo: SocketServer,
  socketsToNotify: string[],
  user: { _id: Types.ObjectId; username: string; profileImg: string },
  serverId: string,
) {
  socketIo.to(socketsToNotify).emit(
    SocketEvents.UserLeftServer,
    {
      _id: user._id,
      username: user.username,
      profileImg: user.profileImg,
    },
    serverId,
  );
}
async function getRoomsUserIsIn(socketIo: SocketServer, userId: string) {
  const userSockets = await getConnectedUserSockets(socketIo, userId);
  const allRooms: string[] = [];
  userSockets.forEach((socket) => allRooms.push(...socket.rooms));
  const uniqueRooms = [...new Set(allRooms)];

  return uniqueRooms;
}

function emitUserUpdated(
  socketIo: SocketServer,
  socketsToNotify: string[],
  user: { _id: Types.ObjectId; username: string; profileImg: string },
) {
  socketIo.to(socketsToNotify).emit(SocketEvents.UserUpdated, {
    _id: user._id,
    username: user.username,
    profileImg: user.profileImg,
  });
}

export {
  emitUserJoinedServer,
  emitServerUpdated,
  emitServerDeleted,
  disconnectAllFromServer,
  getConnectedUserSocketIds,
  emitUserLeftServer,
  disconnectSocketsFromRooms,
  getConnectedUserSockets,
  getRoomsUserIsIn,
  emitUserUpdated,
};
