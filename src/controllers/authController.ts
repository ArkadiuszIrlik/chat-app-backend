import { NextFunction, Request, Response } from 'express';
import argon2 from 'argon2';
import User from '@models/User.js';

export async function registerUser(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const { email, password } = req.body;

    const hashedPassword = await argon2.hash(password, {
      type: argon2.argon2id,
      memoryCost: 19456,
      timeCost: 2,
      parallelism: 1,
      secret: Buffer.from(process.env.PASSWORD_PEPPER!),
    });

    await User.create({
      email,
      password: hashedPassword,
    });

    return res.status(201).json({
      message: 'User registered successfully',
    });
  } catch (err) {
    return next(err);
  }
}
