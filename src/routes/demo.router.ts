import { startDemo } from '@controllers/demo.controller.js';
import express from 'express';

const router = express.Router();

router.get('/', startDemo);

export default router;
