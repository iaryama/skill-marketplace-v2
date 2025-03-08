import express, { Request, Response, Router } from "express";
import { failureResponse } from "../../helpers/responseHelpers";
import { createTask, updateTask, getTask, createTaskValidation, updateTaskValidation } from "../../controller/task";
import { authenticate } from "../../middleware/authenticate";
import { HTTP_STATUS_CODE } from "../../helpers/constants";

const router: Router = express.Router();


router
  .route("/")
  .post(authenticate, createTaskValidation, createTask)
  .all((req: Request, res: Response) => {
    return failureResponse(res, HTTP_STATUS_CODE.METHOD_NOT_ALLOWED, "METHOD_NOT_ALLOWED");
  });

router
  .route("/:taskId")
  .post(authenticate, updateTaskValidation, updateTask)
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