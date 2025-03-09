import { Request, Response } from 'express';
import { Offer } from '../models/offer';
import { getTaskById } from '../services/grpcTask';
import { failureResponse, successResponse } from '../helpers/responseHelpers';
import { HTTP_STATUS_CODE } from '../helpers/constants';
import { Logger } from '../helpers/logger';

export const createOffer = async (req: Request, res: Response) => {
  try {
    const { task_id } = req.params;
    const { price, proposal } = req.body;
    const { user_id } = res.locals;

    const task = await getTaskById(Number(task_id));
    if (!task) return failureResponse(res, HTTP_STATUS_CODE.NOT_FOUND, 'Task not found');

    const offer = await Offer.create({ task_id, user_id, price, proposal, status: 'pending' });

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

    offer.status = 'rejected';
    await offer.save();

    return successResponse(res, HTTP_STATUS_CODE.OK, { message: 'Offer rejected' });
  } catch (err) {
    Logger.ERROR(err);
    return failureResponse(res, HTTP_STATUS_CODE.INTERNAL_SERVER_ERROR, 'Internal server error');
  }
};
