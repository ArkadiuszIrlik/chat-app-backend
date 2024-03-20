import express from 'express';
import { getUserFromAuth } from '@controllers/users.controller.js';

const router = express.Router();

router.get('/self', getUserFromAuth);

export default router;
