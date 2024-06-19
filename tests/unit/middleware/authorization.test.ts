import {
  AuthRole,
  restrictAccess,
} from '@middleware/authorization.middleware.js';
import { IUser } from '@models/User.js';
import { NextFunction, Request, Response } from 'express';
import mongoose from 'mongoose';

jest.mock('@models/Server.js', () => ({
  findOne: jest.fn(),
}));
import Server, { IServer } from '@models/Server.js';

describe('restrictAccess', () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  const nextFunction: NextFunction = jest.fn();

  beforeEach(() => {
    mockRequest = { cookies: {} };
    mockResponse = {
      json: jest.fn(),
      clearCookie: jest.fn(() => mockResponse as Response),
      redirect: jest.fn(),
      status: jest.fn(() => mockResponse as Response),
    };
  });
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('denies access when role name not recognized', async () => {
    await restrictAccess(['invalidRoleNameForTesting' as AuthRole])(
      mockRequest as Request,
      mockResponse as Response,
      nextFunction,
    );
    expect(nextFunction).not.toHaveBeenCalled();
    expect(mockResponse.status).toHaveBeenCalledWith(403);
  });

  it('allows access when user only meets one of the allowed role requirements', async () => {
    const mockServerId = new mongoose.Types.ObjectId();
    mockRequest.params = {
      serverId: mockServerId.toString(),
    };

    const mockUserId = new mongoose.Types.ObjectId();
    mockRequest.user = {
      _id: mockUserId,
    } as IUser;

    (Server.findOne as jest.Mock).mockImplementation(async () => ({
      _id: mockServerId,
      ownerId: new mongoose.Types.ObjectId(),
      members: [
        new mongoose.Types.ObjectId(),
        new mongoose.Types.ObjectId(),
        mockUserId,
      ],
    }));

    await restrictAccess([AuthRole.ServerOwner, AuthRole.ServerMember])(
      mockRequest as Request,
      mockResponse as Response,
      nextFunction,
    );

    expect(nextFunction).not.toHaveBeenCalledWith(expect.anything());
    expect(nextFunction).toHaveBeenCalled();
  });

  describe(AuthRole.ServerOwner, () => {
    const restrict = restrictAccess([AuthRole.ServerOwner]);
    it('allows access when userId and ownerId are equal', async () => {
      const mockUserId = new mongoose.Types.ObjectId();
      mockRequest.user = { _id: mockUserId } as IUser;
      mockRequest.params = {
        serverId: new mongoose.Types.ObjectId().toString(),
      };

      const mockOwnerId = mockUserId;
      const mockServer = { ownerId: mockOwnerId };

      (Server.findOne as jest.Mock).mockImplementationOnce(
        async () => mockServer,
      );

      await restrict(
        mockRequest as Request,
        mockResponse as Response,
        nextFunction,
      );

      expect(Server.findOne).toHaveBeenCalled();
      expect(nextFunction).not.toHaveBeenCalledWith(expect.anything());
      expect(nextFunction).toHaveBeenCalled();
    });

    it('denies access when server not found', async () => {
      const mockUserId = new mongoose.Types.ObjectId();
      mockRequest.user = { _id: mockUserId } as IUser;
      mockRequest.params = {
        serverId: new mongoose.Types.ObjectId().toString(),
      };
      (Server.findOne as jest.Mock).mockImplementationOnce(async () => null);
      await restrict(
        mockRequest as Request,
        mockResponse as Response,
        nextFunction,
      );
      expect(mockResponse.status).toHaveBeenLastCalledWith(403);
    });

    it('denies access when serverId param is invalid', async () => {
      const mockUserId = new mongoose.Types.ObjectId();
      mockRequest.user = { _id: mockUserId } as IUser;
      mockRequest.params = {
        serverId: 'invalid-Id',
      };
      await restrict(
        mockRequest as Request,
        mockResponse as Response,
        nextFunction,
      );
      expect(mockResponse.status).toHaveBeenLastCalledWith(403);
    });

    it('denies access when userId not found', async () => {
      const mockServerId = new mongoose.Types.ObjectId();
      mockRequest.params = {
        serverId: mockServerId.toString(),
      };
      mockRequest.server = {
        _id: mockServerId,
        ownerId: new mongoose.Types.ObjectId(),
      } as IServer;
      await restrict(
        mockRequest as Request,
        mockResponse as Response,
        nextFunction,
      );
      expect(mockResponse.status).toHaveBeenLastCalledWith(403);
    });
  });

  describe(AuthRole.ServerMember, () => {
    const restrict = restrictAccess([AuthRole.ServerMember]);

    it('allows access when userId is in server.members list', async () => {
      const mockServerId = new mongoose.Types.ObjectId();
      mockRequest.params = {
        serverId: mockServerId.toString(),
      };

      const mockUserId = new mongoose.Types.ObjectId();
      mockRequest.user = { _id: mockUserId } as IUser;
      (Server.findOne as jest.Mock).mockImplementationOnce(async () => ({
        members: [
          new mongoose.Types.ObjectId(),
          mockUserId,
          new mongoose.Types.ObjectId(),
        ],
      }));
      await restrict(
        mockRequest as Request,
        mockResponse as Response,
        nextFunction,
      );
      expect(nextFunction).toHaveBeenCalled();
    });

    it('denies access when userId is not in server.members list', async () => {
      const mockServerId = new mongoose.Types.ObjectId();
      mockRequest.params = {
        serverId: mockServerId.toString(),
      };

      const mockUserId = new mongoose.Types.ObjectId();
      mockRequest.user = { _id: mockUserId } as IUser;
      (Server.findOne as jest.Mock).mockImplementationOnce(async () => ({
        members: [
          new mongoose.Types.ObjectId(),
          new mongoose.Types.ObjectId(),
          new mongoose.Types.ObjectId(),
        ],
      }));
      await restrict(
        mockRequest as Request,
        mockResponse as Response,
        nextFunction,
      );
      expect(nextFunction).not.toHaveBeenCalled();
      expect(mockResponse.status).toHaveBeenCalledWith(403);
    });
  });

  describe(AuthRole.Self, () => {
    const restrict = restrictAccess([AuthRole.Self]);

    it('allows access when userId being accessed is equal to userId in auth user info', async () => {
      const mockAccessedUserId = new mongoose.Types.ObjectId();
      mockRequest.params = {
        userId: mockAccessedUserId.toString(),
      };

      mockRequest.user = { _id: mockAccessedUserId } as IUser;

      await restrict(
        mockRequest as Request,
        mockResponse as Response,
        nextFunction,
      );
      expect(nextFunction).toHaveBeenCalled();
    });

    it('denies access when userId being accessed is different from userId in auth user info', async () => {
      const mockAccessedUserId = new mongoose.Types.ObjectId();
      mockRequest.params = {
        userId: mockAccessedUserId.toString(),
      };

      mockRequest.user = { _id: new mongoose.Types.ObjectId() } as IUser;

      await restrict(
        mockRequest as Request,
        mockResponse as Response,
        nextFunction,
      );

      expect(nextFunction).not.toHaveBeenCalled();
      expect(mockResponse.status).toHaveBeenCalledWith(403);
    });
  });
});
