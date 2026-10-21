# Trip Builder media configuration

Repository inspection found URL-based images only: no upload endpoint, media
database, storage SDK, or configured storage provider in application code.

The optional integration uses a **public Vercel Blob store** for public trip
photos. Before enabling uploads, an operator must create/connect a Blob store to
the intended Vercel environment and configure `BLOB_READ_WRITE_TOKEN` server-side.
Use a separate store/token for previews or local testing. Never use a NEXT_PUBLIC
variable for this token. No store, token, or production configuration is created
or changed by this implementation.

Without that configuration the builder remains usable with image URLs; uploads
report that storage is not configured. Uploaded photos are public assets: do not
upload customer documents or private information.

The authenticated content-management upload endpoint enforces a 4 MiB input
limit, allow JPEG/PNG/WebP, decode actual image bytes, limit decoded pixels,
strip metadata, and re-encode as WebP. Filenames are server-generated and cannot
overwrite an existing asset. SVG and animated images are rejected. No remote URL
is fetched by the server. URL fallback is separately validated.

Removing a photo from a trip only removes its reference; it does not delete the
stored object or assets referenced by other trips. Uploaded-but-unsaved photos
can remain orphaned; lifecycle cleanup needs a separately reviewed storage policy.

References: [Vercel Blob SDK](https://vercel.com/docs/vercel-blob/using-blob-sdk)
and [public storage](https://vercel.com/docs/vercel-blob/public-storage).
