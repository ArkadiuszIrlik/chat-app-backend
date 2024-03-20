import {
  logInUser,
  logOutUser,
  registerUser,
} from '@controllers/authController.js';
import express from 'express';

const router = express.Router();

router.post('/signup', registerUser);
router.post('/login', logInUser);
router.get('/logout', logOutUser);

export default router;
