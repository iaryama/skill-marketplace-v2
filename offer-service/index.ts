import express from 'express';
import cors from 'cors';
import * as grpc from '@grpc/grpc-js';
import offer from './routes/api/offer';
import { sequelize } from './db/connectPostgres';
import { GRPC_APP_PORT, REST_APP_PORT } from './configuration/config';
import { Logger } from './helpers/logger';
import { grpcServer } from './grpc/grpc';
import bodyParser from 'body-parser';
import { successResponse } from './helpers/responseHelpers';
import { HTTP_STATUS_CODE } from './helpers/constants';

const app = express();
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cors());

app.use('/offer', offer);

app.get('/', (req, res) => {
  return successResponse(res, HTTP_STATUS_CODE.OK, 'OFFER SERVICE IS RUNNING');
});

const port = Number(REST_APP_PORT);
app.listen(port, () => {
  Logger.INFO('OFFER REST Server is running on port:' + port);
});

(async () => {
  try {
    await sequelize.authenticate();
    Logger.INFO('Connected to PostgreSQL database.');
    await sequelize.sync();
  } catch (error) {
    Logger.ERROR('Unable to connect to PostgreSQL:', error);
    process.exit(1);
  }

  grpcServer.bindAsync(`0.0.0.0:${GRPC_APP_PORT}`, grpc.ServerCredentials.createInsecure(), (err, port) => {
    if (err) {
      Logger.ERROR('gRPC server failed to start:', err);
      process.exit(1);
    }
    Logger.INFO(`Offer gRPC server running on port: ${port}`);
  });
})();
