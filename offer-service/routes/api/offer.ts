import express from 'express';
import { createOffer, getOffersByTask, acceptOffer, rejectOffer } from '../../controller/offer';
import { authenticateClient, authenticateContractor } from '../../middleware/authenticate';
import { failureResponse } from '../../helpers/responseHelpers';
import { HTTP_STATUS_CODE } from '../../helpers/constants';

const router = express.Router();

router
  .route('/task/:task_id/add')
  .post(authenticateContractor, createOffer)
  .all((req, res) => failureResponse(res, HTTP_STATUS_CODE.METHOD_NOT_ALLOWED, 'METHOD_NOT_ALLOWED'));

router
  .route('/task/:task_id')
  .get(authenticateClient, getOffersByTask)
  .all((req, res) => failureResponse(res, HTTP_STATUS_CODE.METHOD_NOT_ALLOWED, 'METHOD_NOT_ALLOWED'));

router
  .route('/:offer_id/accept')
  .patch(authenticateClient, acceptOffer)
  .all((req, res) => failureResponse(res, HTTP_STATUS_CODE.METHOD_NOT_ALLOWED, 'METHOD_NOT_ALLOWED'));

router
  .route('/:offer_id/reject')
  .patch(authenticateClient, rejectOffer)
  .all((req, res) => failureResponse(res, HTTP_STATUS_CODE.METHOD_NOT_ALLOWED, 'METHOD_NOT_ALLOWED'));

export default router;
