import express, { Request, Response } from 'express';
import { failureResponse } from '../../helpers/responseHelpers';
import {
  updateTaskValidation,
  updateTask,
  createTask,
  getTask,
  createTaskValidation,
  rejectTask,
  updateTaskProgress,
  completeTask,
  updateTaskProgressValidation,
} from '../../controller/task';
import { authenticate } from '../../middleware/authenticate';
import { HTTP_STATUS_CODE } from '../../helpers/constants';

const router = express.Router();

router
  .route('/add')
  .post(authenticate, createTaskValidation, createTask)
  .all((req: Request, res: Response) => {
    return failureResponse(res, HTTP_STATUS_CODE.METHOD_NOT_ALLOWED, 'METHOD_NOT_ALLOWED');
  });

router
  .route('/:task_id')
  .get(getTask)
  .patch(authenticate, updateTaskValidation, updateTask)
  .all((req: Request, res: Response) => {
    return failureResponse(res, HTTP_STATUS_CODE.METHOD_NOT_ALLOWED, 'METHOD_NOT_ALLOWED');
  });

router
  .route('/:task_id/reject-completion')
  .patch(authenticate, rejectTask)
  .all((req, res) => failureResponse(res, HTTP_STATUS_CODE.METHOD_NOT_ALLOWED, 'METHOD_NOT_ALLOWED'));

router
  .route('/:task_id/progress')
  .patch(authenticate, updateTaskProgressValidation, updateTaskProgress)
  .all((req, res) => failureResponse(res, HTTP_STATUS_CODE.METHOD_NOT_ALLOWED, 'METHOD_NOT_ALLOWED'));

router
  .route('/:task_id/accept-completion')
  .patch(authenticate, completeTask)
  .all((req, res) => failureResponse(res, HTTP_STATUS_CODE.METHOD_NOT_ALLOWED, 'METHOD_NOT_ALLOWED'));

export default router;
