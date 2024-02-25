import { NextFunction, Request, Response } from 'express';
import checkAuthExpiry from '@middleware/auth.js';
// import jwt, { Secret } from 'jsonwebtoken';

describe('Authorization expiry middleware', () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  const nextFunction: NextFunction = jest.fn();

  beforeEach(() => {
    mockRequest = { cookies: {} };
    mockResponse = {
      json: jest.fn(),
      clearCookie: jest.fn(() => mockResponse as Response),
      redirect: jest.fn(),
    };
  });
  it('calls next(error) when "auth" cookie contains an invalid value', async () => {
    mockRequest.cookies.auth = 'invalid';

    await checkAuthExpiry(
      mockRequest as Request,
      mockResponse as Response,
      nextFunction,
    );
    expect(nextFunction).toHaveBeenCalledWith(expect.anything());
  });
});
