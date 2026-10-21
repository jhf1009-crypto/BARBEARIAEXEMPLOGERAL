import { readFileSync, writeFileSync } from 'node:fs';
const lh = JSON.parse(readFileSync('output/lighthouse-final.summary.json', 'utf8'));
const tests = JSON.parse(readFileSync('output/e2e-results.json', 'utf8'));
const audit = JSON.parse(readFileSync('output/dependency-audit-final.json', 'utf8'));
const offline = JSON.parse(readFileSync('output/offline-results.json', 'utf8'));
const retry = JSON.parse(readFileSync('output/retry-result.json', 'utf8'));
const rawLighthouse = JSON.parse(readFileSync('output/lighthouse-final.report.json', 'utf8'));
const scriptBytes = rawLighthouse.audits['network-requests'].details.items
  .filter((r) => r.resourceType === 'Script')
  .reduce((sum, r) => sum + r.transferSize, 0);
const counts = JSON.parse(readFileSync('output/verification-summary.json', 'utf8')).counts;
const report = `# Relatório de entrega — Barbearia Geral

## Arquitetura e decisões

Next.js 16 App Router, React, TypeScript estrito, Prisma 6 e SQLite. Painel e agendamento em chunks próprios. CSS com tokens e Web Animations API mantém a animação leve; não foi necessário Motion/GSAP ou Tailwind. Fotos reais locais em AVIF/WebP, fontes OFL locais, manifest e service worker. O conteúdo público usa cache de 30s invalidado pelo painel; disponibilidade e dados privados não usam esse cache.

Reservas são transacionais e cada minuto possui restrição única por barbeiro. Jornada, almoço, bloqueios, folgas, duração, pausa, antecedência e limite futuro são validados no servidor. O agendamento manual autenticado permite agenda imediata. Consulta, cancelamento e reagendamento usam token aleatório de 256 bits armazenado como hash.

SQLite e uploads em var/uploads exigem disco persistente e uma instância. PostgreSQL requer troca do provider, migrations próprias e transferência dos dados; não é apenas uma mudança de URL. Vercel requer também adaptar armazenamento de arquivos. Webpack foi escolhido pela compatibilidade com este Windows/OneDrive.

## Skills

Instaladas: security-threat-model, playwright-interactive e vercel-deploy. Já disponíveis e usadas: skill-installer, Refero Design, security-best-practices e Playwright. Detalhes e limites em [SKILLS.md](SKILLS.md). Refero remoto retornou NO_SUBSCRIPTION; design fundamentado no briefing e referências locais de craft e motion. Nenhuma imagem de IA foi usada.

## Acesso e execução

- Site: http://localhost:3000
- Painel: http://localhost:3000/admin
- Contas iniciais: admin@example.com, gerente@example.com, barbeiro@example.com.
- Senha inicial: SEED_PASSWORD em .env, arquivo ignorado pelo Git. Troca obrigatória no primeiro acesso. Não há senha fixa pública no código.
- Instalar/rodar: pnpm install, pnpm run setup, pnpm dev.
- Produção: pnpm build e pnpm start.
- Reset descartável: pnpm demo:reset. Este comando apaga dados.

## Fotografias

20 arquivos-base com fontes e licença individual em [PHOTOS.md](PHOTOS.md) e [PHOTO-SOURCES.json](PHOTO-SOURCES.json). Todas derivam de fotografias reais sob Unsplash License; Barlow Condensed e DM Sans usam SIL Open Font License. Nenhuma atribuição ou aviso de template foi inserido no site.

## Verificação efetivamente executada

| Categoria Lighthouse mobile | Resultado |
|---|---:|
| Performance | ${lh.scores.performance} |
| Acessibilidade | ${lh.scores.accessibility} |
| Boas práticas | ${lh.scores['best-practices']} |
| SEO | ${lh.scores.seo} |

- LCP: ${lh.metrics['largest-contentful-paint'].display}; CLS: ${lh.metrics['cumulative-layout-shift'].display}; TBT: ${lh.metrics['total-blocking-time'].display}.
- INP exige dados reais de uso; não é certificado por este teste de laboratório.
- JavaScript inicial transferido (inclui cabeçalhos): ${(scriptBytes / 1024).toFixed(1)} KiB. A meta aproximada de 120 KB ainda não foi atingida.
- A meta Performance ≥95 e LCP <2s permanece pendente. Os demais três índices atingiram 100. Portanto, esta entrega não deve ser tratada como aprovação integral de todos os critérios de produção do briefing.
- Playwright local: ${tests.stats.expected} testes aprovados na execução completa; ${tests.stats.unexpected} caso interrompido por timeout após um intervalo de 44 minutos do computador. Repetição isolada do fluxo desktop: ${retry.passed} aprovado em ${retry.durationSeconds}s, ${retry.failed} falhas, registrada em output/retry-result.json. Viewports: 360×640, 390×844, 768×1024 e 1440×900.
- Página inicial offline: ${offline.filter((r) => r.ok).length}/${offline.length} resoluções aprovadas após instalação do service worker.
- Integração contínua limpa no Linux: todos os testes de navegador, build, tipos, lint, testes unitários e auditoria passaram no [GitHub Actions](https://github.com/jhf1009-crypto/BARBEARIAEXEMPLOGERAL/actions/runs/39656079690).
- Testes unitários de horários: 4 aprovados.
- Auditoria de dependências (pnpm audit): ${JSON.stringify(audit.metadata.vulnerabilities)}.
- Evidências locais: output/playwright, output/lighthouse-final.report.html, output/lighthouse-final.report.json, output/e2e-results.json e playwright-report.
- Seed: ${counts.users} usuários, ${counts.barbers} barbeiros, ${counts.services} serviços, ${counts.customers} clientes, ${counts.appointments} agendamentos, ${counts.gallery} fotos de galeria e ${counts.reviews} avaliações.

Testes cobrem agendamento, consulta, reagendamento e cancelamento; CRUD de gestão e configurações; exportação; duas reservas simultâneas; origem externa; papel de barbeiro e alteração indevida de outra agenda; 2FA criptografado; limite de login; upload válido e rejeição de SVG; reduced-motion, touch, imagens, ausência de overflow, conexão lenta e conteúdo sem JavaScript.

## Segurança e limites

Cookies httpOnly/SameSite; Secure e HSTS para HTTPS; bcrypt custo 12; sessões opacas com hash; origem estrita em mutações; Zod cliente/servidor; CSP com nonce, sem unsafe-eval em produção; uploads reprocessados; auditoria; anonimização; proteção contra fórmulas em CSV; TOTP AES-256-GCM com chave no ambiente. [SECURITY.md](../SECURITY.md) documenta implantação, proxy confiável e backups.

Os lembretes são links de WhatsApp prontos para envio manual. SMTP é configurável para redefinição de senha; sem SMTP, desenvolvimento registra o link apenas no terminal. HTTPS real, HSTS e entrega de e-mail devem ser verificados no domínio de produção. Nenhum resultado representa auditoria externa ou dados de campo de desempenho.

## Reutilizar em outro cliente

1. Copie o repositório.
2. Edite src/site.config.ts e as imagens/ícones.
3. Configure .env para domínio, banco, e-mail, senha e chave 2FA.
4. Ajuste o seed ou cadastre equipe, serviços, preços e horários no painel.
5. Execute setup, troque as senhas e revise privacidade/termos e dados comerciais.
6. Rode testes/build e publique com HTTPS e armazenamento persistente.

O [README](../README.md) contém os comandos completos, variáveis, estrutura, VPS e migração para PostgreSQL.

## Dependências do proprietário

Definir dados reais do negócio, domínio e hospedagem; configurar SMTP; confirmar telefone, endereço e links sociais; criar chaves Turnstile se desejado; provisionar PostgreSQL e object storage se escolher Vercel. A aplicação não foi publicada em hospedagem externa automaticamente.
`;
writeFileSync('docs/REPORT.md', report);
