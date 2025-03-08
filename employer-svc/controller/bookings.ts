import express from "express";
import libphonenumber from "google-libphonenumber";
import { IPricing } from "../helpers/IPricing";
import { validationResult, body, query, param } from "express-validator";
import { db } from "../utils/connectFirestore";
import {
  getCurrentISTDateTime,
  calculatePackagePrice,
  regexPatternsIdProofs,
  findCombinations,
  todaysDate,
} from "../helpers/miscellaneous";
import { generateBookingId } from "../helpers/bookingsModelHelper";

import { getPackage } from "../helpers/packageModelHelper";
import {
  BMDTemplesDarshanDates,
  BMDTemplesDarshans,
  BMDTemplesDarshanSlots,
} from "../models/darshanTicketsPerSlot";

import { sequelize } from "../utils/connectPostgres";
import { Model } from "sequelize";
import { failureResponse, successResponse } from "../helpers/responseHelpers";
import { generateNTTPaymentPayload, decrypt } from "../helpers/nttPGHelpers";
import { POST_PAYMENT_REDIRECT } from "../utils/constants";

const phoneUtil = libphonenumber.PhoneNumberUtil.getInstance();

/**
 *Validation Rules For Booking API
 */
export const bookValidation = [
  body("date")
    .isISO8601()
    .withMessage("journeyDate must be in the format YYYY-MM-DD")
    .custom((value) => {
      // Get the current date in IST
      const nowUTC = new Date();
      const nowIST = new Date(nowUTC.getTime() + (5 * 60 + 30) * 60 * 1000);
      nowIST.setUTCHours(0, 0, 0, 0); // Set the time to midnight (start of the day)

      // Convert the entered date to a Date object
      const enteredDate = new Date(value);
      enteredDate.setUTCHours(0, 0, 0, 0); // Set the time to midnight

      if (enteredDate < nowIST) {
        throw new Error("Journey date cannot be in the past");
      }
      return true;
    }),
  body("packageId").isInt({ min: 1 }).notEmpty(),
  body("passengers")
    .isArray({ max: 9, min: 1 })
    .withMessage("Passengers should be an Array with max 9 and minimum 1 passengers only")
    .custom((value: any[]) => {
      return value.some((passenger) => passenger.age >= 18);
    })
    .withMessage("At least one passenger must be 18 years or older")
    .custom((value, { req }) => {
      const [passengerIdTypes, passengersProofNo] = req.body.passengers.reduce(
        (acc: [string[], string[]], passenger: any) => {
          acc[0].push(passenger.idProof);
          acc[1].push(passenger.proofNo);
          return acc;
        },
        [[], []]
      );

      if (new Set(passengersProofNo).size !== passengersProofNo.length) {
        return false; // Duplicate proofNo found
      }

      for (let i = 0; i < passengerIdTypes.length; i++) {
        const idType = passengerIdTypes[i];
        const proofNo = passengersProofNo[i];

        // Get the corresponding regex pattern for the current ID type
        const regexPattern = regexPatternsIdProofs[idType];

        // If no regex is available for this ID type, skip validation
        if (!regexPattern) {
          continue;
        }

        // Check if the proof number matches the regex pattern
        if (!regexPattern.test(proofNo)) {
          return false; // If regex doesn't match, validation fails
        }
      }

      return true; // All checks passed
    })
    .withMessage("proofNos should  be unique and follow the mentioned regex patterns")
    .notEmpty(),
  body("passengers.*.name").isString().notEmpty(),
  body("passengers.*.age")
    .isInt({ max: 200 })
    .custom((value) => Number.isInteger(value) && value >= 2)
    .withMessage("Age should be an integer and greater than or equal to 2")
    .notEmpty(),
  body("passengers.*.gender")
    .isString()
    .matches(/^(M|F)$/)
    .withMessage("Gender must be either 'M' or 'F'")
    .notEmpty(),
  body("passengers.*.idProof")
    .isString()
    .custom((value) => {
      switch (value) {
        case "AADHAR":
        case "PAN":
        case "DRIVING_LICENSE":
        case "PASSPORT":
        case "OTHER":
        case "VOTER_ID":
          return true;
        default:
          return false;
      }
    })
    .withMessage("Valid Values are AADHAR, PAN, DRIVING_LICENSE, PASSPORT, VOTER_ID, OTHER")
    .notEmpty(),
  body("passengers.*.proofNo").isString().notEmpty(),
  body("name")
    .isString()
    .matches(/^[a-zA-Z.\s]+(\|[a-zA-Z.\s]+)*$/)
    .notEmpty(),
  body("no_of_rooms")
    .optional()
    .isInt({ gt: 0 })
    .withMessage("Should be a non-zero integer")
    .custom((value, { req }) => {
      const passengers = req.body.passengers || [];
      let noOfAdults = 0;
      let noOfChildren = 0;
      passengers.forEach((passenger: any) => {
        const { age } = passenger;
        if (age < 12 && age >= 2) {
          noOfChildren++;
        } else if (age >= 12) {
          noOfAdults++;
        }
      });

      const no_of_passengers = noOfAdults + noOfChildren;
      return Number(value) <= no_of_passengers;
    })
    .withMessage("Rooms cannot exceed total passengers")
    .custom((value, { req }) => {
      const passengers = req.body.passengers || [];
      let noOfAdults = 0;
      let noOfChildren = 0;
      passengers.forEach((passenger: any) => {
        const { age } = passenger;
        if (age < 12 && age >= 2) {
          noOfChildren++;
        } else if (age >= 12) {
          noOfAdults++;
        }
      });

      const no_of_rooms = Number(value);

      const no_of_passengers = noOfAdults + noOfChildren;
      const results: number[] = []; // Store all valid extra bed configurations

      // Iterate through possible extra beds (max 1 extra bed per room)
      for (let beds = 0; beds <= Math.min(no_of_rooms, no_of_passengers / 3); beds++) {
        let passengersRemaining = no_of_passengers;

        // Passengers accommodated by rooms with extra beds
        const roomsWithExtraBeds = beds; // Each room with an extra bed
        passengersRemaining -= roomsWithExtraBeds * 3;

        // Remaining rooms for passengers without extra beds
        const roomsWithoutExtraBeds = no_of_rooms - roomsWithExtraBeds;

        // Validate if remaining passengers fit into rooms without extra beds
        if (
          passengersRemaining >= roomsWithoutExtraBeds && // At least 1 person per room
          passengersRemaining <= roomsWithoutExtraBeds * 2 // Max 2 people per room
        ) {
          results.push(beds);
        }
      }
      // Check if the user-provided extra_beds exists in valid configurations
      return results.includes(Number(req.body.no_of_extra_beds));
    })
    .withMessage(
      "The number of rooms and extra beds must accommodate all passengers. Each room can hold up to 2 passengers without an extra bed or 3 passengers with one extra bed."
    )
    .notEmpty(),
  body("no_of_extra_beds")
    .optional()
    .isInt({ min: 0 })
    .withMessage("Should be a non-negative integer")
    .custom((value, { req }) => Number(value) <= Number(req.body.no_of_rooms))
    .withMessage("Extra beds cannot exceed the number of rooms")
    .notEmpty(),
  body("iso_code")
    .isString()
    .custom((value) => {
      return /^[A-Za-z]{2,3}$/.test(value);
    })
    .notEmpty(),
  body("phoneNo")
    .isString()
    .matches(/^\+?\d[\d\s-]*$/) // Allow only digits, spaces, hyphens, and a single '+' at the beginning
    .withMessage(
      "Phone number can only contain digits, spaces, hyphens, and a '+' at the beginning, used only once."
    )
    .custom((value: string, { req }) => {
      const isoCode = req.body.iso_code;
      // Parse number with country code and keep raw input.
      const num = phoneUtil.parseAndKeepRawInput(value, isoCode);
      if (phoneUtil.isValidNumber(num)) {
        // Parse the number with the country code
        const parsedNumber = phoneUtil.parse(value, isoCode);
        // Format the number in the international format
        req.body.validPhoneNo = phoneUtil
          .format(parsedNumber, libphonenumber.PhoneNumberFormat.INTERNATIONAL)
          .replace(/\s/g, "");
        return true;
      } else {
        return false;
      }
    })
    .withMessage("Not a valid mobile no")
    .notEmpty(),
  body("email").isEmail().notEmpty(),
  body("address").isString().notEmpty(),
  body("transportation_type")
    .isString()
    .notEmpty()
    .custom((value) => value === "bus" || value === "cab")
    .withMessage(`Transportation Type can be either 'cab' or 'bus'`),
  body("city")
    .isString()
    .matches(/^[a-zA-Z]+$/)
    .withMessage(
      "City must contain only alphabetic characters with no spaces, digits, or special characters"
    )
    .notEmpty(),
  body("country")
    .isString()
    .matches(/^[a-zA-Z]+$/)
    .withMessage(
      "Country must contain only alphabetic characters with no spaces, digits, or special characters"
    )
    .notEmpty(),
  body("pincode")
    .isString()
    .matches(/^[1-9]{1}[0-9]{2}\s{0,1}[0-9]{3}$/)
    .notEmpty(),
  body("state")
    .isString()
    .matches(/^[a-zA-Z]+$/)
    .withMessage(
      "State must contain only alphabetic characters with no spaces, digits, or special characters"
    )
    .notEmpty(),
  body("gstin").optional().isString().notEmpty(),
  body("darshan_id")
    .isInt({ min: 1 }) // Ensure it's an integer and greater than or equal to 1
    .notEmpty()
    .matches(/^[1-9]\d*$/) // Ensure no leading zeros
    .withMessage("darshan_id must be a positive integer without leading zeros"),
  body("darshan_time")
    .isString()
    .notEmpty()
    .matches(/^([01]\d|2[0-3]):([0-5]\d):([0-5]\d)$/)
    .withMessage("darshan_time must be in HH:MM:SS 24-hour format"),
  body("seaters")
    .custom((combination) => {
      if (typeof combination !== "object" || Array.isArray(combination) || combination === null) {
        throw new Error("Seaters must be a valid object");
      }
      if (Object.keys(combination).length === 0) {
        throw new Error("Seaters object must have at least one key-value pair.");
      }
      Object.keys(combination).forEach((key) => {
        if (!/^[0-9]+_seater$/.test(key)) {
          throw new Error(
            `Invalid key '${key}' in seaters. Keys must follow the 'number_seater' format.`
          );
        }
        if (typeof combination[key] !== "number" || combination[key] <= 0) {
          throw new Error(`Value for key '${key}' must be a positive number.`);
        }
      });
      return true;
    })
    .notEmpty(),
];

