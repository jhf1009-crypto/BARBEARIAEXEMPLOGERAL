# Relatório de entrega — Barbearia Geral

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
| --------------------------- | --------: |
| Performance                 |        90 |
| Acessibilidade              |       100 |
| Boas práticas               |       100 |
| SEO                         |       100 |

- LCP: 3.4 s; CLS: 0; TBT: 100 ms.
- INP exige dados reais de uso; não é certificado por este teste de laboratório.
- JavaScript inicial transferido (inclui cabeçalhos): 140.5 KiB. A meta aproximada de 120 KB ainda não foi atingida.
- A meta Performance ≥95 e LCP <2s permanece pendente. Os demais três índices atingiram 100. Portanto, esta entrega não deve ser tratada como aprovação integral de todos os critérios de produção do briefing.
- Playwright local: 51 testes aprovados na execução completa; 1 caso interrompido por timeout após um intervalo de 44 minutos do computador. Repetição isolada do fluxo desktop: 1 aprovado em 44.6s, 0 falhas, registrada em output/retry-result.json. Viewports: 360×640, 390×844, 768×1024 e 1440×900.
- Página inicial offline: 4/4 resoluções aprovadas após instalação do service worker.
- Integração contínua limpa no Linux: todos os testes de navegador, build, tipos, lint, testes unitários e auditoria passaram no [GitHub Actions](https://github.com/jhf1009-crypto/BARBEARIAEXEMPLOGERAL/actions/runs/39656079690).
- Testes unitários de horários: 4 aprovados.
- Auditoria de dependências (pnpm audit): {"info":0,"low":0,"moderate":0,"high":0,"critical":0}.
- Evidências locais: output/playwright, output/lighthouse-final.report.html, output/lighthouse-final.report.json, output/e2e-results.json e playwright-report.
- Seed: 3 usuários, 3 barbeiros, 9 serviços, 24 clientes, 72 agendamentos, 6 fotos de galeria e 4 avaliações.

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
