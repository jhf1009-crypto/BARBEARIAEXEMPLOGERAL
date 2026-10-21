import { db } from '../src/lib/db';
const services = await db.service.findMany({ orderBy: { order: 'asc' } });
for (let i = 0; i < services.length; i++)
  await db.service.update({
    where: { id: services[i].id },
    data: { image: `/images/service-${i + 1}.webp` },
  });
const captions = [
  'Precisão no corte à tesoura',
  'Degradê com acabamento limpo',
  'Textura e movimento',
  'Corte feito com atenção',
  'Barba alinhada com cuidado',
  'Um acabamento que transforma',
];
const gallery = await db.gallery.findMany({ orderBy: { order: 'asc' } });
for (let i = 0; i < Math.min(6, gallery.length); i++)
  await db.gallery.update({ where: { id: gallery[i].id }, data: { caption: captions[i] } });
await db.$disconnect();
