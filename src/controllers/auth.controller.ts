import { Request, Response } from 'express';
import * as authService from '@services/auth.service.js';
import * as usersService from '@services/users.service.js';
import * as mailService from '@services/mail.service.js';
import * as tempUsersService from '@services/tempUsers.service.js';
import * as trackingService from '@services/tracking.service.js';
import * as clientService from '@services/client.service.js';
import { CLIENT_RESET_PASSWORD_PATH } from '@config/client.config.js';

export async function registerUser(req: Request, res: Response) {
  const { email, password } = req.body;

  const existingEmailUser = usersService.getUserByEmail(email);
  const hashedPassword = await authService.hashPassword(password);
  const isExistingEmail = !!(await existingEmailUser);

  if (!isExistingEmail) {
    const tempUser = await tempUsersService.createTempUser(
      email,
      hashedPassword,
    );
    const verificationToken =
      await tempUsersService.getTempUserVerificationToken(tempUser);
    const clientVerificationUrl =
      clientService.getEmailVerificationUrl(verificationToken);

    await mailService.sendVerifyEmailNewAccount(email, clientVerificationUrl);
  } else {
    const userTrackingInfo = await trackingService.getUserTrackingInfo(req);
    const resetPasswordUrl = clientService.getClientUrl(
      CLIENT_RESET_PASSWORD_PATH,
    );

    await mailService.sendExistingEmailRegisterAttempt(
      email,
      resetPasswordUrl,
      userTrackingInfo,
    );
  }

  return res.status(200).json({
    message: 'Confirmation email sent to provided address',
  });
}

export async function logInUser(req: Request, res: Response) {
  const { email, password } = req.body;

  const user = await usersService.getUserByEmail(email);

  // prevent timing attacks when user not found
  if (!user) {
    const placeholderPassword =
      '$argon2id$v=19$m=19456,t=2,p=1$a0Ssm0ypgf6Tb5TU5usH0A$wvwQMNUX1kOasnZdXgkrpaOivDCzCdOR3ervvKya4JI';
    await authService.verifyPasswordMatch(placeholderPassword, password);
    return res.status(400).json({ message: 'Invalid email or password' });
  }

  const userPassword = await usersService.getUserPassword(user);
  const passwordMatch = await authService.verifyPasswordMatch(
    userPassword,
    password,
  );
  if (!passwordMatch) {
    return res.status(400).json({ message: 'Invalid email or password' });
  }

  const userId = usersService.getUserId(user);
  const userEmail = await usersService.getUserEmail(user);
  const authToken = await authService.signAuthJwt(userId, userEmail);
  authService.setAuthCookie(res, authToken);

  const refreshTokenObject = authService.generateRefreshTokenObject();
  await usersService.addRefreshToken(user, refreshTokenObject);
  const refreshToken =
    authService.getTokenFromRefreshTokenObject(refreshTokenObject);
  authService.setRefreshCookie(res, refreshToken);

  return res.status(200).json({
    message: 'Logged in successfully',
  });
}

export function logOutUser(_req: Request, res: Response) {
  authService.logOutUser(res);
  return res.json({ message: 'Logged out successfully' });
}

export async function verifyEmail(req: Request, res: Response) {
  // type checked by validation middleware
  const verificationToken = req.query.token as string;

  const tempUser =
    await tempUsersService.getTempUserFromToken(verificationToken);
  if (tempUser === null) {
    return res.status(404).json({ message: 'Invalid verification token' });
  }

  const isExpired = await tempUsersService.checkIfTempUserExpired(tempUser);
  if (isExpired) {
    return res.status(404).json({ message: 'Verification token expired' });
  }

  await usersService.createUser(tempUser);

  return res.status(200).json({
    message: 'Email address verified successfully',
  });
}
