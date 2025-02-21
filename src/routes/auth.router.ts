import {
  logInUser,
  logOutUser,
  registerUser,
  verifyEmail,
} from '@controllers/auth.controller.js';
import { validate } from '@middleware/validation.middleware.js';
import { ExtendedYup } from '@src/extendedYup.js';
import express from 'express';

const router = express.Router();

router.post(
  '/signup',
  validate({
    body: {
      email: ExtendedYup.string()
        .trim()
        .email('Invalid email address.')
        .required('Please enter an email.'),
      password: ExtendedYup.string()
        .min(8, 'Password has to be at least 8 characters long.')
        .max(100, "Password can't be longer than 100 characters.")
        .required('Please enter a password.'),
    },
  }),
  registerUser,
);
router.post('/login', logInUser);
router.get('/logout', logOutUser);
router.get('/verify-email', verifyEmail);

export default router;
