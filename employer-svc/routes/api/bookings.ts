import express, { Request, Response } from "express";
import { failureResponse } from "../../helpers/responseHelpers";

import { authenticate } from "../../middleware/authenticate";
import {
  book,
  confirm,
  fetchBooking,
  bookValidation,
  fetchBookingValidation,
  confirmBookingValidation,
} from "../../controller/bookings";

const router = express.Router();
/**
 * Block The ticket
 */
router
  .route("/book")
  .post(authenticate, bookValidation, book)
  .all((req: Request, res: Response) => {
    return failureResponse(res, 405, "METHOD_NOT_ALLOWED");
  });
/**
 * Confirm The ticket
 */
router
  .route("/confirm")
  .post(authenticate, confirmBookingValidation, confirm)
  .all((req: Request, res: Response) => {
    return failureResponse(res, 405, "METHOD_NOT_ALLOWED");
  });
/**
 * Fetch The Booking
 */
router
  .route("/:bookingId")
  .get(authenticate, fetchBookingValidation, fetchBooking)
  .all((req: Request, res: Response) => {
    return failureResponse(res, 405, "METHOD_NOT_ALLOWED");
  });

export default router;
