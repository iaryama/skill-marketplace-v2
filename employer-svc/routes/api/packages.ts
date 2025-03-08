import express, { Request, Response } from "express";
import { failureResponse } from "../../helpers/responseHelpers";

import { authenticate } from "../../middleware/authenticate";
import { packageById, packages, packageByIdValidation } from "../../controller/packages";

const router = express.Router();

/**
 * Fetch The Package of Specific Partner
 */
router
  .route("/:packageId")
  .get(authenticate, packageByIdValidation, packageById)
  .all((req: Request, res: Response) => {
    return failureResponse(res, 405, "METHOD_NOT_ALLOWED");
  });

/**
 * Fetch all The Partner Packages
 */
router
  .route("/")
  .get(authenticate, packages)
  .all((req: Request, res: Response) => {
    return failureResponse(res, 405, "METHOD_NOT_ALLOWED");
  });

export default router;
