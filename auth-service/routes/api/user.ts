import express, { Request, Response } from 'express';
import { failureResponse } from '../../helpers/responseHelpers';
import { login, logout, refresh, signUp, signUpValidation, loginValidation, refreshTokenValidation } from '../../controller/user';
import { HTTP_STATUS_CODE } from '../../helpers/constants';

const router = express.Router();

router
  .route('/signup')
  .post(signUpValidation, signUp)
  .all((req: Request, res: Response) => {
    return failureResponse(res, HTTP_STATUS_CODE.METHOD_NOT_ALLOWED, 'METHOD_NOT_ALLOWED');
  });

router
  .route('/login')
  .post(loginValidation, login)
  .all((req: Request, res: Response) => {
    return failureResponse(res, HTTP_STATUS_CODE.METHOD_NOT_ALLOWED, 'METHOD_NOT_ALLOWED');
  });

router
  .route('/refresh')
  .post(refreshTokenValidation, refresh)
  .all((req: Request, res: Response) => {
    return failureResponse(res, HTTP_STATUS_CODE.METHOD_NOT_ALLOWED, 'METHOD_NOT_ALLOWED');
  });

router
  .route('/logout')
  .post(refreshTokenValidation, logout)
  .all((req: Request, res: Response) => {
    return failureResponse(res, HTTP_STATUS_CODE.METHOD_NOT_ALLOWED, 'METHOD_NOT_ALLOWED');
  });

export default router;