async function bookHelper(req: express.Request): Promise<{
  success: boolean;
  status_code: number;
  data?: any; // Contains bookingId, bookingData, packageDetails, passengers, total
  errorMessage?: any;
}> {
  const {
    date: userDate,
    packageId,
    passengers,
    name,
    address,
    phoneNo,
    city,
    email,
    pincode,
    country,
    state,
    gstin,
    darshan_id,
    darshan_time,
    seaters,
    no_of_rooms,
    no_of_extra_beds,
    transportation_type,
  } = req.body as {
    date: string;
    packageId: number;
    passengers: {
      name: string;
      age: number;
      gender: string;
      idProof: string;
      proofNo: string;
    }[];
    name: string;
    address: string;
    city: string;
    phoneNo: string;
    pincode: number;
    email: string;
    country: string;
    state: string;
    gstin: string;
    darshan_id: number;
    no_of_rooms: number;
    no_of_extra_beds: number;
    darshan_time: string;
    transportation_type: "cab" | "bus";
    seaters: Record<string, number>;
  };
  // Create a new date object for the current time in UTC
  const nowUTC = new Date();

  // Convert current time to IST by adding 5 hours and 30 minutes
  const nowIST = new Date(nowUTC.getTime() + (5 * 60 + 30) * 60 * 1000);

  // Strip time part from IST to focus only on date
  const todayIST = new Date(nowIST.getFullYear(), nowIST.getMonth(), nowIST.getDate());

  // Convert user-supplied date to a Date object and strip time part
  const suppliedDate = new Date(userDate);
  const userDateOnly = new Date(
    suppliedDate.getFullYear(),
    suppliedDate.getMonth(),
    suppliedDate.getDate()
  );

  // Calculate difference in days based purely on date
  const daysDifference = (userDateOnly.getTime() - todayIST.getTime()) / (1000 * 3600 * 24);

  // @ts-ignore
  const uid = req.uid;
  let noOfAdults = 0;
  let noOfChildren = 0;
  passengers.forEach((passenger) => {
    const { age } = passenger;
    if (age < 12 && age >= 2) {
      noOfChildren++;
    } else if (age >= 12) {
      noOfAdults++;
    }
  });

  // Fetch the package details
  const packagesData = await getPackage(packageId.toString());

  if (!packagesData) {
    return {
      success: false,
      status_code: 404,
      errorMessage: "NO_PACKAGE_FOUND",
    };
  }

  const packageData = packagesData.dataValues;
  const {
    pricing,
    duration,
    ticker,
    package_type,
    main_temple,
    is_accomodation_included,
    package_name,
    darshan_ids,
  } = packageData as {
    pricing: IPricing;
    duration: number;
    package_name: string;
    is_accomodation_included: boolean;
    package_type: string;
    main_temple: string;
    ticker: string;
    darshan_ids: string[];
  };

  let noOfRooms = 0;
  let noOfExtraBeds = 0;
  if (is_accomodation_included) {
    if (no_of_rooms === undefined || no_of_extra_beds === undefined) {
      return {
        success: false,
        status_code: 400,
        errorMessage: "ACCOMODATION_INCLUDED_PACKAGES_NEED_NO_OF_ROOMS_AND_BEDS",
      };
    }
    noOfRooms = Number(no_of_rooms);
    noOfExtraBeds = Number(no_of_extra_beds);
  }

  // Validate the user-supplied date
  if (daysDifference > 90) {
    return {
      success: false,
      status_code: 400,
      errorMessage: "DATES_AVAILABLE_ONLY_FOR_NEXT_90_DAYS",
    };
  }

  //Addition Checks
  if (daysDifference < 1) {
    return {
      success: false,
      status_code: 400,
      errorMessage: "DATES_AVAILABLE_ONLY_FROM_T_PLUS_1_DAYS",
    };
  }

  const darshan = await BMDTemplesDarshans.findOne({
    where: { darshan_id },
  });

  if (darshan == null || !darshan_ids.includes(`${darshan_id}`)) {
    return {
      success: false,
      status_code: 404,
      errorMessage: "DARSHAN_NOT_ASSOCIATED_WITH_THE_GIVEN_PACKAGE",
    };
  }
  const darshanSlotRecord = await BMDTemplesDarshanSlots.findOne({
    where: { darshan_id, darshan_time },
  });
  if (!darshanSlotRecord) {
    return {
      success: false,
      status_code: 404,
      errorMessage: "DARSHAN_TIME_NOT_ASSOCIATED_WITH_THE_GIVEN_DARSHAN",
    };
  }
  const availableSeaters = Object.entries(pricing.local_transport_cost).reduce(
    (acc: number[], [key, transportCosts]) => {
      if (key === transportation_type) {
        acc.push(
          ...Object.keys(transportCosts).map(
            (seater) => Number(seater.split("_")[0]) // Extract the number from the seater key
          )
        );
      }
      return acc;
    },
    [] // Initialize as an empty array
  );

  const combinations = findCombinations(
    noOfAdults + noOfChildren,
    availableSeaters,
    transportation_type
  );
  const exists = combinations.some((combination) =>
    Object.keys(seaters).every(
      (key) =>
        seaters[key] === combination[key] &&
        Object.keys(combination).length === Object.keys(seaters).length
    )
  );
  if (!exists) {
    return {
      success: false,
      status_code: 404,
      errorMessage: "GIVEN_SEATER_COMBINATION_DOESNT_EXIST",
    };
  }

  const packageDetails = {
    duration,
    ticker,
    package_name,
    package_type,
    main_temple,
    city: packageData.city,
  };

  const darshanPrice = darshan.dataValues.price;
  let pricingDetails = {} as Record<string, number>;
  try {
    pricingDetails = calculatePackagePrice(
      pricing as IPricing,
      darshanPrice,
      duration,
      noOfAdults + noOfChildren,
      noOfRooms,
      noOfExtraBeds,
      transportation_type,
      Object.entries(seaters).flatMap(([key, count]) =>
        Array(count).fill(key)
      ) as `${number}_seater`[]
    );
  } catch (error: any) {
    return {
      success: false,
      status_code: 400,
      errorMessage: error,
    };
  }
  const { total } = pricingDetails as { total: number };
  delete pricingDetails.total;
  const date = new Date(userDate);
  const endDate = new Date(date);
  endDate.setDate(endDate.getDate() + duration);

  const bookingData: any = {
    date,
    endDate,
    bookingDate: new Date(todaysDate()),
    packageDetails,
    passengers,
    name,
    address,
    phoneNo,
    city,
    pincode,
    status: "PENDING",
    uid,
    email,
    country,
    state,
    no_of_rooms: noOfRooms,
    no_of_extra_beds: noOfExtraBeds,
    transportation_type,
    seaters,
    gstin: gstin ?? "",
    darshan_id,
    darshan_time,
    createdAt: new Date().getTime(),
    updatedAt: new Date().getTime(),
    pricing: {
      total,
      per_pax_breakup: {
        adult: { ...pricingDetails },
        child: { ...pricingDetails },
      },
    },
  };
  let NO_OF_TICKETS_ON_GIVEN_DATE = 0;
  let record: Model = null;

  const transaction = await sequelize.transaction();
  const { no_of_tickets }: { no_of_tickets: number } = darshanSlotRecord.dataValues;
  record = (
    await BMDTemplesDarshanDates.findOrCreate({
      where: {
        darshan_id,
        darshan_time,
        date: userDate,
      },
      transaction,
      lock: transaction.LOCK.UPDATE,
      defaults: {
        no_of_tickets,
      },
    })
  )[0];

  NO_OF_TICKETS_ON_GIVEN_DATE = record.dataValues.no_of_tickets as number;
  if (NO_OF_TICKETS_ON_GIVEN_DATE < passengers.length) {
    await transaction.rollback();
    return {
      success: false,
      status_code: 400,
      errorMessage: "NO_TICKETS_AVAILABLE",
    };
  }
  record.setDataValue("no_of_tickets", NO_OF_TICKETS_ON_GIVEN_DATE - passengers.length);
  await record.save({ transaction });
  await transaction.commit();

  const bookingId = await generateBookingId(ticker);
  return {
    success: true,
    data: { userDate, bookingId, bookingData, packageDetails, passengers, total },
    status_code: 200,
  };
}
/**
 *  Block the Ticket of a Given Partner
 * @param req
 * @param res
 * @returns
 */
