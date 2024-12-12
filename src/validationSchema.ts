import { ExtendedYup } from '@src/extendedYup.js';

const patchFile = ExtendedYup.mixed()
  .notArray('Single patch document expected')
  .oneOfMimeType(['application/json'], 'Unsupported patch file format')
  .notTruncated('Patch document too big')
  .required('Please provide a patch document');
const idParam = ExtendedYup.string()
  .typeError('Invalid _id')
  .mongooseId('Invalid _id');
const serverImg = ExtendedYup.string()
  .typeError('Invalid "serverImg" type')
  .trim();

const userSchema = {
  username: ExtendedYup.string()
    .typeError('Invalid "username" type')
    .trim()
    .max(30, "Username can't be longer than 30 characters."),
  profileImg: ExtendedYup.string()
    .typeError('Invalid "profileImg" type')
    .trim(),
};

export { patchFile, idParam, serverImg, userSchema };
