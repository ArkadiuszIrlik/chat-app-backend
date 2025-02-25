import { NextFunction, Request, Response } from 'express';
import mongoose from 'mongoose';
import * as usersService from '@services/users.service.js';
import * as serversService from '@services/servers.service.js';
import * as authService from '@services/auth.service.js';

enum AuthRole {
  ServerOwner = 'SERVER_OWNER',
  ServerMember = 'SERVER_MEMBER',
  Self = 'SELF',
}

async function _getAccessedServer(req: Request) {
  const serverId = req.params.serverId;
  if (!mongoose.Types.ObjectId.isValid(serverId)) {
    return null;
  }
  if (req.context.requestedServer) {
    return req.context.requestedServer;
  } else {
    const server = await serversService.getServer(serverId);
    if (server) {
      req.context.requestedServer = server;
    }
    return server;
  }
}

async function _getRequestingUserId(req: Request) {
  let userId: string | null = null;
  if (req.context.requestingUser) {
    userId = usersService.getUserId(req.context.requestingUser).toString();
  } else if (req.decodedAuth) {
    userId = req.decodedAuth.userId;
  } else {
    try {
      const decodedAuth = await authService.decodeAuthToken(
        req.cookies.auth ?? '',
      );
      if (decodedAuth) {
        req.decodedAuth = {
          email: decodedAuth.sub,
          userId: decodedAuth.userId,
          deviceId: decodedAuth.deviceId,
        };
        userId = decodedAuth.userId;
      }
    } catch {}
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
          const server = await _getAccessedServer(req);
          if (!server) {
            return false;
          }

          const userId = await _getRequestingUserId(req);
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
          const server = await _getAccessedServer(req);
          if (!server) {
            return false;
          }

          const userId = await _getRequestingUserId(req);
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

          const userId = await _getRequestingUserId(req);
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
