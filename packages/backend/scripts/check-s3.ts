/**
 * S3 connectivity helper check.
 * Verifies that the AWS credentials in .env can talk to the configured bucket
 * Run with:  npm run check:s3 -w backend
 */
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
  if (!v) {
    console.error(`Missing env var: ${name}`);
    process.exit(1);
  }
  return v;
}

const region = required('AWS_REGION');
const bucket = required('AWS_S3_BUCKET');
const accessKeyId = required('AWS_ACCESS_KEY_ID');
const secretAccessKey = required('AWS_SECRET_ACCESS_KEY');

const s3 = new S3Client({
  region,
  credentials: { accessKeyId, secretAccessKey },
});

const sdkKey = `_diagnostics/sdk-${Date.now()}.txt`;
const presignedKey = `_diagnostics/presigned-${Date.now()}.txt`;
const sdkBody = `sdk check ${new Date().toISOString()}`;
const presignedBody = 'round trip via presigned put';

async function step<T>(label: string, fn: () => Promise<T>): Promise<T> {
  process.stdout.write(`  ${label} ... `);
  try {
    const result = await fn();
    console.log('OK');
    return result;
  } catch (err) {
    console.log('FAIL');
    const e = err as { name?: string; message?: string; $metadata?: { httpStatusCode?: number } };
    console.error(`    ${e.name ?? 'Error'}: ${e.message}`);
    if (e.$metadata?.httpStatusCode) {
      console.error(`    HTTP status: ${e.$metadata.httpStatusCode}`);
    }
    throw err;
  }
}

async function main() {
  console.log(`Bucket: ${bucket}`);
  console.log(`Region: ${region}`);
  console.log();

  await step('1. PUT object via SDK', () =>
    s3.send(
      new PutObjectCommand({
        Bucket: bucket,
        Key: sdkKey,
        Body: sdkBody,
        ContentType: 'text/plain',
      }),
    ),
  );

  const head = await step('2. HEAD object via SDK', () =>
    s3.send(new HeadObjectCommand({ Bucket: bucket, Key: sdkKey })),
  );
  console.log(`     size=${head.ContentLength}  contentType=${head.ContentType}`);

  await step('3. GET object via SDK (body matches)', async () => {
    const res = await s3.send(new GetObjectCommand({ Bucket: bucket, Key: sdkKey }));
    const body = await res.Body!.transformToString();
    if (body !== sdkBody) throw new Error(`body mismatch: got "${body}"`);
  });

  const presignedPut = await step('4. Generate presigned PUT URL', () =>
    getSignedUrl(
      s3,
      new PutObjectCommand({
        Bucket: bucket,
        Key: presignedKey,
        ContentType: 'text/plain',
      }),
      { expiresIn: 60 },
    ),
  );
  console.log(`     host: ${new URL(presignedPut).host}`);

  await step('5. Upload via presigned PUT (no creds)', async () => {
    const res = await fetch(presignedPut, {
      method: 'PUT',
      headers: { 'Content-Type': 'text/plain' },
      body: presignedBody,
    });
    if (!res.ok) {
      throw new Error(`PUT status ${res.status}: ${await res.text()}`);
    }
  });

  const presignedGet = await step('6. Generate presigned GET URL', () =>
    getSignedUrl(
      s3,
      new GetObjectCommand({ Bucket: bucket, Key: presignedKey }),
      { expiresIn: 60 },
    ),
  );

  await step('7. Fetch presigned GET URL (body matches)', async () => {
    const res = await fetch(presignedGet);
    if (!res.ok) throw new Error(`GET status ${res.status}`);
    const txt = await res.text();
    if (txt !== presignedBody) throw new Error(`body mismatch: got "${txt}"`);
  });

  await step('8. DELETE both test objects', () =>
    Promise.all([
      s3.send(new DeleteObjectCommand({ Bucket: bucket, Key: sdkKey })),
      s3.send(new DeleteObjectCommand({ Bucket: bucket, Key: presignedKey })),
    ]),
  );

  console.log();
  console.log('All S3 checks passed.');
}

main().catch(() => {
  console.error();
  console.error('S3 check failed.');
  process.exit(1);
});
