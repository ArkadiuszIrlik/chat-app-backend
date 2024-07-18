import {
  getServer,
  createServer,
  createInvite,
  checkIfUserIsMember,
  addMember,
  createChannelCategory,
  createChannel,
  createChannelAndCategory,
  deleteServer,
  patchServer,
  patchChannelCategory,
  deleteChannelCategory,
  patchChannel,
  deleteChannel,
  removeMember,
  getChannelSocketIds,
  getServerSocketId,
} from '@services/servers.service.js';
import mongoose, { HydratedDocument } from 'mongoose';
import {
  getServerDocFixture,
  getServerFixture,
} from '@tests/fixtures/data/dbDocs.js';
import * as patchService from '@services/patch.service.js';

jest.mock('@models/Server.js', () => ({
  findById: jest.fn(),
  create: jest.fn(),
  deleteOne: jest.fn(() => ({
    exec: jest.fn(),
  })),
}));
import Server, { IServer } from '@models/Server.js';

jest.mock('@models/ServerInvite.js', () => ({
  __esModule: true,
  default: jest.fn(),
  findById: jest.fn(),
  create: jest.fn(),
}));
import ServerInvite from '@models/ServerInvite.js';

afterEach(() => {
  jest.clearAllMocks();
});

describe('getServer', () => {
  it('fetches server from database', async () => {
    const mockServer = {
      _id: 'test-id',
      name: 'test server',
    };
    (Server.findById as jest.Mock).mockResolvedValueOnce(mockServer);
    const returnedValue = await getServer(mockServer._id);
    expect(Server.findById).toHaveBeenCalled();
    expect(returnedValue?.name).toEqual(mockServer.name);
  });

  it("doesn't populate members property if not explicitly specified", async () => {
    const mockServer = {
      _id: 'test-id',
      name: 'test server',
      populate: jest.fn(),
    };
    (Server.findById as jest.Mock).mockResolvedValueOnce(mockServer);
    const returnedValue = await getServer(mockServer._id);
    expect(Server.findById).toHaveBeenCalled();
    expect(returnedValue?.name).toEqual(mockServer.name);
    expect(returnedValue?.populate).not.toHaveBeenCalled();
  });

  it('populates members property when explicitly specified', async () => {
    const mockServer = {
      _id: 'test-id',
      name: 'test server',
      populate: jest.fn(),
    };
    (Server.findById as jest.Mock).mockResolvedValueOnce(mockServer);
    const returnedValue = await getServer(mockServer._id, {
      populateMembers: true,
    });
    expect(Server.findById).toHaveBeenCalled();
    expect(returnedValue?.name).toEqual(mockServer.name);
    expect(returnedValue?.populate).toHaveBeenCalled();
  });
});

describe('createServer', () => {
  it('creates a new server in DB', async () => {
    const mockServer = getServerFixture();
    (Server.create as jest.Mock).mockImplementationOnce(async (obj) => obj);
    const returnedServer = await createServer({
      ownerId: mockServer.ownerId,
      serverImg: mockServer.serverImg,
      serverName: mockServer.name,
    });
    expect(Server.create).toHaveBeenCalled();
    expect(returnedServer.name).toEqual(mockServer.name);
  });
});

