import express from "express";
import cors from "cors";
import task from "./routes/api/task";
import bodyParser from "body-parser";

import { APP_PORT } from "./configuration/config";
import { Logger } from "./helpers/logger";
import { successResponse } from "./helpers/responseHelpers";
import { HTTP_STATUS_CODE, Log } from "./helpers/constants";

const app = express();
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));


app.use(cors());
app.get("/", (req, res) => {
  return successResponse(res, HTTP_STATUS_CODE.OK, "TASK SERVICE is RUNNING");
});

app.use("/task", task);

const port = Number(APP_PORT);
app.listen(port, () => {
  Logger.INFO("Task Service is running on port:" + port);
});
