import express, { Request, Response } from 'express';
import helmet from 'helmet';
import dotenv from 'dotenv';
import { createServer } from 'node:https';
import { readFile } from 'fs/promises';
import { Server } from 'socket.io';

dotenv.config({ path: `.env.${process.env.NODE_ENV}` });

const key = await readFile('./localhost-key.pem');
const cert = await readFile('./localhost.pem');

const PORT = process.env.PORT || 3000;
const app = express();
const server = createServer({ key, cert }, app);
const io = new Server(server, {
  cors: {
    origin: process.env.FRONTEND_ADDRESS,
  },
  transports: ['polling', 'websocket'],
});

console.log(process.env.FRONTEND_ADDRESS);

app.use(helmet());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get('/', (_: Request, res: Response) => {
  res.send('Hello world!');
});

io.on('connection', (socket) => {
  console.log(`connected with transport ${socket.conn.transport.name}`);

  socket.conn.on('upgrade', (transport) => {
    console.log(`transport upgraded to ${transport.name}`);
  });

  socket.on('disconnect', (reason) => {
    console.log(`disconnected due to ${reason}`);
  });
});

server.listen(PORT, () => console.log(`Running on ${PORT} ⚡`));
