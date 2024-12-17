import path from 'path';
import { SERVER_IMAGES_PATH, USER_IMAGES_PATH } from '@config/data.config.js';
import { ImageObject } from '@src/typesModule.js';
import fileUpload from 'express-fileupload';
import * as filesService from '@services/files.service.js';
import { getAssetUrl } from '@helpers/fetch.helpers.js';

async function _saveImageAsset(
  imageBuffer: fileUpload.UploadedFile,
  pathname: string,
): Promise<ImageObject> {
  const imgFileExt = imageBuffer.mimetype.split('/')[1];
  const nextImgObj: ImageObject = path.join(
    pathname,
    `${imageBuffer.md5}.${imgFileExt}`,
  );
  try {
    await imageBuffer.mv(`./assets/${nextImgObj}`);
    return nextImgObj;
  } catch (err) {
    throw err;
  }
}

async function saveServerImage(imageBuffer: fileUpload.UploadedFile) {
  return _saveImageAsset(imageBuffer, SERVER_IMAGES_PATH);
}

async function saveUserProfileImage(imageBuffer: fileUpload.UploadedFile) {
  return _saveImageAsset(imageBuffer, USER_IMAGES_PATH);
}

function removeImage(imageObject: ImageObject) {
  return filesService.removeFile(path.join('./assets/', imageObject));
}

const originalPresetProfileImgs: {
  id: ImageObject;
  altText: string;
  pathname: string;
}[] = [
  {
    altText: 'closeup futuristic soldier image',
    id: 'images/user/preset-images/553df52533b6c45e59da0f5b1e2efc3d.png',
    pathname: 'images/user/preset-images/553df52533b6c45e59da0f5b1e2efc3d.png',
  },
  {
    altText: 'angry gorilla image',
    id: 'images/user/preset-images/072e974791b34e994847f56f07bb92c0.png',
    pathname: 'images/user/preset-images/072e974791b34e994847f56f07bb92c0.png',
  },
  {
    altText: 'cartoon hedgehog image',
    id: 'images/user/preset-images/fc240c93384ba3ff7685d552e0f8abb3.png',
    pathname: 'images/user/preset-images/fc240c93384ba3ff7685d552e0f8abb3.png',
  },
  {
    altText: 'cartoon barbarian image',
    id: 'images/user/preset-images/27cf650f4eeb77dc01687f82453d1edc.png',
    pathname: 'images/user/preset-images/27cf650f4eeb77dc01687f82453d1edc.png',
  },
];

const presetProfileImgs = originalPresetProfileImgs.map((preset) => ({
  id: preset.id,
  altText: preset.altText,
  url: getAssetUrl(preset.pathname),
}));

const presetServerImgs = originalPresetProfileImgs.map((preset) => ({
  id: preset.id,
  altText: preset.altText,
  url: getAssetUrl(preset.pathname),
}));

export {
  presetProfileImgs,
  presetServerImgs,
  saveServerImage,
  saveUserProfileImage,
  removeImage,
};
