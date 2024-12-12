import { uploadProfileImg } from '@controllers/images.controller.js';
import express from 'express';

const router = express.Router();

router.post('/profile-img', uploadProfileImg);

export default router;