export async function book(req: express.Request, res: express.Response) {
  // Check for validation errors
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    // If there are validation errors, send a response with the errors
    return failureResponse(res, 400, errors.array());
  }

  try {
    const { packageId, email, phoneNo } = req.body as {
      packageId: number;
      email: string;
      phoneNo: string;
    };
    const path = req.originalUrl.split("/")[1];
    switch (path) {
      case "bmd-partner": {
        //@ts-ignore
        const { package_ids }: { package_ids: number[] } = req.data;
        if (!package_ids.includes(packageId)) {
          return failureResponse(res, 404, "NO_PACKAGES_FOUND");
        }
        const helperResponse = await bookHelper(req);

        if (!helperResponse.success) {
          return failureResponse(
            res,
            helperResponse.status_code as 400 | 405 | 403 | 404 | 401 | 500,
            helperResponse.errorMessage || "INTERNAL_SERVER_ERROR"
          );
        }
        const { bookingId, userDate, bookingData, packageDetails, passengers, total } =
          helperResponse.data;

        const collectionRef = db.collection("bookings-partner-pending");
        const docRef = collectionRef.doc(bookingId);

        await docRef.set({ ...bookingData });
        const { endDate } = bookingData;
        const data = {
          date: userDate,
          endDate,
          bookingId,
          packageDetails,
          passengers,
          pricing: { total },
        };
        return successResponse(res, helperResponse.status_code as 200 | 201, data);
      }
      default: {
        const helperResponse = await bookHelper(req);

        if (!helperResponse.success) {
          return failureResponse(
            res,
            helperResponse.status_code as 400 | 405 | 403 | 404 | 401 | 500,
            helperResponse.errorMessage
          );
        }
        const { bookingId, bookingData, packageDetails, passengers, total } = helperResponse.data;

        const nttResponse = await generateNTTPaymentPayload(total as number, true, email, phoneNo);
        const collectionRef = db.collection("bookings-client-pending");
        const docRef = collectionRef.doc(bookingId);

        await docRef.set({ ...bookingData });
        const data = {
          bookingId,
          packageDetails,
          passengers,
          pricing: { total },
          nttResponse,
        };
        return successResponse(res, helperResponse.status_code as 200 | 201, data);
      }
    }
  } catch (error: any) {
    console.error(getCurrentISTDateTime() + ":", error);
    return failureResponse(res, 500, "INTERNAL_SERVER_ERROR");
  }
}
export const fetchBookingValidation = [
  param("bookingId").isString().withMessage("BookingId is mandatory"),
];

