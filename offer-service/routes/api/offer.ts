import express from 'express';
import { createOffer, getOffersByTask, acceptOffer, rejectOffer } from '../../controller/offer';
import { authenticate } from '../../middleware/authenticate';
import { failureResponse } from '../../helpers/responseHelpers';
import { HTTP_STATUS_CODE } from '../../helpers/constants';

const router = express.Router();

router
  .route('/')
  .post(authenticate, createOffer)
  .all((req, res) => failureResponse(res, HTTP_STATUS_CODE.METHOD_NOT_ALLOWED, 'METHOD_NOT_ALLOWED'));

router
  .route('/task/:task_id')
  .get(authenticate, getOffersByTask)
  .all((req, res) => failureResponse(res, HTTP_STATUS_CODE.METHOD_NOT_ALLOWED, 'METHOD_NOT_ALLOWED'));

router
  .route('/:offer_id/accept')
  .patch(authenticate, acceptOffer)
  .all((req, res) => failureResponse(res, HTTP_STATUS_CODE.METHOD_NOT_ALLOWED, 'METHOD_NOT_ALLOWED'));

router
  .route('/:offer_id/reject')
  .patch(authenticate, rejectOffer)
  .all((req, res) => failureResponse(res, HTTP_STATUS_CODE.METHOD_NOT_ALLOWED, 'METHOD_NOT_ALLOWED'));

export default router;
