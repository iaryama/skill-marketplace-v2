import { validationResult, body } from 'express-validator';
import { Request, Response } from 'express';
import { failureResponse, successResponse } from '../helpers/responseHelpers';
import { HTTP_STATUS_CODE } from '../helpers/constants';
import { Task } from '../models/task';
import { TaskSkill } from '../models/taskSkill';
import { Skill } from '../models/skill';
import { Category } from '../models/category';

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

    await TaskSkill.bulkCreate(skillIds.map((skillId: any) => ({ taskId: task.id, skillId })));

    return successResponse(res, HTTP_STATUS_CODE.CREATED, task);
  } else {
    return failureResponse(res, HTTP_STATUS_CODE.BAD_REQUEST, 'At least one skill is required');
  }
};

export const getTask = async (req: Request, res: Response) => {
  const task = await Task.findByPk(req.params.taskId, {
    include: [
      {
        model: Skill,
        through: { attributes: [] },
      },
      {
        model: Category,
        attributes: ['id', 'name'],
      },
    ],
  });
  if (!task) return failureResponse(res, HTTP_STATUS_CODE.NOT_FOUND, 'Task not found');
  return successResponse(res, HTTP_STATUS_CODE.OK, task);
};
