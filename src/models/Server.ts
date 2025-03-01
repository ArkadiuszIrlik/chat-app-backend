import { getAssetUrl } from '@helpers/fetch.helpers.js';
import mongoose, { Schema, Types, Model } from 'mongoose';

export enum DemoChannelIds {
  General = '677fe20cafdc934e773604c8',
  Pics = '677fe20cafdc934e773604c9',
}

export interface IChannel {
  _id: Types.ObjectId;
  name: string;
  type: 'text' | 'voice';
  socketId: Types.ObjectId;
  demoChannelId: DemoChannelIds;
}

export interface IChannelCategory {
  _id: Types.ObjectId;
  name: string;
  channels: IChannel[];
}

type THydratedChannelCategoryDocument = {
  channels?: Types.DocumentArray<IChannel>;
};

type ChannelCategoryModelType = Model<
  IChannelCategory,
  {},
  {},
  {},
  THydratedChannelCategoryDocument
>;

export type ServerImage = string;

export interface IServer {
  _id: Types.ObjectId;
  name: string;
  serverImg: ServerImage;
  ownerId: Types.ObjectId;
  members: Types.ObjectId[];
  channelCategories: IChannelCategory[];
  socketId: Types.ObjectId;
}

export type THydratedServerDocument = {
  channelCategories?: Types.DocumentArray<IChannelCategory>;
};

type ServerModelType = Model<IServer, {}, THydratedServerDocument>;

const ChannelSchema = new mongoose.Schema<IChannel>({
  name: { type: String, required: true },
  type: { type: String, enum: ['text', 'voice'], required: true },
  socketId: {
    type: Schema.Types.ObjectId,
    required: true,
    default: () => new Types.ObjectId(),
  },
  demoChannelId: DemoChannelIds,
});

const ChannelCategorySchema = new mongoose.Schema<
  IChannelCategory,
  ChannelCategoryModelType
>({
  name: { type: String, required: true },
  channels: {
    type: [ChannelSchema],
    required: true,
    default: [],
  },
});

const ServerSchema = new mongoose.Schema<IServer, ServerModelType>(
  {
    name: { type: String, required: true },
    serverImg: {
      type: String,
      required: true,
      get: getServerImgUrl,
    },
    ownerId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    members: [
      { type: Schema.Types.ObjectId, ref: 'User', default: [], required: true },
    ],
    // @ts-expect-error
    channelCategories: {
      type: [ChannelCategorySchema],
      required: true,
      default: () => [
        {
          name: 'Text Channels',
          channels: [{ name: 'general', type: 'text' }],
        },
      ],
    },
    socketId: {
      type: Schema.Types.ObjectId,
      required: true,
      default: () => new Types.ObjectId(),
    },
  },
  { toJSON: { getters: true } },
);

function getServerImgUrl(imagePathname: ServerImage) {
  if (!imagePathname) {
    return '';
  }
  return getAssetUrl(imagePathname);
}

export default mongoose.model<IServer, ServerModelType>('Server', ServerSchema);
