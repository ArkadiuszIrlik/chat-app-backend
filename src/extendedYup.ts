import * as Yup from 'yup';
import mongoose from 'mongoose';

Yup.addMethod(Yup.string, 'mongooseId', function (errorMessage?: string) {
  const message = errorMessage ?? "Value isn't a valid mongoose ID string";
  return this.test('isValidMongooseId', message, function (value) {
    if (value === undefined) {
      return false;
    }
    return mongoose.Types.ObjectId.isValid(value);
  });
});

Yup.addMethod(Yup.mixed, 'notTruncated', function (errorMessage?: string) {
  const message = errorMessage ?? 'Uploaded file is too big';
  return this.test('isNotTruncated', message, function (value) {
    if (typeof value === 'object' && 'truncated' in value) {
      return !value.truncated;
    } else {
      return true;
    }
  });
});

Yup.addMethod(Yup.mixed, 'notArray', function (errorMessage?: string) {
  const message = errorMessage ?? "Value can't be an array";
  return this.test('isNotArrayType', message, function (value) {
    return !Array.isArray(value);
  });
});

Yup.addMethod(
  Yup.mixed,
  'oneOfMimeType',
  function (allowedTypes: string[], errorMessage?: string) {
    const message = errorMessage ?? "Value can't be an array";
    return this.test('isNotArrayType', message, function (value) {
      if (typeof value === 'object' && 'mimetype' in value) {
        if (allowedTypes.includes(value.mimetype as string)) {
          return true;
        } else {
          return false;
        }
      } else {
        return false;
      }
    });
  },
);

export { Yup as ExtendedYup };
