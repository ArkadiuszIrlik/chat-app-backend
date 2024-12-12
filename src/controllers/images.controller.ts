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

export { uploadProfileImg };
