import { Request, Response } from 'express';
import { body, param } from 'express-validator';
import { Offer } from '../models/offer';
import { getTaskById } from '../services/grpcTask';
import { failureResponse, successResponse } from '../helpers/responseHelpers';
import { HTTP_STATUS_CODE, Currency } from '../helpers/constants';
import { Logger } from '../helpers/logger';

export const createOfferValidation = [
  param('task_id').isInt().notEmpty(),
  body('proposal').isString().notEmpty(),
  body('hourly_rate').isDecimal().notEmpty(),
  body('currency').isIn(Object.values(Currency)).notEmpty(),
];

export const createOffer = async (req: Request, res: Response) => {
  try {
    const { task_id } = req.params;
    const { hourly_rate, currency, proposal } = req.body;
    const { user_id } = res.locals;

    const task = await getTaskById(Number(task_id));
    if (!task || task.status != '') return failureResponse(res, HTTP_STATUS_CODE.NOT_FOUND, 'Task Not found or No longer available');

    const offer = await Offer.create({ task_id, user_id, hourly_rate, currency, proposal, status: 'pending' });

    return successResponse(res, HTTP_STATUS_CODE.CREATED, offer);
  } catch (err) {
    Logger.ERROR(err);
    return failureResponse(res, HTTP_STATUS_CODE.INTERNAL_SERVER_ERROR, 'Internal server error');
  }
};

export const getOffersByTask = async (req: Request, res: Response) => {
  try {
    const { task_id } = req.params;
    const task = await getTaskById(Number(task_id));
    if (!task) return failureResponse(res, HTTP_STATUS_CODE.NOT_FOUND, 'Task not found');
    const offers = await Offer.findAll({ where: { task_id } });

    return successResponse(res, HTTP_STATUS_CODE.OK, { offers, task });
  } catch (err) {
    Logger.ERROR(err);
    return failureResponse(res, HTTP_STATUS_CODE.INTERNAL_SERVER_ERROR, 'Internal server error');
  }
};

export const acceptOffer = async (req: Request, res: Response) => {
  try {
    const { offer_id } = req.params;

    const offer = await Offer.findByPk(offer_id);
    if (!offer) return failureResponse(res, HTTP_STATUS_CODE.NOT_FOUND, 'Offer not found');
    const task = await getTaskById(offer.task_id);
    if (!task) return failureResponse(res, HTTP_STATUS_CODE.NOT_FOUND, 'Task not found');
    if (task.id !== offer.task_id) return failureResponse(res, HTTP_STATUS_CODE.BAD_REQUEST, 'You are not the owner of this task');

    offer.status = 'accepted';
    await offer.save();

    return successResponse(res, HTTP_STATUS_CODE.OK, { message: 'Offer accepted' });
  } catch (err) {
    Logger.ERROR(err);
    return failureResponse(res, HTTP_STATUS_CODE.INTERNAL_SERVER_ERROR, 'Internal server error');
  }
};

export const rejectOffer = async (req: Request, res: Response) => {
  try {
    const { offer_id } = req.params;

    const offer = await Offer.findByPk(offer_id);
    if (!offer) return failureResponse(res, HTTP_STATUS_CODE.NOT_FOUND, 'Offer not found');
    const task = await getTaskById(offer.task_id);
    if (!task) return failureResponse(res, HTTP_STATUS_CODE.NOT_FOUND, 'Task not found');
    if (task.id !== offer.task_id) return failureResponse(res, HTTP_STATUS_CODE.BAD_REQUEST, 'You are not the owner of this task');

    offer.status = 'rejected';
    await offer.save();

    return successResponse(res, HTTP_STATUS_CODE.OK, { message: 'Offer rejected' });
  } catch (err) {
    Logger.ERROR(err);
    return failureResponse(res, HTTP_STATUS_CODE.INTERNAL_SERVER_ERROR, 'Internal server error');
  }
};
