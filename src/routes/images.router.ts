import {
  getPresetProfileImages,
  getPresetServerImages,
  uploadProfileImg,
  uploadServerImg,
} from '@controllers/images.controller.js';
import express from 'express';

const router = express.Router();

router.post('/profile-img', uploadProfileImg);
router.get('/profile-img/presets', getPresetProfileImages);
router.post('/server-img', uploadServerImg);
router.get('/server-img/presets', getPresetServerImages);

export default router;
