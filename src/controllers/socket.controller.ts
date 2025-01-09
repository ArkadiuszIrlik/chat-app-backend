import { IUser } from '@models/User.js';
import sanitize from 'sanitize-html';
import {
  SocketEvents,
  SocketServer,
  SocketWithAuth,
} from '@customTypes/socket.types.js';
import { UserOnlineStatus } from '@src/typesModule.js';
import { HydratedDocument } from 'mongoose';
import * as usersService from '@services/users.service.js';
import * as serversService from '@services/servers.service.js';
import * as chatService from '@services/chat.service.js';

async function _refetchUser(socket: SocketWithAuth) {
  const userId = usersService.getUserId(socket.data.user);
  const nextUser = await usersService.getUser(userId.toString(), {
    populateServersIn: true,
  });

  if (nextUser === null) {
    throw new Error('User not found');
  }
  return nextUser;
}

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

  socket.on(SocketEvents.SendChatMessage, async (msg, roomId, callback) => {
    const roomData = socket.data.channelSocketMap.get(roomId);
    if (!roomData) {
      return;
    }
    const { channelId, serverId } = roomData;

    const messageDoc = await chatService.createServerMessage(
      {
        author: usersService.getUserId(socket.data.user),
        text: sanitize(msg.text),
        channelId,
        serverId,
        clientId: sanitize(msg.clientId),
      },
      { saveDoc: false },
    );
    const socketMessage = chatService.getSocketSafeServerMessage(
      messageDoc,
      socket.data.user,
    );
    if (!socketMessage) {
      return;
    }

    socket.broadcast.to(roomId).emit(SocketEvents.ChatMessage, socketMessage);
    messageDoc.save();
    callback(socketMessage);
  });

  socket.on(SocketEvents.GetOnlineStatus, async (roomId, callback) => {
    const socketList = await io.in(roomId).fetchSockets();
    const userList: {
      _id: string;
      onlineStatus: UserOnlineStatus;
    }[] = [];
    socketList.forEach((s) => {
      if (s.data.onlineStatus === UserOnlineStatus.Offline) {
        return;
      }
      userList.push({
        _id: usersService.getUserId(s.data.user).toString(),
        onlineStatus: s.data.onlineStatus,
      });
      return;
    });
    callback(userList);
  });

  socket.on(SocketEvents.ChangeOnlineStatus, (nextStatus, callback) => {
    if (Object.values(UserOnlineStatus).includes(nextStatus)) {
      socket.data.onlineStatus = nextStatus;
      io.to([...socket.rooms.keys()]).emit(
        SocketEvents.OnlineStatusChanged,
        usersService.getUserId(socket.data.user).toString(),
        nextStatus,
      );
      callback();
    }
  });

  socket.on(SocketEvents.UpdateServerList, async (callback) => {
    try {
      const nextUser = await _refetchUser(socket);
      await _refreshUser(socket, nextUser);
    } catch (err) {
      callback({ ok: false, data: null });
      return;
    }
    if (socket.data.onlineStatus !== UserOnlineStatus.Offline) {
      socket.to([...socket.rooms.keys()]).emit(SocketEvents.UserConnected, {
        _id: usersService.getUserId(socket.data.user).toString(),
        onlineStatus: socket.data.onlineStatus,
      });
    }
    callback({ ok: true, data: null });
  });

  socket.on('disconnecting', () => {
    if (socket.data.onlineStatus !== UserOnlineStatus.Offline) {
      io.to([...socket.rooms.keys()]).emit(
        SocketEvents.OnlineStatusChanged,
        usersService.getUserId(socket.data.user).toString(),
        UserOnlineStatus.Offline,
      );
    }
  });
}

export { handleSocket };
