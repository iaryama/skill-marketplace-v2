import { validationResult, body } from 'express-validator';
import { Request, Response } from 'express';
import { failureResponse, successResponse } from '../helpers/responseHelpers';
import { HTTP_STATUS_CODE } from '../helpers/constants';
import { Skill } from '../models/skill';
import { Category } from '../models/category';

export const addSkillValidation = [body('name').isString().notEmpty(), body('categoryId').isInt().notEmpty()];

export const addSkill = async (req: Request, res: Response) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return failureResponse(res, HTTP_STATUS_CODE.BAD_REQUEST, errors.array());
  }

  const skill = await Skill.create(req.body);
  return successResponse(res, HTTP_STATUS_CODE.CREATED, skill);
};

export const getSkill = async (req: Request, res: Response) => {
  const skill = await Skill.findByPk(req.params.skillId, {
    include: [{ model: Category, as: 'category', attributes: ['name'] }],
  });
  if (!skill) return failureResponse(res, HTTP_STATUS_CODE.NOT_FOUND, 'Skill not found');
  return successResponse(res, HTTP_STATUS_CODE.OK, skill);
};
