import * as grpc from '@grpc/grpc-js';
import { sequelize } from './db/connectPostgres';
import { GRPC_APP_PORT } from './configuration/config';
import { Logger } from './helpers/logger';
import { grpcServer } from './grpc/grpc';

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
