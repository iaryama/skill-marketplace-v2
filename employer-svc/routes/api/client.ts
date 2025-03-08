import express, { Request, Response } from "express";
import { failureResponse } from "../../helpers/responseHelpers";
import {
  validationCheckAdminUser,
  validationCheckUserExists,
  validationCheckaddOrEditUser,
  checkIfAdminUser,
  checkIfUserExists,
  addOrEditUser,
  checkIfNewUser,
  validationCheckIfNewUser,
  validationCheckResetEmailPwd,
  resetEmailPwd,
} from "../../controller/client";
import { authenticateClientAgent } from "../../middleware/authenticate";
const router = express.Router();

router
  .route("/checkIfAdminUser")
  .get(validationCheckAdminUser, checkIfAdminUser)
  .all((req: Request, res: Response) => {
    return failureResponse(res, 405, "METHOD_NOT_ALLOWED");
  });
router
  .route("/checkIfUserExists")
  .get(validationCheckUserExists, checkIfUserExists)
  .all((req: Request, res: Response) => {
    return failureResponse(res, 405, "METHOD_NOT_ALLOWED");
  });
router
  .route("/checkIfNewUser")
  .get(validationCheckIfNewUser, checkIfNewUser)
  .all((req: Request, res: Response) => {
    return failureResponse(res, 405, "METHOD_NOT_ALLOWED");
  });
router
  .route("/addOrEditUser")
  .post(authenticateClientAgent, validationCheckaddOrEditUser, addOrEditUser)
  .all((req: Request, res: Response) => {
    return failureResponse(res, 405, "METHOD_NOT_ALLOWED");
  });
router
  .route("/reset-email-pwd")
  .post(validationCheckResetEmailPwd, resetEmailPwd)
  .all((req: Request, res: Response) => {
    return failureResponse(res, 405, "METHOD_NOT_ALLOWED");
  });

export default router;
