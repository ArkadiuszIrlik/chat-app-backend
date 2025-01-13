import Server from '@models/Server.js';
import User, { IUser, UserAccountStatus } from '@models/User.js';
import { hashPassword } from '@services/auth.service.js';
import { HydratedDocument, Types } from 'mongoose';

enum MessageAuthorIds {
  John = '677a7ad6daef42ed69afdea8',
  Billy = '677a7ad6daef42ed69afdea9',
  Sue = '677d63d09f5268156bd6f254',
}

enum DemoChannelIds {
  General = '677fe20cafdc934e773604c8',
  Pics = '677fe20cafdc934e773604c9',
}

const templateServerStartDate = new Date('January 30, 2025, 12:00:00');
const initialMessageTemplates = [
  {
    authorId: MessageAuthorIds.John,
    textContent: 'Hey everyone',
    datePostedRelative: new Date('January 16, 2025, 16:59:23'),
    demoChannelId: DemoChannelIds.General,
  },
  {
    authorId: MessageAuthorIds.Billy,
    textContent: `What's up John. How are you doing?`,
    datePostedRelative: new Date('January 16, 2025, 17:00:05'),
    demoChannelId: DemoChannelIds.General,
  },
  {
    authorId: MessageAuthorIds.John,
    textContent: `I'm doing great! Happy to join you guys here.`,
    datePostedRelative: new Date('January 16, 2025, 17:00:45'),
    demoChannelId: DemoChannelIds.General,
  },
  {
    authorId: MessageAuthorIds.Sue,
    textContent: `Here's a little something to make your day better <a href="https://th.bing.com/th/id/OIP.AGHDNRbrMghFLo3hEzREUQHaFj" target="_blank">https://th.bing.com/th/id/OIP.AGHDNRbrMghFLo3hEzREUQHaFj</a>`,
    datePostedRelative: new Date('January 20, 2025, 11:34:35'),
    demoChannelId: DemoChannelIds.Pics,
  },
  {
    authorId: MessageAuthorIds.Billy,
    textContent: `God that's so cute 😍`,
    datePostedRelative: new Date('January 20, 2025, 11:42:50'),
    demoChannelId: DemoChannelIds.Pics,
  },
];
// avoids accidentally using someone's real email address
const emailUrl = new URL(process.env.FRONTEND_ADDRESS ?? 'https://example.com');
let demoUsers: HydratedDocument<IUser>[] = [];
const demoUserTemplates = [
  {
    _id: MessageAuthorIds.John,
    username: 'John',
    email: `belugademouser-c9ff9428-3d23-4879-9253-ea6d90a596f4@${emailUrl.hostname}`,
    password: 'nonsense-hash',
    profileImg:
      'images/user/preset-images/6baf1aad828a68c4db5cb123bafbb090.png',
    accountStatus: UserAccountStatus.Approved,
  },
  {
    _id: MessageAuthorIds.Billy,
    username: 'Billy',
    email: `belugademouser-d88e1dd3-e6e9-4679-9d47-22c3c0613d4e@${emailUrl.hostname}`,
    password: 'nonsense-hash',
    profileImg:
      'images/user/preset-images/fc240c93384ba3ff7685d552e0f8abb3.png',
    accountStatus: UserAccountStatus.Approved,
  },
  {
    _id: MessageAuthorIds.Sue,
    username: 'Sue',
    email: `belugademouser-741176d4-e02a-43c1-a263-bc6bcebfe8fb@${emailUrl.hostname}`,
    password: 'nonsense-hash',
    profileImg:
      'images/user/preset-images/27cf650f4eeb77dc01687f82453d1edc.png',
    accountStatus: UserAccountStatus.Approved,
  },
];

/** Adds or updates DB docs for "fake" users used in the demo. */
async function createFakeDemoUsers() {
  const userPromises = demoUserTemplates.map((template) =>
    User.findOneAndUpdate({ _id: template._id }, template, {
      upsert: true,
      new: true,
    }).exec(),
  );

  const users = await Promise.all(userPromises);
  const nextDemoUsers = users.filter((user) => user !== null);
  demoUsers = nextDemoUsers;
}

async function getDemoUsers() {
  if (demoUsers.length !== demoUserTemplates.length) {
    await createFakeDemoUsers();
  }
  return demoUsers;
}

/** Creates a new demo server instance.
 * @returns mongoose doc of the created server
 */
function createDemoServer(ownerId: string | Types.ObjectId) {
  const demoServer = new Server({
    name: 'Demo Server',
    ownerId: ownerId,
    serverImg: 'images/user/preset-images/6baf1aad828a68c4db5cb123bafbb090.png',
    channelCategories: [
      {
        name: 'General',
        channels: [
          {
            name: 'chat',
            type: 'text',
            demoChannelId: DemoChannelIds.General,
          },
          {
            name: 'cute cat pics 😸',
            type: 'text',
            demoChannelId: DemoChannelIds.Pics,
          },
        ],
      },
    ],
    members: [...Object.values(MessageAuthorIds), ownerId],
  });

  return demoServer;
}

/** Creates a new instance of a (human) demo user.
 * @param userId id for the new demo user doc
 * @param demoServerId id of the demo server instance created for this user
 * @returns mongoose doc of the created user
 */
async function createDemoUser(
  userId: string | Types.ObjectId,
  demoServerId: string | Types.ObjectId,
) {
  const password = await hashPassword(crypto.randomUUID());

  const demoUser = new User({
    _id: userId,
    username: 'Demo User',
    email: `belugademouser-${crypto.randomUUID()}@${emailUrl.hostname}`,
    password,
    profileImg:
      'images/user/preset-images/6baf1aad828a68c4db5cb123bafbb090.png',
    accountStatus: UserAccountStatus.Approved,
    serversIn: [demoServerId],
    demoStepOffset: 0,
    demoServer: demoServerId,
  });

  return demoUser;
}

export {
  createDemoUser,
  createFakeDemoUsers,
  createDemoServer,
  getDemoUsers,
  MessageAuthorIds,
  DemoChannelIds,
};
