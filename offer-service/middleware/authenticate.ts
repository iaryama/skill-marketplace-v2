import jwt from 'jsonwebtoken';
import { Request, Response, NextFunction } from 'express';
import { JWT_SECRET_KEY } from '../configuration/config';
import { HTTP_STATUS_CODE } from '../helpers/constants';
import { failureResponse } from '../helpers/responseHelpers';
import { Logger } from '../helpers/logger';

export async function _authenticate(req: Request, res: Response) {
  const authHeader = req.headers.authorization;
  if (!authHeader) return failureResponse(res, HTTP_STATUS_CODE.UNAUTHORIZED, 'No token provided');
  if (!authHeader.startsWith('Bearer ')) {
    return failureResponse(res, HTTP_STATUS_CODE.UNAUTHORIZED, 'NOT_VALID_BEARER_TOKEN');
  }
  const token = authHeader.split(' ')[1];
  const payload = jwt.verify(token, JWT_SECRET_KEY) as { user_id: number; role: string };
  res.locals.user_id = payload.user_id;
  res.locals.role = payload.role;
}

export async function authenticateClient(req: Request, res: Response, next: NextFunction) {
  try {
    _authenticate(req, res);
    if (res.locals.role !== 'client') return failureResponse(res, HTTP_STATUS_CODE.UNAUTHORIZED, 'Not Authorized User');
    next();
  } catch (err) {
    Logger.ERROR(err);
    return failureResponse(res, HTTP_STATUS_CODE.UNAUTHORIZED, 'Invalid token');
  }
}

export async function authenticateContractor(req: Request, res: Response, next: NextFunction) {
  try {
    _authenticate(req, res);
    if (res.locals.role !== 'contractor') return failureResponse(res, HTTP_STATUS_CODE.UNAUTHORIZED, 'Not Authorized User');
    next();
  } catch (err) {
    Logger.ERROR(err);
    return failureResponse(res, HTTP_STATUS_CODE.UNAUTHORIZED, 'Invalid token');
  }
}
