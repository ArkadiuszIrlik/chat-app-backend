// Make sure env config is imported first
import '@config/env.config.js';
import express, { Request, Response } from 'express';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import { createServer } from 'node:https';
import { readFile } from 'fs/promises';
import { Server } from 'socket.io';
import chatRouter from '@routes/chat.router.js';
import connectToDb from '@config/db.config.js';
import cors from 'cors';
import errorHandler from 'error-handler-json';

const key = await readFile('./localhost-key.pem');
const cert = await readFile('./localhost.pem');

const PORT = process.env.PORT || 3000;
const app = express();
const server = createServer({ key, cert }, app);
const io = new Server(server, {
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
app.use(cookieParser());
app.use(
  cors({
    origin: process.env.FRONTEND_ADDRESS,
    credentials: true,
  }),
);

app.get('/', (_: Request, res: Response) => {
  res.send('Hello world!');
});

app.use('/chat', checkAuthExpiry, chatRouter);

app.use(errorHandler({}));
io.engine.use(cookieParser());

  socket.on('disconnect', (reason) => {
    console.log(`disconnected due to ${reason}`);
  });
});

server.listen(PORT, () => console.log(`Running on ${PORT} ⚡`));
