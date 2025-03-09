import express from 'express';
import cors from 'cors';
import offer from './routes/api/offer';
import { sequelize } from './db/connectPostgres';
import { REST_APP_PORT, TASK_GRPC_APP_HOST, TASK_GRPC_APP_PORT } from './configuration/config';
import { Logger } from './helpers/logger';
import bodyParser from 'body-parser';
import { successResponse } from './helpers/responseHelpers';
import { HTTP_STATUS_CODE } from './helpers/constants';
import * as grpc from '@grpc/grpc-js';
import * as protoLoader from '@grpc/proto-loader';
import path from 'path';

const PROTO_PATH = path.join(__dirname, './proto/task.proto');

// Load the TaskService proto file
const packageDefinition = protoLoader.loadSync(PROTO_PATH, {
  keepCase: true,
  longs: String,
  enums: String,
  defaults: true,
  oneofs: true,
});

const grpcObject = grpc.loadPackageDefinition(packageDefinition) as any;
const taskPackage = grpcObject.task;

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

// gRPC Client for Task Service
export const taskClient = new taskPackage.TaskService(`${TASK_GRPC_APP_HOST}:${TASK_GRPC_APP_PORT}`, grpc.credentials.createInsecure());

(async () => {
  try {
    await sequelize.authenticate();
    Logger.INFO('Connected to PostgreSQL database.');
    await sequelize.query('CREATE SCHEMA IF NOT EXISTS tasks;');
    await sequelize.sync();
  } catch (error) {
    Logger.ERROR('Unable to connect to PostgreSQL:', error);
    process.exit(1);
  }
})();
