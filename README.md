# Bot LEIA

Projeto Firebase `leia-498520`.

## Auditoria e backup do Firestore

- **Log estruturado de escritas**: ver [`docs/logging.md`](docs/logging.md).
- **Backup agendado e restauração**: ver [`docs/backup-restore.md`](docs/backup-restore.md).

## Desenvolvimento

```bash
cd functions
npm install
npm run build
firebase emulators:start
```

## Deploy

```bash
firebase deploy --only functions,firestore:rules
```
