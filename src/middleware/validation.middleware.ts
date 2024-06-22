import { NextFunction, Request, Response } from 'express';
import { Schema } from 'yup';

function validate(schema: Schema) {
  return async function (req: Request, res: Response, next: NextFunction) {
    try {
      await schema.validate({
        body: req.body,
        params: req.params,
        query: req.query,
      });
      return next();
    } catch (err) {
      return res.status(404).json({ message: 'Invalid data format' });
    }
  };
}

export { validate };
