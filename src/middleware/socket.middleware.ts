import { NextFunction, Request, Response } from 'express';

function onHandshake(
  callback: (req: Request, res: Response, next: NextFunction) => any,
) {
  return (req: Request, res: Response, next: NextFunction) => {
    const isHandshake = req._query?.sid === undefined;
    if (!isHandshake) {
      return next();
    }
    return callback(req, res, next);
  };
}

function initializeSocketRequest(
  req: Request,
  _res: Response,
  next: NextFunction,
) {
  req.context.isSocketRequest = true;
  return next();
}

export { onHandshake, initializeSocketRequest };
