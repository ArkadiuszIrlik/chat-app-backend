import { SocketEvents, SocketServer } from '@customTypes/socket.types.js';
import { IServer } from '@models/Server.js';
import { IUser } from '@models/User.js';
import { HydratedDocument } from 'mongoose';

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
export {
  emitUserJoinedServer,
  emitServerUpdated,
  emitServerDeleted,
};
