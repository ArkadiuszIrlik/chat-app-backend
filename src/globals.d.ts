import { SocketServer } from '@customTypes/socket.types.ts';
import { IServer } from '@models/Server.ts';
import { IUser } from '@models/User.ts';
import { HydratedDocument } from 'mongoose';
declare global {
  namespace Express {
    export interface Request {
      socketIo: SocketServer;
      decodedAuth?: {
        userId: string;
        email: string;
      };
      context: {
        requestingUser?: HydratedDocument<IUser>;
        requestedUser?: HydratedDocument<IUser>;
        requestedServer?: HydratedDocument<IServer>;
      };
  }
}

export {};
