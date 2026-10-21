# Segurança

## Modelo e limites

Ativos: dados mínimos de clientes, agenda, credenciais e sessões. Atores: visitante, cliente com token, barbeiro, gerente e dono. Fronteiras: navegador/API, aplicação/SQLite e aplicação/provedores externos.

O link de um agendamento é uma credencial: qualquer pessoa com o link pode consultá-lo e, dentro da antecedência mínima, alterá-lo. Não publique esses links. Banco armazena somente SHA-256 do token de 256 bits; expiração em 30 dias após o atendimento. Rotas privadas enviam no-store, noindex e no-referrer.

## Controles implementados

- Senhas bcrypt custo 12; senha inicial aleatória em .env, troca obrigatória.
- Sessões opacas de 256 bits, hash no banco, expiração de 12h; cookies httpOnly, SameSite=Lax e Secure configurável para HTTPS.
- Segredos TOTP protegidos por AES-256-GCM com chave independente em TOTP_ENCRYPTION_KEY; guarde a chave separadamente do backup do banco.
- Autorização por papel em cada API. Barbeiro limitado à própria agenda; gerente não gerencia usuários, configurações ou auditoria.
- Zod em entradas; ORM parametrizado. Saída React escapada. JSON-LD serializado e `<` escapado.
- Mutações JSON exigem Origin idêntico a APP_URL e Content-Type application/json. Upload verifica Origin, usuário e papel.
- Rate limit persistente por IP e, para login/reset, também por conta. Configure o proxy confiável para substituir x-real-ip: nunca repasse diretamente o cabeçalho vindo da internet.
- Agendamento transacional e reserva de cada minuto com UNIQUE(barberId, minute). Conflitos retornam 409. Cancelamento libera as reservas; reagendamento é atômico.
- Honeypot e suporte a verificação Turnstile no servidor. Configure as duas chaves em conjunto.
- Upload restrito a imagens, MIME/assinatura verificados pelo decoder sharp, máximo 5 MB e 25 megapixels, reprocessamento e UUID. Nenhum SVG/HTML é servido como upload.
- CSP com nonce por resposta, strict-dynamic, sem unsafe-eval em produção; style-src permite estilos inline usados por React e gráficos. frame-ancestors none, nosniff, Referrer-Policy e Permissions-Policy.
- HSTS ativado somente junto com SESSION_COOKIE_SECURE=true, após configuração HTTPS válida.
- CSV neutraliza início de fórmula. Auditoria registra ações sem gravar senhas ou tokens.
- Anonimização remove nome, telefone e observações do cliente e dos agendamentos.

## Implantação

1. Use HTTPS. APP_URL deve ser a origem pública exata. Ative SESSION_COOKIE_SECURE=true.
2. Não publique .env, banco, uploads internos ou logs. Backups criptografados e com retenção definida.
3. Em VPS use proxy reverso com limite de corpo de 6 MB, timeout e substituição de x-real-ip. Restrinja Next ao loopback.
4. SQLite e uploads exigem volume persistente e uma instância de aplicação. Para múltiplas instâncias, migre banco e armazenamento para serviços compartilhados.
5. Configure SMTP para redefinição de senha; links só são exibidos no terminal em NODE_ENV=development. Produção sem SMTP retorna indisponibilidade.
6. Não reutilize a base de dados inicial com clientes reais. Defina retenção adequada e revise textos legais/dados comerciais antes do lançamento.
7. Rode lint, typecheck, testes, auditoria e build após qualquer atualização de dependências.

## Notas de implantação

A política CSP dinâmica exige renderização dinâmica das páginas. O service worker não armazena APIs, painel, links de agendamento nem requisições com query string. Cache público contém apenas página inicial, recursos estáticos e fallback offline; confirmar horários sempre exige rede.

Achados e evidências das verificações ficam em docs/REPORT.md. Não interpretar a presença destes controles como certificação ou auditoria externa.
