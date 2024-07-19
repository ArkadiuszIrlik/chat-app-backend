import argon2 from 'argon2';

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

export { hashPassword };