describe('createInvite', () => {
  it('creates an invite', async () => {
    const serverId = new mongoose.Types.ObjectId();
    const dateIn10Minutes = new Date(Date.now() + 10 * 60 * 1000);
    (ServerInvite as unknown as jest.Mock).mockImplementation((obj) => ({
      ...obj,
      save: jest.fn(),
    }));
    const returnedInvite = await createInvite(serverId, dateIn10Minutes);

    expect(ServerInvite).toHaveBeenCalled();
    expect(serverId.equals(returnedInvite.server)).toEqual(true);
    expect(returnedInvite.expDate.getTime()).toEqual(dateIn10Minutes.getTime());
  });

  it('creates an invite code in the format: uppercase letters and digits, length 10', async () => {
    const serverId = new mongoose.Types.ObjectId();
    const dateIn10Minutes = new Date(Date.now() + 10 * 60 * 1000);
    (ServerInvite as unknown as jest.Mock).mockImplementationOnce(() => ({
      save: jest.fn(),
    }));
    await createInvite(serverId, dateIn10Minutes);

    expect(
      (ServerInvite as unknown as jest.Mock).mock.calls[0][0].inviteCode,
    ).toMatch(/^[A-Z\d]{10}$/);
  });

  it('retries with new code when the first invite fails to save to DB', async () => {
    const serverId = new mongoose.Types.ObjectId();
    const dateIn10Minutes = new Date(Date.now() + 10 * 60 * 1000);
    (ServerInvite as unknown as jest.Mock).mockImplementationOnce(() => ({
      save: jest.fn().mockImplementationOnce(() => Promise.reject()),
    }));
    await createInvite(serverId, dateIn10Minutes);

    expect(ServerInvite).toHaveBeenCalledTimes(2);
    expect(
      (ServerInvite as unknown as jest.Mock).mock.calls[0][0].inviteCode,
    ).not.toEqual(
      (ServerInvite as unknown as jest.Mock).mock.calls[1][0].inviteCode,
    );
  });
});

describe('checkIfUserIsMember', () => {
  it('returns true when user is a member', async () => {
    const userId = new mongoose.Types.ObjectId();
    const mockServer = getServerFixture({
      members: [
        new mongoose.Types.ObjectId(),
        userId,
        new mongoose.Types.ObjectId(),
      ],
    });
    const returnValue = await checkIfUserIsMember(
      mockServer as HydratedDocument<IServer>,
      userId.toString(),
    );
    expect(returnValue).toBe(true);
  });

  it('returns false when user is not a member', async () => {
    const userId = new mongoose.Types.ObjectId();
    const mockServer = getServerFixture();
    const returnValue = await checkIfUserIsMember(
      mockServer as HydratedDocument<IServer>,
      userId.toString(),
    );
    expect(returnValue).toBe(false);
  });
});

describe('addMember', () => {
  it("adds userId to server's members array", async () => {
    const userId = new mongoose.Types.ObjectId();
    const mockServer = getServerFixture() as HydratedDocument<IServer>;
    mockServer.save = jest.fn();
    const returnedServer = await addMember(mockServer, userId.toString());

    const isUserInReturnedServer = !!returnedServer.members.find((id) =>
      id.equals(userId),
    );
    expect(isUserInReturnedServer).toBe(true);
  });
});

describe('createChannelCategory', () => {
  const mockServerDoc = getServerDocFixture();

  it('creates a new category in the provided Server doc', async () => {
    const mockCategoryName = 'newly added channel category';
    const initialCategoriesLength = mockServerDoc.channelCategories.length;
    const returnedDoc = await createChannelCategory(
      mockServerDoc,
      mockCategoryName,
    );

    const lastCategoryIndex = returnedDoc.channelCategories.length - 1;
    expect(returnedDoc.channelCategories.length).toBe(
      initialCategoriesLength + 1,
    );
    expect(returnedDoc.channelCategories[lastCategoryIndex].name).toBe(
      mockCategoryName,
    );
  });
});

describe('createChannel', () => {
  let mockServerDoc = getServerDocFixture();
  afterEach(() => {
    mockServerDoc = getServerDocFixture();
  });

  it('creates a new channel', async () => {
    const mockChannelName = 'newly added test mock channel';
    const categoryId = mockServerDoc.channelCategories[1]._id;

    const returnedDoc = await createChannel(
      mockServerDoc,
      mockChannelName,
      categoryId.toString(),
    );

    const lastChannelIndex =
      returnedDoc.channelCategories[1].channels.length - 1;
    expect(
      returnedDoc.channelCategories[1].channels[lastChannelIndex].name,
    ).toBe(mockChannelName);
  });

  it('throws "Category not found" when passed invalid categoryId', async () => {
    const mockChannelName = 'newly added test mock channel';
    const categoryId = 'invalid id value';

    await expect(
      createChannel(mockServerDoc, mockChannelName, categoryId),
    ).rejects.toThrow('Category not found');
  });
});

