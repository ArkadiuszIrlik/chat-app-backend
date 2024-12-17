import {
  SUPPORTED_PROFILE_IMG_MIME_TYPES,
  SUPPORTED_SERVER_IMG_MIME_TYPES,
} from '@config/data.config.js';
import {
  getPresetProfileImages,
  getPresetServerImages,
  uploadProfileImg,
  uploadServerImg,
} from '@controllers/images.controller.js';
import { validate } from '@middleware/validation.middleware.js';
import { ExtendedYup } from '@src/extendedYup.js';
import express from 'express';

const router = express.Router();

router.post(
  '/profile-img',
  validate({
    files: {
      image: ExtendedYup.mixed()
        .notArray('Single profile image expected')
        .oneOfMimeType(
          SUPPORTED_PROFILE_IMG_MIME_TYPES,
          'Unsupported file format',
        )
        .notTruncated("Profile image can't be bigger than 2MB")
        .required('Image upload missing'),
    },
  }),
  uploadProfileImg,
);
router.get('/profile-img/presets', getPresetProfileImages);
router.post(
  '/server-img',
  validate({
    files: {
      image: ExtendedYup.mixed()
        .notArray('Single server image expected')
        .oneOfMimeType(
          SUPPORTED_SERVER_IMG_MIME_TYPES,
          'Unsupported file format',
        )
        .notTruncated("Server image can't be bigger than 2MB")
        .required('Image upload missing'),
    },
  }),
  uploadServerImg,
);
router.get('/server-img/presets', getPresetServerImages);

export default router;
