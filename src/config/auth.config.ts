import { getClientUrl } from '@helpers/fetch.helpers.js';

const REFRESH_TOKEN_MAX_AGE = 30 * 24 * 60 * 60 * 1000;
const AUTH_JWT_MAX_AGE = 10 * 60 * 1000;
const TEMP_USER_MAX_AGE = 24 * 60 * 60 * 1000;
const CLIENT_RESET_PASSWORD_URL = getClientUrl('/reset-password');

export {
  REFRESH_TOKEN_MAX_AGE,
  AUTH_JWT_MAX_AGE,
  TEMP_USER_MAX_AGE,
  CLIENT_RESET_PASSWORD_URL,
};
