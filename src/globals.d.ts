declare global {
  namespace Express {
    export interface Request {
      decodedAuth?: {
        userId: string;
        email: string;
      };
    }
  }
}

export {};
