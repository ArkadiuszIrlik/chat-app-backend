import { NextFunction, Request, Response } from 'express';

function initializeContext(req: Request, _res: Response, next: NextFunction) {
  if (req.context === undefined) {
    req.context = {};
  }
  return next();
}

export { initializeContext };
