import env from '#start/env'

const minioConfig = {
  endpoint: env.get('MINIO_ENDPOINT'),
  publicEndpoint: env.get('MINIO_PUBLIC_ENDPOINT') ?? env.get('MINIO_ENDPOINT'),
  port: env.get('MINIO_PORT'),
  useSSL: env.get('MINIO_USE_SSL'),
  accessKey: env.get('MINIO_ACCESS_KEY').release(),
  secretKey: env.get('MINIO_SECRET_KEY').release(),
  bucket: env.get('MINIO_BUCKET'),
  region: env.get('MINIO_REGION'),
  signedUrlExpiresIn: env.get('MINIO_SIGNED_URL_EXPIRES_IN'),
}

export default minioConfig
