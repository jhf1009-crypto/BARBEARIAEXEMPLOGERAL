import { db } from '../src/lib/db';
import { readFileSync, writeFileSync } from 'node:fs';
const counts = {
  users: await db.user.count(),
  barbers: await db.barber.count(),
  services: await db.service.count(),
  customers: await db.customer.count(),
  appointments: await db.appointment.count(),
  gallery: await db.gallery.count(),
  reviews: await db.review.count(),
};
const report = JSON.parse(readFileSync('output/e2e-results.json', 'utf8'));
console.log(JSON.stringify({ counts, tests: report.stats }, null, 2));
writeFileSync(
  'output/verification-summary.json',
  JSON.stringify({ counts, tests: report.stats }, null, 2),
);
await db.$disconnect();