describe('createChannelAndCategory', () => {
  let mockServerDoc = getServerDocFixture();
  afterEach(() => {
    mockServerDoc = getServerDocFixture();
  });

  it('creates new channel category with a new channel', async () => {
    const mockChannelName = 'mock channel name to add';
    const mockCategoryName = 'mock category name to add';
    const lastCategoryIndex = mockServerDoc.channelCategories.length - 1;

    const returnedDoc = await createChannelAndCategory(
      mockServerDoc,
      mockChannelName,
      mockCategoryName,
    );

    const newCategory = returnedDoc.channelCategories[lastCategoryIndex + 1];
    expect(newCategory.name).toBe(mockCategoryName);
    expect(newCategory.channels[0].name).toBe(mockChannelName);
  });

  it("doesn't unnecessarily save document when calling createChannel", async () => {
    await createChannelAndCategory(
      mockServerDoc,
      'mock channel',
      'mock category',
    );
    expect(mockServerDoc.save).toHaveBeenCalledTimes(1);
  });
});

describe('deleteServer', () => {
  it('calls deleteOne on the Server model', () => {
    const mockServerId = new mongoose.Types.ObjectId();

    deleteServer(mockServerId.toString());

    expect(Server.deleteOne).toHaveBeenCalled();
    expect(Server.deleteOne).toHaveBeenCalledWith(
      expect.objectContaining({ _id: mockServerId.toString() }),
    );
  });
});

describe('patchServer', () => {
  const mockServerDoc = getServerDocFixture();
  const mockPatch = [
    { op: 'replace', path: '/name', value: 'Changed server name' },
  ];

  let patchSpy = jest.spyOn(patchService, 'patchDoc');

  beforeEach(() => {
    patchSpy = jest.spyOn(patchService, 'patchDoc');
    patchSpy.mockImplementationOnce((targetDoc) => targetDoc);
  });

  afterEach(() => {
    patchSpy.mockRestore();
  });

  it('calls patchDoc with provided Server doc and patch', async () => {
    await patchServer(mockServerDoc, mockPatch);

    expect(patchSpy.mock.calls[0][0]).toBe(mockServerDoc);
    expect(patchSpy.mock.calls[0][2]).toBe(mockPatch);
  });

  it("saves the updated server by default when saveDocument option isn't defined", async () => {
    await patchServer(mockServerDoc, mockPatch);

    expect(mockServerDoc.save).toHaveBeenCalled();
  });

  it('returns the mutated doc', async () => {
    const returnedDoc = await patchServer(mockServerDoc, mockPatch);

    expect(returnedDoc).toBe(mockServerDoc);
  });
});

describe('patchChannelCategory', () => {
  let mockServerDoc = getServerDocFixture();
  const mockPatch = [
    { op: 'replace', path: '/name', value: 'Changed category name' },
  ];

  let patchSpy = jest.spyOn(patchService, 'patchDoc');

  beforeEach(() => {
    patchSpy = jest.spyOn(patchService, 'patchDoc');
    patchSpy.mockImplementationOnce((targetDoc) => targetDoc);
  });

  afterEach(() => {
    patchSpy.mockRestore();
    mockServerDoc = getServerDocFixture();
  });

  it('calls patchDoc with the correct arguments', async () => {
    const mockCategoryId = mockServerDoc.channelCategories[1]._id;
    const pathToPatchedCategory = 'channelCategories.1';

    await patchChannelCategory(
      mockServerDoc,
      mockCategoryId.toString(),
      mockPatch,
    );

    expect(patchSpy.mock.calls[0]).toEqual([
      mockServerDoc,
      expect.objectContaining({}),
      mockPatch,
      pathToPatchedCategory,
    ]);
  });

  it('throws "Channel category not found" when passed invalid categoryId', async () => {
    const mockCategoryId = 'invalid category id';
    await expect(
      patchChannelCategory(mockServerDoc, mockCategoryId, mockPatch),
    ).rejects.toThrow('Channel category not found');
  });

  it("saves the updated server by default when saveDocument option isn't defined", async () => {
    const mockCategoryId = mockServerDoc.channelCategories[1]._id;

    await patchChannelCategory(
      mockServerDoc,
      mockCategoryId.toString(),
      mockPatch,
    );

    expect(mockServerDoc.save).toHaveBeenCalled();
  });

  it('returns the mutated doc', async () => {
    const mockCategoryId = mockServerDoc.channelCategories[1]._id;

    const returnedDoc = await patchChannelCategory(
      mockServerDoc,
      mockCategoryId.toString(),
      mockPatch,
    );

    expect(returnedDoc).toBe(mockServerDoc);
  });
});

