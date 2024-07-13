import {
  getPatchableServer,
  updateCommandValue,
  checkIfPatchHasProperty,
  patchDoc,
  getPatchableChannel,
  getPatchableChannelCategory,
} from '@services/patch.service.js';
import Server, { IServer } from '@models/Server.js';
import { getServerFixture } from '@tests/fixtures/data/dbDocs.js';
import { HydratedDocument } from 'mongoose';

let mockPatch = [
  { op: 'add', path: '/profileImg', value: 'link.To.Image' },
  { op: 'replace', path: '/username', value: 'cool_user' },
  {
    op: 'add',
    path: '/contactDetails/phoneNumbers/0',
    value: { number: '555-123' },
  },
];

describe('getPatchableServer', () => {
  it('returns object with only the following properties: name, serverImg, channelCategories', () => {
    const mockServer = new Server(getServerFixture());
    const returnedDoc = getPatchableServer(
      mockServer as HydratedDocument<IServer>,
    );

    expect(Object.keys(returnedDoc)).toEqual([
      'name',
      'serverImg',
      'channelCategories',
    ]);
  });
});

describe('updateCommandValue', () => {
  it('updates command value', () => {
    const returnedPatch = updateCommandValue(
      mockPatch,
      '/username',
      'even_cooler_user',
    );

    expect(returnedPatch[1].value).toEqual('even_cooler_user');
  });

  it('returns unchanged patch if path not found', () => {
    const returnedPatch = updateCommandValue(
      mockPatch,
      '/password',
      'secret_password',
    );

    expect(returnedPatch).toEqual(mockPatch);
  });
});

describe('checkIfPatchHasProperty', () => {
  it('returns true if property is in patch', () => {
    const returnedValue = checkIfPatchHasProperty(
      mockPatch,
      '/contactDetails/phoneNumbers/0',
    );

    expect(returnedValue).toBe(true);
  });

  it.each`
    propertyPath
    ${'/profileImg'}
    ${'/username'}
    ${'/contactDetails/phoneNumbers/0'}
  `(
    'returns true if property is in patch',

    ({ propertyPath }) => {
      const returnedValue = checkIfPatchHasProperty(mockPatch, propertyPath);

      expect(returnedValue).toBe(true);
    },
  );

  it('returns false when property is not in patch', () => {
    const returnedValue = checkIfPatchHasProperty(
      mockPatch,
      '/notAValidProperty',
    );

    expect(returnedValue).toBe(false);
  });
});

describe('patchDoc', () => {
  it('patches a document', () => {
    const mockServer = new Server(getServerFixture());

    const patchableServer = getPatchableServer(
      mockServer as HydratedDocument<IServer>,
    );
    const mockPatch = [
      { op: 'replace', path: '/name', value: 'Changed Server Name' },
    ];

    const returnedDoc = patchDoc(mockServer, patchableServer, mockPatch);
    expect(returnedDoc.name).toBe('Changed Server Name');
  });

  it("doesn't allow adding new properties to document", () => {
    const mockServer = new Server(getServerFixture());

    const patchableServer = getPatchableServer(
      mockServer as HydratedDocument<IServer>,
    );
    const mockPatch = [
      { op: 'add', path: '/notInTheSchema', value: 'text_value' },
    ];

    const returnedDoc = patchDoc(mockServer, patchableServer, mockPatch);
    expect(returnedDoc).not.toHaveProperty('notInTheSchema');
  });

  it('updates nested properties when provided a path', () => {
    const mockServer = new Server(getServerFixture());
    const mockChannel = mockServer.channelCategories![1].channels[1];
    const patchableChannel = getPatchableChannel(mockChannel);
    const mockPatch = [
      { op: 'replace', path: '/name', value: 'Changed Channel Name' },
    ];

    const returnedDoc = patchDoc(
      mockServer,
      patchableChannel,
      mockPatch,
      'channelCategories.1.channels.1',
    );
    expect(returnedDoc.channelCategories[1].channels[1].name).toBe(
      'Changed Channel Name',
    );
  });
});

describe('getPatchableChannelCategory', () => {
  it('returns object with only the following property: name', () => {
    const mockServer = new Server(getServerFixture());
    const mockChannelCategory = mockServer.channelCategories![0];
    const returnedDoc = getPatchableChannelCategory(mockChannelCategory);

    expect(Object.keys(returnedDoc)).toEqual(['name']);
  });
});

describe('getPatchableChannel', () => {
  it('returns object with only the following property: name', () => {
    const mockServer = new Server(getServerFixture());
    const mockChannel = mockServer.channelCategories![0].channels[0];
    const returnedDoc = getPatchableChannel(mockChannel);

    expect(Object.keys(returnedDoc)).toEqual(['name']);
  });
});
