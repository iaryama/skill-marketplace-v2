export interface IPricing {
  local_transport_cost: {
    [key in "cab" | "bus"]: { [key: `${number}_seater`]: number };
  }; // Nested structure for seater options
  bmd_margin_type: string; // Explicit string type for this property
  accomodation_price: number; // Per pax per day
  extra_bed_price: number; // Per pax per day
  fresh_up_price: number; // Per pax per package
  breakfast_price: number; // Per pax per package
  lunch_price: number; // Per pax per package
  dinner_price: number; // Per pax per package
  bmd_margin: { [key in "cab" | "bus"]: number }; // Fixed bmd_margin structure
  bmd_base_price_gst: number;
  service_charge_percentage: number;
  agent_commission_percentage: number;
  gst: number;
}
