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
import chatRouter from '@routes/chat.router.js';
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

app.use('/chat', checkAuthExpiry, chatRouter);

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
