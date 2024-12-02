const SERVER_IMAGES_PATH = 'images/server/';
const USER_IMAGES_PATH = 'images/user/';
const USER_PRESET_IMAGES_PATH = 'images/user/preset-images/';
const STATIC_ASSETS_BASE_URL = process.env.BACKEND_ADDRESS
  ? new URL('static', process.env.BACKEND_ADDRESS).toString()
  : '';

export {
  SERVER_IMAGES_PATH,
  USER_IMAGES_PATH,
  USER_PRESET_IMAGES_PATH,
  STATIC_ASSETS_BASE_URL,
};
