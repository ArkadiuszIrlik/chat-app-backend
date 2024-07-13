import {
  addServerAsMember,
  checkIfIsInServer,
  getUser,
} from '@services/users.service.js';
import mongoose from 'mongoose';

jest.mock('@models/User.js', () => ({
  findById: jest.fn(() => ({
    exec: jest.fn(),
  })),
}));
import User, { IUser } from '@models/User.js';
import { getUserFixture } from '@tests/fixtures/data/dbDocs.js';
import { HydratedDocument } from 'mongoose';

afterEach(() => {
  jest.clearAllMocks();
});

describe('getUser', () => {
  it('gets user from DB', async () => {
    const mockUser = getUserFixture() as HydratedDocument<IUser>;
    mockUser._id = new mongoose.Types.ObjectId();

    (User.findById as jest.Mock).mockReturnValueOnce({
      exec: jest.fn().mockResolvedValue(mockUser),
    });
    const returnedUser = await getUser(mockUser._id.toString());

    expect(User.findById).toHaveBeenCalled();
    expect(returnedUser?._id).toEqual(mockUser._id);
  });

  it("doesn't populate serversIn property if not explicitly specified", async () => {
    const mockUser = {
      _id: 'test-id',
      name: 'test server',
      populate: jest.fn(),
    };
    (User.findById as jest.Mock).mockReturnValueOnce({
      exec: jest.fn().mockResolvedValue(mockUser),
    });
    const returnedUser = await getUser(mockUser._id.toString());

    expect(User.findById).toHaveBeenCalled();
    expect(returnedUser?._id).toEqual(mockUser._id);
    expect(returnedUser?.populate).not.toHaveBeenCalled();
  });

  it('populates serversIn property when explicitly specified', async () => {
    const mockUser = {
      _id: 'test-id',
      name: 'test server',
      populate: jest.fn(),
    };
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
  it("adds provided serverId to user's serversIn array", async () => {
    const mockUser = getUserFixture() as HydratedDocument<IUser>;
    mockUser.save = jest.fn();
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
    const mockUser = getUserFixture({
      serversIn: [
        new mongoose.Types.ObjectId(),
        serverId,
        new mongoose.Types.ObjectId(),
      ],
    }) as HydratedDocument<IUser>;

    const returnedValue = await checkIfIsInServer(
      mockUser,
      serverId.toString(),
    );
    expect(returnedValue).toBe(true);
  });

  it("returns false if serverId is not in user's serversIn array", async () => {
    const serverId = new mongoose.Types.ObjectId();
    const mockUser = getUserFixture() as HydratedDocument<IUser>;

    const returnedValue = await checkIfIsInServer(
      mockUser,
      serverId.toString(),
    );
    expect(returnedValue).toBe(false);
  });
});
