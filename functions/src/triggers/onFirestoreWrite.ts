import { onDocumentWritten } from "firebase-functions/v2/firestore";
import { logger } from "firebase-functions/v2";

const LOG_NAME = "firestore-writes";

// {document=**} matches a write to any document in any collection, at any
// depth — the safety net that catches writes made outside firestoreLogger.
export const onFirestoreWrite = onDocumentWritten("{document=**}", (event) => {
  const before = event.data?.before;
  const after = event.data?.after;
  const action = !before?.exists ? "create" : !after?.exists ? "delete" : "update";

  logger.info(LOG_NAME, {
    logName: LOG_NAME,
    source: "trigger",
    action,
    path: event.document,
    actor: after?.get("_meta.updatedBy") ?? before?.get("_meta.updatedBy") ?? "unknown",
    timestamp: new Date().toISOString(),
  });
});
