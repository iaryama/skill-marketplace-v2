import express from "express";

import { IPricing } from "../helpers/IPricing";
import { validationResult, query, param } from "express-validator";

import {
  calculatePackagePrice,
  findCombinations,
  getCurrentISTDateTime,
} from "../helpers/miscellaneous";

import { getPackages, getPackage } from "../helpers/packageModelHelper";
import { getDarshanSlots } from "../helpers/darshansModelHelper";

import { failureResponse, successResponse } from "../helpers/responseHelpers";

/**
 *  List All Packages Of a Given Partner
 * @param req
 * @param res
 * @returns
 */

export async function packages(req: express.Request, res: express.Response) {
  const path = req.originalUrl.split("/")[1];
  try {
    switch (path) {
      case "bmd-partner": {
        //@ts-ignore
        const { package_ids }: { package_ids: number[] } = req.data;

        // Fetch the package details from the DB
        const data = await getPackages(package_ids);
        if (!data || data.length === 0) {
          return failureResponse(res, 404, "NO_PACKAGES_FOUND");
        }
        return successResponse(res, 200, data);
      }
      default: {
        // Fetch the package details from the DB
        const data = await getPackages();
        if (!data || data.length === 0) {
          return failureResponse(res, 404, "NO_PACKAGES_FOUND");
        }
        return successResponse(res, 200, data);
      }
    }
  } catch (error: any) {
    console.error(getCurrentISTDateTime() + ":", error);
    return failureResponse(res, 500, "INTERNAL_SERVER_ERROR");
  }
}

export const packageByIdValidation = [
  param("packageId").isInt().notEmpty(),
  query("no_of_adults").isInt({ gt: 0 }).withMessage("Should be a non-zero integer").notEmpty(),
  query("no_of_rooms")
    .optional()
    .isInt({ gt: 0 })
    .withMessage("Should be a non-zero integer")
    .custom((value, { req }) => {
      const no_of_passengers = Number(req.query.no_of_adults) + Number(req.query.no_of_children);
      return Number(value) <= no_of_passengers;
    })
    .withMessage("Rooms cannot exceed total passengers")
    .custom((value, { req }) => {
      const no_of_passengers = Number(req.query.no_of_adults) + Number(req.query.no_of_children);

      const no_of_rooms = Number(value);

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
      return results.includes(Number(req.query.no_of_extra_beds));
    })
    .withMessage(
      "The number of rooms and extra beds must accommodate all passengers. Each room can hold up to 2 passengers without an extra bed or 3 passengers with one extra bed."
    )
    .notEmpty(),
  query("no_of_extra_beds")
    .optional()
    .isInt({ min: 0 })
    .withMessage("Should be a non-negative integer")
    .custom((value, { req }) => Number(value) <= Number(req.query.no_of_rooms))
    .withMessage("Extra beds cannot exceed the number of rooms")
    .notEmpty(),
  query("no_of_children")
    .isInt()
    .withMessage("Should be a non-zero integer")
    .custom((value, { req }) => {
      const no_of_children = Number(value);
      const no_of_adults = Number(req.query.no_of_adults);
      return no_of_adults + no_of_children <= 9;
    })
    .withMessage("At most 9 passengers are allowed")
    .notEmpty(),
];

