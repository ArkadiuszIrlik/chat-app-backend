const SERVER_IMAGES_PATH = 'images/server/';
const USER_IMAGES_PATH = 'images/user/';
const STATIC_ASSETS_BASE_URL = new URL(
  'static',
  process.env.BACKEND_ADDRESS ?? '',
);

export { SERVER_IMAGES_PATH, USER_IMAGES_PATH, STATIC_ASSETS_BASE_URL };
