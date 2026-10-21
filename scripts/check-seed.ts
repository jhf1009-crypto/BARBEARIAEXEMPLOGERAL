import { db } from '../src/lib/db';
const result = {
  users: await db.user.count(),
  passwordChangesRequired: await db.user.count({ where: { mustChangePassword: true } }),
  barbers: await db.barber.count(),
  services: await db.service.count(),
  customers: await db.customer.count(),
  appointments: await db.appointment.count(),
  statuses: await db.appointment.groupBy({ by: ['status'], _count: true }),
  gallery: await db.gallery.count(),
  reviews: await db.review.count(),
};
console.log(JSON.stringify(result, null, 2));
await db.$disconnect();
