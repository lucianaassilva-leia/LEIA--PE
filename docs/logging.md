# Log estruturado de escritas no Firestore

Toda escrita no Firestore feita pelo Bot LEIA deve ser rastreável: **o quê**
mudou, **quando** e **quem** (ou qual serviço) fez a mudança.

## Como funciona

1. **`functions/src/lib/firestoreLogger.ts`** — todo `create`/`set`/`update`/
   `delete` do código do bot deve passar por `loggedSet`, `loggedUpdate` ou
   `loggedDelete`. Eles gravam o campo `_meta` (`createdBy`, `updatedBy`,
   `updatedAt`) no próprio documento e emitem um log estruturado no Cloud
   Logging com nome `firestore-writes`.

2. **`functions/src/triggers/onFirestoreWrite.ts`** — rede de segurança.
   Um gatilho `onDocumentWritten("{document=**}")` dispara para **qualquer**
   escrita no banco, mesmo que alguém escreva sem passar pelo wrapper acima.
   Ele também loga em `firestore-writes`, lendo o `actor` do campo `_meta`
   já gravado no documento.

3. **`firestore.rules`** — exemplo comentado exigindo que `_meta.createdBy`/
   `_meta.updatedBy` bata com `request.auth.uid`, para impedir que um
   cliente escreva direto no Firestore sem o carimbo de autoria.

## Formato do log

Cada entrada em Cloud Logging (`jsonPayload`):

```json
{
  "logName": "firestore-writes",
  "action": "create | update | delete",
  "collection": "conversas",
  "documentId": "abc123",
  "path": "conversas/abc123",
  "actor": "uid-do-usuario-ou-nome-do-servico",
  "fieldsChanged": ["mensagem", "status"],
  "timestamp": "2026-09-15T03:00:00.000Z"
}
```

## Consultando os logs

No Console do GCP → Logging → Logs Explorer:

```
jsonPayload.logName="firestore-writes"
```

## Retenção mais longa / consulta com SQL (opcional)

Para manter os logs além do padrão do Cloud Logging (30 dias) ou consultar
com SQL, crie um **log sink** para BigQuery:

```bash
gcloud logging sinks create firestore-writes-sink \
  bigquery.googleapis.com/projects/leia-498520/datasets/firestore_audit \
  --log-filter='jsonPayload.logName="firestore-writes"'
```

## Cobertura total (opcional, mais custo)

Se for necessário auditar também escritas feitas fora do código do bot
(ex: edição manual no console do Firebase), habilite **Cloud Audit Logs –
Data Access** para o serviço Firestore no projeto. Isso captura o
principal (e-mail/service account) automaticamente a nível de API, sem
depender do campo `_meta`, mas gera bem mais volume de log.
