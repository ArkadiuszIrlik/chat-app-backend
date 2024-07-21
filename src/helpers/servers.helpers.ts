import { IChannel, IChannelCategory } from '@models/Server.js';
import { HydratedArraySubdocument } from 'mongoose';

function getChannelsFromCategories(categoriesList: IChannelCategory[]) {
  const channels: HydratedArraySubdocument<IChannel>[] = [];
  categoriesList.forEach((category) =>
    channels.push(
      ...(category.channels as HydratedArraySubdocument<IChannel>[]),
    ),
  );
  return channels;
}

export { getChannelsFromCategories };
