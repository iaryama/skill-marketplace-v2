import { validationResult, body } from 'express-validator';
import { Request, Response } from 'express';
import { failureResponse, successResponse } from '../helpers/responseHelpers';
import { HTTP_STATUS_CODE } from '../helpers/constants';
import { Task } from '../models/task';
import { Category } from '../models/category';

export const createTaskValidation = [
  body('category_id').isInt().notEmpty(),
  body('taskName').isString().notEmpty(),
  body('description').isString().notEmpty(),
];

export const createTask = async (req: Request, res: Response) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return failureResponse(res, HTTP_STATUS_CODE.BAD_REQUEST, errors.array());
  }
  const { user_id } = res.locals;
  const { category_id, taskName, description } = req.body;
  const task = await Task.create({ category_id, taskName, description, user_id });

  return successResponse(res, HTTP_STATUS_CODE.CREATED, task);
};

export const getTask = async (req: Request, res: Response) => {
  const task = await Task.findByPk(req.params.task_id, {
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

export const acceptTaskCompletion = async (req: Request, res: Response) => {
  const { task_id } = req.params;

  const task = await Task.findByPk(task_id);
  if (!task) return failureResponse(res, HTTP_STATUS_CODE.NOT_FOUND, 'Task not found');

  task.dataValues.status = 'completed';
  await task.save();

  return successResponse(res, HTTP_STATUS_CODE.OK, { message: 'Task completion accepted' });
};

export const rejectTaskCompletion = async (req: Request, res: Response) => {
  const { task_id } = req.params;

  const task = await Task.findByPk(task_id);
  if (!task) return failureResponse(res, HTTP_STATUS_CODE.NOT_FOUND, 'Task not found');

  task.dataValues.status = 'in-progress';
  await task.save();

  return successResponse(res, HTTP_STATUS_CODE.OK, { message: 'Task completion rejected' });
};

export const updateTaskProgress = async (req: Request, res: Response) => {
  const { task_id } = req.params;
  const { description } = req.body;

  const task = await Task.findByPk(task_id);
  if (!task) return failureResponse(res, HTTP_STATUS_CODE.NOT_FOUND, 'Task not found');

  const timestamp = new Date().toISOString();
  task.dataValues.progress = `${task.dataValues.progress || ''}\n[${timestamp}] ${description}`;
  await task.save();

  return successResponse(res, HTTP_STATUS_CODE.OK, { message: 'Task progress updated' });
};

export const completeTask = async (req: Request, res: Response) => {
  const { task_id } = req.params;

  const task = await Task.findByPk(task_id);
  if (!task) return failureResponse(res, HTTP_STATUS_CODE.NOT_FOUND, 'Task not found');

  task.dataValues.status = 'completed';
  await task.save();

  return successResponse(res, HTTP_STATUS_CODE.OK, { message: 'Task marked as completed' });
};
