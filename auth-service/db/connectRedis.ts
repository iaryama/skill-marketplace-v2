import { createClient } from 'redis';
import { REDIS_HOST } from '../configuration/config';
import { Logger } from '../helpers/logger';

const redisClient = createClient({
  url: `redis://${REDIS_HOST}`,
});

redisClient.on('error', (err) => Logger.ERROR("Redis connection error: ", err));

export { redisClient };
