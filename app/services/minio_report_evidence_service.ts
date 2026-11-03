import {
  CreateBucketCommand,
  DeleteObjectCommand,
  GetObjectCommand,
  HeadBucketCommand,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'
import { Exception } from '@adonisjs/core/exceptions'
import app from '@adonisjs/core/services/app'
import { createReadStream } from 'node:fs'

import minioConfig from '#config/minio'
import type { StagedReportEvidence } from '#services/report_evidence_staging_service'

export interface StoredReportEvidence {
  bucket: string
  objectKey: string
  etag: string | null
}

const connectionOptions = {
  region: minioConfig.region,
  forcePathStyle: true,
  credentials: {
    accessKeyId: minioConfig.accessKey,
    secretAccessKey: minioConfig.secretKey,
  },
}

function endpointUrl(host: string): string {
  const protocol = minioConfig.useSSL ? 'https' : 'http'
  return `${protocol}://${host}:${minioConfig.port}`
}

const storageClient = new S3Client({
  ...connectionOptions,
  endpoint: endpointUrl(minioConfig.endpoint),
})

const publicUrlClient = new S3Client({
  ...connectionOptions,
  endpoint: endpointUrl(minioConfig.publicEndpoint),
})

export default class MinioReportEvidenceService {
  static async ensureBucket(): Promise<void> {
    if (app.inTest) {
      return
    }

    try {
      await storageClient.send(new HeadBucketCommand({ Bucket: minioConfig.bucket }))
    } catch (error) {
      const status = (error as { $metadata?: { httpStatusCode?: number } }).$metadata
        ?.httpStatusCode
      if (status !== 404) {
        throw error
      }
      await storageClient.send(new CreateBucketCommand({ Bucket: minioConfig.bucket }))
    }
  }

  static async store(stagedEvidence: StagedReportEvidence): Promise<StoredReportEvidence> {
    if (app.inTest) {
      return {
        bucket: minioConfig.bucket,
        objectKey: stagedEvidence.objectKey,
        etag: 'test-etag',
      }
    }

    try {
      await this.ensureBucket()
      const result = await storageClient.send(
        new PutObjectCommand({
          Bucket: minioConfig.bucket,
          Key: stagedEvidence.objectKey,
          Body: createReadStream(stagedEvidence.absolutePath),
          ContentLength: stagedEvidence.sizeBytes,
          ContentType: stagedEvidence.mimeType,
          Metadata: {
            'original-name': encodeURIComponent(stagedEvidence.originalName),
          },
        })
      )

      return {
        bucket: minioConfig.bucket,
        objectKey: stagedEvidence.objectKey,
        etag: result.ETag ?? null,
      }
    } catch {
      throw new Exception('No fue posible almacenar la evidencia del reporte', {
        status: 503,
        code: 'E_REPORT_STORAGE_UNAVAILABLE',
      })
    }
  }

  static async remove(storedEvidence: StoredReportEvidence): Promise<void> {
    if (app.inTest) {
      return
    }

    await storageClient.send(
      new DeleteObjectCommand({
        Bucket: storedEvidence.bucket,
        Key: storedEvidence.objectKey,
      })
    )
  }

  static async getSignedUrl(bucket: string, objectKey: string): Promise<string> {
    if (app.inTest) {
      return `${endpointUrl(minioConfig.publicEndpoint)}/${bucket}/${objectKey}?test-signature=true`
    }

    return getSignedUrl(publicUrlClient, new GetObjectCommand({ Bucket: bucket, Key: objectKey }), {
      expiresIn: minioConfig.signedUrlExpiresIn,
    })
  }
}
