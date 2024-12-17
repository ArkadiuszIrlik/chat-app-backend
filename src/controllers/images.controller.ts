import { Request, Response } from 'express';
import fileUpload from 'express-fileupload';
import * as imagesService from '@services/images.service.js';

async function uploadProfileImg(req: Request, res: Response) {
  // type tested by validation middleware
  const tempImage = req.files?.image as fileUpload.UploadedFile;
  const imageObject = await imagesService.saveUserProfileImage(tempImage);

  return res.status(201).json({
    message: 'Image uploaded',
    data: {
      image: imageObject,
    },
  });
}

async function getPresetProfileImages(_req: Request, res: Response) {
  const presets = imagesService.presetProfileImgs;

  return res
    .status(200)
    .json({ message: 'Presets returned', data: { presets } });
}

async function uploadServerImg(req: Request, res: Response) {
  // type tested by validation middleware
  const tempImage = req.files?.image as fileUpload.UploadedFile;
  const imageObject = await imagesService.saveServerImage(tempImage);

  return res.status(201).json({
    message: 'Image uploaded',
    data: {
      image: imageObject,
    },
  });
}

async function getPresetServerImages(_req: Request, res: Response) {
  const presets = imagesService.presetServerImgs;

  return res
    .status(200)
    .json({ message: 'Presets returned', data: { presets } });
}

export {
  uploadProfileImg,
  getPresetProfileImages,
  uploadServerImg,
  getPresetServerImages,
};
