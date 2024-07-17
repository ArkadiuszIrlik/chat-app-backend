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

describe('patchUser', () => {
  const mockUserDoc = getUserDocFixture();
  const patchSpy = jest
    .spyOn(patchService, 'patchDoc')
    // @ts-ignore
    .mockImplementation(() => undefined);

  it('calls patchDoc with provided user doc and patch', async () => {
    const mockPatch = [
      { op: 'replace', path: '/username', value: 'Changed Username' },
    ];

    await patchUser(mockUserDoc, mockPatch);

    expect(patchSpy.mock.calls[0][0]).toBe(mockUserDoc);
    expect(patchSpy.mock.calls[0][2]).toBe(mockPatch);
  });

  it("saves the updated user by default when saveDocument option isn't defined", async () => {
    const mockPatch = [
      { op: 'replace', path: '/username', value: 'Changed Username' },
    ];

    await patchUser(mockUserDoc, mockPatch);

    expect(mockUserDoc.save).toHaveBeenCalled();
  });

  it('returns the updated doc', async () => {
    const mockPatch = [
      { op: 'replace', path: '/username', value: 'Changed Username' },
    ];

    const returnedDoc = await patchUser(mockUserDoc, mockPatch);

    expect(returnedDoc).toBe(mockUserDoc);
  });
});

describe('getClientSafeSubset', () => {
  const mockUserDoc = getUserDocFixture();

  it('returns the User doc with resolved getters', () => {
    const returnedObject = getClientSafeSubset(mockUserDoc, UserAuthLevel.Self);
    expect(typeof mockUserDoc.profileImg).toBe('object');
    expect(typeof returnedObject.profileImg).toBe('string');
  });

  it(`returns object with following properties for "Self" authLevel: _id,
    email, username, profileImg, prefersOnlineStatus, serversIn, chatsIn,
    friends`, () => {
    const returnedObject = getClientSafeSubset(mockUserDoc, UserAuthLevel.Self);
    expect(Object.keys(returnedObject)).toEqual([
      '_id',
      'email',
      'username',
      'profileImg',
      'prefersOnlineStatus',
      'serversIn',
      'chatsIn',
      'friends',
    ]);
  });

  it(`returns object with following properties for "OtherUser" authLevel:
    username, profileImg`, () => {
    const returnedObject = getClientSafeSubset(
      mockUserDoc,
      UserAuthLevel.OtherUser,
    );
    expect(Object.keys(returnedObject)).toEqual(['username', 'profileImg']);
  });
});
