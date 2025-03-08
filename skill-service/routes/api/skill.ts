import express, { Request, Response, Router } from "express";
import { failureResponse } from "../../helpers/responseHelpers";
import { addSkillValidation, addSkill, updateSkill, updateSkillValidation } from "../../controller/skill";
import { authenticate } from "../../middleware/authenticate";
import { HTTP_STATUS_CODE } from "../../helpers/constants";

const router: Router = express.Router();


router
  .route("/")
  .post(authenticate, addSkillValidation, addSkill)
  .all((req: Request, res: Response) => {
    return failureResponse(res, HTTP_STATUS_CODE.METHOD_NOT_ALLOWED, "METHOD_NOT_ALLOWED");
  });

router
  .route("/:skillId")
  .post(authenticate, updateSkillValidation, updateSkill)
  .all((req: Request, res: Response) => {
    return failureResponse(res, HTTP_STATUS_CODE.METHOD_NOT_ALLOWED, "METHOD_NOT_ALLOWED");
});

export default router;