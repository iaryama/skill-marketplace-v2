import { IPricing } from "./IPricing";

export function todaysDate() {
  const currentDate = new Date();
  const formattedDate = new Intl.DateTimeFormat("en-IN", {
    timeZone: "Asia/Kolkata",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(currentDate);
  const dateParts = formattedDate.split("/");
  return `${dateParts[2]}-${dateParts[1]}-${dateParts[0]}`;
}

export function getCurrentISTDateTime() {
  const date = new Date().toLocaleString("en-US", { timeZone: "Asia/Kolkata", hour12: false });
  const [month, day, year] = date.split(",")[0].split("/");
  const [time] = date.split(", ")[1].split(" ");
  return `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")} ${time}`;
}

export function findCombinations(
  passengers: number,
  seaters: number[],
  transportation_type: "cab" | "bus"
): Record<string, number>[] {
  if (transportation_type === "cab") {
    const results: number[][] = [];

    function combine(current: number[], start: number, totalSeats: number): void {
      if (totalSeats >= passengers) {
        results.push([...current]); // Store the current valid combination
        return;
      }

      for (let i = start; i < seaters.length; i++) {
        combine([...current, seaters[i]], i, totalSeats + seaters[i]);
      }
    }

    combine([], 0, 0);

    // Apply the rule: At most 4 empty seats are allowed
    const filteredResults = results.filter((combination) => {
      const totalSeats = combination.reduce((sum, seater) => sum + seater, 0);
      return totalSeats >= passengers && totalSeats <= passengers + 4;
    });

    return filteredResults.map((combination) => {
      const count: Record<string, number> = {};
      for (const seater of combination) {
        const key = `${seater}_seater`;
        count[key] = (count[key] || 0) + 1;
      }
      return count;
    });
  } else {
    return seaters.map((seater) => ({ [`${seater}_seater`]: 1 }));
  }
}

export const months = [
  "JAN",
  "FEB",
  "MAR",
  "APR",
  "MAY",
  "JUN",
  "JUL",
  "AUG",
  "SEP",
  "OCT",
  "NOV",
  "DEC",
];

export function calculatePackagePrice(
  pricingDetails: IPricing,
  darshanPrice: number,
  duration: number, // Number of days in the package
  noOfPassengers: number,
  noOfRooms: number,
  noOfExtraBeds: number,
  transportation_type: "cab" | "bus",
  seaters: `${number}_seater`[]
): Record<string, number> {
  // Calculate the local transport cost based on the selected vehicle(s)
  let transportCost = 0;
  for (const seater of seaters) {
    transportCost += pricingDetails.local_transport_cost[transportation_type][seater] || 0;
  }

  // Calculate accommodation cost
  const accomodationCost =
    noOfRooms * pricingDetails.accomodation_price * duration +
    noOfExtraBeds * pricingDetails.extra_bed_price * duration;

  const { fresh_up_price, breakfast_price, lunch_price, dinner_price } = pricingDetails;
  // Calculate per pax costs
  const perPaxCost = fresh_up_price + breakfast_price + lunch_price + dinner_price;

  // Calculate total cost excluding margins and GST
  const baseCost =
    transportCost + darshanPrice * noOfPassengers + accomodationCost + perPaxCost * noOfPassengers;

  // Add BMD margin
  const bmdMargin = pricingDetails.bmd_margin[transportation_type] || 0;
  const bmdMarginOnCost =
    pricingDetails.bmd_margin_type === "percentage" ? (baseCost * bmdMargin) / 100 : bmdMargin;
  const costWithMargin = baseCost + bmdMarginOnCost;
  // Add GST to BMD base price
  const gst_on_bmd_base_price = (costWithMargin * pricingDetails.bmd_base_price_gst) / 100;
  const gstCost = costWithMargin + gst_on_bmd_base_price;

  // Add service charge and agent commission
  const serviceCharge = (gstCost * pricingDetails.service_charge_percentage) / 100;
  const agentCommission = (gstCost * pricingDetails.agent_commission_percentage) / 100;
  const grossMRP = gstCost + serviceCharge + agentCommission;

  // Add final GST
  const gst = (grossMRP * pricingDetails.gst) / 100;
  const finalPrice = grossMRP + gst;

  // Round off to nearest digit based on .50 cutoff
  const roundedPrice =
    Number((finalPrice % 1).toFixed(2)) >= 0.51 ? Math.ceil(finalPrice) : Math.floor(finalPrice);

  return {
    total: roundedPrice,
    // Below Keys Hold Per PAX Cost
    transpor_cost: Number((transportCost / noOfPassengers).toFixed(2)),
    accomodation_cost: Number((accomodationCost / noOfPassengers).toFixed(2)),
    fresh_up_price,
    breakfast_price,
    lunch_price,
    dinner_price,
    darshan_price: darshanPrice,
    bmd_margin: Number((bmdMarginOnCost / noOfPassengers).toFixed(2)),
    gst_on_bmd_base_price: Number((gst_on_bmd_base_price / noOfPassengers).toFixed(2)),
    service_charge: Number((serviceCharge / noOfPassengers).toFixed(2)),
    agent_commission: Number((agentCommission / noOfPassengers).toFixed(2)),
    gst: Number((gst / noOfPassengers).toFixed(2)),
    final_per_pax_price: Number((roundedPrice / noOfPassengers).toFixed(2)),
  };
}

// Define the regex patterns for each ID type
export const regexPatternsIdProofs: { [key: string]: RegExp } = {
  AADHAR: /^[2-9]{1}[0-9]{3}[0-9]{4}[0-9]{4}$/,
  PAN: /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/,
  PASSPORT: /^[A-PR-WY][1-9]\d\s?\d{4}[1-9]$/,
  VOTER_ID: /^[A-Z]{3}[0-9]{7}$/,
};
