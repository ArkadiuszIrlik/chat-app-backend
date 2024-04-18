import {
  logInUser,
  logOutUser,
  registerUser,
  verifyEmail,
} from '@controllers/auth.controller.js';
import express from 'express';

const router = express.Router();

router.post('/signup', registerUser);
router.post('/login', logInUser);
router.get('/logout', logOutUser);
router.get('/verify-email', verifyEmail);

export default router;
