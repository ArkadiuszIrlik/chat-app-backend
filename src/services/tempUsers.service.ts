import { TEMP_USER_MAX_AGE } from '@config/auth.config.js';
import TempUser from '@models/TempUser.js';

function createTempUser(email: string, hashedPassword: string) {
  return TempUser.create({
    email,
    password: hashedPassword,
    expDate: new Date(Date.now() + TEMP_USER_MAX_AGE),
  });
}
export { createTempUser };
