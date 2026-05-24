# Deployment Checklist

Use this checklist for the MVP launch on Vercel Hobby with MongoDB Atlas Free
Tier and Vercel Blob.

## Hosting

- Create a Vercel Hobby project for this repository.
- Use the generated `*.vercel.app` URL for the MVP; a custom domain is not
  required.
- Set `NEXT_PUBLIC_SITE_URL` to the production `https://<project>.vercel.app`
  URL.

## Database

- Create a MongoDB Atlas Free Tier cluster.
- Set `DATABASE_URI` in Vercel to the Atlas connection string.
- Configure Atlas network access so Vercel/serverless functions can connect.

## Secrets

- Set `PAYLOAD_SECRET` to a long random value.
- Set `REVALIDATION_SECRET` to a separate long random value.

## Media

- Add a Vercel Blob store to the project.
- Set `BLOB_READ_WRITE_TOKEN` from the Blob store credentials.
- Set `NEXT_PUBLIC_BLOB_HOSTNAME` to the store hostname, for example
  `<store-id>.public.blob.vercel-storage.com`.

## Analytics

- Enable Vercel Web Analytics.
- Enable Vercel Speed Insights.
- Set `ANALYTICS_ENABLED=true` in Vercel only after analytics is enabled.

## Smoke Tests

- Open `/admin` and complete the first admin login flow.
- Publish a post with a cover image and verify `/blog` and `/blog/<slug>`.
- Submit a comment, approve it in `/admin`, and verify it renders publicly.
- Run either `DATABASE_URI="..." scripts/backup-mongo.sh --dry-run` or a real
  `make backup-mongo` export and keep the backup evidence outside git.
