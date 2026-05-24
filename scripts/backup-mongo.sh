#!/bin/sh
set -eu

usage() {
  cat <<'USAGE'
Usage: scripts/backup-mongo.sh [--dry-run]

Environment:
  DATABASE_URI  MongoDB connection string to export.
  BACKUP_DIR    Optional output directory. Defaults to backups/<timestamp>.
USAGE
}

dry_run=false

case "${1:-}" in
  "")
    ;;
  "--dry-run")
    dry_run=true
    ;;
  "-h" | "--help")
    usage
    exit 0
    ;;
  *)
    usage >&2
    exit 2
    ;;
esac

if [ -z "${DATABASE_URI:-}" ]; then
  echo "DATABASE_URI is required." >&2
  exit 1
fi

timestamp=$(date -u +"%Y%m%dT%H%M%SZ")
output_dir=${BACKUP_DIR:-"backups/$timestamp"}

if [ "$dry_run" = true ]; then
  printf 'mongodump --uri "$DATABASE_URI" --out "%s"\n' "$output_dir"
  exit 0
fi

if ! command -v mongodump >/dev/null 2>&1; then
  echo "mongodump is required." >&2
  exit 1
fi

mkdir -p "$output_dir"
mongodump --uri "$DATABASE_URI" --out "$output_dir"