async function packageByIdHelper(
  req: express.Request,
  packageId: string
): Promise<{
  success: boolean;
  status_code: number;
  data?: any;
  errorMessage?: any;
}> {
  const nowUTC = new Date();
  const nowIST = new Date(nowUTC.getTime() + (5 * 60 + 30) * 60 * 1000);

  let { no_of_adults, no_of_children, no_of_rooms, no_of_extra_beds } = req.query as {
    no_of_adults: string;
    no_of_children: string;
    no_of_rooms: string;
    no_of_extra_beds: string;
  };

  const noOfAdults = Number(no_of_adults);
  const noOfChildren = Number(no_of_children);
  const totalPersons = noOfAdults + noOfChildren;
  let noOfRooms = 0;
  let noOfExtraBeds = 0;

  const pkg = await getPackage(packageId);

  if (!pkg) {
    return {
      success: false,
      status_code: 404,
      errorMessage: "NO_PACKAGE_FOUND",
    };
  }

  const packageData = pkg.dataValues;
  const { pricing, darshan_ids, duration, is_accomodation_included } = packageData as {
    pricing: IPricing;
    duration: number;
    is_accomodation_included: boolean;
    darshan_ids: number[];
  };
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

  const noOfDays = 1;

  const startDate = new Date(nowIST);
  startDate.setUTCDate(startDate.getUTCDate() + noOfDays);
  const startDateFormatted = startDate.toISOString().split("T")[0];

  const endDate = new Date(startDate);
  endDate.setUTCDate(endDate.getUTCDate() + 90);
  const endDateFormatted = endDate.toISOString().split("T")[0];

  let darshanSlotResults = [] as any[];

  darshanSlotResults = await getDarshanSlots(
    startDateFormatted,
    endDateFormatted,
    darshan_ids,
    totalPersons
  );

  if (!darshanSlotResults || darshanSlotResults.length === 0) {
    return {
      success: false,
      status_code: 404,
      errorMessage: "NO_DARSHAN_SLOTS_AVAILABLE",
    };
  }

  const availableSeaters = Object.entries(pricing.local_transport_cost).reduce(
    (acc, [key, transportCosts]) => {
      acc[key] = Object.keys(transportCosts).map(
        (seater) => Number(seater.split("_")[0]) // Extract the number from the seater key
      );
      return acc;
    },
    {} as Record<string, number[]>
  );
  const cabSeaterCombinations = findCombinations(totalPersons, availableSeaters.cab, "cab").map(
    (combination) => {
      const transformed: `${number}_seater`[] = [];
      for (const [key, count] of Object.entries(combination)) {
        for (let i = 0; i < count; i++) {
          transformed.push(key as `${number}_seater`);
        }
      }
      return transformed;
    }
  );
  const busSeaterCombinations = findCombinations(totalPersons, availableSeaters.bus, "bus").map(
    (combination) => {
      const transformed: `${number}_seater`[] = [];
      for (const [key, count] of Object.entries(combination)) {
        for (let i = 0; i < count; i++) {
          transformed.push(key as `${number}_seater`);
        }
      }
      return transformed;
    }
  );
  // Group darshan slots by darshan_id, and store dates under each darshan
  const darshansGrouped = darshanSlotResults.reduce((acc: any, slot: any) => {
    // Initialize an array to hold all combination prices for this slot
    const combinationPrices: { type: string; combination: string[]; price: number }[] = [];
    for (const cabSeaterCombination of cabSeaterCombinations) {
      const cabPrice = calculatePackagePrice(
        pricing as IPricing,
        Number(slot.price),
        duration,
        totalPersons,
        noOfRooms,
        noOfExtraBeds,
        "cab",
        cabSeaterCombination
      ).total;
      combinationPrices.push({
        type: "cab",
        combination: cabSeaterCombination.reduce(
          (acc: any, seater) => ({ ...acc, [seater]: (acc[seater] || 0) + 1 }),
          {}
        ),
        price: cabPrice,
      });
    }

    for (const busSeaterCombination of busSeaterCombinations) {
      const busPrice = calculatePackagePrice(
        pricing as IPricing,
        Number(slot.price),
        duration,
        totalPersons,
        noOfRooms,
        noOfExtraBeds,
        "bus",
        busSeaterCombination
      ).total;
      combinationPrices.push({
        type: "bus",
        combination: busSeaterCombination.reduce(
          (acc: any, seater) => ({ ...acc, [seater]: (acc[seater] || 0) + 1 }),
          {}
        ),
        price: busPrice,
      });
    }

    // Initialize darshan grouping if it doesn't exist
    if (!acc[slot.darshan_id]) {
      acc[slot.darshan_id] = {
        darshan_id: slot.darshan_id,
        darshan_name: slot.darshan_name,
        temple_name: slot.temple_name,
        temple_id: slot.temple_id,
        location: slot.location,
        prices: combinationPrices, // Add all combination prices here
        dates: [],
      };
    }

    const dateEntry = acc[slot.darshan_id].dates.find((date: any) => date[slot.date]);

    if (dateEntry) {
      dateEntry[slot.date].push({
        darshan_time: slot.darshan_time,
        no_of_tickets: slot.no_of_tickets,
      });
    } else {
      acc[slot.darshan_id].dates.push({
        [slot.date]: [
          {
            darshan_time: slot.darshan_time,
            no_of_tickets: slot.no_of_tickets,
          },
        ],
      });
    }

    return acc;
  }, {});

  delete packageData.pricing;
  const data = { ...packageData, darshans: Object.values(darshansGrouped) };
  return {
    success: true,
    status_code: 200,
    data,
  };
}
/**
 *  Fetch Specific Package Of a Given Partner
 * @param req
 * @param res
 * @returns
 */
export async function packageById(req: express.Request, res: express.Response) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return failureResponse(res, 400, errors.array());
  }
  const { packageId } = req.params;
  const path = req.originalUrl.split("/")[1];
  try {
    switch (path) {
      case "bmd-partner": {
        //@ts-ignore
        const { package_ids }: { package_ids: number[] } = req.data;
        if (!package_ids.includes(Number(packageId))) {
          return failureResponse(res, 404, "NO_PACKAGES_FOUND");
        }
        const helperResponse = await packageByIdHelper(req, packageId);
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
        const helperResponse = await packageByIdHelper(req, packageId);
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
