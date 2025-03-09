import { Request, Response } from 'express';
import { Offer } from '../models/offer';
import { failureResponse, successResponse } from '../helpers/responseHelpers';
import { HTTP_STATUS_CODE } from '../helpers/constants';

export const createOffer = async (req: Request, res: Response) => {
  const { taskId, price, proposal } = req.body;
  const { user_id } = res.locals;

  const offer = await Offer.create({ taskId, user_id, price, proposal, status: 'pending' });

  return successResponse(res, HTTP_STATUS_CODE.CREATED, offer);
};

export const getOffersByTask = async (req: Request, res: Response) => {
  const { taskId } = req.params;
  const offers = await Offer.findAll({ where: { taskId } });

  return successResponse(res, HTTP_STATUS_CODE.OK, offers);
};

export const acceptOffer = async (req: Request, res: Response) => {
  const { offerId } = req.params;

  const offer = await Offer.findByPk(offerId);
  if (!offer) return failureResponse(res, HTTP_STATUS_CODE.NOT_FOUND, 'Offer not found');

  offer.status = 'accepted';
  await offer.save();

  return successResponse(res, HTTP_STATUS_CODE.OK, { message: 'Offer accepted' });
};

export const rejectOffer = async (req: Request, res: Response) => {
  const { offerId } = req.params;

  const offer = await Offer.findByPk(offerId);
  if (!offer) return failureResponse(res, HTTP_STATUS_CODE.NOT_FOUND, 'Offer not found');

  offer.status = 'rejected';
  await offer.save();

  return successResponse(res, HTTP_STATUS_CODE.OK, { message: 'Offer rejected' });
};
