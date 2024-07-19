import mongoose from 'mongoose';
import {
  checkIfIsServerMessage,
  getMessages,
  getMessageServerId,
} from '@services/chat.service.js';

jest.mock('@models/ChatMessage.js', () => ({
  find: jest.fn(() => ChatMessage),
}));
import ChatMessage from '@models/ChatMessage.js';
import { getChatMessageDocFixture } from '@tests/fixtures/data/dbDocs.js';

afterEach(() => {
  jest.clearAllMocks();
});

describe('getMessages', () => {
  // @ts-ignore
  const mockFindReturn = {
    // @ts-ignore
    sort: jest.fn(() => mockFindReturn),
    populate: jest.fn(() => mockFindReturn),
    limit: jest.fn(() => mockFindReturn),
    exec: jest.fn(() => mockFindReturn),
  };

  beforeEach(() => {
    (ChatMessage.find as jest.Mock).mockImplementationOnce(
      () => mockFindReturn,
    );
  });

  it('calls ChatMessage.find with provided chatId', async () => {
    const mockChatId = new mongoose.Types.ObjectId();

    await getMessages(mockChatId.toString());

    expect(ChatMessage.find).toHaveBeenCalledWith(
      expect.objectContaining({ chatId: mockChatId.toString() }),
    );
  });

  it("doesn't populate author field when populateAuthor option isn't set", async () => {
    const mockChatId = new mongoose.Types.ObjectId();

    await getMessages(mockChatId.toString());

    expect(mockFindReturn.populate).not.toHaveBeenCalled();
  });

  it('populates author field when populateAuthor option is set to true', async () => {
    const mockChatId = new mongoose.Types.ObjectId();

    await getMessages(mockChatId.toString(), { populateAuthor: true });

    expect(mockFindReturn.populate).toHaveBeenCalledWith(
      'author',
      'username profileImg',
    );
  });
});

describe('checkIfIsServerMessage', () => {
  it('returns true when message.serverId property is defined', () => {
    const mockServerMessage = getChatMessageDocFixture('server');

    expect(checkIfIsServerMessage(mockServerMessage)).toBe(true);
  });

  it('returns false when message.serverId property is not defined', () => {
    const mockServerMessage = getChatMessageDocFixture('dm');

    expect(checkIfIsServerMessage(mockServerMessage)).toBe(false);
  });
});

describe('getMessageServerId', () => {
  it('returns the Id of a server ChatMessage', () => {
    const mockServerMessage = getChatMessageDocFixture('server');

    expect(getMessageServerId(mockServerMessage)).toBe(
      mockServerMessage.serverId,
    );
  });

  it('returns undefined when passed non-server message doc', () => {
    const mockServerMessage = getChatMessageDocFixture('dm');

    expect(getMessageServerId(mockServerMessage)).toBeUndefined();
  });
});
