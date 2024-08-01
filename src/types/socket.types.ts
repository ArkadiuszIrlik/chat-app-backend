import { IServer } from '@models/Server.js';
import { IUser } from '@models/User.js';
import { UserOnlineStatus } from '@src/typesModule.js';
import mongoose, { HydratedDocument } from 'mongoose';
import { Server, Socket } from 'socket.io';

enum SocketEvents {
  ChatMessage = 'chat message',
  GetOnlineStatus = 'get online status',
  AuthenticationError = 'authentication error',
  SendChatMessage = 'send chat message',
  ChangeOnlineStatus = 'change online status',
  OnlineStatusChanged = 'online status changed',
  RoomsUpdated = 'rooms updated',
  UserJoinedServer = 'user joined server',
  UserLeftServer = 'user left server',
  ServerUpdated = 'server updated',
  ServerDeleted = 'server deleted',
  UpdateServerList = 'update server list',
  UserConnected = 'user connected',
  UserUpdated = 'user updated',
}

interface SocketChatMessage {
  postedAt: Date;
  author: {
    _id: mongoose.Types.ObjectId;
    username: string;
    profileImg: string;
  };
  text: string;
  chatId: string;
  serverId: string;
  clientId: string;
}

interface ServerToClientSocketEvents {
  [SocketEvents.ChatMessage]: (message: SocketChatMessage) => void;
  [SocketEvents.AuthenticationError]: (error: string) => void;
  [SocketEvents.OnlineStatusChanged]: (
    userId: string,
    nextStatus: UserOnlineStatus,
  ) => void;
  [SocketEvents.ServerUpdated]: (serverId: string) => void;
  [SocketEvents.ServerDeleted]: (serverId: string) => void;
  [SocketEvents.UserJoinedServer]: (
    user: {
      _id: mongoose.Types.ObjectId;
      username: string;
      profileImg: string;
    },
    serverId: string,
  ) => void;
  [SocketEvents.UserLeftServer]: (
    user: {
      _id: mongoose.Types.ObjectId;
      username: string;
      profileImg: string;
    },
    serverId: string,
  ) => void;
  [SocketEvents.UserConnected]: (user: {
    _id: string;
    onlineStatus: UserOnlineStatus;
  }) => void;
  [SocketEvents.UserUpdated]: (user: {
    _id: mongoose.Types.ObjectId;
    username: string;
    profileImg: string;
  }) => void;
}

interface ClientToServerSocketEvents {
  [SocketEvents.GetOnlineStatus]: (
    roomSocketId: string,
    callback: (
      data: {
        _id: string;
        onlineStatus: UserOnlineStatus;
      }[],
    ) => void,
  ) => void;
  [SocketEvents.SendChatMessage]: (
    message: { text: string; clientId: string },
    socketId: string,
  ) => void;
  [SocketEvents.ChangeOnlineStatus]: (
    nextStatus: UserOnlineStatus,
    callback: () => void,
  ) => void;
  [SocketEvents.UpdateServerList]: (
    callback: (res: { ok: boolean; data: any }) => void,
  ) => void;
}

interface InterServerSocketEvents {}

interface SocketData {
  user: mongoose.MergeType<HydratedDocument<IUser>, { serversIn: IServer[] }>;
  onlineStatus: UserOnlineStatus;
  channelSocketMap: Map<string, { serverId: string; channelId: string }>;
}

type SocketServer = Server<
  ClientToServerSocketEvents,
  ServerToClientSocketEvents,
  InterServerSocketEvents,
  SocketData
>;

type SocketWithAuth = Socket<
  ClientToServerSocketEvents,
  ServerToClientSocketEvents,
  InterServerSocketEvents,
  SocketData
> & {
  request: {
    context: {
      requestingUser?: HydratedDocument<IUser>;
    };
  };
};

export {
  ServerToClientSocketEvents,
  ClientToServerSocketEvents,
  InterServerSocketEvents,
  SocketData,
  SocketEvents,
  SocketServer,
  SocketWithAuth,
};
