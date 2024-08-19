import { NextFunction, Request, Response } from 'express';

function initializeSocketRequest(
  req: Request,
  _res: Response,
  next: NextFunction,
) {
  req.context.isSocketRequest = true;
  return next();
}

export { initializeSocketRequest };
