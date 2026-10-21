import { unstable_cache } from 'next/cache';
import { db } from './db';
import { settings } from './settings';
export const publicData = unstable_cache(
  async () => {
    const [services, barbers, gallery, reviews, cfg] = await Promise.all([
      db.service.findMany({ where: { active: true }, orderBy: { order: 'asc' } }),
      db.barber.findMany({ where: { active: true } }),
      db.gallery.findMany({ where: { active: true }, orderBy: { order: 'asc' } }),
      db.review.findMany({ where: { active: true }, take: 5 }),
      settings(),
    ]);
    return { services, barbers, gallery, reviews, cfg };
  },
  ['public-catalog'],
  { revalidate: 30, tags: ['public-catalog'] },
);
