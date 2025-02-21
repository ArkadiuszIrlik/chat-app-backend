// Make sure env config is imported first
import '@config/env.config.js';
import express from 'express';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import { createServer } from 'node:https';
import { readFile } from 'fs/promises';
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
import errorHandler from 'error-handler-json';
import fileUpload from 'express-fileupload';
import path from 'path';
import {
  ClientToServerSocketEvents,
  InterServerSocketEvents,
  ServerToClientSocketEvents,
  SocketData,
  SocketWithAuth,
} from '@customTypes/socket.types.js';
import { initializeContext } from '@middleware/context.middleware.js';
import compression from 'compression';
let key: Buffer, cert: Buffer;
switch (true) {
  case process.env.NODE_ENV === 'development':
    key = await readFile('./localhost-key.pem');
    cert = await readFile('./localhost.pem');
    break;
  case process.env.NODE_ENV === 'dev-remote':
    key = await readFile('./key.pem');
    cert = await readFile('./cert.pem');
    break;
  default:
    key = await readFile('./localhost-key.pem');
    cert = await readFile('./localhost.pem');
    break;
}

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
await connectToDb();
app.use(helmet());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(
  fileUpload({
    createParentPath: true,
    tempFileDir: './tmp/',
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
app.use(
  '/static',
  helmet({ crossOriginResourcePolicy: { policy: 'same-site' } }),
  express.static(path.join(__dirname, '..', 'assets')),
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

  socket.on('disconnect', (reason) => {
    console.log(`disconnected due to ${reason}`);
  });
});

server.listen(PORT, () => console.log(`Running on ${PORT} ⚡`));
