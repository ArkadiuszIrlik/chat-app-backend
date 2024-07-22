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

export { Yup as ExtendedYup };
