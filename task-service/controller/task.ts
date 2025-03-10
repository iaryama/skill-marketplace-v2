import { validationResult, body } from 'express-validator';
import { Request, Response } from 'express';
import { failureResponse, successResponse } from '../helpers/responseHelpers';
import { HTTP_STATUS_CODE } from '../helpers/constants';
import { Task } from '../models/task';
import { Category } from '../models/category';
import { Logger } from '../helpers/logger';
import { Currency } from '../helpers/constants';

export const createTaskValidation = [
  body('category_id').isInt().notEmpty(),
  body('task_name').isString().notEmpty(),
  body('description').isString().notEmpty(),
  body('start_date').isDate().notEmpty(),
  body('no_of_working_hours').isInt().notEmpty(),
  body('hourly_rate').isDecimal().notEmpty(),
  body('currency').isIn(Object.values(Currency)).notEmpty(),
];

export const createTask = async (req: Request, res: Response) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return failureResponse(res, HTTP_STATUS_CODE.BAD_REQUEST, errors.array());
  }
  try {
    const { user_id } = res.locals;
    const category = Category.findByPk(req.body.category_id);
    if (!category) {
      return failureResponse(res, HTTP_STATUS_CODE.BAD_REQUEST, 'Category not found');
    }
    const { category_id, task_name, description, start_date, no_of_working_hours, hourly_rate, currency } = req.body;
    const task = await Task.create({
      category_id,
      task_name,
      description,
      user_id,
      start_date,
      no_of_working_hours,
      hourly_rate,
      currency,
    });

    return successResponse(res, HTTP_STATUS_CODE.CREATED, task);
  } catch (err) {
    Logger.ERROR(err);
    return failureResponse(res, HTTP_STATUS_CODE.INTERNAL_SERVER_ERROR, 'Internal server error');
  }
};

export const updateTaskValidation = [
  body('category_id').optional().isInt().notEmpty(),
  body('task_name').optional().isString().notEmpty(),
  body('description').optional().isString().notEmpty(),
  body('start_date').optional().isDate().notEmpty(),
  body('no_of_working_hours').optional().isInt().notEmpty(),
  body('hourly_rate').optional().isDecimal().notEmpty(),
  body('currency').optional().isIn(Object.values(Currency)).notEmpty(),
];

export const updateTask = async (req: Request, res: Response) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return failureResponse(res, HTTP_STATUS_CODE.BAD_REQUEST, errors.array());
  }
  try {
    const { category_id } = req.body;
    const { task_id } = req.params;

    if (category_id) {
      // Ensure category exists
      const category = await Category.findByPk(category_id);
      if (!category) {
        return failureResponse(res, HTTP_STATUS_CODE.BAD_REQUEST, 'Invalid category');
      }
    }

    const { user_id } = res.locals as { user_id: number };
    const task = await Task.upsert({ id: task_id, ...req.body, user_id });

    return successResponse(res, HTTP_STATUS_CODE.CREATED, { id: task_id, ...req.body, user_id });
  } catch (err) {
    Logger.ERROR(err);
    return failureResponse(res, HTTP_STATUS_CODE.INTERNAL_SERVER_ERROR, 'Internal server error');
  }
};

export const getTask = async (req: Request, res: Response) => {
  try {
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
  } catch (err) {
    Logger.ERROR(err);
    return failureResponse(res, HTTP_STATUS_CODE.INTERNAL_SERVER_ERROR, 'Internal server error');
  }
};

export const rejectTask = async (req: Request, res: Response) => {
  try {
    const { task_id } = req.params;

    const task = await Task.findByPk(task_id);
    if (!task) return failureResponse(res, HTTP_STATUS_CODE.NOT_FOUND, 'Task not found');

    task.dataValues.status = 'in-progress';
    await task.save();

    return successResponse(res, HTTP_STATUS_CODE.OK, { message: 'Task completion rejected' });
  } catch (err) {
    Logger.ERROR(err);
    return failureResponse(res, HTTP_STATUS_CODE.INTERNAL_SERVER_ERROR, 'Internal server error');
  }
};
export const updateTaskProgressValidation = [body('description').isString().notEmpty()];
export const updateTaskProgress = async (req: Request, res: Response) => {
  try {
    const { task_id } = req.params;
    const { description } = req.body;

    const task = await Task.findByPk(task_id);
    if (!task) return failureResponse(res, HTTP_STATUS_CODE.NOT_FOUND, 'Task not found');
    console.log('In', task.dataValues);

    const timestamp = new Date().toISOString();
    const progress = `${task.dataValues.progress || ''}\n[${timestamp}] ${description}`;
    await task.update({ progress });
    console.log('End', (await Task.findByPk(task_id)).dataValues);

    return successResponse(res, HTTP_STATUS_CODE.OK, { message: 'Task progress updated' });
  } catch (err) {
    Logger.ERROR(err);
    return failureResponse(res, HTTP_STATUS_CODE.INTERNAL_SERVER_ERROR, 'Internal server error');
  }
};

export const completeTask = async (req: Request, res: Response) => {
  try {
    const { task_id } = req.params;

    const task = await Task.findByPk(task_id);
    if (!task) return failureResponse(res, HTTP_STATUS_CODE.NOT_FOUND, 'Task not found');

    task.dataValues.status = 'completed';
    await task.save();

    return successResponse(res, HTTP_STATUS_CODE.OK, { message: 'Task marked as completed' });
  } catch (err) {
    Logger.ERROR(err);
    return failureResponse(res, HTTP_STATUS_CODE.INTERNAL_SERVER_ERROR, 'Internal server error');
  }
};
