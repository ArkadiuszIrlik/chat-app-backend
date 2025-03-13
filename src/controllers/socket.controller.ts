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
import * as demoService from '@services/demo.service.js';
import { getChannelsFromCategories } from '@helpers/servers.helpers.js';

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

interface DemoMessageData {
  authorId: demoService.MessageAuthorIds;
  text: string;
  demoChannelId: string;
}
const demoMessageSteps: { message: DemoMessageData; delayBefore: number }[] = [
  {
    message: {
      authorId: demoService.MessageAuthorIds.Billy,
      text: `Hey there. Cool of you to pop into our server.
It's good to have you around.`,
      demoChannelId: demoService.DemoChannelIds.General,
    },
    delayBefore: 5 * 1000,
  },
  {
    message: {
      authorId: demoService.MessageAuthorIds.Billy,
      text: `<p>You can get pretty creative with your messages. Wrap text in <code>~~tilde~~</code>
to strike it through like <s>this</s>. Start a line with a different number of <code>#</code>
to adjust heading level like</p>
<h3>so.</h3>
<p>Press <code>shift + enter</code> to move to a new line or
<code>ctrl + enter</code> (<code>cmd + enter</code> on MacOS) to start a new paragraph.
You can also enter lines of code with <code>backticks</code>.
And if you ever feel like sharing some poetry, why not put it inside a nice blockquote with
<code>></code>.</p>`,
      demoChannelId: demoService.DemoChannelIds.General,
    },
    delayBefore: 5 * 1000,
  },
  {
    message: {
      authorId: demoService.MessageAuthorIds.Sue,
      text: `Click here to see something adorable 🥰 <a href="https://th.bing.com/th/id/OIP.X3mfeI7lW-x1NvHx8AZwAAHaHa" target="_blank">https://th.bing.com/th/id/OIP.X3mfeI7lW-x1NvHx8AZwAAHaHa</a>`,
      demoChannelId: demoService.DemoChannelIds.Pics,
    },
    delayBefore: 20 * 1000,
  },
  {
    message: {
      authorId: demoService.MessageAuthorIds.Billy,
      text: `<p>I gave you extra permissions so you can invite your friends
to join us. You can invite from the server menu in the top left of the app.</p>`,
      demoChannelId: demoService.DemoChannelIds.General,
    },
    delayBefore: 10 * 1000,
  },
  {
    message: {
      authorId: demoService.MessageAuthorIds.Billy,
      text: `<p>If you don't know anyone around here yet, you could always open
      the app in a separate incognito window.</p>`,
      demoChannelId: demoService.DemoChannelIds.General,
    },
    delayBefore: 6 * 1000,
  },
  {
    message: {
      authorId: demoService.MessageAuthorIds.Billy,
      text: `<p>Alright, that's all from me. Thank you for stopping by and have a
nice day 😄</p>`,
      demoChannelId: demoService.DemoChannelIds.General,
    },
    delayBefore: 6 * 1000,
  },
];

async function runDemo(socket: SocketWithAuth, io: SocketServer) {
  const isUsingDemo = !!socket.data.user.demoServer;
  if (!isUsingDemo) {
    return;
  }
  if (
    socket.data.user.demoServer === undefined ||
    socket.data.user.demoStepOffset === undefined
  ) {
    return;
  }

  let currentStepOffset = socket.data.user.demoStepOffset;
  if (currentStepOffset >= demoMessageSteps.length) {
    return;
  }
  const demoServer = await serversService.getServer(
    socket.data.user.demoServer.toString(),
  );
  if (!demoServer) {
    return;
  }
  const demoChannels = getChannelsFromCategories(demoServer.channelCategories);
  const demoUsers = await demoService.getDemoUsers();

  for (let i = currentStepOffset; i < demoMessageSteps.length; i++) {
    const currentStep = demoMessageSteps[i];
    await new Promise((resolve) =>
      setTimeout(() => resolve(true), currentStep.delayBefore),
    );
    // helps concurrency issues if client calls start demo twice
    if (i !== socket.data.user.demoStepOffset) {
      return;
    }

    const demoMessageData = currentStep.message;
    const author = demoUsers.find((user) =>
      user._id.equals(demoMessageData.authorId),
    );

    if (!author) {
      socket.data.user.save();
      return;
    }

    const demoChannel = demoChannels.find(
      (channel) => channel.demoChannelId === demoMessageData.demoChannelId,
    );
    if (!demoChannel) {
      socket.data.user.save();
      return;
    }

    const messageDoc = await chatService.createServerMessage(
      {
        author: usersService.getUserId(author),
        text: demoMessageData.text,
        channelId: demoChannel._id,
        serverId: demoServer._id,
        clientId: crypto.randomUUID(),
      },
      { saveDoc: false },
    );
    const socketMessage = chatService.getSocketSafeServerMessage(
      messageDoc,
      author,
    );
    if (!socketMessage) {
      return;
    }

    // io necessary, since socket.to() excludes the socket itself
    io.to(demoChannel.socketId.toString()).emit(
      SocketEvents.ChatMessage,
      socketMessage,
    );
    messageDoc.save();

    socket.data.user.demoStepOffset = i + 1;
  }
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
