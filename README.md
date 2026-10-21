# Barbearia Geral

Site de barbearia com agendamento em seis passos, consulta por link seguro e painel administrativo. Conteúdo público em português brasileiro, agenda no fuso America/Bahia e valores em centavos de real.

## Executar localmente

Requisitos: Node.js 22.12+ (validado com 24), pnpm 11 ou npm compatível, disco persistente para SQLite e uploads.

```sh
pnpm install
pnpm run setup
pnpm dev
```

Abra http://localhost:3000 e http://localhost:3000/admin. O setup cria `.env` apenas se ainda não existir, gera uma senha aleatória, cria o banco e executa o seed. Leia `SEED_PASSWORD` em `.env`; não publique esse arquivo. Contas iniciais: `admin@example.com`, `gerente@example.com` e `barbeiro@example.com`. Todas exigem troca de senha antes de liberar os módulos. Configure `SEED_EMAIL_DOMAIN` antes do seed para trocar o domínio.

Se o banco já foi preparado, use `pnpm dev` diretamente. Para instalar com npm, copie `.env.example` para `.env`, preencha as variáveis e execute os mesmos scripts via `npm run`; o lockfile canônico deste projeto é o `pnpm-lock.yaml`.

## Comandos

| Comando           | Finalidade                                    |
| ----------------- | --------------------------------------------- |
| `pnpm dev`        | Servidor de desenvolvimento, somente loopback |
| `pnpm build`      | Gera Prisma e compila Next com Webpack        |
| `pnpm start`      | Servidor de produção                          |
| `pnpm db:migrate` | Aplica as migrations versionadas              |
| `pnpm db:push`    | Sincroniza schema em banco local descartável  |
| `pnpm db:seed`    | Preenche banco vazio                          |
| `pnpm demo:reset` | **Apaga os dados** e recarrega o seed         |
| `pnpm typecheck`  | TypeScript estrito                            |
| `pnpm lint`       | ESLint, TypeScript e regras de hooks          |
| `pnpm format`     | Prettier                                      |
| `pnpm test`       | Testes unitários de disponibilidade           |
| `pnpm test:e2e`   | Playwright nos quatro viewports               |
| `pnpm audit`      | Auditoria de dependências                     |

O seed nunca sobrescreve usuários existentes. O reset é somente para ambiente descartável. Faça backup antes de qualquer migração ou reset.

## Variáveis

| Variável                                                            | Uso                                                   |
| ------------------------------------------------------------------- | ----------------------------------------------------- |
| `DATABASE_URL`                                                      | `file:./dev.db` para SQLite, relativo a `prisma/`     |
| `APP_URL`                                                           | Origem exata; usada em CSRF, SEO e reset de senha     |
| `SESSION_COOKIE_SECURE`                                             | `false` em localhost HTTP; `true` em HTTPS            |
| `SEED_PASSWORD`                                                     | Senha inicial; gerada pelo setup se não houver `.env` |
| `SEED_EMAIL_DOMAIN`                                                 | Domínio das três contas iniciais                      |
| `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASSWORD`, `SMTP_FROM` | Redefinição de senha por e-mail                       |
| `TURNSTILE_SECRET`, `NEXT_PUBLIC_TURNSTILE_SITE_KEY`                | Proteção opcional contra automação; configurar ambas  |
| `PLAYWRIGHT_CHANNEL`                                                | Chrome por padrão; `msedge` para usar Edge instalado  |

Sem SMTP, links de redefinição aparecem **somente no terminal de desenvolvimento**. Nunca são devolvidos ao navegador. O site usa links de WhatsApp para lembretes; não realiza disparos automáticos pela API do WhatsApp.

## Arquitetura

```text
src/app/                   páginas e APIs App Router
src/components/            site público, sheet e painel
src/lib/                   validação, sessão, banco e regras da agenda
src/site.config.ts         identidade e dados padrão do negócio
src/generated/prisma/      cliente gerado, fora do Git
prisma/schema.prisma       entidades e restrições
prisma/seed.ts             dados iniciais
public/images/             fotos locais AVIF/WebP e versões pequenas
public/fonts/              fontes e licenças OFL
tests/                     unitários e Playwright
docs/                      decisões, fontes de fotos e validações
```

Next.js 16, React, TypeScript estrito, Prisma 6 e SQLite. Zod valida dados nas duas pontas. Bcrypt protege senhas; sessões opacas ficam em cookies httpOnly. CSS com tokens e Web Animations API reduz dependências no cliente. O painel e o sheet são carregados separadamente do site público. Não foi adotado Tailwind: CSS centralizado torna os tokens e o rebranding diretos. Webpack evita problemas de junctions do Turbopack no Windows/OneDrive deste ambiente.

