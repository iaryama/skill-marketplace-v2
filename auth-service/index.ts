import express from 'express';
import cors from 'cors';
import user from './routes/api/user';
import bodyParser from 'body-parser';
import { User } from './models/user';
import * as grpc from '@grpc/grpc-js';
import * as protoLoader from '@grpc/proto-loader';
import { sequelize } from './db/connectPostgres';
import { redisClient, connectRedis } from './db/connectRedis';
import { GRPC_APP_PORT, REST_APP_PORT } from './configuration/config';
import { Logger } from './helpers/logger';
import { successResponse } from './helpers/responseHelpers';
import { HTTP_STATUS_CODE } from './helpers/constants';

const app = express();
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.use(cors());
try {
  // Test the database connection
  await sequelize.authenticate();
  Logger.INFO('Connected to the PostgreSQL database.');
  await sequelize.query('CREATE SCHEMA IF NOT EXISTS auth;');
  await User.sync();
  await connectRedis();
} catch (error) {
  Logger.ERROR('Unable to connect to the PostgreSQL database:', error);
  throw error;
}
app.get('/', (req, res) => {
  return successResponse(res, HTTP_STATUS_CODE.OK, 'AUTH SERVICE is RUNNING');
});

app.use('/user', user);

const port = Number(REST_APP_PORT);
app.listen(port, () => {
  Logger.INFO('AUTH Service is running on port:' + port);
});

const packageDef = protoLoader.loadSync('proto/auth.proto', {});
const grpcObj = grpc.loadPackageDefinition(packageDef) as any;
const authPackage = grpcObj.auth;

const grpcServer = new grpc.Server();
grpcServer.addService(authPackage.AuthService.service, {
  GetUserById: async (call: any, callback: any) => {
    const user = await User.findByPk(call.request.id);
    if (user) callback(null, { id: user.id, email: user.email, role: user.role });
    else callback({ code: grpc.status.NOT_FOUND, message: 'User not found' });
  },
});

grpcServer.bindAsync(`0.0.0.0:${GRPC_APP_PORT}`, grpc.ServerCredentials.createInsecure(), (err, port) => {
  if (err) {
    console.error('gRPC server failed to start:', err);
    return;
  }
  Logger.INFO(`gRPC server running on port: ${port}`);
});

// Graceful shutdown
const gracefulShutdown = async () => {
  Logger.INFO('Shutting down gracefully...');
  try {
    // Close the Sequelize connection
    await sequelize.close();
    Logger.INFO('Sequelize connection closed.');
    await redisClient.disconnect();
    Logger.INFO('Redis connection closed.');
    process.exit(0);
  } catch (error) {
    Logger.ERROR('Error during database/redis shutdown:', error);
    process.exit(1);
  }
};

process.on('SIGTERM', gracefulShutdown);
process.on('SIGINT', gracefulShutdown);
