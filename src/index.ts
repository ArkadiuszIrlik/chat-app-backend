// Make sure env config is imported first
import '@config/env.config.js';
import express from 'express';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import { createServer } from 'node:https';
import { Server } from 'socket.io';
import {
  verifyAuth,
  addRequestingUserToContext,
} from '@middleware/auth.middleware.js';
import authRouter from '@routes/auth.router.js';
import serverRouter from '@routes/servers.router.js';
import userRouter from '@routes/users.router.js';
import chatRouter from '@routes/chat.router.js';
import imagesRouter from '@routes/images.router.js';
import connectToDb from '@config/db.config.js';
import cors from 'cors';
import { handleSocket } from '@controllers/socket.controller.js';
import errorHandler from 'error-handler-json';
import fileUpload from 'express-fileupload';
import path from 'path';
import { fileURLToPath } from 'url';
import {
  ClientToServerSocketEvents,
  InterServerSocketEvents,
  ServerToClientSocketEvents,
  SocketData,
  SocketWithAuth,
} from '@customTypes/socket.types.js';
import { initializeContext } from '@middleware/context.middleware.js';
import {
  initializeSocketRequest,
  onHandshake,
} from '@middleware/socket.middleware.js';
import { initializeRefreshLockCache } from '@services/auth.service.js';
import compression from 'compression';

// alternative to __dirname that works in both ESM (app) and CJS (jest)
const unifiedDirname =
  typeof __dirname !== 'undefined'
    ? __dirname
    : path.dirname(fileURLToPath(import.meta.url));

const key = process.env.TLS_KEY;
const cert = process.env.TLS_CERT;
const PORT = process.env.PORT || 3000;
const app = express();
const server = createServer({ key, cert }, app);
const io = new Server<
  ClientToServerSocketEvents,
  ServerToClientSocketEvents,
  InterServerSocketEvents,
  SocketData
>(server, {
  cors: {
    origin: process.env.FRONTEND_ADDRESS,
    credentials: true,
  },
  transports: ['polling', 'websocket'],
});
if (process.env.NODE_ENV !== 'test') {
  await connectToDb();
}

initializeRefreshLockCache();
app.use(helmet());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(
  fileUpload({
    createParentPath: true,
    tempFileDir: path.join(unifiedDirname, '..', 'tmp'),
    useTempFiles: true,
    limits: {
      fileSize: 2 * 1024 * 1024,
    },
  }),
);
app.use(cookieParser());
app.use(compression({ level: 1 }));
app.use(
  cors({
    origin: process.env.FRONTEND_ADDRESS,
    credentials: true,
  }),
);
app.use(initializeContext);
app.use((req, _res, next) => {
  req.socketIo = io;
  return next();
});
app.use(
  '/static',
  helmet({ crossOriginResourcePolicy: { policy: 'same-site' } }),
  express.static(path.join(unifiedDirname, '..', 'assets')),
);

app.get('/', (_req, res) => {
  res.send('Hello world!');
});
app.use('/auth', authRouter);
app.use('/servers', verifyAuth, serverRouter);
app.use('/users', verifyAuth, userRouter);
app.use('/chat', verifyAuth, chatRouter);
app.use('/images', verifyAuth, imagesRouter);
app.use(errorHandler({}));

io.engine.use(initializeContext);
io.engine.use(initializeSocketRequest);
io.engine.use(cookieParser());
io.engine.use(onHandshake(verifyAuth));
io.engine.use(onHandshake(addRequestingUserToContext));

io.on('connection', (socket) => {
  handleSocket(socket as SocketWithAuth, io);
});

if (process.env.NODE_ENV !== 'test') {
  server.listen(PORT, () => console.log(`Running on ${PORT} ⚡`));
}

export { app, server };
