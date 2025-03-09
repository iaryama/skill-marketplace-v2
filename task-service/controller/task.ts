import { validationResult, body } from 'express-validator';
import { Request, Response } from 'express';
import { failureResponse, successResponse } from '../helpers/responseHelpers';
import { HTTP_STATUS_CODE } from '../helpers/constants';
import { Task } from '../models/task';
import { Category } from '../models/category';

export const createTaskValidation = [
  body('categoryId').isInt().notEmpty(),
  body('taskName').isString().notEmpty(),
  body('description').isString().notEmpty(),
];

export const createTask = async (req: Request, res: Response) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return failureResponse(res, HTTP_STATUS_CODE.BAD_REQUEST, errors.array());
  }
  const { userId } = res.locals;
  const { categoryId, taskName, description } = req.body;
  const task = await Task.create({ categoryId, taskName, description, userId });

  return successResponse(res, HTTP_STATUS_CODE.CREATED, task);
};

export const getTask = async (req: Request, res: Response) => {
  const task = await Task.findByPk(req.params.taskId, {
    include: [
      {
        model: Category,
        attributes: ['id', 'name'],
      },
    ],
  });
  if (!task) return failureResponse(res, HTTP_STATUS_CODE.NOT_FOUND, 'Task not found');
  return successResponse(res, HTTP_STATUS_CODE.OK, task);
};
