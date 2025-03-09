import express, { Request, Response } from 'express';
import { failureResponse } from '../../helpers/responseHelpers';
import {
  createTask,
  getTask,
  createTaskValidation,
  acceptTaskCompletion,
  rejectTaskCompletion,
  updateTaskProgress,
  completeTask,
} from '../../controller/task';
import { authenticate } from '../../middleware/authenticate';
import { HTTP_STATUS_CODE } from '../../helpers/constants';

const router = express.Router();

router
  .route('/')
  .post(authenticate, createTaskValidation, createTask)
  .all((req: Request, res: Response) => {
    return failureResponse(res, HTTP_STATUS_CODE.METHOD_NOT_ALLOWED, 'METHOD_NOT_ALLOWED');
  });

router
  .route('/:task_id')
  .get(getTask)
  .all((req: Request, res: Response) => {
    return failureResponse(res, HTTP_STATUS_CODE.METHOD_NOT_ALLOWED, 'METHOD_NOT_ALLOWED');
  });

router
  .route('/:task_id/accept-completion')
  .patch(authenticate, acceptTaskCompletion)
  .all((req, res) => failureResponse(res, HTTP_STATUS_CODE.METHOD_NOT_ALLOWED, 'METHOD_NOT_ALLOWED'));

router
  .route('/:task_id/reject-completion')
  .patch(authenticate, rejectTaskCompletion)
  .all((req, res) => failureResponse(res, HTTP_STATUS_CODE.METHOD_NOT_ALLOWED, 'METHOD_NOT_ALLOWED'));

router
  .route('/:task_id/progress')
  .patch(authenticate, updateTaskProgress)
  .all((req, res) => failureResponse(res, HTTP_STATUS_CODE.METHOD_NOT_ALLOWED, 'METHOD_NOT_ALLOWED'));

router
  .route('/:task_id/complete')
  .patch(authenticate, completeTask)
  .all((req, res) => failureResponse(res, HTTP_STATUS_CODE.METHOD_NOT_ALLOWED, 'METHOD_NOT_ALLOWED'));

export default router;
