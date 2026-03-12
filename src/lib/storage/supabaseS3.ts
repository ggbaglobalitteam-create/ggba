import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";

type SupabaseS3Config = {
  bucket: string;
  endpoint: string;
  region: string;
  accessKeyId: string;
  secretAccessKey: string;
};

let cachedClient: S3Client | null = null;
let cachedConfig: SupabaseS3Config | null = null;

function readRequiredEnv(name: string): string {
  const value = process.env[name];
  if (!value || !value.trim()) {
    throw new Error(`Missing required env var: ${name}`);
  }
  return value.trim();
}

function readBucketName(): string {
  const value =
    process.env.SUPABASE_STORAGE_BUCKET ??
    process.env.SUPABASE_BUCKET_NAME ??
    process.env.SUPABASE_S3_BUCKET ??
    process.env.SUPABASE_BUCKET;

  if (!value || !value.trim()) {
    throw new Error(
      "Missing storage bucket env var. Set SUPABASE_STORAGE_BUCKET (or SUPABASE_BUCKET_NAME)."
    );
  }

  return value.trim();
}

function getConfig(): SupabaseS3Config {
  if (cachedConfig) return cachedConfig;

  cachedConfig = {
    bucket: readBucketName(),
    endpoint: readRequiredEnv("SUPABASE_BUCKET_ENDPOINT"),
    region: readRequiredEnv("SUPABASE_BUCKET_REGION"),
    accessKeyId: readRequiredEnv("SUPABASE_ACCESS_KEY_ID"),
    secretAccessKey: readRequiredEnv("SUPABASE_SECRET_ACCESS_KEY"),
  };

  return cachedConfig;
}

function getClient(): { client: S3Client; config: SupabaseS3Config } {
  const config = getConfig();
  if (!cachedClient) {
    cachedClient = new S3Client({
      endpoint: config.endpoint,
      region: config.region,
      forcePathStyle: true,
      credentials: {
        accessKeyId: config.accessKeyId,
        secretAccessKey: config.secretAccessKey,
      },
    });
  }
  return { client: cachedClient, config };
}

function toPublicObjectUrl(bucket: string, objectPath: string): string | null {
  const supabaseUrl = process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!supabaseUrl) return null;

  const base = supabaseUrl.replace(/\/+$/, "");
  const encodedPath = objectPath
    .split("/")
    .filter(Boolean)
    .map((part) => encodeURIComponent(part))
    .join("/");

  return `${base}/storage/v1/object/public/${encodeURIComponent(bucket)}/${encodedPath}`;
}

export async function uploadToSupabaseS3(params: { objectPath: string; file: File }) {
  const { objectPath, file } = params;
  const { client, config } = getClient();
  const body = Buffer.from(await file.arrayBuffer());

  try {
    await client.send(
      new PutObjectCommand({
        Bucket: config.bucket,
        Key: objectPath,
        Body: body,
        ContentType: file.type || "application/octet-stream",
        CacheControl: "public, max-age=31536000, immutable",
      })
    );
  } catch (error: unknown) {
    const code =
      typeof error === "object" && error
        ? String((error as { Code?: unknown; name?: unknown }).Code ?? (error as { name?: unknown }).name ?? "")
        : "";
    if (code === "NoSuchBucket") {
      throw new Error(
        `Supabase bucket "${config.bucket}" was not found. Create it in Supabase Storage and set SUPABASE_STORAGE_BUCKET correctly.`
      );
    }
    throw error;
  }

  return {
    bucket: config.bucket,
    objectPath,
    publicUrl: toPublicObjectUrl(config.bucket, objectPath),
  };
}
