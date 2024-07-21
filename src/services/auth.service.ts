import {
  AUTH_JWT_MAX_AGE,
  REFRESH_TOKEN_MAX_AGE,
} from '@config/auth.config.js';
import { IRefreshTokenObject } from '@models/User.js';
import argon2 from 'argon2';
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';

async function hashPassword(password: string) {
  if (!process.env.PASSWORD_PEPPER) {
    console.error('Missing PASSWORD_PEPPER environment variable');
    throw Error('Server error');
  }
  const hashedPassword = await argon2.hash(password, {
    type: argon2.argon2id,
    memoryCost: 19456,
    timeCost: 2,
    parallelism: 1,
    secret: Buffer.from(process.env.PASSWORD_PEPPER),
  });

  return hashedPassword;
}

function verifyPasswordMatch(hashedPassword: string, plainPassword: string) {
  if (!process.env.PASSWORD_PEPPER) {
    console.error('PASSWORD_PEPPER env variable missing');
    throw Error('Server error');
  }

  return argon2.verify(hashedPassword, plainPassword, {
    secret: Buffer.from(process.env.PASSWORD_PEPPER),
  });
}

function signAuthJwt(userId: mongoose.Types.ObjectId | string, email: string) {
  return new Promise<string>((resolve, reject) => {
    if (!process.env.JWT_SECRET) {
      console.error('JWT_SECRET environment variable missing');
      return reject('Server error');
    }
    jwt.sign(
      { userId },
      process.env.JWT_SECRET,
      {
        expiresIn: `${AUTH_JWT_MAX_AGE}ms`,
        subject: email,
      },
      (err, encoded) => {
        if (err) {
          return reject(err);
        } else {
          resolve(encoded!);
        }
      },
    );
  });
}

function generateRefreshTokenObject() {
  const token = crypto.randomUUID();
  const refreshTokenObj: IRefreshTokenObject = {
    token,
    expDate: new Date(Date.now() + REFRESH_TOKEN_MAX_AGE),
  };

  return refreshTokenObj;
}

function getTokenFromRefreshTokenObject(
  refreshTokenObject: IRefreshTokenObject,
) {
  return refreshTokenObject.token;
}

export {
  hashPassword,
  verifyPasswordMatch,
  signAuthJwt,
  generateRefreshTokenObject,
  getTokenFromRefreshTokenObject,
};
