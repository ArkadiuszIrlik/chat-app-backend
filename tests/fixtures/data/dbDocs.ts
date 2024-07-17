import { USER_IMAGES_PATH } from '@config/data.config.js';
import { IServer } from '@models/Server.js';
import { IUser } from '@models/User.js';
import { UserOnlineStatus } from '@src/typesModule.js';
import mongoose, { HydratedDocument } from 'mongoose';
import path from 'path';

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
            _id: new mongoose.Types.ObjectId(),
            name: 'Test Channel 1',
            type: 'text',
            socketId: new mongoose.Types.ObjectId(),
          },
          {
            _id: new mongoose.Types.ObjectId(),
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
            _id: new mongoose.Types.ObjectId(),
            name: 'Test Channel 3',
            type: 'text',
            socketId: new mongoose.Types.ObjectId(),
          },
          {
            _id: new mongoose.Types.ObjectId(),
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

function getUserFixture(dataOverride: Partial<IUser> = {}): IUser {
  const userFixture: IUser = {
    // _id: new mongoose.Types.ObjectId(),
    email: 'testemail@example.com',
    // 'Y0uWUr/BZyeXXr4j/sXa9w'
    password:
      '$argon2id$v=19$m=19456,t=2,p=1$X7qHGLhmr30I2c7T7dbV2w$MPp+sKN3cHGxnALT/G1Tu5Ela/cvv+gD8qwFZlJm9tU',
    username: 'testuser123',
    // @ts-ignore
    profileImg: './tests/fixtures/assets/images/user/test-user-img.jpg',
    prefersOnlineStatus: UserOnlineStatus.Online,
    serversIn: [],
    chatsIn: [],
    friends: [],
    refreshTokens: [],
  };

  return { ...userFixture, ...dataOverride };
}

/** Returns a mock User document with mongoose functions replaced
 * with jest mocks.
 *
 * @param dataOverride object with replacement values for any of the
 * properties, both the document values and the mongoose functions
 */
function getUserDocFixture(
  dataOverride: Partial<HydratedDocument<IUser>> = {},
): HydratedDocument<IUser> {
  const baseDocProperties = getUserValuesFixture();
  const mongooseProperties = {
    _id: new mongoose.Types.ObjectId(),
    save: jest.fn(),
    populate: jest.fn(),
  };

  const objectWithOverrides = {
    ...baseDocProperties,
    ...mongooseProperties,
    ...dataOverride,
  };

  function toObject() {
    const baseWithOverrides = Object.fromEntries(
      (
        Object.keys(baseDocProperties) as (keyof typeof baseDocProperties)[]
      ).map((key) => [key, objectWithOverrides[key]]),
    );
    return {
      ...baseWithOverrides,
      profileImg: baseDocProperties.profileImg.get(),
      _id: objectWithOverrides._id,
      id: objectWithOverrides._id.toString(),
    };
  }

  return {
    ...baseDocProperties,
    ...mongooseProperties,
    ...dataOverride,
    toObject: dataOverride.toObject ?? toObject,
  } as HydratedDocument<IUser>;
}

/** Returns an object with mock values, implementing the User
 * schema. Can be passed into the User model constructor to
 * create a User document.
 * @param dataOverride object with replacement values for any of the
 * properties
 */
function getUserValuesFixture(dataOverride: Partial<IUser> = {}): IUser {
  const userFixture = {
    // _id: new mongoose.Types.ObjectId(),
    email: 'testemail@example.com',
    // 'Y0uWUr/BZyeXXr4j/sXa9w'
    password:
      '$argon2id$v=19$m=19456,t=2,p=1$X7qHGLhmr30I2c7T7dbV2w$MPp+sKN3cHGxnALT/G1Tu5Ela/cvv+gD8qwFZlJm9tU',
    username: 'testuser123',
    profileImg: {
      pathname: path.join(USER_IMAGES_PATH, `testUserProfileImg.jpeg`),
      name: 'testUserProfileImg',
      ext: 'jpeg',
      get: () => 'https://testurl.url/testUserProfileImg.jpeg',
    },
    prefersOnlineStatus: UserOnlineStatus.Online,
    serversIn: [],
    chatsIn: [],
    friends: [],
    refreshTokens: [],
  };

  return { ...userFixture, ...dataOverride };
}

export {
  getServerFixture,
  getUserFixture,
  getUserDocFixture,
  getUserValuesFixture,
};
