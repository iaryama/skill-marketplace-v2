import express, { Request, Response, Router } from "express";
import { failureResponse } from "../../helpers/responseHelpers";
import { createTask, updateTask, getTask, taskValidation } from "../../controller/task";
import { authenticate } from "../../middleware/authenticate";
import { HTTP_STATUS_CODE } from "../../helpers/constants";

const router: Router = express.Router();


router
  .route("/")
  .post(authenticate, taskValidation, createTask)
  .all((req: Request, res: Response) => {
    return failureResponse(res, HTTP_STATUS_CODE.METHOD_NOT_ALLOWED, "METHOD_NOT_ALLOWED");
  });

router
  .route("/:taskId")
  .post(authenticate, taskValidation, updateTask)
  .all((req: Request, res: Response) => {
    return failureResponse(res, HTTP_STATUS_CODE.METHOD_NOT_ALLOWED, "METHOD_NOT_ALLOWED");
});
router
  .route("/:taskId")
  .get(authenticate, getTask)
  .all((req: Request, res: Response) => {
    return failureResponse(res, HTTP_STATUS_CODE.METHOD_NOT_ALLOWED, "METHOD_NOT_ALLOWED");
  });

export default router;