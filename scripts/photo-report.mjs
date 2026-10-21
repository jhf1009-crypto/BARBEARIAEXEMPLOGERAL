import { readFileSync, writeFileSync } from 'node:fs';
const photos = JSON.parse(readFileSync('docs/PHOTO-SOURCES.json', 'utf8'));
const lines = [
  '# Fontes e licenças de fotografias',
  '',
  'Todas as imagens são fotografias reais baixadas localmente. As variantes AVIF, WebP e pequenas derivam da mesma fotografia indicada abaixo. Tratamento: redimensionamento, compressão e dessaturação via CSS, sem geração por IA.',
  '',
  'Licença de todas as fotos: [Unsplash License](https://unsplash.com/license). Uso comercial permitido conforme os termos da plataforma. Fontes das cinco novas fotos foram verificadas nas páginas públicas com a indicação de uso gratuito.',
  '',
  '| Arquivo-base | Fonte | Licença |',
  '|---|---|---|',
  ...photos.map(
    (p) =>
      `| ${p.file} | [Fotografia](${p.photoPage ?? p.source}) · [arquivo original](${p.source}) | Unsplash License |`,
  ),
  '',
  'Fontes tipográficas: Barlow Condensed e DM Sans, distribuídas sob SIL Open Font License. Os textos integrais estão em public/fonts/.',
];
writeFileSync('docs/PHOTOS.md', lines.join('\n') + '\n');
