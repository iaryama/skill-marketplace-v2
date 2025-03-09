import express, { Request, Response } from 'express';
import { failureResponse } from '../../helpers/responseHelpers';
import { addSkill, getSkill, addSkillValidation, updateSkill, updateSkillValidation } from '../../controller/skill';
import { authenticate } from '../../middleware/authenticate';
import { HTTP_STATUS_CODE } from '../../helpers/constants';

const router = express.Router();

router
  .route('/add')
  .post(authenticate, addSkillValidation, addSkill)
  .all((req: Request, res: Response) => {
    return failureResponse(res, HTTP_STATUS_CODE.METHOD_NOT_ALLOWED, 'METHOD_NOT_ALLOWED');
  });

router
  .route('/:skill_id/update')
  .patch(updateSkillValidation, updateSkill)
  .all((req: Request, res: Response) => {
    return failureResponse(res, HTTP_STATUS_CODE.METHOD_NOT_ALLOWED, 'METHOD_NOT_ALLOWED');
  });
router
  .route('/:skill_id')
  .get(getSkill)
  .all((req: Request, res: Response) => {
    return failureResponse(res, HTTP_STATUS_CODE.METHOD_NOT_ALLOWED, 'METHOD_NOT_ALLOWED');
  });

export default router;
