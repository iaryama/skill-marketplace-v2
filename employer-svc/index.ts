import express from "express";
import cors from "cors";
import packages from "./routes/api/packages";
import partner from "./routes/api/partner";
import bookings from "./routes/api/bookings";
import client from "./routes/api/client";
import bodyParser from "body-parser";
import { Packages } from "./models/packages";
import {
  BMDTemplesDarshans,
  BMDTemples,
  BMDTemplesDarshanSlots,
  BMDTemplesDarshanDates,
} from "./models/darshanTicketsPerSlot";
import { BookingIdGenerator } from "./models/bookingIdGenerator";
import { APP_PORT } from "./utils/constants";
import { getCurrentISTDateTime } from "./helpers/miscellaneous";
import { sequelize } from "./utils/connectPostgres";
import { successResponse } from "./helpers/responseHelpers";

const app = express();
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
try {
  // Test the database connection
  await sequelize.authenticate();
  console.log(getCurrentISTDateTime() + ":", "Connected to the PostgreSQL database.");
  await sequelize.query("CREATE SEQUENCE IF NOT EXISTS invoice_no AS BIGINT START 1;");
  //Sync all Models at Once
  await Promise.all([
    Packages.sync(),
    BookingIdGenerator.sync(),
    BMDTemples.sync(),
    BMDTemplesDarshans.sync(),
    BMDTemplesDarshanSlots.sync(),
    BMDTemplesDarshanDates.sync(),
  ]);
} catch (error: any) {
  console.error(
    getCurrentISTDateTime() + ":",
    "Unable to connect to the PostgreSQL database / Sync Error:",
    error
  );
  throw error;
}

app.use(cors());
app.get("/", (req, res) => {
  return successResponse(res, 200, "APP is RUNNING");
});
app.use("/bmd-partner/packages", packages);
app.use("/bmd-client/packages", packages);
app.use("/bmd-agent/packages", packages);
app.use("/bmd-agent/bookings", bookings);
app.use("/bmd-partner/bookings", bookings);
app.use("/bmd-client/bookings", bookings);
app.use("/bmd-partner", partner);
app.use("/bmd-client", client);
// Graceful shutdown
const gracefulShutdown = async () => {
  console.log(getCurrentISTDateTime() + ":", "Shutting down gracefully...");
  try {
    // Close the Sequelize connection
    await sequelize.close();
    console.log(getCurrentISTDateTime() + ":", "Sequelize connection closed.");
    process.exit(0);
  } catch (error) {
    console.error(getCurrentISTDateTime() + ":", "Error during database shutdown:", error);
    process.exit(1);
  }
};

process.on("SIGTERM", gracefulShutdown);
process.on("SIGINT", gracefulShutdown);
const port = Number(APP_PORT);
app.listen(port, () => {
  console.log(getCurrentISTDateTime() + ":", "HTTP Server is running on port:" + port);
});