Serviços e horários vêm do banco. Disponibilidade considera serviços, profissional, jornada dividida em turnos, intervalos, bloqueios, antecedência, limite de dias e pausa entre atendimentos. Uma transação reserva todos os minutos ocupados; a restrição única `(barberId, minute)` impede conflito mesmo com chamadas simultâneas. Cancelamento libera as reservas e reagendamento troca a reserva atomicamente.

## Novo cliente em menos de 10 minutos

1. Copie o repositório e instale dependências.
2. Edite `src/site.config.ts`: nome, monograma, textos, contato, endereço, cores e redes.
3. Troque as fotos em `public/images`, preservando os nomes ou ajustando a configuração/seed. Registre as respectivas licenças.
4. Copie `.env.example` para `.env`, configure domínio, banco, senha inicial e SMTP.
5. Edite os serviços, equipe e contatos no seed ou cadastre-os pelo painel. Execute o setup em banco vazio.
6. Faça login, troque as senhas e confira jornadas, folgas, feriados e regras da agenda.
7. Rode testes e build, configure HTTPS e publique. No painel, ajuste marca, textos e regras sem alterar código.

O seed é específico da barbearia inicial. Ao trocar de marca em site.config.ts, seus padrões são usados nas configurações enquanto não houver valores personalizados no banco. Para uma nova operação real, substitua também os registros iniciais por dados próprios; não migre clientes do template.

## Produção em VPS

1. Instale Node, copie o código e configure `.env` com origem HTTPS e cookies seguros.
2. `pnpm install --frozen-lockfile`, `pnpm exec prisma generate`, `pnpm db:migrate` e `pnpm build`.
3. Execute Next atrás de Nginx/Caddy com TLS. Limite corpo a 6 MB e sobrescreva `x-real-ip` com o IP remoto confiável. Mantenha o processo vinculado a loopback.
4. Persista `prisma/dev.db` e `var/uploads`. Faça backups consistentes do SQLite e dos arquivos. Uma instância para SQLite; use PostgreSQL para escalar.
5. Rode o seed apenas em banco inicial e altere todas as senhas. Em produção evolua schema com migrations revisadas; não use reset.

## Vercel e PostgreSQL

Para visualizar este template, o projeto **marcos-0447/barbeariaexemplogeral** usa o modo de prévia descrito em [docs/VERCEL-PREVIEW.md](docs/VERCEL-PREVIEW.md). O arquivo `vercel.json` fixa Next.js e o build com seed; o domínio é https://barbeariaexemplogeral.vercel.app. Essa configuração permite visualizar a interface, com dados temporários por instância, sem enviar o banco local.

O SQLite local e uploads no filesystem **não persistem** adequadamente em funções efêmeras. Antes de usar Vercel, migre para PostgreSQL e um armazenamento de objetos. Este repositório não declara um deploy serverless pronto sem essas adaptações.

Para migrar o banco:

1. Faça backup e exporte os registros preservando IDs, datas UTC e relações.
2. Troque o provider de `sqlite` para `postgresql` em `schema.prisma` e configure `DATABASE_URL`.
3. Gere migrations PostgreSQL próprias (`prisma migrate dev --name init`) em uma base de desenvolvimento vazia; não reaproveite SQL de SQLite.
4. Importe os dados na ordem das relações, rode os testes de conflitos e permissões e valide os índices únicos.
5. Use `prisma migrate deploy` no pipeline de produção. Migre o upload para armazenamento persistente antes do deploy serverless.

## Testes e evidências

Inicie o servidor antes do Playwright. Os testes usam Chrome instalado; alternativamente instale Chromium com Playwright e ajuste o canal. Os testes E2E criam/cancelam dados e devem usar banco descartável. As evidências locais ficam em `output/playwright/`, `playwright-report/` e `test-results/`, ignoradas pelo Git.

Veja [docs/REPORT.md](docs/REPORT.md) para resultados efetivamente executados; [SECURITY.md](SECURITY.md) para controles e implantação; [docs/PHOTO-SOURCES.json](docs/PHOTO-SOURCES.json) para fotos e licenças; [docs/DESIGN.md](docs/DESIGN.md) para as decisões visuais e [docs/SKILLS.md](docs/SKILLS.md) para skills e limitações de pesquisa.
