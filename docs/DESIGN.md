# Direção e decisões

Brief: agendamento mobile em 360px; confiança, precisão e calor humano. Construção direta autorizada pelo briefing.

Refero remoto indisponível: NO_SUBSCRIPTION. Referências locais lidas: craft-details.md e motion.md da skill Refero Design. A direção dominante é o briefing do cliente; não há alegação de pesquisa visual remota concluída.

| Decisão                                | Fonte                       | Aplicação                                      |
| -------------------------------------- | --------------------------- | ---------------------------------------------- |
| Grafite, tipografia de impacto e âmbar | Briefing, identidade visual | Âmbar para CTA/seleção; superfícies neutras    |
| Fotografia protagonista                | Briefing, fotos reais       | Hero com espaço reservado, recorte editorial   |
| Campos rotulados e foco visível        | Refero craft-details        | Toda interface, alvos 44px                     |
| Motion 120/200/320ms                   | Refero motion               | Feedback, etapas, sheet; reduced-motion        |
| CSS e Web Animations API               | Refero motion               | Evita biblioteca de animação no bundle inicial |
| Dialog nativo                          | WCAG e craft-details        | Contenção/restauração de foco e Escape         |

Tokens em globals.css; marca em site.config.ts. Não usar imagens de IA. SQLite requer disco persistente; Vercel exige migração para PostgreSQL. Prisma 6 fixado para configuração estável do datasource; migrar exige provider, migrations e transferência de dados, não apenas URL.
