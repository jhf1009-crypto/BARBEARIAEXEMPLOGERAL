# Prévia temporária na Vercel

O projeto correto é **marcos-0447/barbeariaexemplogeral**, conectado a este repositório e à branch main. Production deve abrir em https://barbeariaexemplogeral.vercel.app. O antigo projeto vercel-preview era uma cópia separada e não atualizava esse domínio.

`vercel.json` fixa o framework Next.js e `pnpm run build:vercel`. O build cria um banco novo com migrations e seed, inclui esse arquivo nas funções e copia-o para `/tmp` quando necessário. `.vercelignore` impede o envio do `.env`, uploads e banco local. Nenhum banco de trabalho é copiado.

Essa cópia inclui o banco inicial no bundle e cria uma cópia gravável em `/tmp` por instância. Agendamentos, sessões e uploads podem desaparecer e não são compartilhados de forma confiável entre instâncias. Serve para visualizar e explorar a interface; não deve receber clientes reais. O projeto original continua usando seu banco local normalmente.

Variáveis obrigatórias no projeto Vercel: APP_URL (domínio público), SEED_PASSWORD e TOTP_ENCRYPTION_KEY (64 caracteres hexadecimais). Os dois últimos valores são secretos e devem ser configurados como variáveis criptografadas. VERCEL_SQLITE_PREVIEW=true e SESSION_COOKIE_SECURE=true são definidos por vercel.json. O ambiente local continua usando SQLite persistente normalmente.

Use a CLI oficial autenticada no diretório do repositório:

```bash
vercel link --project barbeariaexemplogeral --scope marcos-0447 --yes
vercel deploy --prod --yes
```

Para produção na Vercel, migre para PostgreSQL e armazenamento de objetos, mantenha rate limiting compartilhado, configure as variáveis do ambiente e execute os testes novamente. As limitações de uma prévia SQLite não são substituto para essa migração.

Diagnóstico do 404: o projeto estava com framework null e builds vazios. A Vercel aceitava o deploy como Ready, mas não havia rotas publicadas. A correção fica no repositório e nas configurações do projeto original, sem depender de uma cópia fora dele.
