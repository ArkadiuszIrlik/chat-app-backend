import path from 'path';
const SERVER_IMAGES_PATH = 'images/server/';
const USER_IMAGES_PATH = 'images/user/';
const STATIC_ASSETS_BASE_URL = path.join(
  process.env.FRONTEND_ADDRESS ?? '',
  'static',
);

export { SERVER_IMAGES_PATH, USER_IMAGES_PATH, STATIC_ASSETS_BASE_URL };
