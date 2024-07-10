import { NextFunction, Request, Response } from 'express';
import { Schema } from 'yup';
import * as Yup from 'yup';

type ValidatedProperties = 'body' | 'params' | 'query' | 'files';
type ValidateObject = Partial<
  Record<ValidatedProperties, Record<string, Schema>>
>;

function validate(validateObject: ValidateObject) {
  return async function (req: Request, res: Response, next: NextFunction) {
    try {
      const processedValidateObject: Partial<
        Record<ValidatedProperties, Schema>
      > = {};
      (Object.keys(validateObject) as ValidatedProperties[]).forEach(
        (key) =>
          (processedValidateObject[key] = Yup.object(validateObject[key])),
      );

      const resObject = (await Yup.object(processedValidateObject).validate({
        body: req.body,
        params: req.params,
        query: req.query,
        files: req.files,
      })) as Record<ValidatedProperties, Record<string, any>>;

      (Object.keys(resObject) as ValidatedProperties[]).forEach((property) => {
        req[property] = { ...req[property], ...resObject[property] };
      });

      return next();
    } catch (err) {
      return res.status(404).json({ message: 'Invalid data format' });
    }
  };
}

export { validate };
