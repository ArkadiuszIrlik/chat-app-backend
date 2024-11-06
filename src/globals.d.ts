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
        deviceId: string;
      };
      context: {
        requestingUser?: HydratedDocument<IUser>;
        requestedUser?: HydratedDocument<IUser>;
        requestedServer?: HydratedDocument<IServer>;
        isSocketRequest?: boolean;
      };
      _query?: Record<string, any>;
    }
  }
}

declare module 'yup' {
  interface StringSchema<
    TType extends Maybe<string> = string | undefined,
    TContext extends AnyObject = AnyObject,
    TOut extends TType = TType,
  > extends yup.BaseSchema<TType, TContext, TOut> {
    mongooseId(errorMessage?: string): StringSchema<TType, TContext>;
  }

  interface MixedSchema<
    TType extends Maybe<string> = string | undefined,
    TContext extends AnyObject = AnyObject,
    TOut extends TType = TType,
  > extends yup.BaseSchema<TType, TContext, TOut> {
    notArray(errorMessage?: string): MixedSchema<TType, TContext>;
    notTruncated(errorMessage?: string): MixedSchema<TType, TContext>;
    oneOfMimeType(
      allowedTypes: string[],
      errorMessage?: string,
    ): MixedSchema<TType, TContext>;
  }
}

export {};
