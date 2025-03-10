import jwt from 'jsonwebtoken';
import { Request, Response, NextFunction } from 'express';
import { JWT_SECRET_KEY } from '../configuration/config';
import { HTTP_STATUS_CODE } from '../helpers/constants';
import { failureResponse } from '../helpers/responseHelpers';
import { Logger } from '../helpers/logger';

async function _authenticate(req: Request, res: Response): Promise<boolean> {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      failureResponse(res, HTTP_STATUS_CODE.UNAUTHORIZED, 'No token provided');
      return false;
    }

    if (!authHeader.startsWith('Bearer ')) {
      failureResponse(res, HTTP_STATUS_CODE.UNAUTHORIZED, 'NOT_VALID_BEARER_TOKEN');
      return false;
    }

    const token = authHeader.split(' ')[1];
    const payload = jwt.verify(token, JWT_SECRET_KEY) as { user_id: number; role: string };

    res.locals.user_id = payload.user_id;
    res.locals.role = payload.role;
    return true;
  } catch (err) {
    Logger.ERROR('Authentication error:', err);
    failureResponse(res, HTTP_STATUS_CODE.UNAUTHORIZED, 'Invalid token');
    return false;
  }
}

export async function authenticateClient(req: Request, res: Response, next: NextFunction) {
  if (!(await _authenticate(req, res))) return;
  if (res.locals.role !== 'client') {
    return failureResponse(res, HTTP_STATUS_CODE.UNAUTHORIZED, 'Not Authorized User');
  }
  next();
}

export async function authenticateContractor(req: Request, res: Response, next: NextFunction) {
  if (!(await _authenticate(req, res))) return;
  if (res.locals.role !== 'contractor') {
    return failureResponse(res, HTTP_STATUS_CODE.UNAUTHORIZED, 'Not Authorized User');
  }
  next();
}
