import { IServer } from '@models/Server.js';
import mongoose from 'mongoose';

function getServerFixture(dataOverride: Partial<IServer> = {}): IServer {
  const serverFixture: IServer = {
    //   _id: new mongoose.Types.ObjectId(),
    name: 'Test Server',
    serverImg: {
      pathname: 'images/server/test-server-img.jpg',
      name: 'test-server-img.jpg',
      ext: 'jpg',
      get: () => './tests/fixtures/assets/images/server/test-server-img.jpg',
    },
    ownerId: new mongoose.Types.ObjectId(),
    members: [
      new mongoose.Types.ObjectId(),
      new mongoose.Types.ObjectId(),
      new mongoose.Types.ObjectId(),
    ],
    channelCategories: [
      {
        _id: new mongoose.Types.ObjectId(),
        name: 'Test Category 1',
        channels: [
          {
            //   _id: new mongoose.Types.ObjectId(),
            name: 'Test Channel 1',
            type: 'text',
            socketId: new mongoose.Types.ObjectId(),
          },
          {
            //   _id: new mongoose.Types.ObjectId(),
            name: 'Test Channel 2',
            type: 'text',
            socketId: new mongoose.Types.ObjectId(),
          },
        ],
      },
      {
        _id: new mongoose.Types.ObjectId(),
        name: 'Test Category 2',
        channels: [
          {
            //   _id: new mongoose.Types.ObjectId(),
            name: 'Test Channel 3',
            type: 'text',
            socketId: new mongoose.Types.ObjectId(),
          },
          {
            //   _id: new mongoose.Types.ObjectId(),
            name: 'Test Channel 4',
            type: 'text',
            socketId: new mongoose.Types.ObjectId(),
          },
        ],
      },
    ],
    socketId: new mongoose.Types.ObjectId(),
  };

  return { ...serverFixture, ...dataOverride };
}

export { getServerFixture };
