import { IServer } from '@models/Server.ts';
import { IUser } from '@models/User.ts';
import { HydratedDocument } from 'mongoose';
declare global {
  namespace Express {
    export interface Request {
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
