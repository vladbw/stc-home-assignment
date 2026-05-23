import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  HeadObjectCommand,
  DeleteObjectCommand,
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

/**
 * Generate a presigned PUT URL. The signed request locks Content-Type and
 * Content-Length: the browser must send a PUT with both headers matching
 * exactly what was signed, or S3 rejects the upload.
 */
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

/**
 * HEAD an object. Returns null if it doesn't exist; throws on other errors.
 *
 * Note: our IAM policy intentionally omits `s3:ListBucket`, so S3 returns
 * 403 (not 404) when the object isn't there — it can't distinguish "missing"
 * from "forbidden" without list permission, by design. Since we know our
 * credentials are valid (the same client signs PUT/GET successfully), both
 * 403 and 404 here mean "object isn't in the bucket".
 */
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

export async function deleteS3Object(key: string): Promise<void> {
  await s3.send(new DeleteObjectCommand({ Bucket: BUCKET, Key: key }));
}
