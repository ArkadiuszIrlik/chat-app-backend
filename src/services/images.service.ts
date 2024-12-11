import path from 'path';
import { SERVER_IMAGES_PATH, USER_IMAGES_PATH } from '@config/data.config.js';
import { ImageObject } from '@src/typesModule.js';
import fileUpload from 'express-fileupload';
import * as filesService from '@services/files.service.js';

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

export { saveServerImage, saveUserProfileImage, removeImage };