async function fetchBookingHelper(
  uid: string,
  booking_id: string,
  collectionName: string
): Promise<{
  success: boolean;
  status_code: number;
  data?: any;
  errorMessage?: any;
}> {
  const collectionRef = db.collection(collectionName);
  const docRef = collectionRef.doc(booking_id);
  const booking = await docRef.get();
  if (!booking.exists) {
    return {
      success: false,
      status_code: 400,
      errorMessage: "BOOKING_DOESNT_EXIST",
    };
  }
  const data = booking.data();

  if (uid !== data.uid) {
    return {
      success: false,
      errorMessage: "CAN_FETCH_ONLY_THE_BOOKING_DONE_BY_THE_USER",
      status_code: 400,
    };
  }
  data.date = data.date.toDate().toISOString().split("T")[0];
  data.endDate = data.endDate.toDate().toISOString().split("T")[0];
  data.bookingDate = data.bookingDate.toDate().toISOString().split("T")[0];
  delete data.pricing.per_pax_breakup;
  return { success: true, data, status_code: 200 };
}

/**
 *  Fetch Booking of a Given Partner
 * @param req
 * @param res
 * @returns
 */
export async function fetchBooking(req: express.Request, res: express.Response) {
  // Check for validation errors
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    // If there are validation errors, send a response with the errors
    return failureResponse(res, 400, errors.array());
  }
  try {
    const booking_id = req.params.bookingId;
    const path = req.originalUrl.split("/")[1];
    switch (path) {
      case "bmd-partner": {
        const helperResponse = await fetchBookingHelper(
          //@ts-ignore
          req.uid,
          booking_id,
          "bookings-partner"
        );
        if (!helperResponse.success) {
          return failureResponse(
            res,
            helperResponse.status_code as 400 | 405 | 403 | 404 | 401 | 500,
            helperResponse.errorMessage || "INTERNAL_SERVER_ERROR"
          );
        }
        const { data, status_code } = helperResponse;
        return successResponse(res, status_code as 200 | 201, data);
      }
      default: {
        //@ts-ignore
        const helperResponse = await fetchBookingHelper(req.uid, booking_id, "bookings-client");
        if (!helperResponse.success) {
          return failureResponse(
            res,
            helperResponse.status_code as 400 | 405 | 403 | 404 | 401 | 500,
            helperResponse.errorMessage || "INTERNAL_SERVER_ERROR"
          );
        }
        const { data, status_code } = helperResponse;
        return successResponse(res, status_code as 200 | 201, data);
      }
    }
  } catch (error: any) {
    console.error(getCurrentISTDateTime() + ":", error);
    return failureResponse(res, 500, "INTERNAL_SERVER_ERROR");
  }
}
export const confirmBookingValidation = [
  query("bookingId").isString().withMessage("BookingId is mandatory"),
];

