# Backup e restauração do Firestore

## Backup

- **Quando**: diariamente às 3h (horário de São Paulo), via
  `functions/src/backup/exportFirestore.ts` (`onSchedule`, cron `0 3 * * *`).
- **Onde**: `gs://leia-498520-firestore-backups/backups/<timestamp>/`.
- **Retenção**: 30 dias — apagado automaticamente por lifecycle rule no
  bucket (ver `infra/setup-backup-infra.sh`).
- O Cloud Scheduler é criado automaticamente pelo `onSchedule()` no deploy
  (`firebase deploy --only functions`); não precisa criar manualmente.

### Setup único de infraestrutura

```bash
gcloud auth login
gcloud config set project leia-498520
./infra/setup-backup-infra.sh
```

Isso cria o bucket, a lifecycle rule de 30 dias e concede ao service
account de runtime das Cloud Functions as permissões `datastore.
importExportAdmin` (exportar/importar Firestore) e `storage.objectAdmin`
no bucket (gravar os backups).

### Verificando que rodou

Console do GCP → Logging → Logs Explorer:

```
jsonPayload.outputUriPrefix:"leia-498520-firestore-backups"
```

ou liste os objetos do bucket:

```bash
gcloud storage ls gs://leia-498520-firestore-backups/backups/
```

## Restauração

**Atenção**: `import` sobrescreve os documentos existentes nas coleções
importadas. Teste sempre em um projeto/ambiente separado antes de restaurar
em produção.

```bash
gcloud firestore import gs://leia-498520-firestore-backups/backups/<timestamp>/
```

Para restaurar só algumas coleções:

```bash
gcloud firestore import gs://leia-498520-firestore-backups/backups/<timestamp>/ \
  --collection-ids=conversas,usuarios
```
