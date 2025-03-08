import express, { Request, Response } from "express";
import { failureResponse } from "../../helpers/responseHelpers";
import { signUp, loginContractor, signUpValidation } from "../../controller/user";
import { HTTP_STATUS_CODE } from "../../helpers/constants";

const router = express.Router();

/**
 * Contractor SignUp
 */
router
  .route("/sign-up")
  .post(signUpValidation, signUp)
  .all((req: Request, res: Response) => {
    return failureResponse(res, HTTP_STATUS_CODE.METHOD_NOT_ALLOWED, "METHOD_NOT_ALLOWED");
  });
/**
 * Contractor Login
 */
router
  .route("/login")
  .post(loginContractor)
  .all((req: Request, res: Response) => {
    return failureResponse(res, HTTP_STATUS_CODE.METHOD_NOT_ALLOWED, "METHOD_NOT_ALLOWED");
  });

export default router;
