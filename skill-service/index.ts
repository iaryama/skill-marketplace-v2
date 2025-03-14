import express from 'express';
import cors from 'cors';
import skill from './routes/api/skill';
import bodyParser from 'body-parser';
import { Category } from './models/category';
import { Skill } from './models/skill';
import { sequelize } from './db/connectPostgres';
import { REST_APP_PORT } from './configuration/config';
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
  await sequelize.query('CREATE SCHEMA IF NOT EXISTS skills;');
  await sequelize.query('CREATE SCHEMA IF NOT EXISTS skills_tasks;');
  await Category.sync();
  await Skill.sync();
} catch (error) {
  Logger.ERROR('Unable to connect to the PostgreSQL database:', error);
  throw error;
}
app.get('/', (req, res) => {
  return successResponse(res, HTTP_STATUS_CODE.OK, 'SKILL SERVICE IS RUNNING');
});

app.use('/skill', skill);

const port = Number(REST_APP_PORT);
app.listen(port, () => {
  Logger.INFO('SKILL REST Server is running on port:' + port);
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
