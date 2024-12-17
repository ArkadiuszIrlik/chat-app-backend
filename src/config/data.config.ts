const SERVER_IMAGES_PATH = 'images/server/';
const USER_IMAGES_PATH = 'images/user/';
const STATIC_ASSETS_BASE_URL = new URL(
  'static',
  process.env.BACKEND_ADDRESS,
).toString();
// human-readable string listing the allowed formats
const SUPPORTED_PROFILE_IMG_FORMATS_HUMAN = '.jpg, .png, .webp, .svg, .avif';
const SUPPORTED_PROFILE_IMG_MIME_TYPES = [
  'image/jpeg',
  'image/avif',
  'image/svg+xml',
  'image/png',
  'image/webp',
];
const SUPPORTED_SERVER_IMG_FORMATS_HUMAN = SUPPORTED_PROFILE_IMG_FORMATS_HUMAN;
const SUPPORTED_SERVER_IMG_MIME_TYPES = SUPPORTED_PROFILE_IMG_MIME_TYPES;

export {
  SERVER_IMAGES_PATH,
  USER_IMAGES_PATH,
  STATIC_ASSETS_BASE_URL,
  SUPPORTED_PROFILE_IMG_FORMATS_HUMAN,
  SUPPORTED_PROFILE_IMG_MIME_TYPES,
  SUPPORTED_SERVER_IMG_FORMATS_HUMAN,
  SUPPORTED_SERVER_IMG_MIME_TYPES,
};
