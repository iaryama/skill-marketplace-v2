import jwt from 'jsonwebtoken';
import { Request, Response, NextFunction } from 'express';
import { JWT_SECRET_KEY } from '../configuration/config';
import { HTTP_STATUS_CODE } from '../helpers/constants';
import { failureResponse } from '../helpers/responseHelpers';
import { User } from '../models/user';

export async function authenticate(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers['authorization'];
  if (!authHeader) return failureResponse(res, HTTP_STATUS_CODE.UNAUTHORIZED, 'No token provided');

  const token = authHeader.split(' ')[1];
  try {
    const payload = jwt.verify(token, JWT_SECRET_KEY) as { userId: number; role: string };
    res.locals.userId = payload.userId;

    const user = await User.findByPk(payload.userId);
    if (!user || user.dataValues.role !== 'client') return failureResponse(res, HTTP_STATUS_CODE.UNAUTHORIZED, 'Not Authorized User');

    next();
  } catch (err) {
    return failureResponse(res, HTTP_STATUS_CODE.UNAUTHORIZED, 'Invalid token');
  }
}
