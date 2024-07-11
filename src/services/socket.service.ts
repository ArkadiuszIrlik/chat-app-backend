import { SocketEvents } from '@customTypes/socket.types.js';
import { IServer } from '@models/Server.js';
import { IUser } from '@models/User.js';
import { HydratedDocument } from 'mongoose';
import { Server } from 'socket.io';

function emitUserJoinedServer(
  socketIo: Server,
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
    server._id,
  );
}

export { emitUserJoinedServer };
