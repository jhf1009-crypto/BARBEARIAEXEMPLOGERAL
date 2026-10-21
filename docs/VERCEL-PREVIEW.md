# Prévia temporária na Vercel

`node scripts/prepare-vercel-preview.mjs` prepara uma cópia descartável em `output/vercel-preview`, a partir do último commit. O banco é criado novamente com o seed; o `.env`, os uploads e o banco de trabalho não são enviados. As credenciais novas ficam somente em `output/vercel-preview-access.json`, ignorado pelo Git.

Essa cópia inclui o banco inicial no bundle e cria uma cópia gravável em `/tmp` por instância. Agendamentos, sessões e uploads podem desaparecer e não são compartilhados de forma confiável entre instâncias. Serve para visualizar e explorar a interface; não deve receber clientes reais. O projeto original continua usando seu banco local normalmente.

Use a CLI oficial autenticada para enviar a pasta preparada:

```bash
vercel deploy output/vercel-preview --yes
```

Para produção na Vercel, migre para PostgreSQL e armazenamento de objetos, mantenha rate limiting compartilhado, configure as variáveis do ambiente e execute os testes novamente. As limitações de uma prévia SQLite não são substituto para essa migração.
