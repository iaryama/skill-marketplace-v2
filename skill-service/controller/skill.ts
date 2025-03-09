import { validationResult, body, param } from 'express-validator';
import { Request, Response } from 'express';
import { failureResponse, successResponse } from '../helpers/responseHelpers';
import { HTTP_STATUS_CODE } from '../helpers/constants';
import { Skill } from '../models/skill';
import { Category } from '../models/category';
import { Currency, NatureOfWork } from '../helpers/constants';
import { Logger } from '../helpers/logger';

export const addSkillValidation = [
  body('name').isString().notEmpty(),
  body('category_id').isInt().notEmpty(),
  body('experience').isInt().notEmpty(),
  body('nature_of_work').isIn(Object.values(NatureOfWork)).notEmpty(),
  body('hourly_rate').isFloat().notEmpty(),
  body('currency').isIn(Object.values(Currency)).notEmpty(),
];

export const addSkill = async (req: Request, res: Response) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return failureResponse(res, HTTP_STATUS_CODE.BAD_REQUEST, errors.array());
  }
  try {
    const { name, category_id, experience, nature_of_work, hourly_rate, currency } = req.body;

    // Ensure category exists
    const category = await Category.findByPk(category_id);
    if (!category) {
      return failureResponse(res, HTTP_STATUS_CODE.BAD_REQUEST, 'Invalid category');
    }

    const { user_id } = res.locals as { user_id: number };
    const skill = await Skill.create({ name, category_id, user_id, experience, nature_of_work, hourly_rate, currency });

    return successResponse(res, HTTP_STATUS_CODE.CREATED, skill);
  } catch (err) {
    Logger.ERROR(err);
    return failureResponse(res, HTTP_STATUS_CODE.INTERNAL_SERVER_ERROR, 'Internal server error');
  }
};

export const updateSkillValidation = [
  param('skillId').isInt().notEmpty(),
  body('name').optional().isString().notEmpty(),
  body('category_id').optional().isInt().notEmpty(),
  body('experience').optional().isInt().notEmpty(),
  body('nature_of_work').optional().isIn(Object.values(NatureOfWork)).notEmpty(),
  body('hourly_rate').optional().isFloat().notEmpty(),
  body('currency').optional().isIn(Object.values(Currency)).notEmpty(),
];
export const updateSkill = async (req: Request, res: Response) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return failureResponse(res, HTTP_STATUS_CODE.BAD_REQUEST, errors.array());
  }
  try {
    const { category_id } = req.body;
    const { skillId } = req.params;

    if (category_id) {
      // Ensure category exists
      const category = await Category.findByPk(category_id);
      if (!category) {
        return failureResponse(res, HTTP_STATUS_CODE.BAD_REQUEST, 'Invalid category');
      }
    }

    const { user_id } = res.locals as { user_id: number };
    const skill = await Skill.upsert({ id: skillId, ...req.body, user_id });

    return successResponse(res, HTTP_STATUS_CODE.CREATED, skill);
  } catch (err) {
    Logger.ERROR(err);
    return failureResponse(res, HTTP_STATUS_CODE.INTERNAL_SERVER_ERROR, 'Internal server error');
  }
};

export const getSkill = async (req: Request, res: Response) => {
  try {
    const skill = await Skill.findByPk(req.params.skillId, {
      include: [{ model: Category, as: 'category', attributes: ['name'] }],
    });
    if (!skill) return failureResponse(res, HTTP_STATUS_CODE.NOT_FOUND, 'Skill not found');
    return successResponse(res, HTTP_STATUS_CODE.OK, skill);
  } catch (err) {
    Logger.ERROR(err);
    return failureResponse(res, HTTP_STATUS_CODE.INTERNAL_SERVER_ERROR, 'Internal server error');
  }
};
