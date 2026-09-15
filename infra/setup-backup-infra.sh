#!/usr/bin/env bash
# Provisions the Cloud Storage bucket and IAM needed for the scheduled
# Firestore backup function (functions/src/backup/exportFirestore.ts).
# The Cloud Scheduler job itself is created automatically on `firebase
# deploy` by the onSchedule() trigger — this script only needs to run once
# per environment, before (or after) the first deploy.
#
# Prereqs: gcloud auth login && gcloud config set project leia-498520
set -euo pipefail

PROJECT_ID="leia-498520"
BUCKET="leia-498520-firestore-backups"
LOCATION="us-central1"   # match your Firestore location
RETENTION_DAYS=30

gcloud storage buckets create "gs://${BUCKET}" \
  --project="${PROJECT_ID}" \
  --location="${LOCATION}" \
  --uniform-bucket-level-access

gcloud storage buckets update "gs://${BUCKET}" \
  --lifecycle-file=/dev/stdin <<EOF
{
  "rule": [
    {
      "action": {"type": "Delete"},
      "condition": {"age": ${RETENTION_DAYS}}
    }
  ]
}
EOF

# 2nd-gen Cloud Functions run as the Compute Engine default service account
# unless a custom one is configured. Verify after your first deploy with:
#   gcloud functions describe exportFirestoreBackup --gen2 \
#     --format='value(serviceConfig.serviceAccountEmail)'
PROJECT_NUMBER="$(gcloud projects describe "${PROJECT_ID}" --format='value(projectNumber)')"
RUNTIME_SA="${PROJECT_NUMBER}-compute@developer.gserviceaccount.com"

gcloud projects add-iam-policy-binding "${PROJECT_ID}" \
  --member="serviceAccount:${RUNTIME_SA}" \
  --role="roles/datastore.importExportAdmin"

gcloud storage buckets add-iam-policy-binding "gs://${BUCKET}" \
  --member="serviceAccount:${RUNTIME_SA}" \
  --role="roles/storage.objectAdmin"

echo "Done. Backups will land under gs://${BUCKET}/backups/<timestamp>/"
