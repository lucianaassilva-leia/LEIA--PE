import { logger } from "firebase-functions/v2";
import {
  DocumentData,
  DocumentReference,
  SetOptions,
  UpdateData,
} from "firebase-admin/firestore";

export type WriteAction = "create" | "update" | "delete";

const LOG_NAME = "firestore-writes";

function logWrite(
  action: WriteAction,
  ref: DocumentReference,
  actor: string,
  fields?: string[]
): void {
  logger.info(LOG_NAME, {
    logName: LOG_NAME,
    action,
    collection: ref.parent.id,
    documentId: ref.id,
    path: ref.path,
    actor,
    fieldsChanged: fields,
    timestamp: new Date().toISOString(),
  });
}

/**
 * Creates or overwrites a document, stamping `_meta` with who/when and
 * emitting a structured write log. Use `actor` = the bot user's uid, or a
 * fixed string identifying the calling service for server-to-server writes.
 */
export async function loggedSet(
  ref: DocumentReference,
  data: DocumentData,
  actor: string,
  options?: SetOptions
): Promise<void> {
  const now = new Date().toISOString();
  const merging = !!options && "merge" in options && !!options.merge;
  const payload = {
    ...data,
    // set(..., {merge:true}) deep-merges nested maps, so a partial _meta
    // here only touches these keys and leaves the original createdBy intact.
    _meta: merging
      ? { updatedBy: actor, updatedAt: now }
      : { createdBy: actor, updatedBy: actor, updatedAt: now },
  };
  await (options ? ref.set(payload, options) : ref.set(payload));
  logWrite(merging ? "update" : "create", ref, actor, Object.keys(data));
}

/** Updates a document, stamping `_meta.updatedBy`/`updatedAt` and logging the write. */
export async function loggedUpdate(
  ref: DocumentReference,
  data: UpdateData<DocumentData>,
  actor: string
): Promise<void> {
  const payload = {
    ...data,
    // update() replaces nested maps wholesale instead of merging them, so
    // the audit fields must use dot-notation paths to touch only these two.
    "_meta.updatedBy": actor,
    "_meta.updatedAt": new Date().toISOString(),
  };
  await ref.update(payload);
  logWrite("update", ref, actor, Object.keys(data));
}

/** Deletes a document and emits a structured write log. */
export async function loggedDelete(ref: DocumentReference, actor: string): Promise<void> {
  await ref.delete();
  logWrite("delete", ref, actor);
}
