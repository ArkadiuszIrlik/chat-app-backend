import ChatMessage from '@models/ChatMessage.js';
import { IUser } from '@models/User.js';
import sanitize from 'sanitize-html';
import {
  SocketChatMessage,
  SocketEvents,
  SocketServer,
  SocketWithAuth,
} from '@customTypes/socket.types.js';
import { UserOnlineStatus } from '@src/typesModule.js';
import { HydratedDocument } from 'mongoose';
import * as usersService from '@services/users.service.js';
import * as serversService from '@services/servers.service.js';

async function _refreshUser(
  socket: SocketWithAuth,
  user: HydratedDocument<IUser>,
) {
  const nextOnlineStatus = usersService.getUserOnlineStatus(user);

  const userServers = await usersService.getUserServersIn(user, {
    populateServersIn: true,
  });

  const nextChannelSocketMap = new Map();
  userServers.forEach((server) => {
    const serverMap = serversService.mapSocketsToChannels(server);
    serverMap.forEach((value, key) => nextChannelSocketMap.set(key, value));
  });

  const serverSockets = userServers.map((server) =>
    serversService.getServerSocketId(server),
  );
  socket.join([...nextChannelSocketMap.keys(), ...serverSockets]);

  socket.data.user = user;
  socket.data.onlineStatus = nextOnlineStatus;
  socket.data.channelSocketMap = nextChannelSocketMap;
}

async function handleSocket(socket: SocketWithAuth, io: SocketServer) {
  if (!socket.request.context.requestingUser) {
    socket.emit(
      SocketEvents.AuthenticationError,
      'Missing valid client credentials',
    );
    socket.disconnect(true);
    return;
  }

  await _refreshUser(socket, socket.request.context.requestingUser);

  // Memory optimization
  // incorrect types in the original package require disabling the type
  // checker for this line
  // @ts-expect-error
  delete socket.conn.request;

  // notify rooms that user came online
  if (socket.data.onlineStatus !== UserOnlineStatus.Offline) {
    io.to([...socket.rooms.keys()]).emit(
      SocketEvents.OnlineStatusChanged,
      usersService.getUserId(socket.data.user).toString(),
      socket.data.onlineStatus,
    );
  }

  socket.on(SocketEvents.SendChatMessage, (msg, roomId, callback) => {
    const roomData = socket.data.channelSocketMap.get(roomId);
    if (!roomData) {
      return;
    }
    const { channelId, serverId } = roomData;
    const message = new ChatMessage({
      postedAt: Date.now(),
      author: usersService.getUserId(socket.data.user),
      text: sanitize(msg.text),
      chatId: channelId,
      serverId,
      clientId: sanitize(msg.clientId),
    });
    const clientSafeUser = usersService.getClientSafeSubset(
      socket.data.user,
      usersService.UserAuthLevel.OtherUser,
    );
    const baseMessage = message.toJSON({ flattenObjectIds: true });
    if (!baseMessage.serverId) {
      return;
    }
    const messageToSend: SocketChatMessage = {
      // type assertion necessary because typescript ignores type guard
      ...(baseMessage as Omit<typeof baseMessage, 'serverId'> & {
        serverId: string;
      }),

      author: clientSafeUser,
    };

    socket.broadcast.to(roomId).emit(SocketEvents.ChatMessage, messageToSend);
    callback(messageToSend);
    message.save();
  });
}

export { handleSocket };
