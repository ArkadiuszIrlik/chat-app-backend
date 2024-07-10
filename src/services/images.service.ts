import { SERVER_IMAGES_PATH } from '@config/data.config.js';
import fileUpload from 'express-fileupload';

async function _saveImageAsset(
  imageBuffer: fileUpload.UploadedFile,
  pathname: string,
) {
  const imgFileExt = imageBuffer.mimetype.split('/')[1];
  const nextImgObj = {
    pathname: `${pathname}${imageBuffer.md5}.${imgFileExt}`,
    name: imageBuffer.md5,
    ext: imgFileExt,
  };
  try {
    await imageBuffer.mv(`./assets/${nextImgObj.pathname}`);
    return nextImgObj;
  } catch (err) {
    throw err;
  }
}

async function saveServerImage(imageBuffer: fileUpload.UploadedFile) {
  return _saveImageAsset(imageBuffer, SERVER_IMAGES_PATH);
}

export { saveServerImage };
