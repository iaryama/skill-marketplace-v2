import express, { Request, Response } from "express";
import { failureResponse } from "../../helpers/responseHelpers";
import { authenticateSuperAdmin } from "../../middleware/authenticate";
import { signUp, login, signUpValidation } from "../../controller/partner";

const router = express.Router();

/**
 * Partner SignUp
 */
router
  .route("/sign-up")
  .post(signUpValidation, signUp)
  .all((req: Request, res: Response) => {
    return failureResponse(res, 405, "METHOD_NOT_ALLOWED");
  });
/**
 * Partner Login
 */
router
  .route("/login")
  .post(login)
  .all((req: Request, res: Response) => {
    return failureResponse(res, 405, "METHOD_NOT_ALLOWED");
  });

export default router;
