export const {
  REST_APP_PORT,
  JWT_SECRET_KEY,
  POSTGRES_DB,
  POSTGRES_USERNAME,
  POSTGRES_PASSWORD,
  POSTGRES_HOST,
  REDIS_HOST,
  NODE_ENV,
  GRPC_APP_PORT,
} = process.env as Record<string, string>;
