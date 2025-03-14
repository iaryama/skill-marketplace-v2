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
import { authenticateClient, authenticateContractor } from '../../middleware/authenticate';
import { HTTP_STATUS_CODE } from '../../helpers/constants';

const router = express.Router();

router
  .route('/add')
  .post(authenticateClient, createTaskValidation, createTask)
  .all((req: Request, res: Response) => {
    return failureResponse(res, HTTP_STATUS_CODE.METHOD_NOT_ALLOWED, 'METHOD_NOT_ALLOWED');
  });

router
  .route('/:task_id')
  .get(getTask)
  .patch(authenticateClient, updateTaskValidation, updateTask)
  .all((req: Request, res: Response) => {
    return failureResponse(res, HTTP_STATUS_CODE.METHOD_NOT_ALLOWED, 'METHOD_NOT_ALLOWED');
  });

router
  .route('/:task_id/reject-completion')
  .patch(authenticateClient, rejectTask)
  .all((req, res) => failureResponse(res, HTTP_STATUS_CODE.METHOD_NOT_ALLOWED, 'METHOD_NOT_ALLOWED'));

router
  .route('/:task_id/progress')
  .patch(authenticateContractor, updateTaskProgressValidation, updateTaskProgress)
  .all((req, res) => failureResponse(res, HTTP_STATUS_CODE.METHOD_NOT_ALLOWED, 'METHOD_NOT_ALLOWED'));

router
  .route('/:task_id/accept-completion')
  .patch(authenticateClient, completeTask)
  .all((req, res) => failureResponse(res, HTTP_STATUS_CODE.METHOD_NOT_ALLOWED, 'METHOD_NOT_ALLOWED'));

export default router;
