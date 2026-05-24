import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  HeadObjectCommand,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

function required(name: string): string {
  const v = process.env[name];
  if (!v) throw new Error(`Missing env var: ${name}`);
  return v;
}

export const BUCKET = required('AWS_S3_BUCKET');

export const s3 = new S3Client({
  region: required('AWS_REGION'),
  credentials: {
    accessKeyId: required('AWS_ACCESS_KEY_ID'),
    secretAccessKey: required('AWS_SECRET_ACCESS_KEY'),
  },
});

export async function presignedPutUrl(
  key: string,
  contentType: string,
  contentLength: number,
  expiresIn = 300, // 5 minutes
): Promise<string> {
  return getSignedUrl(
    s3,
    new PutObjectCommand({
      Bucket: BUCKET,
      Key: key,
      ContentType: contentType,
      ContentLength: contentLength,
    }),
    { expiresIn },
  );
}

/** Presigned GET URL. Default TTL 1h for viewing media in the editor. */
export async function presignedGetUrl(key: string, expiresIn = 3600): Promise<string> {
  return getSignedUrl(s3, new GetObjectCommand({ Bucket: BUCKET, Key: key }), { expiresIn });
}

export type HeadResult = { size: number; contentType: string | undefined };

export async function headObject(key: string): Promise<HeadResult | null> {
  try {
    const res = await s3.send(new HeadObjectCommand({ Bucket: BUCKET, Key: key }));
    return { size: res.ContentLength ?? 0, contentType: res.ContentType };
  } catch (err) {
    const e = err as { name?: string; $metadata?: { httpStatusCode?: number } };
    const status = e.$metadata?.httpStatusCode;
    if (status === 404 || status === 403) return null;
    if (e.name === 'NotFound' || e.name === 'NoSuchKey') return null;
    throw err;
  }
}

// Not done for this assignment, but a real app needs a way to delete existing media
// export async function deleteS3Object(key: string): Promise<void> {
//   await s3.send(new DeleteObjectCommand({ Bucket: BUCKET, Key: key }));
// }
