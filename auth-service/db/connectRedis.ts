import { createClient } from 'redis';
import { REDIS_HOST } from '../configuration/config';
import { Logger } from '../helpers/logger';

export const redisClient = createClient({
  url: `redis://${REDIS_HOST}`,
});

redisClient.on('error', (err) => Logger.ERROR('Redis connection error: ', err));

export const connectRedis = async () => {
  await redisClient.connect();
  Logger.INFO('Connected to Redis successfully');
};