describe('deleteChannelCategory', () => {
  let mockServerDoc = getServerDocFixture();

  beforeEach(() => {
    mockServerDoc = getServerDocFixture();
  });

  it('removes the channel category from the Server doc', async () => {
    const mockCategoryId = mockServerDoc.channelCategories[1]._id;
    const initialCategoriesLength = mockServerDoc.channelCategories.length;

    const returnedDoc = await deleteChannelCategory(
      mockServerDoc,
      mockCategoryId.toString(),
    );

    expect(returnedDoc.channelCategories.length).toBe(
      initialCategoriesLength - 1,
    );
    expect(returnedDoc.channelCategories).not.toContainEqual(
      expect.objectContaining({
        _id: mockCategoryId,
      }),
    );
  });

  it('throws "Channel category not found" when passed an invalid categoryId', async () => {
    const mockCategoryId = 'invalid category id';

    await expect(
      deleteChannelCategory(mockServerDoc, mockCategoryId),
    ).rejects.toThrow('Channel category not found');
  });

  it("saves the updated server by default when saveDocument option isn't defined", async () => {
    const mockCategoryId = mockServerDoc.channelCategories[1]._id;

    await deleteChannelCategory(mockServerDoc, mockCategoryId.toString());

    expect(mockServerDoc.save).toHaveBeenCalled();
  });

  it('returns the mutated doc', async () => {
    const mockCategoryId = mockServerDoc.channelCategories[1]._id;

    const returnedDoc = await deleteChannelCategory(
      mockServerDoc,
      mockCategoryId.toString(),
    );

    expect(returnedDoc).toBe(mockServerDoc);
  });
});

describe('patchChannel', () => {
  let mockServerDoc = getServerDocFixture();
  const mockPatch = [
    { op: 'replace', path: '/name', value: 'Changed channel name' },
  ];

  let patchSpy = jest.spyOn(patchService, 'patchDoc');

  beforeEach(() => {
    patchSpy = jest.spyOn(patchService, 'patchDoc');
    patchSpy.mockImplementationOnce((targetDoc) => targetDoc);
  });

  afterEach(() => {
    patchSpy.mockRestore();
    mockServerDoc = getServerDocFixture();
  });

  it('calls patchDoc with the correct arguments', async () => {
    const mockChannelId = mockServerDoc.channelCategories[1].channels[0]._id;
    const pathToPatchedChannel = 'channelCategories.1.channels.0';

    await patchChannel(mockServerDoc, mockChannelId.toString(), mockPatch);

    expect(patchSpy.mock.calls[0]).toEqual([
      mockServerDoc,
      expect.objectContaining({}),
      mockPatch,
      pathToPatchedChannel,
    ]);
  });

  it('throws "Channel not found" when passed invalid channelId', async () => {
    const mockChannelId = 'invalid category id';
    await expect(
      patchChannel(mockServerDoc, mockChannelId, mockPatch),
    ).rejects.toThrow('Channel not found');
  });

  it("saves the updated server by default when saveDocument option isn't defined", async () => {
    const mockChannelId = mockServerDoc.channelCategories[1].channels[0]._id;

    await patchChannel(mockServerDoc, mockChannelId.toString(), mockPatch);

    expect(mockServerDoc.save).toHaveBeenCalled();
  });

  it('returns the mutated doc', async () => {
    const mockChannelId = mockServerDoc.channelCategories[1].channels[0]._id;

    const returnedDoc = await patchChannel(
      mockServerDoc,
      mockChannelId.toString(),
      mockPatch,
    );

    expect(returnedDoc).toBe(mockServerDoc);
  });
});

