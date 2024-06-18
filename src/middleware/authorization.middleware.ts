import { getDecodedAuthFromJwt } from '@helpers/auth.helpers.js';
import Server from '@models/Server.js';
import { NextFunction, Request, Response } from 'express';
import mongoose from 'mongoose';

enum AuthRole {
  ServerOwner = 'SERVER_OWNER',
  ServerMember = 'SERVER_MEMBER',
  Self = 'SELF',
}

async function getAccessedServer(req: Request) {
  const serverId = req.params.serverId;
  if (!mongoose.Types.ObjectId.isValid(serverId)) {
    return false;
  }
  const server = req.server ?? (await Server.findOne({ _id: serverId }));
  return server;
}

function getRequestingUserId(req: Request) {
  let userId: string | null = null;
  if (req.user) {
    userId = req.user._id.toString();
  } else if (req.decodedAuth) {
    userId = req.decodedAuth.userId;
  } else {
    const decodedAuth = getDecodedAuthFromJwt(req.cookies.auth ?? '');
    if (decodedAuth) {
      req.decodedAuth = decodedAuth;
      userId = decodedAuth.userId;
    }
  }
  return userId;
}

function restrictAccess(roleArray: AuthRole[]) {
  return async function checkRoleMiddleware(
    req: Request,
    res: Response,
    next: NextFunction,
  ) {
    async function testIsRoleAllowed(role: AuthRole) {
      switch (role) {
        case AuthRole.ServerOwner: {
          const server = await getAccessedServer(req);
          if (!server) {
            return false;
          }

          const userId = getRequestingUserId(req);
          if (!userId) {
            return false;
          }

          //   check if owner
          if (server.ownerId.equals(userId)) {
            return true;
          } else {
            return false;
          }
        }
        case AuthRole.ServerMember: {
          const server = await getAccessedServer(req);
          if (!server) {
            return false;
          }

          const userId = getRequestingUserId(req);
          if (!userId) {
            return false;
          }

          //   check if member
          if (server.members.find((id) => id.equals(userId))) {
            return true;
          } else {
            return false;
          }
        }
        case AuthRole.Self: {
          // get accessed userId
          const accessedId = req.params.userId;
          if (!mongoose.Types.ObjectId.isValid(accessedId)) {
            return false;
          }

          const userId = getRequestingUserId(req);
          if (!userId) {
            return false;
          }

          //   check if accessing self
          if (accessedId === userId) {
            return true;
          } else {
            return false;
          }
        }
        default: {
          return false;
        }
      }
    }
    for (let i = 0; i < roleArray.length; i++) {
      const role = roleArray[i];
      const isAllowed = await testIsRoleAllowed(role);
      if (isAllowed) {
        return next();
      }
    }
    return res
      .status(403)
      .json({ message: 'Not authorized to access resource' });
  };
}

export { restrictAccess, AuthRole };
