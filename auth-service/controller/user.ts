import { failureResponse, successResponse } from '../helpers/responseHelpers';
import { HTTP_STATUS_CODE } from '../helpers/constants';
import { validationResult, body } from 'express-validator';
import { Request, Response } from 'express';
import { loginUser, refreshToken } from '../services/authService';
import { redisClient } from '../db/connectRedis';
import { User } from '../models/user';
import bcrypt from 'bcrypt';

export const signUpValidation = [
  body('providerType').isIn(['individual', 'company']).notEmpty(),
  body('firstName').isString().notEmpty(),
  body('lastName').isString().notEmpty(),
  body('email').isEmail().notEmpty(),
  body('password')
    .isLength({ min: 8 })
    .matches(/[A-Z]/)
    .matches(/[a-z]/)
    .matches(/\d/)
    .matches(/[!@#$%^&*(),.?":{}|<>]/),
  body('companyName').if(body('providerType').equals('company')).isString().notEmpty(),
  body('businessTaxNumber')
    .if(body('providerType').equals('company'))
    .matches(/^[A-Z0-9]{10}$/),
  body('mobileNumber').isString().notEmpty(),
  body('streetNumber').if(body('providerType').equals('company')).isString().notEmpty(),
  body('streetName').if(body('providerType').equals('company')).isString().notEmpty(),
  body('city').if(body('providerType').equals('company')).isString().notEmpty(),
  body('state').if(body('providerType').equals('company')).isString().notEmpty(),
  body('postCode').if(body('providerType').equals('company')).isString().notEmpty(),
];

export const signUp = async (req: Request, res: Response) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return failureResponse(res, HTTP_STATUS_CODE.BAD_REQUEST, errors.array());
  }

  try {
    const { email, password } = req.body;

    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      return failureResponse(res, HTTP_STATUS_CODE.BAD_REQUEST, 'Email already exists');
    }

    req.body.passwordHash = await bcrypt.hash(password, 10);

    const newUser = await User.create(req.body);

    return successResponse(res, HTTP_STATUS_CODE.CREATED, { user_id: newUser.id, email: newUser.email });
  } catch (err: any) {
    return failureResponse(res, HTTP_STATUS_CODE.INTERNAL_SERVER_ERROR, err.message);
  }
};

export const loginValidation = [
  body('email').isEmail().notEmpty(),
  body('password')
    .isLength({ min: 8 })
    .matches(/[A-Z]/)
    .matches(/[a-z]/)
    .matches(/\d/)
    .matches(/[!@#$%^&*(),.?":{}|<>]/),
];
export const login = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;
    const tokens = await loginUser(email, password);
    return successResponse(res, HTTP_STATUS_CODE.OK, tokens);
  } catch (err: any) {
    return failureResponse(res, HTTP_STATUS_CODE.UNAUTHORIZED, err.message);
  }
};

export const refreshTokenValidation = [body('refreshToken').isString().notEmpty()];
export const refresh = async (req: Request, res: Response) => {
  try {
    const tokens = await refreshToken(req.body.refreshToken);
    res.json(tokens);
  } catch (err: any) {
    return failureResponse(res, HTTP_STATUS_CODE.ACCESS_FORBIDDEN, err.message);
  }
};

export const logout = async (req: Request, res: Response) => {
  await redisClient.del(req.body.refreshToken);
  return successResponse(res, HTTP_STATUS_CODE.OK, 'Logged out');
};
