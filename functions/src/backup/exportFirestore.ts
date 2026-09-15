import { onSchedule } from "firebase-functions/v2/scheduler";
import { logger } from "firebase-functions/v2";
import { v1 } from "@google-cloud/firestore";

const PROJECT_ID = "leia-498520";
const BACKUP_BUCKET = "leia-498520-firestore-backups";

const client = new v1.FirestoreAdminClient();

export const exportFirestoreBackup = onSchedule(
  {
    schedule: "0 3 * * *",
    timeZone: "America/Sao_Paulo",
    retryCount: 2,
  },
  async () => {
    const databaseName = client.databasePath(PROJECT_ID, "(default)");
    const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
    const outputUriPrefix = `gs://${BACKUP_BUCKET}/backups/${timestamp}`;

    logger.info("firestore-backup-started", { outputUriPrefix });

    const [operation] = await client.exportDocuments({
      name: databaseName,
      outputUriPrefix,
      collectionIds: [], // empty = export every collection
    });

    logger.info("firestore-backup-triggered", {
      outputUriPrefix,
      operationName: operation.name,
    });
  }
);
