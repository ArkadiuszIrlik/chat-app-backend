import { CLIENT_EMAIL_VERIFICATION_PATH } from '@config/client.config.js';

function getClientUrl(url: string) {
  const urlExpression =
    'https?://(www.)?[-a-zA-Z0-9@:%._+~#=]{1,256}.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_+.~#?&//=]*)';
  const regex = new RegExp(urlExpression);
  if (url.match(regex)) {
    return url;
  }
  let mainURL = process.env.FRONTEND_ADDRESS;
  if (mainURL === undefined) return '';
  if (!mainURL.endsWith('/')) mainURL += '/';

  let nextUrl = url;
  if (url.length > 0 && url.startsWith('/')) {
    nextUrl = url.substring(1, url.length);
  }
  return mainURL + nextUrl;
}

function getEmailVerificationUrl(verificationToken: string) {
  return getClientUrl(
    CLIENT_EMAIL_VERIFICATION_PATH + `?token=${verificationToken}`,
  );
}

export { getClientUrl, getEmailVerificationUrl };
