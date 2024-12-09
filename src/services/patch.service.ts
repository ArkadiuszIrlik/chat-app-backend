import jsonpatch from 'jsonpatch';
import { IUser } from '@models/User.js';
import { IChannel, IChannelCategory, IServer } from '@models/Server.js';
import { flatten } from 'mongo-dot-notation';
import { HydratedDocument } from 'mongoose';

function getPatchableUser(user: HydratedDocument<IUser>) {
  const { username, profileImgData, prefersOnlineStatus } = user.toObject();
  const patchableDoc = { username, profileImgData, prefersOnlineStatus };
  return patchableDoc;
}

/** Takes a Server document and returns an object with a subset of
 * its properties that are safe to use with JSON Patch.
 */
function getPatchableServer(server: HydratedDocument<IServer>) {
  const { name, channelCategories, serverImg } = server.toObject();

  const patchableDoc = { name, serverImg, channelCategories };

  return patchableDoc;
}

function getPatchableChannelCategory(category: IChannelCategory) {
  const { name } = category;
  const patchableDoc = { name };
  return patchableDoc;
}

function getPatchableChannel(channel: IChannel) {
  const { name } = channel;
  const patchableDoc = { name };
  return patchableDoc;
}

/** Uses JSONPatch to modify the provided target document.
 *
 * @param targetDoc mongoose document you want to patch
 * @param patchableSubset a document containing only the properties
 * you want to be patchable
 * @param patch a correctly formatted array of JSONPatch documents
 * @param pathToPatch optional path string using mongo dot notation
 * in case you want to patch a nested object
 * @returns mutated version of the targetDoc with the patch applied
 */
function patchDoc<ISchema>(
  targetDoc: HydratedDocument<ISchema>,
  patchableSubset: Record<string, any>,
  patch: string | any[],
  pathToPatch?: string,
) {
  const patchedDoc = jsonpatch.apply_patch(patchableSubset, patch);
  // makes sure the client doesn't add properties not included in
  // patchableDoc
  const processedPatchedDoc: typeof patchableSubset = {};
  Object.keys(patchableSubset).forEach(
    (key) => (processedPatchedDoc[key] = patchedDoc[key]),
  );

  // flatten returns object in format {$set: updateObject}, hence
  // the call to Object.values to extract updateObject
  const flattenedPatchedDoc: Record<string, any> =
    Object.values(flatten(processedPatchedDoc, { array: true }))[0] ?? {};

  const updateObject: Record<string, any> = {};
  Object.keys(flattenedPatchedDoc).forEach((key) => {
    updateObject[`${pathToPatch ? `${pathToPatch}.${key}` : key}`] =
      flattenedPatchedDoc[key];
  });

  targetDoc.set(updateObject);
  return targetDoc;
}

function updateCommandValue(patch: any[], pathToCommand: string, value: any) {
  patch.forEach((command) => {
    if (command?.path === pathToCommand) {
      command.value = value;
    }
  });
  return patch;
}

/** Checks if provided JSON Patch document includes a command
 * targeting a property at provided path.
 *
 * @param patch JSON Patch document
 * @param propertyPointer path to property you want to check, in JSON Pointer format
 * @returns boolean hasProperty value
 */
function checkIfPatchHasProperty(patch: any[], propertyPointer: string) {
  const hasProperty = !!patch.find(
    (command) => command.path === propertyPointer,
  );

  return hasProperty;
}

export {
  getPatchableUser,
  getPatchableServer,
  getPatchableChannelCategory,
  getPatchableChannel,
  patchDoc,
  updateCommandValue,
  checkIfPatchHasProperty,
};
