import { failureResponse, successResponse } from "../helpers/responseHelpers";
import { HTTP_STATUS_CODE } from "../helpers/constants";


import { Request, Response } from 'express';
import { loginUser, refreshToken } from '../services/authService';
import { redisClient } from '../db/connectRedis';

export const login = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;
    const tokens = await loginUser(email, password);
    res.json(tokens);
  } catch (err:any) {
    return failureResponse(res, HTTP_STATUS_CODE.UNAUTHORIZED, err.message);
  }
};

export const refresh = async (req: Request, res: Response) => {
  try {
    const tokens = await refreshToken(req.body.refreshToken);
    res.json(tokens);
  } catch (err:any) {
    return failureResponse(res, HTTP_STATUS_CODE.ACCESS_FORBIDDEN, err.message);
  }
};

export const logout = async (req: Request, res: Response) => {
  await redisClient.del(req.body.refreshToken);
  return successResponse(res, HTTP_STATUS_CODE.OK, 'Logged out');
};
