import express from "express";
import cors from "cors";
import client from "./routes/api/client";
import contractor from "./routes/api/contractor";
import bodyParser from "body-parser";

import { APP_PORT } from "./configuration/config";
import { logPrefix } from "./helpers/logger";
import { successResponse } from "./helpers/responseHelpers";
import { HTTP_STATUS_CODE, Log } from "./helpers/constants";

const app = express();
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));


app.use(cors());
app.get("/", (req, res) => {
  return successResponse(res, HTTP_STATUS_CODE.OK, "APP is RUNNING");
});

app.use("/client", client);
app.use("/contractor", contractor);

const port = Number(APP_PORT);
app.listen(port, () => {
  console.log(logPrefix(Log.INFO) + ":", "HTTP Server is running on port:" + port);
});
