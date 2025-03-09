import { Sequelize, ConnectionError } from 'sequelize';
import { POSTGRES_DB, POSTGRES_USERNAME, POSTGRES_PASSWORD, POSTGRES_HOST, NODE_ENV } from '../configuration/config';
// Initialize Sequelize
export const sequelize = new Sequelize(POSTGRES_DB, POSTGRES_USERNAME, POSTGRES_PASSWORD, {
  dialect: 'postgres',
  host: POSTGRES_HOST,
  port: 5432,
  pool: {
    max: 5,
    min: 2,
    acquire: 60000,
    idle: 10000,
  },
  logging: NODE_ENV === 'PRODUCTION' ? false : false,
  retry: {
    match: [/Deadlock/i, ConnectionError],
    max: 5, // Maximum retry 5 times
    backoffBase: 1000, // Initial backoff duration in ms. Default: 100,
    backoffExponent: 1.5,
  },
});