describe('deleteChannel', () => {
  let mockServerDoc = getServerDocFixture();

  beforeEach(() => {
    mockServerDoc = getServerDocFixture();
  });

  it('removes the channel from the Server doc', async () => {
    const mockChannelId = mockServerDoc.channelCategories[1].channels[0]._id;
    const initialChannelsLength =
      mockServerDoc.channelCategories[1].channels.length;

    const returnedDoc = await deleteChannel(
      mockServerDoc,
      mockChannelId.toString(),
    );

    expect(returnedDoc.channelCategories[1].channels.length).toBe(
      initialChannelsLength - 1,
    );
    expect(returnedDoc.channelCategories[1].channels).not.toContainEqual(
      expect.objectContaining({
        _id: mockChannelId,
      }),
    );
  });

  it('throws "Channel not found" when passed an invalid channelId', async () => {
    const mockChannelId = 'invalid category id';

    await expect(deleteChannel(mockServerDoc, mockChannelId)).rejects.toThrow(
      'Channel not found',
    );
  });

  it("saves the updated server by default when saveDocument option isn't defined", async () => {
    const mockChannelId = mockServerDoc.channelCategories[1].channels[0]._id;

    await deleteChannel(mockServerDoc, mockChannelId.toString());

    expect(mockServerDoc.save).toHaveBeenCalled();
  });

  it('returns the mutated doc', async () => {
    const mockChannelId = mockServerDoc.channelCategories[1].channels[0]._id;

    const returnedDoc = await deleteChannel(
      mockServerDoc,
      mockChannelId.toString(),
    );

    expect(returnedDoc).toBe(mockServerDoc);
  });
});

describe('removeMember', () => {
  let mockServerDoc = getServerDocFixture();

  beforeEach(() => {
    mockServerDoc = getServerDocFixture();
  });

  it('removes provided memberId from server.members array', async () => {
    const memberIdToRemove = new mongoose.Types.ObjectId();
    mockServerDoc = getServerDocFixture({
      members: [
        new mongoose.Types.ObjectId(),
        memberIdToRemove,
        new mongoose.Types.ObjectId(),
      ],
    });
    const initialMembersLength = mockServerDoc.members.length;

    const returnedDoc = await removeMember(
      mockServerDoc,
      memberIdToRemove.toString(),
    );

    expect(returnedDoc.members.length).toBe(initialMembersLength - 1);
    expect(returnedDoc.members).not.toContainEqual(memberIdToRemove);
  });

  it("saves the updated server by default when saveDocument option isn't defined", async () => {
    const memberIdToRemove = new mongoose.Types.ObjectId();
    mockServerDoc = getServerDocFixture({
      members: [memberIdToRemove],
    });

    await removeMember(mockServerDoc, memberIdToRemove.toString());

    expect(mockServerDoc.save).toHaveBeenCalled();
  });

  it('returns the mutated doc', async () => {
    const memberIdToRemove = new mongoose.Types.ObjectId();
    mockServerDoc = getServerDocFixture({
      members: [memberIdToRemove],
    });

    const returnedDoc = await removeMember(
      mockServerDoc,
      memberIdToRemove.toString(),
    );

    expect(returnedDoc).toBe(mockServerDoc);
  });
});

describe('getChannelSocketIds', () => {
  it('gets socketIds from provided server doc', async () => {
    const mockSocketId1 = new mongoose.Types.ObjectId();
    const mockSocketId2 = new mongoose.Types.ObjectId();

    const mockServerDoc = getServerDocFixture({
      channelCategories: [
        {
          channels: [{ socketId: mockSocketId1 } as IChannel],
        } as IChannelCategory,
        {
          channels: [{ socketId: mockSocketId2 } as IChannel],
        } as IChannelCategory,
      ],
    });

    const returnedValue = await getChannelSocketIds(mockServerDoc);

    expect(returnedValue).toEqual([
      mockSocketId1.toString(),
      mockSocketId2.toString(),
    ]);
  });
});

describe('getServerSocketId', () => {
  it('returns server.socketId as a string', async () => {
    const mockServerDoc = getServerDocFixture();
    const mockSocketId = mockServerDoc.socketId;

    const returnedValue = await getServerSocketId(mockServerDoc);

    expect(returnedValue).toBe(mockSocketId.toString());
  });
});