async function confirmBookingHelper(
  req: express.Request,
  booking_id: string,
  collectionName: string
): Promise<{
  success: boolean;
  status_code: number;
  data?: any;
  errorMessage?: any;
}> {
  const isConfirmed = (await db.collection(collectionName).doc(booking_id).get()).exists;
  if (isConfirmed) {
    return {
      success: false,
      status_code: 400,
      errorMessage: "BOOKING_ALREADY_CONFIRMED",
    };
  }

  const collectionRef = db.collection(`${collectionName}-pending`);
  const docRef = collectionRef.doc(booking_id);
  if (!(await docRef.get()).exists) {
    return {
      success: false,
      status_code: 400,
      errorMessage: "BOOKING_ID_DOESNT_EXIST",
    };
  }
  const data = (await docRef.get()).data();
  const [results] = await sequelize.query("SELECT nextval('invoice_no') as id");
  // @ts-ignore
  const invoiceNo = results[0].id.toString();
  const formattedInvoiceNo = invoiceNo.length > 9 ? invoiceNo : invoiceNo.padStart(9, "0");
  data.invoice_no = formattedInvoiceNo;
  //@ts-ignore
  if (data.uid !== req.uid) {
    return {
      success: false,
      status_code: 400,
      errorMessage: "NOT_THE_BOOKING_OWNER",
    };
  }
  data.status = "UPCOMING";
  data.createdAt = new Date().getTime();
  data.updatedAt = new Date().getTime();
  await db
    .collection(collectionName)
    .doc(booking_id)
    .set({ ...data });

  await docRef.delete();
  data.date = data.date.toDate().toISOString().split("T")[0];
  data.endDate = data.endDate.toDate().toISOString().split("T")[0];
  data.bookingDate = data.bookingDate.toDate().toISOString().split("T")[0];
  delete data.uid;
  delete data.pricing.per_pax_breakup;
  if (collectionName.includes("client")) {
    return {
      success: true,
      status_code: 201,
      data: `${POST_PAYMENT_REDIRECT}thank-you?bookingId=${booking_id}`,
    };
  }
  return {
    success: true,
    status_code: 200,
    data,
  };
}
/**
 *  Confirm Booking of a Given Partner
 * @param req
 * @param res
 * @returns
 */
