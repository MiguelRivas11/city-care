/*
|--------------------------------------------------------------------------
| Environment variables service
|--------------------------------------------------------------------------
|
| The `Env.create` method creates an instance of the Env service. The
| service validates the environment variables and also cast values
| to JavaScript data types.
|
*/

import { Env } from '@adonisjs/core/env'

export default await Env.create(new URL('../', import.meta.url), {
  // Node
  NODE_ENV: Env.schema.enum(['development', 'production', 'test'] as const),
  PORT: Env.schema.number(),
  HOST: Env.schema.string({ format: 'host' }),
  LOG_LEVEL: Env.schema.string(),

  // App
  APP_KEY: Env.schema.secret(),
  APP_URL: Env.schema.string({ format: 'url', tld: false }),
  ACCESS_TOKEN_EXPIRES_IN: Env.schema.string.optional(),
  ADMIN_INITIAL_PASSWORD: Env.schema.string.optional(),
  DEPENDENCY_ADMIN_INITIAL_PASSWORD: Env.schema.string.optional(),
  CITIZEN_INITIAL_EMAIL: Env.schema.string.optional(),
  CITIZEN_INITIAL_PASSWORD: Env.schema.string.optional(),

  // Session
  SESSION_DRIVER: Env.schema.enum(['cookie', 'memory', 'database'] as const),

  /*
  |----------------------------------------------------------
  | Variables for configuring database connection
  |----------------------------------------------------------
  */
  DB_HOST: Env.schema.string({ format: 'host' }),
  DB_PORT: Env.schema.number(),
  DB_USER: Env.schema.string(),
  DB_PASSWORD: Env.schema.string.optional(),
  DB_DATABASE: Env.schema.string(),

  /*
  |----------------------------------------------------------
  | Variables for configuring the limiter package
  |----------------------------------------------------------
  */
  LIMITER_STORE: Env.schema.enum(['memory'] as const),

  /*
  |----------------------------------------------------------
  | MinIO object storage
  |----------------------------------------------------------
  */
  MINIO_ENDPOINT: Env.schema.string({ format: 'host' }),
  MINIO_PUBLIC_ENDPOINT: Env.schema.string.optional(),
  MINIO_PORT: Env.schema.number(),
  MINIO_USE_SSL: Env.schema.boolean(),
  MINIO_ACCESS_KEY: Env.schema.secret(),
  MINIO_SECRET_KEY: Env.schema.secret(),
  MINIO_BUCKET: Env.schema.string(),
  MINIO_REGION: Env.schema.string(),
  MINIO_SIGNED_URL_EXPIRES_IN: Env.schema.number(),
})
