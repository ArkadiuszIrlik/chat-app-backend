import {
  addServerAsMember,
  checkIfIsInServer,
  getUser,
  getClientSafeSubset,
  UserAuthLevel,
  patchUser,
} from '@services/users.service.js';
import mongoose from 'mongoose';
import { getUserDocFixture } from '@tests/fixtures/data/dbDocs.js';
import * as patchService from '@services/patch.service.js';

jest.mock('@models/User.js', () => ({
  findById: jest.fn(() => ({
    exec: jest.fn(),
  })),
}));
import User from '@models/User.js';

afterEach(() => {
  jest.clearAllMocks();
});

describe('getUser', () => {
  const mockUser = getUserDocFixture();

  it('gets user from DB', async () => {
    (User.findById as jest.Mock).mockReturnValueOnce({
      exec: jest.fn().mockResolvedValue(mockUser),
    });
    const returnedUser = await getUser(mockUser._id.toString());

    expect(User.findById).toHaveBeenCalled();
    expect(returnedUser?._id).toEqual(mockUser._id);
  });

  it("doesn't populate serversIn property if not explicitly specified", async () => {
    (User.findById as jest.Mock).mockReturnValueOnce({
      exec: jest.fn().mockResolvedValue(mockUser),
    });
    const returnedUser = await getUser(mockUser._id.toString());

    expect(User.findById).toHaveBeenCalled();
    expect(returnedUser?._id).toEqual(mockUser._id);
    expect(returnedUser?.populate).not.toHaveBeenCalled();
  });

  it('populates serversIn property when explicitly specified', async () => {
    (User.findById as jest.Mock).mockReturnValueOnce({
      exec: jest.fn().mockResolvedValue(mockUser),
    });
    const returnedUser = await getUser(mockUser._id.toString(), {
      populateServersIn: true,
    });

    expect(User.findById).toHaveBeenCalled();
    expect(returnedUser?._id).toEqual(mockUser._id);
    expect(returnedUser?.populate).toHaveBeenCalled();
  });
});

describe('addServerAsMember', () => {
  const mockUser = getUserDocFixture();

  it("adds provided serverId to user's serversIn array", async () => {
    const serverId = new mongoose.Types.ObjectId();
    const returnedUser = await addServerAsMember(mockUser, serverId);

    const isServerInUserDoc = !!returnedUser.serversIn.find((id) =>
      id.equals(serverId),
    );
    expect(isServerInUserDoc).toBe(true);
  });
});

describe('checkIfIsInServer', () => {
  it("returns true if serverId is in user's serversIn array", async () => {
    const serverId = new mongoose.Types.ObjectId();
    const mockUser = getUserDocFixture({
      serversIn: [
        new mongoose.Types.ObjectId(),
        serverId,
        new mongoose.Types.ObjectId(),
      ],
    });

    const returnedValue = await checkIfIsInServer(
      mockUser,
      serverId.toString(),
    );
    expect(returnedValue).toBe(true);
  });

  it("returns false if serverId is not in user's serversIn array", async () => {
    const serverId = new mongoose.Types.ObjectId();
    const mockUser = getUserDocFixture();

    const returnedValue = await checkIfIsInServer(
      mockUser,
      serverId.toString(),
    );
    expect(returnedValue).toBe(false);
  });
});
