import { validationResult, body } from 'express-validator';
import { Request, Response } from 'express';
import { failureResponse, successResponse } from '../helpers/responseHelpers';
import { HTTP_STATUS_CODE } from '../helpers/constants';
import { Task } from '../models/task';
import { TaskSkill } from '../models/taskSkill';
import { Skill } from '../models/skill';

export const createTaskValidation = [
  body('categoryId').isInt().notEmpty(),
  body('taskName').isString().notEmpty(),
  body('description').isString().notEmpty(),
  body('skillIds').isArray().optional(),
];

export const createTask = async (req: Request, res: Response) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return failureResponse(res, HTTP_STATUS_CODE.BAD_REQUEST, errors.array());
  }
  //@ts-ignore
  const userId = { req };
  const { categoryId, taskName, description, skillIds } = req.body;
  if (skillIds && skillIds.length > 0) {
    const validSkills = await Skill.findAll({ where: { id: skillIds } });

    if (validSkills.length !== skillIds.length) {
      return failureResponse(res, HTTP_STATUS_CODE.BAD_REQUEST, 'One or more skills are invalid');
    }
    const task = await Task.create({ categoryId, taskName, description, userId });
    for (const skillId of skillIds) {
      await TaskSkill.create({ taskId: task.dataValues.id, skillId });
    }

    return successResponse(res, HTTP_STATUS_CODE.CREATED, task);
  } else {
    return failureResponse(res, HTTP_STATUS_CODE.BAD_REQUEST, 'At least one skill is required');
  }
};

export const getTask = async (req: Request, res: Response) => {
  const task = await Task.findByPk(req.params.taskId);
  if (!task) return failureResponse(res, HTTP_STATUS_CODE.NOT_FOUND, 'Task not found');
  return successResponse(res, HTTP_STATUS_CODE.OK, task);
};