export async function confirm(req: express.Request, res: express.Response) {
  // Check for validation errors
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    // If there are validation errors, send a response with the errors
    return failureResponse(res, 400, errors.array());
  }
  const booking_id = req.query.bookingId as string;

  const path = req.originalUrl.split("/")[1];
  switch (path) {
    case "bmd-partner": {
      try {
        const helperResponse = await confirmBookingHelper(req, booking_id, "bookings-partner");
        if (!helperResponse.success) {
          return failureResponse(
            res,
            helperResponse.status_code as 400 | 405 | 403 | 404 | 401 | 500,
            helperResponse.errorMessage || "INTERNAL_SERVER_ERROR"
          );
        }
        const { status_code, data } = helperResponse;
        if (status_code === 201) {
          return res.status(201).redirect(helperResponse.data as string);
        }
        return successResponse(res, status_code as 200 | 201, data);
      } catch (error: any) {
        console.error(getCurrentISTDateTime() + ":", error);
        return failureResponse(res, 500, "INTERNAL_SERVER_ERROR");
      }
    }
    default: {
      try {
        const decryptedData = decrypt(req.body.encData);
        const jsonData = JSON.parse(decryptedData);
        const respArray = Object.keys(jsonData).map((key) => jsonData[key]);

        if (respArray[0].responseDetails.statusCode !== "OTS0000") {
          return failureResponse(res, 400, "PAYMENT_NOT_SUCCESSFUL");
        }
        const helperResponse = await confirmBookingHelper(req, booking_id, "bookings-client");
        if (!helperResponse.success) {
          return failureResponse(
            res,
            helperResponse.status_code as 400 | 405 | 403 | 404 | 401 | 500,
            helperResponse.errorMessage || "INTERNAL_SERVER_ERROR"
          );
        }
        const { status_code, data } = helperResponse;
        if (status_code === 201) {
          return res.status(201).redirect(helperResponse.data as string);
        }
        return successResponse(res, status_code as 200 | 201, data);
      } catch (error: any) {
        console.error(getCurrentISTDateTime() + ":", error);
        return res.status(201).redirect(`${POST_PAYMENT_REDIRECT}error?bookingId=${booking_id}`);
      }
    }
  }
}
