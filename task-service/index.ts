import express from 'express';
import cors from 'cors';
import task from './routes/api/task';
import bodyParser from 'body-parser';
import * as grpc from '@grpc/grpc-js';
import { Category } from './models/category';
import { Task } from './models/task';
import { sequelize } from './db/connectPostgres';
import { GRPC_APP_PORT, REST_APP_PORT } from './configuration/config';
import { Logger } from './helpers/logger';
import { successResponse } from './helpers/responseHelpers';
import { HTTP_STATUS_CODE } from './helpers/constants';
import { grpcServer } from './grpc/grpc';

const app = express();
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.use(cors());
try {
  // Test the database connection
  await sequelize.authenticate();
  Logger.INFO('Connected to the PostgreSQL database.');
  await sequelize.query('CREATE SCHEMA IF NOT EXISTS tasks;');
  await sequelize.query('CREATE SCHEMA IF NOT EXISTS skills_tasks;');

  await Category.sync();
  await Task.sync();
} catch (error) {
  Logger.ERROR('Unable to connect to the PostgreSQL database:', error);
  throw error;
}
app.use('/task', task);
app.get('/', (req, res) => {
  return successResponse(res, HTTP_STATUS_CODE.OK, 'SKILL SERVICE IS RUNNING');
});

const port = Number(REST_APP_PORT);
app.listen(port, () => {
  Logger.INFO('Task REST Server is running on port:' + port);
});

grpcServer.bindAsync(`0.0.0.0:${GRPC_APP_PORT}`, grpc.ServerCredentials.createInsecure(), (err, port) => {
  if (err) {
    console.error('gRPC server failed to start:', err);
    return;
  }
  Logger.INFO(`TASK gRPC server running on port: ${port}`);
});

// Graceful shutdown
const gracefulShutdown = async () => {
  Logger.INFO('Shutting down gracefully...');
  try {
    // Close the Sequelize connection
    await sequelize.close();
    Logger.INFO('Sequelize connection closed.');
    process.exit(0);
  } catch (error) {
    Logger.ERROR('Error during database/redis shutdown:', error);
    process.exit(1);
  }
};

process.on('SIGTERM', gracefulShutdown);
process.on('SIGINT', gracefulShutdown);
