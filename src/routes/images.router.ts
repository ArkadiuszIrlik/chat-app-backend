import {
  getPresetProfileImages,
  uploadProfileImg,
} from '@controllers/images.controller.js';
import express from 'express';

const router = express.Router();

router.post('/profile-img', uploadProfileImg);
router.get('/profile-img/presets', getPresetProfileImages);

export default router;
